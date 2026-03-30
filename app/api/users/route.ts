// File: src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { logActivity } from "@/lib/logger";
import { userSchema } from "@/lib/validations/user";

// GET - List all users (Superuser only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Superuser can access
    if (session.user.role !== "superuser") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        seksiName: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// POST - Create new user (Superuser only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Superuser can create users
    if (session.user.role !== "superuser") {
      return NextResponse.json(
        { error: "Hanya Superuser yang dapat menambah user" },
        { status: 403 },
      );
    }

    const body = await req.json();
    
    // Validasi menggunakan Zod
    const validation = userSchema.safeParse(body);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || "Input tidak valid";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password, role, seksiName, phoneNumber } = validation.data;

    // Cek apakah email sudah digunakan
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah digunakan" },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phoneNumber,
        password: hashedPassword,
        role,
        // Izinkan seksiName disimpan jika role adalah 'kepala_seksi' ATAU 'kepala'
        seksiName:
          role === "kepala_seksi" || role === "kepala" ? seksiName : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        seksiName: true,
        createdAt: true,
      },
    });

    await logActivity(
      session.user.id,
      "CREATE_USER",
      `Membuat user baru: ${email}`,
    );

    console.log("✅ User created:", user.email);

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
