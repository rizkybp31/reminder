"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "../components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Edit,
  Eye,
  Plus,
  UserCheck,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { toast } from "sonner";
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

interface Agenda {
  id: string;
  title: string;
  description: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  createdBy: {
    id: string; // Tambahkan ID untuk pengecekan kepemilikan
    name: string;
    email: string;
    seksiName: string;
  };
  response?: {
    responseType: string;
    delegateName?: string;
    delegateEmail?: string;
    notes?: string;
    user: {
      name: string;
    };
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [delegatedAgendas, setDelegatedAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    responded: 0,
    delegated: 0,
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isKepalaRutan = session?.user?.role === "kepala_rutan";
  const isKepalaSeksi = session?.user?.role === "kepala_seksi";

  useEffect(() => {
    if (status === "authenticated") {
      fetchAgendas();
    }
  }, [status]);

  const fetchAgendas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/agendas");

      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        throw new Error("Gagal mengambil data");
      }

      const data = await res.json();
      const myOwn = data.agendas || [];
      const forMe = data.delegatedAgendas || [];

      setAgendas(myOwn);
      setDelegatedAgendas(forMe);

      const uniqueAgendaIds = new Set<string>();
      const allAgendas = [...myOwn, ...forMe];
      allAgendas.forEach((agenda) => uniqueAgendaIds.add(agenda.id));

      const uniqueAgendas = Array.from(uniqueAgendaIds).map(
        (id) => allAgendas.find((a) => a.id === id)!,
      );

      setStats({
        total: uniqueAgendas.length,
        pending: uniqueAgendas.filter((a) => a.status === "pending").length,
        responded: uniqueAgendas.filter(
          (a) => a.status === "responded" || a.response,
        ).length,
        delegated: forMe.length,
      });
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat memuat agenda");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/agendas/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Agenda dihapus");
        fetchAgendas();
      }
    } catch {
      toast.error("Gagal menghapus");
    } finally {
      setDeletingId(null);
    }
  };

  const AgendaCard = ({
    agenda,
    isDelegated = false,
  }: {
    agenda: Agenda;
    isDelegated?: boolean;
  }) => {
    // Cek apakah user saat ini adalah pemilik/pembuat agenda
    const isOwner =
      session?.user?.email === agenda.createdBy?.email ||
      session?.user?.id === agenda.createdBy?.id;

    return (
      <Card
        key={agenda.id}
        className={`hover:shadow-md transition-all ${
          isDelegated ? "border-l-4 border-l-blue-500 shadow-sm" : ""
        }`}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-800">
                  {agenda.title}
                </h3>
                <Badge
                  variant={
                    agenda.status === "pending" ? "secondary" : "default"
                  }
                >
                  {agenda.status === "pending" ? "Menunggu" : "Selesai"}
                </Badge>
                {isDelegated && (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
                    <UserCheck className="w-3 h-3 mr-1" /> Tugas Delegasi
                  </Badge>
                )}
              </div>

              <p className="text-sm text-slate-600 line-clamp-2">
                {agenda.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(agenda.startDateTime), "PPP p", {
                      locale: localeID,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{agenda.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    {agenda.createdBy?.name} ({agenda.createdBy?.seksiName})
                  </span>
                </div>
              </div>

              {agenda.response && (
                <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-100">
                  <p className="text-xs font-semibold uppercase text-slate-400 mb-1">
                    Status Respons
                  </p>
                  <div className="text-sm">
                    <span className="font-medium text-slate-700">
                      {agenda.response.responseType === "diwakilkan"
                        ? `Diwakilkan ke: ${agenda.response.delegateName}`
                        : `Keputusan: ${agenda.response.responseType}`}
                    </span>
                    {agenda.response.notes && (
                      <p className="italic text-slate-500 mt-1">
                        {`"${agenda.response.notes}"`}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex md:flex-col gap-2 justify-end">
              {/* Tombol Beri Respons: Hanya untuk Kepala Rutan, Agenda belum direspons, dan Status Pending */}
              {isKepalaRutan &&
                !agenda.response &&
                agenda.status === "pending" && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() =>
                      router.push(`/dashboard/agendas/${agenda.id}`)
                    }
                  >
                    <UserCheck className="w-4 h-4 mr-2" /> Beri Respons
                  </Button>
                )}

              {/* Tombol Detail: Semua orang bisa lihat detail */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/dashboard/agendas/${agenda.id}`)}
              >
                <Eye className="w-4 h-4 mr-2" /> Detail
              </Button>

              {/* Tombol Edit & Hapus: Hanya muncul jika user adalah PEMBUAT (Owner) agenda tersebut */}
              {isOwner && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      router.push(`/dashboard/agendas/${agenda.id}/edit`)
                    }
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        {deletingId === agenda.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Hapus"
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus agenda{" "}
                          <strong>{agenda.title}</strong>? Tindakan ini tidak
                          dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(agenda.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading)
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
          <p className="text-slate-500 animate-pulse">Memuat data agenda...</p>
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Ringkasan Dashboard
            </h1>
            <p className="text-slate-500">
              Selamat datang kembali, {session?.user?.name}
            </p>
          </div>
          {!isKepalaRutan && (
            <Button
              onClick={() => router.push("/dashboard/agendas/create")}
              className="shadow-lg shadow-primary/20"
            >
              <Plus className="mr-2 h-4 w-4" /> Buat Agenda Baru
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Agenda"
            value={stats.total}
            icon={<LayoutDashboard />}
            desc="Semua agenda unik"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<Clock />}
            desc="Butuh respons"
            color="text-orange-600"
          />
          <StatCard
            title="Selesai"
            value={stats.responded}
            icon={<CheckCircle />}
            desc="Sudah direspons"
            color="text-green-600"
          />
          {(isKepalaSeksi || isKepalaRutan) && (
            <StatCard
              title="Delegasi"
              value={stats.delegated}
              icon={<UserCheck />}
              desc="Tugas untuk Anda"
              color="text-blue-600"
            />
          )}
        </div>

        <Separator />

        <div className="space-y-10">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-xl font-semibold">Semua Agenda</h2>
            </div>
            <div className="grid gap-4">
              {agendas.length > 0 ? (
                agendas.map((a) => <AgendaCard key={a.id} agenda={a} />)
              ) : (
                <EmptyState message="Belum ada agenda yang dibuat." />
              )}
            </div>
          </section>

          {delegatedAgendas.length > 0 && (
            <section className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 bg-blue-500 rounded-full" />
                <h2 className="text-xl font-semibold text-blue-900">
                  Agenda Diwakilkan Ke Saya
                </h2>
              </div>
              <div className="grid gap-4">
                {delegatedAgendas.map((a) => (
                  <AgendaCard
                    key={`delegated-${a.id}`}
                    agenda={a}
                    isDelegated
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// --- Helper Components ---

function StatCard({
  title,
  value,
  icon,
  desc,
  color = "",
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  desc: string;
  color?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">
          {title}
        </CardTitle>
        <div className="text-slate-400">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <p className="text-xs text-slate-400 mt-1">{desc}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 border-2 border-dashed rounded-xl border-slate-200">
      <Calendar className="mx-auto h-10 w-10 text-slate-300 mb-3" />
      <p className="text-slate-500">{message}</p>
    </div>
  );
}
