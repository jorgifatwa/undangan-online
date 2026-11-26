import { signOut } from "@/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/site";

/** Kerangka panel admin: Sidebar shadcn + area konten. */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const openClaims = await db.claimLink.count({
    where: { status: "OPEN", expiresAt: { gt: new Date() } },
  });

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <SidebarProvider>
      <AdminSidebar
        brand={siteConfig.name}
        user={{ name: user.name ?? null, email: user.email ?? null, image: user.image ?? null }}
        openClaims={openClaims}
        logout={logout}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 !h-4" />
          <span className="text-muted-foreground text-sm">{siteConfig.name} · Admin</span>
        </header>
        <div className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
