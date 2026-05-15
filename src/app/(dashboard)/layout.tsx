import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { ResizableLayout } from "@/components/layout/resizable-layout";

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
      <ResizableLayout>
        {children}
      </ResizableLayout>
    </div>
  );
}
