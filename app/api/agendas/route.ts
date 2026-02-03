import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, StatusAgenda } from "@/generated/prisma/client";
import { supabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Prisma.AgendaWhereInput = {};

    if (session.user.role === "kepala_seksi") {
      where.OR = [
        { createdById: session.user.id },
        {
          response: {
            delegateEmail: session.user.email,
            responseType: "diwakilkan",
          },
        },
      ];
    }

    if (status && status !== "all") {
      where.status = status.toUpperCase() as StatusAgenda;
    }

    const agendas = await prisma.agenda.findMany({
      where,
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
            seksiName: true,
          },
        },
        response: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDateTime: "desc",
      },
    });

    let myAgendas = agendas;
    let delegatedAgendas: typeof agendas = [];

    if (session.user.role === "kepala_seksi") {
      myAgendas = agendas.filter((a) => a.createdById === session.user.id);
      delegatedAgendas = agendas.filter(
        (a) =>
          a.response &&
          a.response.delegateEmail === session.user.email &&
          a.response.responseType === "diwakilkan",
      );
    }

    return NextResponse.json({
      agendas: myAgendas,
      delegatedAgendas,
    });
  } catch (error) {
    console.error("Error fetching agendas:", error);
    return NextResponse.json(
      { error: "Failed to fetch agendas" },
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

      // ✅ Use Buffer, not Uint8Array
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

      // ✅ Get public URL
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

    return NextResponse.json(agenda, { status: 201 });
  } catch (error) {
    console.error("CREATE AGENDA ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
