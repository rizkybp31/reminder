import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const DashboardLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const session = await getServerSession(authOptions);

  const roleStatus = session?.user.role;

  if (roleStatus !== "kepala_rutan") {
    redirect("/dashboard");
  }

  return <>{children}</>;
};

export default DashboardLayout;
