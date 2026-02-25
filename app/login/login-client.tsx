"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import kemenimipas from "@/public/kemenimipas.png";
import ditjenpas from "@/public/ditjenpas.png";
import rutan from "@/public/rutan.jpeg";
import Image from "next/image";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import getFriendlyErrorMessage from "@/utils/getFriendlyErrorMessage";

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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <Image
          src={rutan}
          alt="Background image"
          fill
          priority
          className="object-cover"
        />
        {/* Dark Overlay agar teks tetap terbaca */}
        <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/60" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* GLASS CARD EFFECT */}
        <Card className="bg-white/10 dark:bg-slate-900/20 backdrop-blur-xl border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] ring-1 ring-white/20">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="flex items-center justify-center gap-4 bg-white/10 p-2 rounded-2xl backdrop-blur-md">
                <Image
                  src={kemenimipas}
                  alt="logo kemenimipas"
                  width={40}
                  height={40}
                />
                <Image
                  src={ditjenpas}
                  alt="logo ditjenpas"
                  width={40}
                  height={40}
                />
                <Image src={logo} alt="logo rutan" width={40} height={40} />
              </div>
            </div>
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold text-white drop-shadow-md">
                SISDAPIM RUSARANG
              </CardTitle>
              <CardDescription className="text-white/80">
                Silakan login untuk melanjutkan
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-500/20 backdrop-blur-md border-red-500/50 text-white"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {getFriendlyErrorMessage(error)}
                  </AlertDescription>
                </Alert>
              )}

              <FieldGroup className="space-y-4">
                <Field className="space-y-1.5">
                  <FieldLabel htmlFor="email" className="text-white">
                    Email
                  </FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="kepala.seksi@rutan.go.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 transition-all"
                  />
                </Field>

                <Field className="space-y-1.5">
                  <FieldLabel htmlFor="password" className="text-white">
                    Password
                  </FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 transition-all"
                  />
                </Field>
              </FieldGroup>

              <Button
                type="submit"
                className="w-full h-11 bg-white hover:bg-white/90 text-slate-900 font-semibold shadow-lg"
                disabled={loading}
              >
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
        </Card>

        <p className="text-center text-white/60 text-xs mt-6 drop-shadow-sm">
          © 2026 Sistem Reminder Rutan. All rights reserved.
        </p>
      </div>
    </div>
  );
}
