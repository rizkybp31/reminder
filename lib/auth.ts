// File: src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "kepala.seksi@rutan.go.id",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        // Validasi input
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password harus diisi");
        }

        // Cari user di database
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        // User tidak ditemukan
        if (!user) {
          throw new Error("Email atau password salah");
        }

        // Verifikasi password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          throw new Error("Email atau password salah");
        }

        // Return user object (akan masuk ke JWT)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          seksiName: user.seksiName ?? undefined,
        };
      },
    }),
  ],

  // Callbacks untuk mengatur JWT dan Session
  callbacks: {
    // JWT Callback - dipanggil saat token dibuat/diupdate
    async jwt({ token, user }) {
      // Saat pertama kali login, user akan ada
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.seksiName = user.seksiName;
      }
      return token;
    },

    // Session Callback - dipanggil saat getSession() atau useSession()
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.seksiName = token.seksiName as string | undefined;
      }
      return session;
    },
  },

  // Pages kustom
  pages: {
    signIn: "/login", // Redirect ke halaman login kustom
    error: "/login", // Redirect error ke login
  },

  // Session strategy
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },

  // Secret untuk encrypt JWT
  secret: process.env.NEXTAUTH_SECRET,

  // Debug mode (aktifkan di development)
  debug: process.env.NODE_ENV === "development",
};
