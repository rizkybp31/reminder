"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { ArrowLeft, Calendar, MapPin, User, Clock, File } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

import { IoIosArrowDown } from "react-icons/io";
import { toTitleCase } from "@/utils/toTitleCase";
import Link from "next/link";

interface Agenda {
  id: string;
  title: string;
  description: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  attachmentUrl?: string;
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

  const [responseType, setResponseType] = useState("");
  const [delegateEmail, setDelegateEmail] = useState("");
  const [delegateName, setDelegateName] = useState("");
  const [notes, setNotes] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isKepalaRutan = session?.user?.role === "kepala_rutan";

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

    if (responseType === "diwakilkan" && !delegateEmail) {
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
          delegateEmail: responseType === "diwakilkan" ? delegateEmail : null,
          delegateName: responseType === "diwakilkan" ? delegateName : null,
          notes: notes || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);
      toast.success("Respons berhasil disimpan");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal menyimpan respons");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
        <p className="text-slate-500 animate-pulse">Memuat data agenda...</p>
      </div>
    );

  if (!agenda) {
    return (
      <>
        <p className="text-center py-20">Agenda tidak ditemukan</p>
      </>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        <Link href="/dashboard">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{agenda.title}</CardTitle>
                <Badge>
                  {agenda.status === "pending"
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
                  <div>
                    <File className="inline mr-2" />
                    {agenda.attachmentUrl ? (
                      <a
                        href={agenda.attachmentUrl}
                        target="_blank"
                        className="text-sm text-blue-600 underline"
                      >
                        Lihat Lampiran
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Tidak ada lampiran
                      </span>
                    )}
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
                      if (v !== "diwakilkan") {
                        setDelegateEmail("");
                        setDelegateName("");
                      }
                    }}
                  >
                    {["hadir", "tidak_hadir", "diwakilkan"].map((v) => (
                      <div key={v} className="flex items-center gap-2">
                        <RadioGroupItem value={v} />
                        <Label>{toTitleCase(v)}</Label>
                      </div>
                    ))}
                  </RadioGroup>

                  {responseType === "diwakilkan" && (
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
    </>
  );
}
