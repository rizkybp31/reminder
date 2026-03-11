import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "superuser") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const logs = await prisma.activityLog.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 100, // Ambil 100 log terbaru
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("GET_LOGS_ERROR:", error);
        return NextResponse.json({ error: "Gagal memuat log" }, { status: 500 });
    }
}
