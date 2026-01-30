"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner"; // Ganti useToast dengan Sonner
import { Loader2 } from "lucide-react"; // Untuk icon loading
import { toTitleCase } from "@/utils/toTitleCase";
import { DashboardLayout } from "@/app/components/dashboard-layout";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  seksiName?: string | null;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null); // State untuk loading pada tombol delete spesifik

  const router = useRouter();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        toast.error("Gagal memuat daftar user.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memuat data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("User berhasil dihapus.");
        fetchUsers(); // Refresh daftar user
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Gagal menghapus user.");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus user.");
    } finally {
      setDeletingId(null); // Reset loading
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Manajemen User</h1>
        <Button onClick={() => router.push("/dashboard/users/create")}>
          + Tambah User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm text-muted-foreground">
            Daftar user yang terdaftar dalam sistem
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <DashboardLayout>
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
                <p className="text-slate-500 animate-pulse">
                  Memuat data users...
                </p>
              </div>
            </DashboardLayout>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada user</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-muted">
                  <tr>
                    <th className="border px-3 py-2 text-left">Nama</th>
                    <th className="border px-3 py-2 text-left">Email</th>
                    <th className="border px-3 py-2">Role</th>
                    <th className="border px-3 py-2">Seksi</th>
                    <th className="border px-3 py-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="border px-3 py-2">{user.name}</td>
                      <td className="border px-3 py-2">{user.email}</td>
                      <td className="border px-3 py-2 text-center">
                        {toTitleCase(user.role)}
                      </td>
                      <td className="border px-3 py-2 text-center">
                        {user.seksiName ?? "-"}
                      </td>
                      <td className="border px-3 py-2">
                        <div className="flex flex-col md:flex-row gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/dashboard/users/${user.id}/edit`)
                            }
                          >
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={
                                  deletingId === user.id ||
                                  user.role === "kepala_rutan"
                                } // Disable tombol saat loading
                              >
                                {deletingId === user.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menghapus...
                                  </>
                                ) : (
                                  "Hapus"
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Konfirmasi Hapus
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus user{" "}
                                  <strong>{user.name}</strong>? Tindakan ini
                                  tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
