import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    adapter: new PrismaMariaDb({
      host: process.env.DATABASE_HOST!,
      user: process.env.DATABASE_USER!,
      password: process.env.DATABASE_PASSWORD!,
      database: process.env.DATABASE_NAME!,
      port: Number(process.env.DATABASE_PORT) || 3306,
      connectionLimit: 1, // 🔥 serverless-safe
      ssl: false, // testing OK
    }),
    log: ["error"],
  });
}

export const prisma = globalForPrisma.prisma;
