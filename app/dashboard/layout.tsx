import NavigationBar from "../components/nav-bar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const DashboardLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="px-5">
      <NavigationBar />
      <div className="py-6">{children}</div>
    </div>
  );
};

export default DashboardLayout;
