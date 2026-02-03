"use client";

import { Button } from "@/components/ui/button";
import {
  Calendar,
  LayoutDashboard,
  LogOut,
  BarChart3,
  Users,
  Plus,
  Menu, // Icon Burger
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import logo from "@/public/logo.png";
import kemenimipas from "@/public/kemenimipas.png";
import ditjenpas from "@/public/ditjenpas.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import Link from "next/link";

interface NavItemsProps {
  isMobile?: boolean;
  navigation: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    show: boolean;
  }>;
  pathname: string;
  router: ReturnType<typeof useRouter>;
  setOpen: (open: boolean) => void;
}

const NavItems = ({
  isMobile = false,
  navigation,
  pathname,
  setOpen,
}: NavItemsProps) => (
  <>
    {navigation.map(
      (item) =>
        item.show && (
          <Link key={item.name} href={item.href} passHref>
            <Button
              onClick={() => {
                if (isMobile) {
                  setOpen(false);
                }
              }}
              variant={"ghost"}
              className={cn(
                "relative font-medium transition-colors hover:text-primary",
                isMobile
                  ? "w-full justify-start h-12 px-4"
                  : "h-14 rounded-none px-4",
                pathname === item.href
                  ? isMobile
                    ? "bg-primary/10 text-primary border-l-4 border-primary"
                    : "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                  : "text-muted-foreground",
              )}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.name}
            </Button>
          </Link>
        ),
    )}
  </>
);

const NavigationBar = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isKepalaRutan = session?.user?.role === "kepala_rutan";

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    );
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    { name: "Agenda", href: "/dashboard/agendas", icon: Calendar, show: true },
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
    <div className="bg-background px-4">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="block lg:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-70 sm:w-87.5 px-4">
                  <SheetHeader className="mb-6">
                    <div className="flex items-center gap-1.5">
                      <div className="relative h-8 w-8">
                        <Image
                          src={kemenimipas}
                          alt="Logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="relative h-8 w-8">
                        <Image
                          src={ditjenpas}
                          alt="Logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="relative h-8 w-8">
                        <Image
                          src={logo}
                          alt="Logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                    <SheetTitle className="text-left flex items-center gap-2 mt-2">
                      SISDAPIM RUSARANG
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col space-y-2">
                    <NavItems
                      isMobile
                      navigation={navigation}
                      pathname={pathname}
                      router={router}
                      setOpen={setOpen}
                    />
                    <Separator className="my-4" />
                    <Button
                      onClick={() => {
                        router.push("/dashboard/agendas/create");
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Tambah Agenda
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative h-8 w-8">
                <Image
                  src={kemenimipas}
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="relative h-8 w-8">
                <Image
                  src={ditjenpas}
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="relative h-8 w-8">
                <Image src={logo} alt="Logo" fill className="object-contain" />
              </div>
            </div>

            <div className="hidden sm:block border-l pl-4 h-8 flex flex-col justify-center">
              <h1 className="text-sm font-bold leading-tight uppercase">
                Sistem Reminder
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase">
                {isKepalaRutan ? "Kepala Rutan" : "Kepala Seksi"}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10 border border-muted">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(session?.user?.name || "")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="hidden lg:block border-b bg-slate-50/50">
        <div className="container">
          <nav className="flex items-center h-14">
            <div className="flex">
              <NavItems
                navigation={navigation}
                pathname={pathname}
                router={router}
                setOpen={setOpen}
              />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

const Separator = ({ className }: { className?: string }) => (
  <div className={cn("h-1px w-full bg-border", className)} />
);

export default NavigationBar;
