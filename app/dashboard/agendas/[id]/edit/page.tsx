"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const EditAgendaPage = () => {
  const router = useRouter();
  const params = useParams();
  const agendaId = params.id as string;

  const { status } = useSession();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    startDateTime: "",
    endDateTime: "",
    attachmentUrl: "",
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
          attachmentUrl: data.attachmentUrl || "",
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
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("location", form.location);
      formData.append(
        "startDateTime",
        new Date(form.startDateTime).toISOString(),
      );
      formData.append("endDateTime", new Date(form.endDateTime).toISOString());

      // Kirim attachmentUrl lama sebagai cadangan jika tidak ada file baru
      formData.append("attachmentUrl", form.attachmentUrl);

      // Jika ada file baru yang dipilih user
      if (file) {
        formData.append("attachment", file);
      }

      const res = await fetch(`/api/agendas/${agendaId}`, {
        method: "PUT", // Gunakan PUT
        body: formData, // Langsung kirim formData (tanpa headers Content-Type JSON)
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

            <Field>
              <FieldLabel>Lampiran Surat (PDF)</FieldLabel>
              <Link
                href={form.attachmentUrl}
                target="_blank"
                className="text-sm text-blue-600 underline mb-2 block"
              >
                Lihat Lampiran
              </Link>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
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
