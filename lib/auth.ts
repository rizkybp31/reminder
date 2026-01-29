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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim();
        const password = credentials.password.trim();

        console.log("LOGIN ATTEMPT:", email);

        const user = await prisma.user.findUnique({
          where: { email },
        });

        console.log("USER FOUND:", !!user);

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        console.log("PASSWORD VALID:", isPasswordValid);

        if (!isPasswordValid) {
          return null;
        }

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
};
