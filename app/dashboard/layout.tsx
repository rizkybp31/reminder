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
    <>
      <NavigationBar />
      <main className="container py-6 px-4">{children}</main>
    </>
  );
};

export default DashboardLayout;
