import { Suspense } from "react";
import LoginClient from "./login-client";
import { DashboardLayout } from "../components/dashboard-layout";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
            <p className="text-slate-500 animate-pulse">Loading</p>
          </div>
        </DashboardLayout>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
