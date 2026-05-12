import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-sf-bg">
      <AppHeader />
      <SidebarNav />
      <main className="ml-[220px] pt-14 min-h-screen">
        {children}
      </main>
    </div>
  );
}
