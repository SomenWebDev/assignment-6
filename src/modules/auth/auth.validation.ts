import { z } from "zod";

const registerCandidateSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    fullName: z.string().min(1, "Full name is required"),
    phone: z.string().optional(),
  }),
});

const registerCompanySchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    companyName: z.string().min(1, "Company name is required"),
    website: z.string().url("Invalid website URL").optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

const refreshTokenSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({
      message: "Refresh token is required",
    }),
  }),
});

export const AuthValidation = {
  registerCandidateSchema,
  registerCompanySchema,
  loginSchema,
  refreshTokenSchema,
};
