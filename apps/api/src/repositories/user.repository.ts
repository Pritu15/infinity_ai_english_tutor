import type { PrismaClient, User, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export interface CreateUserInput {
  email: string;
  oauthProvider?: string;
  passwordHash?: string;
  role?: UserRole;
}

export class UserRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  create(input: CreateUserInput): Promise<User> {
    return this.client.user.create({
      data: {
        email: input.email,
        oauthProvider: input.oauthProvider,
        passwordHash: input.passwordHash,
        role: input.role ?? "LEARNER"
      }
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.client.user.findUnique({
      where: {
        email
      }
    });
  }

  findById(id: string): Promise<User | null> {
    return this.client.user.findUnique({
      where: {
        id
      }
    });
  }
}
