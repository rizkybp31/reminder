import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase-server";

// GET single agenda
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    // Add session/role checks here if needed (e.g., for authorization)
    // if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const agenda = await prisma.agenda.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            name: true,
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
    });

    if (!agenda) {
      return NextResponse.json({ error: "Agenda not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...agenda,
      startDateTime: agenda.startDateTime?.toISOString(),
      endDateTime: agenda.endDateTime?.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching agenda:", error);
    return NextResponse.json(
      { error: "Failed to fetch agenda" },
      { status: 500 },
    );
  }
}

// PUT - Update agenda (Kepala Seksi only, and only if not responded)
export async function PUT(
  req: NextRequest,
  // Perhatikan perubahan tipe di sini: params adalah Promise
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const { id: agendaId } = await params;

    // Ambil data dari formData
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const startDateTime = formData.get("startDateTime") as string;
    const endDateTime = formData.get("endDateTime") as string;
    const file = formData.get("attachment") as File | null;
    let attachmentUrl = formData.get("attachmentUrl") as string | null;

    // 1. Cek apakah agenda ada
    const existingAgenda = await prisma.agenda.findUnique({
      where: { id: agendaId },
    });

    if (!existingAgenda) {
      return NextResponse.json(
        { error: "Agenda tidak ditemukan" },
        { status: 404 },
      );
    }

    // 2. Logika Update File jika ada file baru
    if (file && file.size > 0) {
      // Hapus file lama dari storage (opsional)
      if (existingAgenda.attachmentUrl) {
        const oldPath = existingAgenda.attachmentUrl.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("lampiran")
            .remove([`agendas/${oldPath}`]);
        }
      }

      // Upload file baru
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      const fileName = `${session.user.id}-${Date.now()}.pdf`;
      const filePath = `agendas/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("lampiran")
        .upload(filePath, buffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from("lampiran").getPublicUrl(filePath);
      attachmentUrl = data.publicUrl;
    }

    // 3. Update Database
    const updatedAgenda = await prisma.agenda.update({
      where: { id: agendaId },
      data: {
        title,
        description,
        location,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        attachmentUrl,
      },
    });

    return NextResponse.json(updatedAgenda);
  } catch (error: unknown) {
    console.error("UPDATE ERROR:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Gagal update" },
      { status: 500 },
    );
  }
}

// DELETE - Delete agenda (Kepala Seksi only, and only if not responded)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== "kepala_seksi") {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    const { id } = await params;

    const agenda = await prisma.agenda.findUnique({
      where: { id },
      include: { response: true },
    });

    if (!agenda) {
      return NextResponse.json({ error: "Agenda not found" }, { status: 404 });
    }

    // if (agenda.createdById !== session?.user.id) {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    if (agenda.response) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus agenda yang sudah direspons" },
        { status: 400 },
      );
    }

    await prisma.agenda.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting agenda:", error);
    return NextResponse.json(
      { error: "Failed to delete agenda" },
      { status: 500 },
    );
  }
}
