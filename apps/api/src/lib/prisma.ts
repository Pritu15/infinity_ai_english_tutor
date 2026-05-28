import { PrismaClient } from "@prisma/client";

declare global {
  var adaptivePrisma: PrismaClient | undefined;
}

export const prisma = globalThis.adaptivePrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.adaptivePrisma = prisma;
}
