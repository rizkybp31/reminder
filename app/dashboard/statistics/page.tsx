"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Download, FileBarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";
import { toast } from "sonner";

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
  const [isExporting, setIsExporting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const pieChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
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

  const agendaData = [
    { name: "Selesai", value: data.agenda.responded, color: "#10b981" },
    { name: "Menunggu", value: data.agenda.pending, color: "#f59e0b" },
  ];

  const responseData = [
    { name: "Hadir", total: data.response.hadir, color: "#10b981" },
    { name: "Tidak Hadir", total: data.response.tidakHadir, color: "#ef4444" },
    { name: "Diwakilkan", total: data.response.diwakilkan, color: "#3b82f6" },
  ];

  const exportPDF = async () => {
    if (!data) return;

    setIsExporting(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text("Laporan Statistik SISDAPIM RUSARANG", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 14, 30);

      // Data Table
      autoTable(doc, {
        startY: 40,
        head: [["Kategori", "Total"]],
        body: [
          ["Total Agenda", data.agenda.total],
          ["Agenda Selesai", data.agenda.responded],
          ["Agenda Menunggu", data.agenda.pending],
          ["Total Respons", data.response.total],
          ["Kepala Rutan Hadir", data.response.hadir],
          ["Tidak Hadir", data.response.tidakHadir],
          ["Diwakilkan", data.response.diwakilkan],
        ],
        headStyles: { fillColor: [37, 99, 235] }, // blue-600
        margin: { top: 40 }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 20;

      // Capture and add charts
      if (pieChartRef.current && barChartRef.current) {
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text("Visualisasi Data", 14, finalY);

        const chartWidth = 85;

        // Capture Pie Chart
        const pieEl = pieChartRef.current;
        const pieRatio = pieEl.offsetHeight / pieEl.offsetWidth;
        const pieHeight = chartWidth * pieRatio;
        const pieImgData = await toPng(pieEl, { pixelRatio: 2, backgroundColor: '#ffffff' });
        doc.addImage(pieImgData, 'PNG', 14, finalY + 10, chartWidth, pieHeight);

        // Capture Bar Chart
        const barEl = barChartRef.current;
        const barRatio = barEl.offsetHeight / barEl.offsetWidth;
        const barHeight = chartWidth * barRatio;
        const barImgData = await toPng(barEl, { pixelRatio: 2, backgroundColor: '#ffffff' });
        doc.addImage(barImgData, 'PNG', 110, finalY + 10, chartWidth, barHeight);

        doc.setFontSize(10);
        doc.text("Rasio Pengisian Agenda", 14, finalY + pieHeight + 15);
        doc.text("Distribusi Respons", 110, finalY + barHeight + 15);
      }

      doc.save(`statistik-agenda-${new Date().getTime()}.pdf`);
      toast.success("Laporan PDF berhasil diunduh");
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengekspor PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Statistik
          </h1>
          <p className="text-slate-500">
            Ringkasan data agenda dan partisipasi
          </p>
        </div>
        <Button
          onClick={exportPDF}
          variant="outline"
          className="shadow-sm"
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Memproses..." : "Export PDF"}
        </Button>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rasio Pengisian Agenda</CardTitle>
            <CardDescription>Perbandingan agenda selesai vs menunggu</CardDescription>
          </CardHeader>
          <CardContent className="h-64" ref={pieChartRef}>
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={agendaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {agendaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Respons</CardTitle>
            <CardDescription>Statistik kehadiran Kepala Rutan</CardDescription>
          </CardHeader>
          <CardContent className="h-64" ref={barChartRef}>
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={responseData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {responseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

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
