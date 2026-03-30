import { z } from "zod";

export const roleEnum = z.enum(["kepala", "kepala_seksi", "kepala_rutan", "superuser"]);

const baseUserSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: roleEnum,
  phoneNumber: z.string().min(10, "Nomor telepon minimal 10 digit"),
  seksiName: z.string().optional().nullable(),
});

export const userSchema = baseUserSchema.refine((data) => {
  if ((data.role === "kepala_seksi" || data.role === "kepala") && !data.seksiName) {
    return false;
  }
  return true;
}, {
  message: "Nama seksi harus diisi untuk Kepala Seksi atau Kepala",
  path: ["seksiName"],
});

export const userUpdateSchema = baseUserSchema.partial().extend({
  password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
}).refine((data) => {
  if (data.role && (data.role === "kepala_seksi" || data.role === "kepala") && !data.seksiName) {
    return false;
  }
  return true;
}, {
  message: "Nama seksi harus diisi untuk Kepala Seksi atau Kepala",
  path: ["seksiName"],
});

