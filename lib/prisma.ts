import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// 1. Buat koneksi pool ke PostgreSQL
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase memerlukan SSL.
  // Jika lokal (development) tidak pakai SSL, bisa gunakan kondisi.
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// 2. Inisialisasi adapter
const adapter = new PrismaPg(pool);

// 3. Buat instance PrismaClient
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
