import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: userId } = await params;
    const session = await getServerSession(authOptions);

    // 1. Cek Autentikasi
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Cek Otorisasi (Hanya KEPALA_RUTAN)
    if (session.user.role !== "KEPALA_RUTAN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    // 3. Cegah hapus diri sendiri
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Tidak bisa menghapus akun sendiri" },
        { status: 400 },
      );
    }

    // 4. Cek keberadaan user
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userToDelete) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    // 5. Proteksi Admin terakhir
    if (userToDelete.role === "KEPALA_RUTAN") {
      const adminCount = await prisma.user.count({
        where: { role: "KEPALA_RUTAN" },
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
  } catch (error: any) {
    if (error.code === "P2003") {
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
