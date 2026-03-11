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
import { Loader2, AlertCircle, Mail, Lock, ShieldCheck } from "lucide-react";

import logo from "@/public/logo.png";
import kemenimipas from "@/public/kemenimipas.png";
import ditjenpas from "@/public/ditjenpas.png";
import rutan from "@/public/rutan.jpeg";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="relative h-screen min-h-[450px] flex items-center justify-center p-4 bg-slate-900 overflow-hidden">
      {/* PROFESSIONAL BACKGROUND SYSTEM */}
      <div className="absolute inset-0 z-0">
        <Image
          src={rutan}
          alt="Rutan Background"
          fill
          priority
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-[4px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[360px] z-10"
      >
        {/* SEMI-TRANSPARENT GLASS CARD */}
        <Card className="bg-white/90 backdrop-blur-xl border-white/40 shadow-2xl overflow-hidden rounded-[2rem] border-2">
          {/* Extremely Compact Header */}
          <CardHeader className="pt-6 pb-2 text-center space-y-3">
            <div className="flex justify-center items-center gap-3">
              <Image src={kemenimipas} alt="logo" width={28} height={28} className="drop-shadow-sm" />
              <Image src={ditjenpas} alt="logo" width={28} height={28} className="drop-shadow-sm" />
              <Image src={logo} alt="logo" width={28} height={28} className="drop-shadow-sm" />
            </div>

            <div className="space-y-0">
              <CardTitle className="text-xl font-black text-slate-900 tracking-tight uppercase">
                SISDAPIM <span className="text-blue-600">RUSARANG</span>
              </CardTitle>
              <CardDescription className="text-slate-500 font-bold tracking-widest text-[7px] uppercase opacity-80">
                Portal Agenda Pimpinan
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-7 pb-8 pt-2">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-3"
                >
                  <Alert variant="destructive" className="py-1 px-3 bg-red-50 border-red-100 rounded-lg">
                    <AlertDescription className="text-[9px] font-bold leading-none py-1 text-red-800">
                      {getFriendlyErrorMessage(error)}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-3">
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email Instansi"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                    <Lock className="h-3.5 w-3.5" />
                  </div>
                  <Input
                    type="password"
                    placeholder="Kata Sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-slate-900 hover:bg-blue-600 text-white font-black rounded-xl shadow-lg transition-all active:scale-[0.98] mt-1 text-[10px] uppercase tracking-widest"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Sign In</div>}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-slate-400 text-[8px] font-black tracking-[0.2em] opacity-60">
                SISDAPIM RUSARANG &copy; 2026
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
