import { prisma } from "./lib/prisma";
import { Role, StatusAgenda, ResponseType } from "./generated/prisma/client";

async function main() {
  // 1. Create User (Kepala Rutan)
  const kepalaRutan = await prisma.user.create({
    data: {
      name: "Kepala Rutan",
      email: "kepala@rutan.go.id",
      password: "password123",
      role: Role.KEPALA_RUTAN,

      agendasCreated: {
        create: {
          title: "Rapat Koordinasi Keamanan",
          description: "Evaluasi keamanan bulanan",
          location: "Ruang Rapat Utama",
          startDateTime: new Date("2026-02-01T09:00:00"),
          endDateTime: new Date("2026-02-01T11:00:00"),
          status: StatusAgenda.PENDING,
        },
      },
    },
    include: {
      agendasCreated: true,
    },
  });

  console.log("Created Kepala Rutan:", kepalaRutan);

  // 2. Create User (Kepala Seksi)
  const kepalaSeksi = await prisma.user.create({
    data: {
      name: "Kepala Seksi Keamanan",
      email: "seksi@rutan.go.id",
      password: "password123",
      role: Role.KEPALA_SEKSI,
      seksiName: "Keamanan",
    },
  });

  // 3. Create Response untuk Agenda
  const response = await prisma.response.create({
    data: {
      agendaId: kepalaRutan.agendasCreated[0].id,
      userId: kepalaSeksi.id,
      responseType: ResponseType.HADIR,
      notes: "Siap hadir",
    },
    include: {
      agenda: true,
      user: true,
    },
  });

  console.log("Created Response:", response);

  // 4. Fetch semua agenda + creator + response
  const allAgendas = await prisma.agenda.findMany({
    include: {
      createdBy: true,
      response: {
        include: {
          user: true,
        },
      },
    },
  });

  console.log("All agendas:", JSON.stringify(allAgendas, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
