import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: userId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "kepala_rutan") {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User tidak ditemukan" },
      { status: 404 },
    );
  }

  return NextResponse.json(user);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: userId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "kepala_rutan") {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const body = await req.json();

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: body,
    });

    return NextResponse.json(updatedUser);
  } catch {
    return NextResponse.json(
      { error: "Gagal memperbarui user" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: userId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "kepala_rutan") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Tidak bisa menghapus akun sendiri" },
        { status: 400 },
      );
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userToDelete) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    if (userToDelete.role === "kepala_rutan") {
      const adminCount = await prisma.user.count({
        where: { role: "kepala_rutan" },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Admin terakhir tidak bisa dihapus" },
          { status: 400 },
        );
      }
    }

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "User ini memiliki data terkait (Foreign Key Constraint)" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
