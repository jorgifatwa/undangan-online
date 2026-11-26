import Link from "next/link";

import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { requireCustomer } from "@/lib/auth-guard";
import { siteConfig } from "@/lib/site";

export default async function AkunLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCustomer();

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/masuk" });
  }

  return (
    <div className="min-h-dvh">
      <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/akun" className="font-heading text-xl">
            {siteConfig.name}
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground hidden truncate sm:inline">
              {user.email ?? user.name}
            </span>
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
