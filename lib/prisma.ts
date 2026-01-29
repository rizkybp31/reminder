import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

// Baca file sertifikat SSL
// Pastikan path-nya benar menuju file .pem kamu
// const sslCert = fs.readFileSync(path.join(process.cwd(), "ca.pem"));
// const sslCert = fs.readFileSync(path.join(process.cwd(), "ca.pem"));

const sslCert = Buffer.from(
  process.env.DATABASE_CA_CERT!.replace(/\\n/g, "\n"),
);

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: Number(process.env.DATABASE_PORT) || 3306,
  connectionLimit: 10,
  // Masukkan konfigurasi SSL di sini
  ssl: {
    ca: sslCert,
    rejectUnauthorized: true, // Pastikan true agar benar-benar terverifikasi
  },
});

export const prisma = new PrismaClient({ adapter });
