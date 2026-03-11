"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ScrollText, User, Calendar, Tag } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { toTitleCase } from "@/utils/toTitleCase";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Log {
    id: string;
    action: string;
    details: string;
    createdAt: string;
    user: {
        name: string;
        email: string;
        role: string;
    };
}

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetch("/api/activity-logs")
            .then((res) => res.json())
            .then((data) => {
                setLogs(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesAction = filterAction === "ALL" || log.action === filterAction;
        const matchesSearch =
            log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.action.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesAction && matchesSearch;
    });

    const getActionColor = (action: string) => {
        if (action.includes("CREATE")) return "bg-green-50 text-green-700 border-green-200";
        if (action.includes("DELETE")) return "bg-red-50 text-red-700 border-red-200";
        if (action.includes("UPDATE")) return "bg-blue-50 text-blue-700 border-blue-200";
        if (action.includes("RESPOND")) return "bg-purple-50 text-purple-700 border-purple-200";
        return "bg-slate-100 text-slate-700 border-slate-200";
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <ScrollText className="h-8 w-8 text-primary" />
                    Log Aktivitas
                </h1>
                <p className="text-slate-500">
                    Rekam jejak aktivitas pengguna dalam sistem
                </p>
            </div>

            <Card className="bg-slate-50/50 border-dashed shadow-none">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Input
                            placeholder="Cari user atau aktivitas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="md:flex-1 bg-white"
                        />
                        <Select value={filterAction} onValueChange={setFilterAction}>
                            <SelectTrigger className="w-full md:w-[200px] bg-white">
                                <SelectValue placeholder="Semua Aksi" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua Aksi</SelectItem>
                                <SelectItem value="CREATE_AGENDA">Buat Agenda</SelectItem>
                                <SelectItem value="UPDATE_AGENDA">Ubah Agenda</SelectItem>
                                <SelectItem value="DELETE_AGENDA">Hapus Agenda</SelectItem>
                                <SelectItem value="RESPOND_AGENDA">Respons Agenda</SelectItem>
                                <SelectItem value="CREATE_USER">Buat User</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-none bg-transparent">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-slate-500 animate-pulse">Memuat log...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed text-slate-400">
                            Tidak ada aktivitas yang sesuai kriteria
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-white hover:shadow-md transition-shadow gap-4"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-full border ${getActionColor(log.action)}`}>
                                            <Tag className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-slate-900">{log.user.name}</span>
                                                <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                                    {toTitleCase(log.user.role)}
                                                </Badge>
                                                <Badge className={`text-[10px] uppercase font-bold border ${getActionColor(log.action)}`}>
                                                    {log.action.replace("_", " ")}
                                                </Badge>
                                            </div>
                                            <p className="text-slate-600 mt-1">{log.details}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-slate-400 min-w-fit">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: idLocale })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
