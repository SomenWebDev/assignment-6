import httpStatus from "http-status";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";

import prisma from "../../lib/prisma";
import AppError from "../../errors/AppError";
import config from "../../config";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type UserJwtPayload,
} from "../../utils/jwt";

type RegisterCandidateInput = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
};

type RegisterCompanyInput = {
  email: string;
  password: string;
  companyName: string;
  website?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type UpdateMeInput = {
  fullName?: string;
  phone?: string;
  companyName?: string;
  website?: string;
};

const googleClient = new OAuth2Client(
  config.google_client_id,
  config.google_client_secret,
  config.google_redirect_uri,
);

function toJwtPayload(user: {
  id: string;
  email: string;
  role: UserJwtPayload["role"];
}): UserJwtPayload {
  return { id: user.id, email: user.email, role: user.role };
}

export async function registerCandidate(input: RegisterCandidateInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, "Email already in use");
  }

  const hashedPassword = await bcrypt.hash(
    input.password,
    config.bcrypt_salt_rounds,
  );

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      role: "CANDIDATE",
      candidateProfile: {
        create: {
          fullName: input.fullName,
          ...(input.phone !== undefined && { phone: input.phone }),
        },
      },
    },
    include: { candidateProfile: true },
  });

  const { password, ...safeUser } = user;
  return safeUser;
}

export async function registerCompany(input: RegisterCompanyInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, "Email already in use");
  }

  const hashedPassword = await bcrypt.hash(
    input.password,
    config.bcrypt_salt_rounds,
  );

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      role: "COMPANY",
      companyProfile: {
        create: {
          companyName: input.companyName,
          ...(input.website !== undefined && { website: input.website }),
        },
      },
    },
    include: { companyProfile: true },
  });

  const { password, ...safeUser } = user;
  return safeUser;
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "This account has been deactivated",
    );
  }

  if (!user.password) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "This account uses Google sign-in",
    );
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password);
  if (!passwordMatches) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  const payload = toJwtPayload(user);
  const { password, ...safeUser } = user;

  return {
    user: safeUser,
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export function getGoogleAuthUrl(role: "CANDIDATE" | "COMPANY") {
  return googleClient.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
    state: role,
  });
}

export async function loginWithGoogle(code: string, state?: string) {
  const role = state === "COMPANY" ? "COMPANY" : "CANDIDATE";

  let googlePayload;
  try {
    const { tokens } = await googleClient.getToken(code);
    if (!tokens.id_token) {
      throw new Error("No id token");
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.google_client_id as string,
    });
    googlePayload = ticket.getPayload();
  } catch {
    throw new AppError(httpStatus.UNAUTHORIZED, "Google sign-in failed");
  }

  if (!googlePayload?.email || !googlePayload.email_verified) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Google account email is not verified",
    );
  }

  const email = googlePayload.email;
  const displayName = googlePayload.name ?? email.split("@")[0] ?? "User";

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user =
      role === "COMPANY"
        ? await prisma.user.create({
            data: {
              email,
              role: "COMPANY",
              companyProfile: { create: { companyName: displayName } },
            },
          })
        : await prisma.user.create({
            data: {
              email,
              role: "CANDIDATE",
              candidateProfile: { create: { fullName: displayName } },
            },
          });
  }

  if (user.deletedAt || !user.isActive) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "This account has been deactivated",
    );
  }

  const payload = toJwtPayload(user);
  const { password, ...safeUser } = user;

  return {
    user: safeUser,
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export async function refreshAccessToken(refreshToken: string) {
  let decoded: UserJwtPayload;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired refresh token",
    );
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || user.deletedAt || !user.isActive) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "User no longer exists or is inactive",
    );
  }

  return { accessToken: signAccessToken(toJwtPayload(user)) };
}

export async function updateMe(
  userId: string,
  role: UserJwtPayload["role"],
  input: UpdateMeInput,
) {
  if (role === "ADMIN") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Admin accounts have no profile to update",
    );
  }

  if (role === "CANDIDATE") {
    if (input.companyName !== undefined || input.website !== undefined) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Candidates cannot set company fields",
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        candidateProfile: {
          update: {
            ...(input.fullName !== undefined && { fullName: input.fullName }),
            ...(input.phone !== undefined && { phone: input.phone }),
          },
        },
      },
      include: { candidateProfile: true, companyProfile: true },
    });

    const { password, ...safeUser } = user;
    return safeUser;
  }

  if (input.fullName !== undefined || input.phone !== undefined) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Companies cannot set candidate fields",
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      companyProfile: {
        update: {
          ...(input.companyName !== undefined && {
            companyName: input.companyName,
          }),
          ...(input.website !== undefined && { website: input.website }),
        },
      },
    },
    include: { candidateProfile: true, companyProfile: true },
  });

  const { password, ...safeUser } = user;
  return safeUser;
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { candidateProfile: true, companyProfile: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const { password, ...safeUser } = user;
  return safeUser;
}
