import { Menu } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/brand/Logo";
import { business } from "@/config/business";

import { AuthButtons } from "./AuthButtons";

const NAV = [
  { href: "/tema", label: "Tema" },
  { href: "/#cara-kerja", label: "Cara kerja" },
  { href: "/harga", label: "Harga" },
  { href: "/#faq", label: "FAQ" },
];

function Brand() {
  return (
    <Link href="/" aria-label={`${business.name} — beranda`} className="shrink-0">
      <Logo className="h-7 sm:h-8" />
    </Link>
  );
}

/** Header website: NavigationMenu (desktop) + Sheet (HP). */
export function SiteHeader() {
  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/65 sticky top-0 z-40 border-b border-transparent backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Brand />
        <NavigationMenu
          viewport={false}
          className="ml-6 hidden md:flex"
          aria-label="Navigasi utama"
        >
          <NavigationMenuList>
            {NAV.map((n) => (
              <NavigationMenuItem key={n.href}>
                <NavigationMenuLink asChild className="text-muted-foreground rounded-full px-3">
                  <Link href={n.href}>{n.label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <div className="ml-auto flex items-center gap-1">
          <AuthButtons />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Buka menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>
                  <Logo className="h-7" />
                  <span className="sr-only">{business.name}</span>
                </SheetTitle>
                <SheetDescription>{business.tagline}</SheetDescription>
              </SheetHeader>
              <nav aria-label="Navigasi utama" className="grid gap-1 px-4">
                {NAV.map((n) => (
                  <Button key={n.href} asChild variant="ghost" className="justify-start text-base">
                    <Link href={n.href}>{n.label}</Link>
                  </Button>
                ))}
                <Button asChild size="lg" className="mt-4 rounded-full">
                  <Link href="/tema">Pilih tema</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
