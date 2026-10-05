import jwt, { type SignOptions } from "jsonwebtoken";
import config from "../config";

export type UserRole = "CANDIDATE" | "COMPANY" | "ADMIN";

export type UserJwtPayload = {
  id: string;
  email: string;
  role: UserRole;
};

export const signAccessToken = (payload: UserJwtPayload): string => {
  return jwt.sign(
    payload,
    config.jwt_access_secret as string,
    {
      expiresIn: config.jwt_access_expires_in,
    } as SignOptions,
  );
};

export const signRefreshToken = (payload: UserJwtPayload): string => {
  return jwt.sign(
    payload,
    config.jwt_refresh_secret as string,
    {
      expiresIn: config.jwt_refresh_expires_in,
    } as SignOptions,
  );
};

export const verifyAccessToken = (token: string): UserJwtPayload => {
  return jwt.verify(
    token,
    config.jwt_access_secret as string,
  ) as UserJwtPayload;
};

export const verifyRefreshToken = (token: string): UserJwtPayload => {
  return jwt.verify(
    token,
    config.jwt_refresh_secret as string,
  ) as UserJwtPayload;
};
