// File: src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

// Extend User type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      seksiName?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    seksiName?: string;
  }
}

// Extend JWT type
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    seksiName?: string;
  }
}
