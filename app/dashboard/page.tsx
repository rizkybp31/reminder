"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "../components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Trash2,
  Eye,
  Plus,
  UserCheck,
  TextWrap,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Agenda {
  id: string;
  title: string;
  description: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  createdBy: {
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

  const isKepalaRutan = session?.user?.role === "kepala_rutan";
  const isKepalaSeksi = session?.user?.role === "kepala_seksi";

  useEffect(() => {
    if (status === "authenticated") {
      fetchAgendas();
    }
  }, [status]);

  const fetchAgendas = async () => {
    try {
      const res = await fetch("/api/agendas");
      const data = await res.json();

      setAgendas(data.agendas || []);
      setDelegatedAgendas(data.delegatedAgendas || []);

      const allAgendas = [
        ...(data.agendas || []),
        ...(data.delegatedAgendas || []),
      ];

      setStats({
        total: allAgendas.length,
        pending: allAgendas.filter((a: Agenda) => a.status === "pending")
          .length,
        responded: allAgendas.filter((a: Agenda) => a.status === "responded")
          .length,
        delegated: data.delegatedAgendas?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching agendas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus agenda ini?")) return;

    try {
      const res = await fetch(`/api/agendas/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchAgendas();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menghapus agenda");
      }
    } catch (error) {
      console.error("Error deleting agenda:", error);
      alert("Terjadi kesalahan");
    }
  };

  const AgendaCard = ({
    agenda,
    isDelegated = false,
  }: {
    agenda: Agenda;
    isDelegated?: boolean;
  }) => (
    <Card key={agenda.id} className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start flex-col md:flex-row">
          <div className="flex-1 space-y-4 text-wrap w-full">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-lg font-semibold">{agenda.title}</h3>
                  <Badge
                    variant={
                      agenda.status === "pending" ? "secondary" : "default"
                    }
                  >
                    {agenda.status === "pending"
                      ? "Belum Direspons"
                      : "Sudah Direspons"}
                  </Badge>
                  {isDelegated && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      <UserCheck className="w-3 h-3 mr-1" />
                      Diwakilkan
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {agenda.description}
                </p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">
                  {format(
                    new Date(agenda.startDateTime),
                    "dd MMMM yyyy, HH:mm",
                    { locale: id },
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{agenda.location}</p>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{agenda.createdBy?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {agenda.createdBy?.seksiName}
                  </p>
                </div>
              </div>
            </div>

            {/* Response */}
            {agenda.response && (
              <div>
                <Separator />
                <div className="bg-muted rounded-lg p-4 w-full mt-3">
                  <p className="text-sm font-medium mb-2 text-wrap">
                    Response dari {agenda.response.user.name}:
                  </p>
                  <div className="flex items-center gap-2 w-fit">
                    <Badge
                      variant="outline"
                      className="text-wrap px-4 py-1 bg-black/5"
                      style={{ textWrap: "wrap" }}
                    >
                      {agenda.response.responseType === "hadir" && "✓ Hadir"}
                      {agenda.response.responseType === "tidak_hadir" &&
                        "Tidak Hadir"}
                      {agenda.response.responseType === "diwakilkan" &&
                        `Diwakilkan kepada ${agenda.response.delegateName}`}
                    </Badge>
                  </div>
                  {agenda.response.notes && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Catatan: {agenda.response.notes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 ml-4">
            {isKepalaRutan ? (
              <Button
                className="mt-3"
                size="sm"
                onClick={() => router.push(`/dashboard/agendas/${agenda.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Respons
              </Button>
            ) : (
              !agenda.response &&
              !isDelegated && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      router.push(`/dashboard/agendas/${agenda.id}/edit`)
                    }
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(agenda.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Agenda
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Semua agenda yang ada
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Belum Direspons
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.pending}
              </div>
              <p className="text-xs text-muted-foreground">Menunggu respons</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sudah Direspons
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.responded}
              </div>
              <p className="text-xs text-muted-foreground">Agenda selesai</p>
            </CardContent>
          </Card>

          {isKepalaSeksi && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Diwakilkan
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.delegated}
                </div>
                <p className="text-xs text-muted-foreground">
                  Agenda untuk Anda
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Agendas with Tabs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {isKepalaRutan ? "Daftar Agenda" : "Agenda Saya"}
                </CardTitle>
                <CardDescription>
                  {isKepalaRutan
                    ? "Semua agenda dari berbagai seksi"
                    : "Agenda yang Anda buat dan diwakilkan"}
                </CardDescription>
              </div>
              <Button onClick={() => router.push("/dashboard/agendas/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Buat Agenda
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isKepalaSeksi && delegatedAgendas.length > 0 ? (
              <Tabs defaultValue="my-agendas" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="my-agendas">
                    Agenda Saya ({agendas.length})
                  </TabsTrigger>
                  <TabsTrigger value="delegated">
                    Diwakilkan ({delegatedAgendas.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="my-agendas" className="space-y-4">
                  {agendas.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                      <h3 className="mt-4 text-lg font-semibold">
                        Belum ada agenda
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Mulai dengan membuat agenda pertama Anda
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => router.push("/dashboard/agendas/create")}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Buat Agenda Pertama
                      </Button>
                    </div>
                  ) : (
                    agendas.map((agenda) => (
                      <AgendaCard key={agenda.id} agenda={agenda} />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="delegated" className="space-y-4">
                  {delegatedAgendas.map((agenda) => (
                    <AgendaCard key={agenda.id} agenda={agenda} isDelegated />
                  ))}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-4">
                {agendas.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                    <h3 className="mt-4 text-lg font-semibold">
                      Belum ada agenda
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {isKepalaRutan
                        ? "Belum ada agenda yang dibuat"
                        : "Mulai dengan membuat agenda pertama Anda"}
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => router.push("/dashboard/agendas/create")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Buat Agenda Pertama
                    </Button>
                  </div>
                ) : (
                  agendas.map((agenda) => (
                    <AgendaCard key={agenda.id} agenda={agenda} />
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
