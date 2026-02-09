import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { supabase } from "@/lib/supabase-server";
import { sendNotification } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email?.toLowerCase();
    const userId = session.user.id;
    const userRole = session.user.role;

    const where: Prisma.AgendaWhereInput = {};

    if (userRole !== "kepala_rutan") {
      where.OR = [
        { status: "pending" },
        { status: "responded" },
        { createdById: userId },
        {
          response: {
            delegateEmail: session.user.email,
            responseType: "diwakilkan",
          },
        },
      ];
    }

    const allAgendas = await prisma.agenda.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, seksiName: true },
        },
        response: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { startDateTime: "desc" },
    });

    // Filter untuk "Agenda Saya" (Delegasi atau Kehadiran Karutan)
    const delegatedAgendas = allAgendas.filter((a) => {
      const isDelegatedToMe =
        a.response?.responseType === "diwakilkan" &&
        a.response?.delegateEmail?.toLowerCase() === userEmail;

      const isKepalaRutanHadir =
        userRole === "kepala_rutan" && a.response?.responseType === "hadir";

      const isCreatedByMe = a.createdById === userId;

      return isDelegatedToMe || isKepalaRutanHadir || isCreatedByMe;
    });

    return NextResponse.json({
      agendas: allAgendas,
      delegatedAgendas: delegatedAgendas,
    });
  } catch (error) {
    console.error("GET_AGENDAS_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const startDateTime = formData.get("startDateTime") as string;
    const endDateTime = formData.get("endDateTime") as string;
    const file = formData.get("attachment") as File | null;

    if (!title || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    let attachmentUrl: string | null = null;

    if (file && file.size > 0) {
      if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "File harus PDF" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileExt = "pdf";
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `agendas/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("lampiran")
        .upload(filePath, buffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        console.error("SUPABASE UPLOAD ERROR:", uploadError);
        return NextResponse.json(
          { error: `Upload gagal: ${uploadError.message}` },
          { status: 500 },
        );
      }

      const { data } = supabase.storage.from("lampiran").getPublicUrl(filePath);

      attachmentUrl = data.publicUrl;
    }

    const agenda = await prisma.agenda.create({
      data: {
        title,
        description,
        location,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        createdById: session.user.id,
        attachmentUrl,
      },
    });

    const kepalaRutan = await prisma.user.findFirst({
      where: { role: "kepala_rutan" },
      select: { phoneNumber: true, name: true },
    });

    if (kepalaRutan?.phoneNumber) {
      const message =
        `🔔 *AGENDA BARU*\n\n` +
        `Halo *${kepalaRutan.name}*, ada agenda baru yang memerlukan respons Anda:\n\n` +
        `📌 *Judul:* ${title}\n` +
        `📍 *Lokasi:* ${location}\n` +
        `📅 *Waktu:* ${new Date(startDateTime).toLocaleString("id-ID")}\n\n` +
        `Silakan cek dashboard untuk memberikan keputusan.`;

      await sendNotification(kepalaRutan.phoneNumber, message);
    }

    return NextResponse.json(agenda, { status: 201 });
  } catch (error) {
    console.error("CREATE AGENDA ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
