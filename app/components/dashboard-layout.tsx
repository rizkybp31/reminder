// File: src/components/dashboard-layout.tsx (Shadcn Version)
"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Calendar, LayoutDashboard, BarChart3 } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isKepalaRutan = session?.user?.role === "KEPALA_RUTAN";

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: "Agenda",
      href: "/dashboard/agendas",
      icon: Calendar,
      show: true,
    },
    {
      name: "Statistik",
      href: "/dashboard/statistics",
      icon: BarChart3,
      show: isKepalaRutan,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6">{children}</main>
    </div>
  );
}
