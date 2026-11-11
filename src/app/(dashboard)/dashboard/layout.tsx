import Link from "next/link";

import { signOut } from "@/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-guard";
import { siteConfig } from "@/lib/site";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-dvh">
      <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/dashboard" className="font-heading text-xl">
            {siteConfig.name}
          </Link>
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                Keluar
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
