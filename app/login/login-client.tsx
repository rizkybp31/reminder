"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

import logo from "@/public/logo.png";
import rutan from "@/public/rutan.jpeg";
import Image from "next/image";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md z-10">
        <Card className="shadow-2xl border-slate-200 dark:border-slate-800">
          <CardHeader className="space-y-4">
            {/* logo */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center border">
                <Image src={logo} alt="logo rutan" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold">
                Sistem Reminder Rutan
              </CardTitle>
              <CardDescription>Silakan login untuk melanjutkan</CardDescription>
            </div>
          </CardHeader>

          {/* Start form login */}
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Start input email for login */}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="kepala.seksi@rutan.go.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    className="h-11"
                  />
                </Field>
              </FieldGroup>
              {/* End input email for login */}

              {/* Start input password for login */}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="Password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="h-11"
                  />
                </Field>
              </FieldGroup>
              {/* End input password for login */}

              {/* Submit Button */}
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </CardContent>
          {/* End form login */}
        </Card>

        <p className="text-center text-muted-foreground text-xs mt-6">
          © 2026 Sistem Reminder Rutan. All rights reserved.
        </p>
      </div>
      <Image
        src={rutan}
        alt="Background image"
        className="absolute inset-0 object-cover w-full h-full opacity-30"
      />
    </div>
  );
}
