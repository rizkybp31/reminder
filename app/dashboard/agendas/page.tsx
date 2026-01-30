"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface Agenda {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  status: "pending" | "responded";
  location: string;
}

export default function AgendaCalendarPage() {
  const router = useRouter();
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [selectedAgenda, setSelectedAgenda] = useState<Agenda | null>(null);

  const fetchAgendas = async () => {
    try {
      const res = await fetch("/api/agendas");
      const data = await res.json();
      setAgendas(data.agendas);
    } catch {
      toast.error("Gagal memuat agenda");
    }
  };

  useEffect(() => {
    (async () => {
      await fetchAgendas();
    })();
  }, []);

  const events = agendas.map((agenda) => ({
    id: agenda.id,
    title: agenda.title,
    start: agenda.startDateTime,
    end: agenda.endDateTime,
    extendedProps: agenda,
  }));

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6S">
        <Card>
          <CardHeader>
            <CardTitle>Kalender Agenda</CardTitle>
          </CardHeader>
          <CardContent>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="id"
              height="auto"
              events={events}
              headerToolbar={{
                left: "prev,next",
                center: "title",
                right: "dayGridMonth,timeGridWeek",
              }}
              buttonText={{
                today: "Today",
                month: "Month",
              }}
              eventClick={(info) => {
                setSelectedAgenda(info.event.extendedProps as Agenda);
              }}
            />
          </CardContent>
        </Card>

        {/* Dialog Detail Agenda */}
        <Dialog
          open={!!selectedAgenda}
          onOpenChange={() => setSelectedAgenda(null)}
        >
          <DialogContent>
            {selectedAgenda && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedAgenda.title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 text-sm">
                  <div>
                    <Badge
                      variant={
                        selectedAgenda.status === "responded"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedAgenda.status}
                    </Badge>
                  </div>

                  <p>
                    🕒{" "}
                    {format(
                      new Date(selectedAgenda.startDateTime),
                      "EEEE, dd MMMM yyyy HH:mm",
                      { locale: idLocale },
                    )}
                  </p>

                  <p>📍 {selectedAgenda.location}</p>

                  <Button
                    className="w-full"
                    onClick={() =>
                      router.push(`/dashboard/agendas/${selectedAgenda.id}`)
                    }
                  >
                    Lihat Detail Agenda
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
