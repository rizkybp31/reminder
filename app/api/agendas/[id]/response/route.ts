// File: src/app/api/agendas/[id]/response/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/whatsapp";
import { logActivity } from "@/lib/logger";

// Paksa route agar selalu dinamis
export const dynamic = "force-dynamic";

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

    // Proteksi: Hanya Kepala Rutan atau Superuser yang bisa memberi respon
    if (!session || (session.user.role !== "kepala_rutan" && session.user.role !== "superuser")) {
      return NextResponse.json(
        { error: "Hanya Kepala Rutan atau Superuser yang dapat merespons agenda" },
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

    // Ambil data agenda dari database
    const agenda = await prisma.agenda.findUnique({
      where: { id },
    });

    if (!agenda) {
      return NextResponse.json(
        { error: "Agenda tidak ditemukan" },
        { status: 404 },
      );
    }

    // Cek apakah sudah ada respon sebelumnya (Upsert logic)
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

      // Update status agenda menjadi 'responded' jika ini respon pertama
      await prisma.agenda.update({
        where: { id },
        data: { status: "responded" },
      });
    }

    await logActivity(
      session.user.id,
      "RESPOND_AGENDA",
      `Memberikan respons (${responseType}) pada agenda: ${agenda.title}`,
    );

    // Ambil data pembuat agenda (Creator) untuk dikirimi WA
    const creator = await prisma.user.findUnique({
      where: { id: agenda.createdById },
      select: { phoneNumber: true, name: true },
    });

    // --- PENYUSUNAN DETAIL PESAN WHATSAPP ---
    const statusEmoji = responseType === "hadir" ? "✅" : "👥";
    const statusLabel =
      responseType === "hadir"
        ? "KEPALA RUTAN AKAN HADIR"
        : `DIWAKILKAN KEPADA: ${delegateName}`;

    // Format Waktu Indonesia (Senin, 1 Januari 2024 pukul 08.00)
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    const formattedStart = new Date(agenda.startDateTime).toLocaleString(
      "id-ID",
      options,
    );
    const formattedEnd = new Date(agenda.endDateTime).toLocaleString(
      "id-ID",
      options,
    );

    // Logic Lampiran: Jika URL tidak diawali http, kita asumsikan perlu prefix domain
    let fileLink = "";
    if (agenda.attachmentUrl) {
      fileLink = agenda.attachmentUrl.startsWith("http")
        ? agenda.attachmentUrl
        : `${process.env.NEXT_PUBLIC_APP_URL || ""}${agenda.attachmentUrl}`;
    }

    const detailAgendaMsg =
      `📌 *JUDUL:* ${agenda.title}\n` +
      `📍 *LOKASI:* ${agenda.location}\n` +
      `📅 *MULAI:* ${formattedStart}\n` +
      `🏁 *SELESAI:* ${formattedEnd}\n` +
      `📝 *DESKRIPSI:* ${agenda.description?.replace(/<[^>]*>/g, "") || ""}\n` +
      (fileLink ? `📎 *LAMPIRAN:* ${fileLink}\n` : "") +
      (notes ? `💬 *CATATAN:* ${notes}\n` : "");

    // 1. Ambil semua user yang memiliki nomor telepon
    const allUsers = await prisma.user.findMany({
      where: {
        phoneNumber: { not: null },
      },
      select: { phoneNumber: true, name: true, email: true },
    });

    // 2. Kirim notifikasi ke semua user agar semua tahu/devisi tahu siapa yang mewakili
    const notificationPromises = allUsers.map(async (user) => {
      if (!user.phoneNumber) return;

      let message = "";
      
      if (responseType === "diwakilkan" && user.email === delegateEmail) {
        message = `📝 *PENUGASAN DELEGASI*\n\n` +
          `Halo *${user.name}*, Anda ditugaskan oleh Kepala Rutan untuk menghadiri agenda berikut:\n\n` +
          detailAgendaMsg +
          `\nMohon kehadirannya tepat waktu.`;
      } else {
        message = `📢 *UPDATE RESPONS AGENDA*\n\n` +
          `Halo *${user.name}*, agenda berikut telah direspons oleh Kepala Rutan:\n\n` +
          `⚖️ *STATUS:* *${statusEmoji} ${statusLabel}*\n\n` +
          detailAgendaMsg +
          `\nSilakan cek detail lengkapnya di dashboard.`;
      }

      try {
        await sendNotification(user.phoneNumber, message);
      } catch (error) {
        console.error(`Gagal mengirim notifikasi ke ${user.name}:`, error);
      }
    });

    await Promise.allSettled(notificationPromises);

    return NextResponse.json({ success: true, response }, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating response:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat mengirim respon" },
      { status: 500 },
    );
  }
}
