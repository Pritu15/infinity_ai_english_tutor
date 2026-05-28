import type { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface AuthenticatedUser {
      email: string;
      id: string;
      role: UserRole;
    }

    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
