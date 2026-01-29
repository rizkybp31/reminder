import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, StatusAgenda } from "@/generated/prisma/client";

// HANDLER UNTUK GET (Fetch Agendas)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mengambil query parameters
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
        startDateTime: "asc",
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

// HANDLER UNTUK POST (Create Agenda)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json(); // Di App Router, gunakan req.json()

    // Validasi sederhana
    if (!body.title || !body.startDateTime || !body.endDateTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const agenda = await prisma.agenda.create({
      data: {
        title: body.title,
        description: body.description,
        location: body.location,
        startDateTime: new Date(body.startDateTime),
        endDateTime: new Date(body.endDateTime),
        createdById: session.user.id,
      },
    });

    return NextResponse.json(
      {
        ...agenda,
        startDateTime: agenda.startDateTime.toISOString(),
        endDateTime: agenda.endDateTime.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating agenda:", error);
    return NextResponse.json(
      { error: "Failed to create agenda" },
      { status: 500 },
    );
  }
}
