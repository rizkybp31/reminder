"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Inbox,
  Trash,
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
import Link from "next/link";

interface Agenda {
  id: string;
  title: string;
  description: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  createdBy: {
    id: string;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isKepalaRutan = session?.user?.role === "kepala_rutan";

  // Memisahkan agenda berdasarkan status secara otomatis (Memoized)
  const pendingAgendas = useMemo(
    () => agendas.filter((a) => a.status === "pending"),
    [agendas],
  );

  const completedAgendas = useMemo(
    () => agendas.filter((a) => a.status !== "pending"),
    [agendas],
  );

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
      setAgendas(data.agendas || []);
      setDelegatedAgendas(data.delegatedAgendas || []);
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
    const isOwner =
      session?.user?.email === agenda.createdBy?.email ||
      session?.user?.id === agenda.createdBy?.id ||
      session?.user?.role === "kepala_rutan";

    const isPending = agenda.status === "pending";

    return (
      <Card
        className={`transition-all border-l-4 ${
          isDelegated
            ? "border-l-blue-500 bg-blue-50/30"
            : isPending
              ? "border-l-orange-500 bg-white"
              : "border-l-emerald-500 bg-slate-50/50"
        } hover:shadow-md`}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-800">
                  {agenda.title}
                </h3>
                <Badge
                  variant={isPending ? "outline" : "default"}
                  className={
                    isPending
                      ? "text-orange-600 border-orange-200"
                      : "bg-emerald-600"
                  }
                >
                  {isPending ? "Menunggu Respons" : "Selesai"}
                </Badge>
                {isDelegated && (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
                    <UserCheck className="w-3 h-3 mr-1" /> Delegasi
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
                    {agenda.createdBy?.name}{" "}
                    {agenda.createdBy?.seksiName &&
                      `(${agenda.createdBy?.seksiName})`}
                  </span>
                </div>
              </div>

              {agenda.response && (
                <div className="mt-4 p-3 bg-white/50 rounded-md border border-slate-200">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">
                    Hasil Keputusan
                  </p>
                  <div className="text-sm">
                    <span className="font-semibold text-slate-700">
                      {agenda.response.responseType === "diwakilkan"
                        ? `Diwakilkan: ${agenda.response.delegateName}`
                        : `Status: ${agenda.response.responseType.toUpperCase()}`}
                    </span>
                    {agenda.response.notes && (
                      <p className="italic text-slate-500 mt-1 text-xs">
                        &ldquo;{agenda.response.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap flex-row md:flex-col gap-2">
              {isKepalaRutan && isPending && (
                <Link href={`/dashboard/agendas/${agenda.id}`}>
                  <Button
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 w-full"
                  >
                    <UserCheck className="w-4 h-4 mr-2" /> Respons
                  </Button>
                </Link>
              )}
              <Link href={`/dashboard/agendas/${agenda.id}`}>
                <Button size="sm" variant="outline" className="w-full">
                  <Eye className="w-4 h-4 mr-2" /> Detail
                </Button>
              </Link>

              {isOwner && (
                <>
                  <Link href={`/dashboard/agendas/${agenda.id}/edit`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start md:justify-center"
                    >
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </Button>
                  </Link>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-auto text-destructive hover:text-destructive hover:bg-destructive/10 justify-start md:justify-center"
                      >
                        <Trash />
                        {deletingId === agenda.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Hapus"
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Agenda?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini permanen. Agenda{" "}
                          <strong>{agenda.title}</strong> akan dihapus dari
                          sistem.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(agenda.id)}
                          className="bg-destructive text-white hover:bg-destructive/90"
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500">
            Selamat Datang, {session?.user?.name}.
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/agendas/create")}
          className="shadow-md"
        >
          <Plus className="mr-2 h-4 w-4" /> Buat Agenda
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-slate-500 animate-pulse font-medium">
            Menyelaraskan data...
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total"
              value={agendas.length + delegatedAgendas.length}
              icon={<LayoutDashboard />}
              desc="Semua agenda"
            />
            <StatCard
              title="Menunggu"
              value={pendingAgendas.length}
              icon={<Clock />}
              desc="Perlu tindak lanjut"
              color="text-orange-600"
            />
            <StatCard
              title="Selesai"
              value={completedAgendas.length}
              icon={<CheckCircle />}
              desc="Sudah direspons"
              color="text-emerald-600"
            />
            <StatCard
              title="Delegasi"
              value={delegatedAgendas.length}
              icon={<UserCheck />}
              desc="Tugas untuk Anda"
              color="text-blue-600"
            />
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 mb-6">
              <TabsTrigger
                value="pending"
                className="data-[state=active]:text-orange-700"
              >
                Menunggu ({pendingAgendas.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Selesai ({completedAgendas.length})
              </TabsTrigger>
              <TabsTrigger
                value="delegated"
                className="data-[state=active]:text-blue-700"
              >
                Delegasi ({delegatedAgendas.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4 outline-none">
              {pendingAgendas.length > 0 ? (
                pendingAgendas.map((a) => <AgendaCard key={a.id} agenda={a} />)
              ) : (
                <EmptyState message="Semua agenda sudah ditanggapi." />
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 outline-none">
              {completedAgendas.length > 0 ? (
                completedAgendas.map((a) => (
                  <AgendaCard key={a.id} agenda={a} />
                ))
              ) : (
                <EmptyState message="Belum ada agenda yang selesai." />
              )}
            </TabsContent>

            <TabsContent value="delegated" className="space-y-4 outline-none">
              {delegatedAgendas.length > 0 ? (
                delegatedAgendas.map((a) => (
                  <AgendaCard key={a.id} agenda={a} isDelegated />
                ))
              ) : (
                <EmptyState message="Tidak ada tugas delegasi untuk Anda saat ini." />
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

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
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-bold uppercase text-slate-400 tracking-wider">
          {title}
        </CardTitle>
        <div className="text-slate-300">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-black ${color}`}>{value}</div>
        <p className="text-[10px] text-slate-400 font-medium">{desc}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-2xl border-slate-200 bg-slate-50/50">
      <Inbox className="h-12 w-12 text-slate-300 mb-4" />
      <p className="text-slate-500 font-medium">{message}</p>
    </div>
  );
}
