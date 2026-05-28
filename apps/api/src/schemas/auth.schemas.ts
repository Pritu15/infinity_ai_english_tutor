import { z } from "zod";

export const emailPasswordSchema = z.object({
  email: z.string().email().max(320).transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128)
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20).optional()
});

export type EmailPasswordInput = z.infer<typeof emailPasswordSchema>;
