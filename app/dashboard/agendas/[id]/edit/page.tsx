"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const EditAgendaPage = () => {
  const router = useRouter();
  const params = useParams();
  const agendaId = params.id as string;

  const { status } = useSession();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    startDateTime: "",
    endDateTime: "",
  });

  useEffect(() => {
    const fetchAgenda = async () => {
      try {
        const res = await fetch(`/api/agendas/${agendaId}`);
        if (!res.ok) throw new Error("Gagal memuat agenda");

        const data = await res.json();

        setForm({
          title: data.title,
          description: data.description,
          location: data.location,
          startDateTime: data.startDateTime.slice(0, 16),
          endDateTime: data.endDateTime.slice(0, 16),
        });
      } catch (err) {
        toast.error((err as Error).message);
        router.back();
      } finally {
        setFetching(false);
      }
    };

    fetchAgenda();
  }, [agendaId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/agendas/${agendaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          location: form.location,
          startDateTime: new Date(form.startDateTime).toISOString(),
          endDateTime: new Date(form.endDateTime).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal memperbarui agenda");
      }

      toast.success("Agenda berhasil diperbarui");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-center py-10">Memuat agenda...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Agenda</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Agenda Title</FieldLabel>
              <Input
                name="title"
                required
                value={form.title}
                onChange={handleChange}
              />
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <Input
                name="description"
                required
                value={form.description}
                onChange={handleChange}
              />
            </Field>

            <Field>
              <FieldLabel>Location</FieldLabel>
              <Input
                name="location"
                required
                value={form.location}
                onChange={handleChange}
              />
            </Field>

            <Field>
              <FieldLabel>Agenda Start</FieldLabel>
              <Input
                type="datetime-local"
                name="startDateTime"
                required
                value={form.startDateTime}
                onChange={handleChange}
              />
            </Field>

            <Field>
              <FieldLabel>Agenda End</FieldLabel>
              <Input
                type="datetime-local"
                name="endDateTime"
                required
                value={form.endDateTime}
                onChange={handleChange}
              />
            </Field>

            <Field orientation="responsive" className="justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Agenda"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditAgendaPage;
