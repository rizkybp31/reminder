"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Payload {
  name: string;
  email: string;
  password?: string;
  role: string;
  seksiName?: string | null;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    seksiName: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${params.id}`);
        if (!res.ok) throw new Error("Gagal mengambil data user");
        const data = await res.json();

        setForm({
          name: data.name || "",
          email: data.email || "",
          password: "",
          confirmPassword: "",
          role: data.role || "",
          seksiName: data.seksiName || "",
        });
      } catch {
        toast.error("User tidak ditemukan");
        router.push("/dashboard/users");
      } finally {
        setFetching(false);
      }
    };

    if (params.id) fetchUser();
  }, [params.id, router]);

  console.table(form);

  if (session?.user?.role !== "kepala_rutan") {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Anda tidak memiliki akses ke halaman ini
      </div>
    );
  }

  if (fetching) {
    return <div className="text-center py-20">Memuat data...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.role) {
      toast.error("Nama, Email, dan Role wajib diisi");
      return;
    }

    if (form.password.trim() !== "") {
      if (form.password.length < 6) {
        toast.error("Password baru minimal 6 karakter");
        return;
      }
      if (form.password !== form.confirmPassword) {
        toast.error("Konfirmasi password tidak cocok!");
        return;
      }
    }

    setLoading(true);

    const payload: Payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      seksiName: form.seksiName,
    };

    if (form.password.trim() !== "") {
      payload.password = form.password;
    }

    try {
      const res = await fetch(`/api/users/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // Gunakan payload, bukan form
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal update");

      toast.success("User berhasil diperbarui");
      router.push("/dashboard/users");
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan saat memperbarui user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit User</CardTitle>
          <CardDescription>Perbarui informasi akun {form.name}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nama */}
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input
                placeholder="Nama lengkap"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@rutan.go.id"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(value) => setForm({ ...form, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kepala_rutan">Kepala Rutan</SelectItem>
                  <SelectItem value="kepala_seksi">Kepala Seksi</SelectItem>
                  <SelectItem value="kepala">Kepala</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nama Seksi - Muncul jika role kepala_seksi */}
            {form.role === "kepala_seksi" ||
              (form.role === "kepala" && (
                <div className="space-y-2">
                  <Label>Nama</Label>
                  <Input
                    placeholder="Contoh: Keamanan"
                    value={form.seksiName}
                    onChange={(e) =>
                      setForm({ ...form, seksiName: e.target.value })
                    }
                  />
                </div>
              ))}

            <hr className="my-4" />
            <p className="text-xs text-muted-foreground italic">
              * Biarkan password kosong jika tidak ingin mengubahnya
            </p>

            {/* Password */}
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <Input
                type="password"
                placeholder="Isi jika ingin ganti"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label>Konfirmasi Password Baru</Label>
              <Input
                type="password"
                placeholder="Ulangi password baru"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.back()}
              >
                Batal
              </Button>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Menyimpan..." : "Update User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
