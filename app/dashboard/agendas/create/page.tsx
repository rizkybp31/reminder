"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const CreateAgenda = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    startDateTime: "",
    endDateTime: "",
  });

  if (status === "loading") return null;

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

      if (file) {
        formData.append("attachment", file);
      }

      const res = await fetch("/api/agendas", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal membuat agenda");
      }

      toast.success("Agenda berhasil dibuat");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Agenda</CardTitle>
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
                placeholder="Enter Agenda Title"
              />
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <Input
                name="description"
                required
                value={form.description}
                onChange={handleChange}
                placeholder="Enter Description"
              />
            </Field>

            <Field>
              <FieldLabel>Location</FieldLabel>
              <Input
                name="location"
                required
                value={form.location}
                onChange={handleChange}
                placeholder="Enter Location"
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
                Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Create Agenda"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateAgenda;
