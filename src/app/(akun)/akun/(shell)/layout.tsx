import { LogOut } from "lucide-react";
import Link from "next/link";

import { signOut } from "@/auth";
import { Logo } from "@/components/brand/Logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { requireCustomer } from "@/lib/auth-guard";
import { siteConfig } from "@/lib/site";

/** Kerangka dashboard pembeli: header ringkas + konten di atas latar gading. */
export default async function AkunLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCustomer();
  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/masuk" });
  }

  return (
    <div className="min-h-dvh">
      <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/akun" aria-label={siteConfig.name}>
            <Logo className="h-7" />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="size-7">
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-48 truncate text-sm sm:inline">
                  {user.name ?? user.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{user.email ?? user.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form action={logout}>
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full">
                    <LogOut /> Keluar
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">{children}</main>
    </div>
  );
}
