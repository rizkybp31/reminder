// File: src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

// GET - List all users (Kepala Rutan only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Kepala Rutan can access
    if (session.user.role !== "kepala_rutan") {
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

// POST - Create new user (Kepala Rutan only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Kepala Rutan can create users
    if (session.user.role !== "kepala_rutan") {
      return NextResponse.json(
        { error: "Hanya Kepala Rutan yang dapat menambah user" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { name, email, password, role, seksiName, phoneNumber } = body;

    // Validasi
    if (!name || !email || !password || !role || !phoneNumber) {
      return NextResponse.json(
        { error: "Nama, email, password, dan role harus diisi" },
        { status: 400 },
      );
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
        { status: 400 },
      );
    }

    // Validasi password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 },
      );
    }

    // Validasi role
    if (!["kepala_rutan", "kepala_seksi", "kepala"].includes(role)) {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
    }

    // Jika role KEPALA_SEKSI, seksiName wajib diisi
    if (role === "kepala_seksi" && !seksiName) {
      return NextResponse.json(
        { error: "Nama seksi harus diisi untuk Kepala Seksi" },
        { status: 400 },
      );
    }

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
