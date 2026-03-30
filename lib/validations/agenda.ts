import { z } from "zod";

export const agendaSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
  location: z.string().min(2, "Lokasi minimal 2 karakter"),
  startDateTime: z.string().or(z.date()),
  endDateTime: z.string().or(z.date()),
  attachmentUrl: z.string().url().optional().nullable(),
}).refine((data) => {
  const start = new Date(data.startDateTime);
  const end = new Date(data.endDateTime);
  return end > start;
}, {
  message: "Waktu selesai harus setelah waktu mulai",
  path: ["endDateTime"],
});
