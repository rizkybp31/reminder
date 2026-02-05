// File: src/app/api/agendas/[id]/response/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/whatsapp";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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

    if (!responseType) {
      return NextResponse.json(
        { error: "Tipe respons harus diisi" },
        { status: 400 },
      );
    }

    const agenda = await prisma.agenda.findUnique({
      where: { id },
    });

    if (!agenda) {
      return NextResponse.json(
        { error: "Agenda tidak ditemukan" },
        { status: 404 },
      );
    }

    const existingResponse = await prisma.response.findUnique({
      where: { agendaId: id },
    });

    let response;

    if (existingResponse) {
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
    } else {
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

      await prisma.agenda.update({
        where: { id },
        data: { status: "responded" },
      });
    }
    const creator = await prisma.user.findUnique({
      where: { id: agenda.createdById },
      select: { phoneNumber: true, name: true },
    });

    const statusInfo = responseType === "hadir" ? "✅ HADIR" : "👥 DIWAKILKAN";
    await sendNotification(
      creator?.phoneNumber || null,
      `📢 *INFO AGENDA*\n\nHalo *${creator?.name}*, agenda Anda:\n\n` +
        `📌 *Judul:* ${agenda.title}\n` +
        `📝 *Keputusan:* *${statusInfo}*\n\n` +
        `Silakan cek detailnya di dashboard.`,
    );

    // 2. Notif ke Penerima Delegasi (Hanya jika 'diwakilkan')
    if (responseType === "diwakilkan" && delegateEmail) {
      const delegateUser = await prisma.user.findUnique({
        where: { email: delegateEmail },
        select: { phoneNumber: true, name: true },
      });

      if (delegateUser?.phoneNumber) {
        const delegateMsg =
          `📝 *PENUGASAN DELEGASI*\n\n` +
          `Halo *${delegateUser.name}*, Anda ditugaskan untuk menghadiri agenda:\n\n` +
          `📌 *Judul:* ${agenda.title}\n` +
          `📅 *Waktu:* ${new Date(agenda.startDateTime).toLocaleString("id-ID")}`;

        await sendNotification(delegateUser.phoneNumber, delegateMsg);
      }
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
