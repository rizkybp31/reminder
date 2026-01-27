"use client";

import { Button } from "@/components/ui/button";
import {
  Calendar,
  LayoutDashboard,
  LogOut,
  BarChart3,
  Users,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import logo from "@/public/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NavigationBar = () => {
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
    {
      name: "User",
      href: "/dashboard/users",
      icon: Users,
      show: isKepalaRutan,
    },
  ];

  return (
    <div className="bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center">
              <Image src={logo} alt="logo rutan" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold">Sistem Reminder Rutan</h1>
              <p className="text-xs text-muted-foreground">
                {isKepalaRutan
                  ? "Dashboard Kepala Rutan"
                  : "Dashboard Kepala Seksi"}
              </p>
            </div>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {session?.user?.name && getInitials(session.user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                  {session?.user?.seksiName && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.seksiName}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="border-b">
        <div className="container">
          <nav className="flex space-x-4 lg:space-x-6 overflow-x-auto">
            {navigation.map(
              (item) =>
                item.show && (
                  <Button
                    key={item.name}
                    variant="ghost"
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "relative h-14 rounded-none px-4 font-medium transition-colors hover:text-primary",
                      pathname === item.href
                        ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                ),
            )}

            <div className="ml-auto flex items-center gap-2">
              <Button
                onClick={() => router.push("/dashboard/users/create")}
                size="sm"
                className="h-9"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah User
              </Button>
              <Button onClick={() => router.push("/dashboard/agendas/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Agenda
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default NavigationBar;
