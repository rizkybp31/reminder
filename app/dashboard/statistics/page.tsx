"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Statistik = {
  agenda: {
    total: number;
    pending: number;
    responded: number;
  };
  response: {
    total: number;
    hadir: number;
    tidakHadir: number;
    diwakilkan: number;
  };
};

export default function StatistikPage() {
  const [data, setData] = useState<Statistik | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/statistic")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data");
        return res.json();
      })
      .then((json) => {
        console.log("Data dari API:", json); // Cek struktur data di sini
        setData(json);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  // Cek apakah data dan sub-propertinya ada sebelum render
  if (!data || !data.agenda || !data.response) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-medium animate-pulse text-slate-500">
          Memuat data statistik...
        </p>
      </div>
    );
  }

  // Menggunakan fallback value 0 dan pengecekan pembagi agar tidak NaN/Infinity
  const agendaProgress =
    data.agenda.total > 0
      ? (data.agenda.responded / data.agenda.total) * 100
      : 0;

  const hadirProgress =
    data.response.total > 0
      ? (data.response.hadir / data.response.total) * 100
      : 0;

  return (
    <div className="space-y-8 p-4 md:p-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        Statistik
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <InfoCard title="Total Agenda" value={data.agenda.total} />
        <InfoCard
          title="Agenda yang Direspon"
          value={data.agenda.responded}
          color="text-green-600"
        />
        <InfoCard
          title="Agenda Menunggu Respon"
          value={data.agenda.pending}
          color="text-yellow-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressBar
            label="Agenda Terjawab"
            value={agendaProgress}
            color="bg-green-600"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Partisipasi Kehadiran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar
              label="Hadir"
              value={hadirProgress}
              color="bg-green-600"
            />
            <StatRow label="Tidak Hadir" value={data.response.tidakHadir} />
            <StatRow label="Diwakilkan" value={data.response.diwakilkan} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Respons</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-5xl font-bold text-blue-600">
              {data.response.total}
            </div>
            <p className="mt-2 text-muted-foreground">
              Total respon terhadap agenda
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Komponen Pendukung ---

function InfoCard({
  title,
  value,
  color = "text-primary",
}: {
  title: string;
  value: number;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground">{title}</p>
        <h2 className={`text-4xl font-bold ${color}`}>{value ?? 0}</h2>
      </CardContent>
    </Card>
  );
}

function ProgressBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{value.toFixed(0)}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-muted">
        <div
          className={`${color} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between border-b py-2">
      <span>{label}</span>
      <span className="font-semibold">{value ?? 0}</span>
    </div>
  );
}
