import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "kepala_seksi") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const agenda = await prisma.agenda.findUnique({
      where: { id },
      include: { response: true },
    });

    if (!agenda) {
      return NextResponse.json({ error: "Agenda not found" }, { status: 404 });
    }

    if (agenda.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (agenda.response) {
      return NextResponse.json(
        { error: "Tidak dapat mengedit agenda yang sudah direspons" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const updatedAgenda = await prisma.agenda.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        location: body.location,
        startDateTime: new Date(body.startDateTime),
        endDateTime: new Date(body.endDateTime),
      },
    });

    return NextResponse.json(updatedAgenda);
  } catch (error) {
    console.error("Error updating agenda:", error);
    return NextResponse.json(
      { error: "Failed to update agenda" },
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
    if (!session || session.user.role !== "kepala_seksi") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const agenda = await prisma.agenda.findUnique({
      where: { id },
      include: { response: true },
    });

    if (!agenda) {
      return NextResponse.json({ error: "Agenda not found" }, { status: 404 });
    }

    if (agenda.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
