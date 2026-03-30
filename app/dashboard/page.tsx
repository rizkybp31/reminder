"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  FileText,
  Search,
  Filter,
  X,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
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
import { toTitleCase } from "@/utils/toTitleCase";

interface Agenda {
  id: string;
  title: string;
  description: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  createdBy: { id: string; name: string; email: string; seksiName: string };
  response?: {
    responseType: string;
    delegateName?: string;
    delegateEmail?: string;
    notes?: string;
    user: { name: string };
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, completed
  const [dateFilter, setDateFilter] = useState(""); // YYYY-MM-DD

  const isKepalaRutan = session?.user?.role === "kepala_rutan";
  const isSuperUser = session?.user?.role === "superuser";
  const isAdmin = isKepalaRutan || isSuperUser;

  useEffect(() => {
    if (status === "authenticated") fetchAgendas();
  }, [status]);

  const fetchAgendas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/agendas");
      const data = await res.json();
      setAgendas(data.agendas || []);
    } catch {
      toast.error("Gagal memuat data");
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

  const filteredAgendas = useMemo(() => {
    return agendas.filter((a) => {
      const matchSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDate = dateFilter
        ? a.startDateTime.startsWith(dateFilter)
        : true;

      return matchSearch && matchDate;
    });
  }, [agendas, searchQuery, dateFilter]);

  const pendingAgendas = useMemo(
    () => filteredAgendas.filter((a) => a.status === "pending"),
    [filteredAgendas],
  );

  const completedAgendas = useMemo(
    () => filteredAgendas.filter((a) => a.status !== "pending"),
    [filteredAgendas],
  );

  const myAgendas = useMemo(() => {
    // ... existing logic ...
    const userEmail = session?.user?.email;
    const userId = session?.user?.id;
    const userName = session?.user?.name;

    if (isAdmin) {
      return filteredAgendas.filter((a) => {
        const isCreator =
          a.createdBy?.email === userEmail || a.createdBy?.id === userId;
        const isAttending = a.response?.responseType === "hadir";
        return isCreator || isAttending;
      });
    } else {
      return filteredAgendas.filter((a) => {
        const isDelegatedToMe =
          a.response?.responseType === "diwakilkan" &&
          (a.response?.delegateEmail === userEmail ||
            a.response?.delegateName === userName);
        return isDelegatedToMe;
      });
    }
  }, [filteredAgendas, isAdmin, session?.user]);

  const exportCSV = () => {
    const headers = ["Judul", "Lokasi", "Waktu Mulai", "Waktu Selesai", "Status", "Pembuat"];
    const csvContent = agendas.map(a => [
      a.title,
      a.location,
      format(new Date(a.startDateTime), "yyyy-MM-dd HH:mm"),
      format(new Date(a.endDateTime), "yyyy-MM-dd HH:mm"),
      a.status,
      a.createdBy?.name || "-"
    ].map(v => `"${v}"`).join(",")).join("\n");

    const blob = new Blob([headers.join(",") + "\n" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `agenda-export-${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const AgendaCard = ({
    agenda,
    isMyAgendaTab = false,
  }: {
    agenda: Agenda;
    isMyAgendaTab?: boolean;
  }) => {
    const isOwner =
      session?.user?.email === agenda.createdBy?.email ||
      session?.user?.id === agenda.createdBy?.id ||
      isAdmin;

    const isPending = agenda.status === "pending";
    const isActualDelegate = !isKepalaRutan && agenda.response?.responseType === "diwakilkan";
    const isKarutanAttending = isAdmin && agenda.response?.responseType === "hadir";

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ translateY: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={`h-full transition-all border-l-4 ${isMyAgendaTab
            ? "border-l-blue-500 bg-blue-50/30"
            : isPending
              ? "border-l-orange-500 bg-white"
              : "border-l-emerald-500 bg-slate-50/50"
            } hover:shadow-xl hover:border-r-slate-200 border-r-transparent border-r-4`}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">
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

                  {isMyAgendaTab && (
                    <>
                      {isActualDelegate && (
                        <Badge className="bg-blue-600 text-white border-none">
                          <UserCheck className="w-3 h-3 mr-1" /> Delegasi Saya
                        </Badge>
                      )}
                      {isKarutanAttending && (
                        <Badge className="bg-indigo-600 text-white border-none">
                          <CheckCircle className="w-3 h-3 mr-1" /> Saya Hadir
                        </Badge>
                      )}
                    </>
                  )}
                </div>

                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                  {agenda.description?.replace(/<[^>]*>/g, "") || ""}
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
                    <MapPin className="h-4 w-4" /> <span>{agenda.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="truncate">
                      {agenda.createdBy?.name}{" "}
                      {agenda.createdBy?.seksiName &&
                        `(${agenda.createdBy?.seksiName})`}
                    </span>
                  </div>
                </div>

                {agenda.response && (
                  <div className="mt-4 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-slate-200/50 shadow-sm">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">
                      Hasil Keputusan
                    </p>
                    <div className="text-sm">
                      <span className="font-semibold text-slate-700">
                        {agenda.response.responseType === "diwakilkan"
                          ? `Diwakilkan: ${agenda.response.delegateName}`
                          : agenda.response.responseType === "hadir"
                            ? "Kepala Rutan Hadir"
                            : `Status: ${toTitleCase(agenda.response.responseType.toUpperCase())}`}
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

              <div className="flex flex-wrap flex-row md:flex-col gap-2 min-w-fit">
                {isAdmin && isPending && (
                  <Link href={`/dashboard/agendas/${agenda.id}`} className="w-full">
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 w-full shadow-sm"
                    >
                      <UserCheck className="w-4 h-4 mr-2" /> Respons
                    </Button>
                  </Link>
                )}
                <Link href={`/dashboard/agendas/${agenda.id}`} className="w-full">
                  <Button size="sm" variant="outline" className="w-full shadow-sm">
                    <Eye className="w-4 h-4 mr-2" /> Detail
                  </Button>
                </Link>
                {isOwner && (isPending || isSuperUser) && (
                  <>
                    <Link href={`/dashboard/agendas/${agenda.id}/edit`} className="w-full">
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
                          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 justify-start md:justify-center"
                        >
                          <Trash className="w-4 h-4 mr-2" />
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
                            <strong>{agenda.title}</strong> akan dihapus.
                            {!isPending && (
                              <p className="mt-2 text-xs text-orange-600 font-semibold">
                                Catatan: Agenda ini sudah direspons. Hanya Superuser yang dapat menghapusnya.
                              </p>
                            )}
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
      </motion.div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Agenda Rutan
          </h1>
          <p className="text-slate-500">
            Monitor dan kelola seluruh agenda kegiatan
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportCSV}
            className="shadow-sm border-dashed"
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button
            onClick={() => router.push("/dashboard/agendas/create")}
            className="shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" /> Buat Agenda
          </Button>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <Card className="bg-slate-50/50 border-dashed shadow-none">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari agenda, lokasi, atau deskripsi..."
                className="pl-10 bg-white border-slate-200 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Input
                  type="date"
                  className="w-full md:w-auto bg-white border-slate-200"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter("")}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {(searchQuery || dateFilter) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery("");
                    setDateFilter("");
                  }}
                  className="text-slate-500"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-slate-500 animate-pulse font-medium">
            Loading data...
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className={`grid gap-4 ${isSuperUser ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2 lg:grid-cols-4"}`}>
            <StatCard
              title="Total"
              value={agendas.length}
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
            {!isSuperUser && (
              <StatCard
                title="Agenda Saya"
                value={myAgendas.length}
                icon={<FileText />}
                desc={isAdmin ? "Agenda dibuat / dihadiri" : "Tugas delegasi Anda"}
                color="text-blue-600"
              />
            )}
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className={`grid w-full ${isSuperUser ? "grid-cols-2" : "grid-cols-3"} h-12 mb-6 bg-slate-100/50 p-1`}>
              <TabsTrigger
                value="pending"
                className="data-[state=active]:text-orange-700 font-bold"
              >
                Menunggu ({pendingAgendas.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="font-bold">
                Selesai ({completedAgendas.length})
              </TabsTrigger>
              {!isSuperUser && (
                <TabsTrigger
                  value="my-agendas"
                  className="data-[state=active]:text-blue-700 font-bold"
                >
                  Agenda Saya ({myAgendas.length})
                </TabsTrigger>
              )}
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="pending" key="pending" className="outline-none">
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingAgendas.length > 0 ? (
                    pendingAgendas.map((a) => <AgendaCard key={a.id} agenda={a} />)
                  ) : (
                    <div className="col-span-full">
                      <EmptyState message="Semua agenda sudah ditanggapi." />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="completed" key="completed" className="outline-none">
                <div className="grid gap-4 md:grid-cols-2">
                  {completedAgendas.length > 0 ? (
                    completedAgendas.map((a) => (
                      <AgendaCard key={a.id} agenda={a} />
                    ))
                  ) : (
                    <div className="col-span-full">
                      <EmptyState message="Belum ada agenda yang selesai." />
                    </div>
                  )}
                </div>
              </TabsContent>

              {!isSuperUser && (
                <TabsContent value="my-agendas" key="my-agendas" className="outline-none">
                  <div className="grid gap-4 md:grid-cols-2">
                    {myAgendas.length > 0 ? (
                      myAgendas.map((a) => (
                        <AgendaCard key={a.id} agenda={a} isMyAgendaTab />
                      ))
                    ) : (
                      <div className="col-span-full">
                        <EmptyState
                          message={
                            isAdmin
                              ? "Tidak ada agenda yang Anda buat atau hadiri."
                              : "Tidak ada tugas delegasi untuk Anda."
                          }
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
            </AnimatePresence>
          </Tabs>
        </div>
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
