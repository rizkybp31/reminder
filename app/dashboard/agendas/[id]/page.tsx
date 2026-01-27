"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/app/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, User, Clock } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

import { IoIosArrowDown } from "react-icons/io";

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
    seksiName: string;
  };
  response?: {
    responseType: string;
    delegateEmail?: string;
    delegateName?: string;
    notes?: string;
  };
}

interface KepalaSeksi {
  id: string;
  name: string;
  email: string;
  seksiName: string;
}

export default function AgendaDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();

  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [kepalaSeksiList, setKepalaSeksiList] = useState<KepalaSeksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 🔥 STATE DIPISAH (PENTING)
  const [responseType, setResponseType] = useState("");
  const [delegateEmail, setDelegateEmail] = useState("");
  const [delegateName, setDelegateName] = useState("");
  const [notes, setNotes] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isKepalaRutan = session?.user?.role === "KEPALA_RUTAN";

  useEffect(() => {
    fetchAgenda();
    if (isKepalaRutan) fetchKepalaSeksi();
  }, []);

  const fetchAgenda = async () => {
    try {
      const res = await fetch(`/api/agendas/${params.id}`);
      const data = await res.json();
      setAgenda(data);

      if (data.response) {
        setResponseType(data.response.responseType);
        setDelegateEmail(data.response.delegateEmail || "");
        setDelegateName(data.response.delegateName || "");
        setNotes(data.response.notes || "");
      }
    } catch {
      toast.error("Gagal memuat agenda");
    } finally {
      setLoading(false);
    }
  };

  const fetchKepalaSeksi = async () => {
    const res = await fetch("/api/users/kasi");
    const data = await res.json();
    setKepalaSeksiList(data);
  };

  console.table(kepalaSeksiList);

  const handleDelegateChange = (email: string) => {
    const selected = kepalaSeksiList.find((k) => k.email === email);
    setDelegateEmail(email);
    setDelegateName(selected ? `${selected.name} (${selected.seksiName})` : "");
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!responseType) {
      toast.error("Pilih jenis respons");
      return;
    }

    if (responseType === "DIWAKILKAN" && !delegateEmail) {
      toast.error("Pilih Kepala Seksi yang mewakili");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/agendas/${params.id}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseType,
          delegateEmail: responseType === "DIWAKILKAN" ? delegateEmail : null,
          delegateName: responseType === "DIWAKILKAN" ? delegateName : null,
          notes: notes || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);
      toast.success("Respons berhasil disimpan");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan respons");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!agenda) {
    return (
      <DashboardLayout>
        <p className="text-center py-20">Agenda tidak ditemukan</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* DETAIL AGENDA */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{agenda.title}</CardTitle>
                <Badge>
                  {agenda.status === "PENDING"
                    ? "Belum Direspons"
                    : "Sudah Direspons"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <p>{agenda.description}</p>
                <Separator />
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Calendar className="inline mr-2" />
                    {format(new Date(agenda.startDateTime), "dd MMMM yyyy", {
                      locale: idLocale,
                    })}
                  </div>
                  <div>
                    <MapPin className="inline mr-2" />
                    {agenda.location}
                  </div>
                  <div>
                    <Clock className="inline mr-2" />
                    {format(new Date(agenda.startDateTime), "HH:mm")} WIB
                  </div>
                  <div>
                    <User className="inline mr-2" />
                    {agenda.createdBy.name}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FORM RESPONS */}
          {isKepalaRutan && (
            <Card>
              <CardHeader>
                <CardTitle>Respons Kehadiran</CardTitle>
                <CardDescription>Pilih kehadiran Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <RadioGroup
                    value={responseType}
                    onValueChange={(v) => {
                      setResponseType(v);
                      if (v !== "DIWAKILKAN") {
                        setDelegateEmail("");
                        setDelegateName("");
                      }
                    }}
                  >
                    {["HADIR", "TIDAK_HADIR", "DIWAKILKAN"].map((v) => (
                      <div key={v} className="flex items-center gap-2">
                        <RadioGroupItem value={v} />
                        <Label>{v.replace("_", " ")}</Label>
                      </div>
                    ))}
                  </RadioGroup>

                  {responseType === "DIWAKILKAN" && (
                    <div className="relative">
                      <Label className="mb-2">Kepala Seksi</Label>
                      <button
                        type="button"
                        className="w-full mt-1 rounded-md border px-3 py-2 text-left"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      >
                        <div className="flex justify-between items-center">
                          {delegateName || "Pilih Kepala Seksi"}
                          <IoIosArrowDown />
                        </div>
                      </button>

                      {isDropdownOpen && (
                        <ul className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow">
                          {kepalaSeksiList.map((k) => (
                            <li
                              key={k.id}
                              className="px-3 py-2 cursor-pointer hover:bg-accent"
                              onClick={() => handleDelegateChange(k.email)}
                            >
                              <div className="font-medium">{k.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {k.seksiName}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div>
                    <Label className="mb-3">Catatan</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Respons"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
