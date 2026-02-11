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

  useEffect(() => {
    fetch("/api/statistic")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data)
    return (
      <>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-slate-500 animate-pulse font-medium">
            Loading data...
          </p>
        </div>
      </>
    );

  const agendaProgress = (data.agenda.responded / data.agenda.total) * 100 || 0;

  const hadirProgress = (data.response.hadir / data.response.total) * 100 || 0;

  return (
    <div className="space-y-8 p-4 md:p-8">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
        Statistik
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <p className="text-muted-foreground mt-2">
              Total respon terhadap agenda
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
        <h2 className={`text-4xl font-bold ${color}`}>{value}</h2>
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
      <div className="w-full bg-muted rounded-full h-3">
        <div
          className={`${color} h-3 rounded-full transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between border-b py-2">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
