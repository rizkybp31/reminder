import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // 🔐 Proteksi
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ⚡ Ambil data statistik secara paralel
    const [
      totalAgenda,
      agendaPending,
      agendaResponded,
      totalResponse,
      hadir,
      tidakHadir,
      diwakilkan,
    ] = await Promise.all([
      prisma.agenda.count(),
      prisma.agenda.count({ where: { status: "pending" } }),
      prisma.agenda.count({ where: { status: "responded" } }),

      prisma.response.count(),
      prisma.response.count({ where: { responseType: "hadir" } }),
      prisma.response.count({ where: { responseType: "tidak_hadir" } }),
      prisma.response.count({ where: { responseType: "diwakilkan" } }),
    ]);

    // 📊 Format data untuk infografis
    return NextResponse.json({
      agenda: {
        total: totalAgenda,
        pending: agendaPending,
        responded: agendaResponded,
      },
      response: {
        total: totalResponse,
        hadir,
        tidakHadir,
        diwakilkan,
      },
    });
  } catch (error) {
    console.error("STATISTIK ERROR:", error);
    return NextResponse.json(
      { error: "Gagal memuat statistik" },
      { status: 500 },
    );
  }
}
