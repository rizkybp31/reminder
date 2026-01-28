import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "kepala_rutan") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const kasi = await prisma.user.findMany({
    where: { role: { in: ["kepala_seksi", "kepala"] } },
    select: {
      id: true,
      name: true,
      seksiName: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(kasi);
}
