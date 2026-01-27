import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "KEPALA_RUTAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const kasi = await prisma.user.findMany({
    where: { role: "KEPALA_SEKSI" },
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
