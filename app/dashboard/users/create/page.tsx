"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";

export default function CreateUserPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    seksiName: "",
  });

  // Proteksi UI
  if (session?.user?.role !== "kepala_rutan") {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Anda tidak memiliki akses ke halaman ini
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.role) {
      toast.error("Lengkapi semua field wajib");
      return;
    }

    if (form.role === "kepala_seksi" && !form.seksiName) {
      toast.error("Nama seksi wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal menambahkan user");
        return;
      }

      toast.success("User berhasil ditambahkan");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Tambah User</CardTitle>
          <CardDescription>
            Tambahkan akun Kepala Rutan atau Kepala Seksi
          </CardDescription>
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

            {/* Password */}
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <Separator />
            <div className="space-y-2">
              <Label>Nama Seksi</Label>
              <Input
                placeholder="Contoh: Keamanan"
                value={form.seksiName}
                onChange={(e) =>
                  setForm({ ...form, seksiName: e.target.value })
                }
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan User"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
