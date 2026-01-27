// File: src/app/api/agendas/[id]/response/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // AWAIT params untuk Next.js 15+
    const { id } = await params;

    console.log("📍 AGENDA ID:", id);

    if (!id) {
      return NextResponse.json({ error: "Invalid agenda id" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "kepala_rutan") {
      return NextResponse.json(
        { error: "Hanya Kepala Rutan yang dapat merespons agenda" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { responseType, delegateEmail, delegateName, notes } = body;

    console.log("📝 Response data:", {
      responseType,
      delegateEmail,
      delegateName,
    });

    // Validasi
    if (!responseType) {
      return NextResponse.json(
        { error: "Tipe respons harus diisi" },
        { status: 400 },
      );
    }

    // Cek agenda ada atau tidak
    const agenda = await prisma.agenda.findUnique({
      where: { id },
    });

    if (!agenda) {
      return NextResponse.json({ error: "Agenda not found" }, { status: 404 });
    }

    // Cek apakah sudah ada respons
    const existingResponse = await prisma.response.findUnique({
      where: { agendaId: id },
    });

    let response;

    if (existingResponse) {
      // Update existing response
      response = await prisma.response.update({
        where: { agendaId: id },
        data: {
          responseType,
          delegateEmail: responseType === "diwakilkan" ? delegateEmail : null,
          delegateName: responseType === "diwakilkan" ? delegateName : null,
          notes: notes || null,
          respondedAt: new Date(),
        },
      });
      console.log("✅ Response updated");
    } else {
      // Create new response
      response = await prisma.response.create({
        data: {
          agendaId: id,
          userId: session.user.id,
          responseType,
          delegateEmail: responseType === "diwakilkan" ? delegateEmail : null,
          delegateName: responseType === "diwakilkan" ? delegateName : null,
          notes: notes || null,
        },
      });

      // Update agenda status
      await prisma.agenda.update({
        where: { id },
        data: { status: "responded" },
      });
      console.log("✅ Response created & agenda status updated");
    }

    return NextResponse.json({ success: true, response }, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating response:", error);
    return NextResponse.json(
      { error: "Failed to create response" },
      { status: 500 },
    );
  }
}
