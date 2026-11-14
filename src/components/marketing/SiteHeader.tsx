import Link from "next/link";

import { business } from "@/config/business";

import { AuthButtons } from "./AuthButtons";

const NAV = [
  { href: "/tema", label: "Tema" },
  { href: "/#cara-kerja", label: "Cara kerja" },
  { href: "/harga", label: "Harga" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b border-transparent backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="font-heading text-xl tracking-tight sm:text-2xl"
          aria-label={`${business.name} — beranda`}
        >
          {business.name}
          <span className="text-gold" aria-hidden>
            .
          </span>
        </Link>
        <nav aria-label="Navigasi utama" className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-muted-foreground hover:text-foreground rounded-full px-3 py-2 text-sm"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
