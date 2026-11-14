import { Mail, MapPin } from "lucide-react";
import Link from "next/link";

import { business, hasContact, instagramLink, waLink } from "@/config/business";

import { InstagramIcon, WhatsAppIcon } from "./BrandIcons";

const LINKS = [
  { href: "/tema", label: "Tema" },
  { href: "/harga", label: "Harga" },
  { href: "/tentang", label: "Tentang kami" },
  { href: "/syarat", label: "Syarat & Ketentuan" },
  { href: "/privasi", label: "Kebijakan Privasi" },
];

/** Footer semua halaman website. Kontak yang belum diisi (null) tidak tampil. */
export function SiteFooter() {
  const wa = waLink(`Halo ${business.name}, saya ingin bertanya tentang undangan digital.`);
  const ig = instagramLink();
  return (
    <footer className="bg-sand paper border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-heading text-2xl">
            {business.name}
            <span className="text-gold">.</span>
          </p>
          <p className="text-muted-foreground mt-2 max-w-sm text-sm">{business.tagline}.</p>
          {business.about && (
            <p className="text-muted-foreground mt-3 max-w-sm text-sm">{business.about}</p>
          )}
        </div>
        <nav aria-label="Tautan footer">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase">Jelajahi</p>
          <ul className="mt-3 space-y-2 text-sm">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted-foreground hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {(hasContact() || business.city) && (
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] uppercase">Hubungi kami</p>
            <ul className="mt-3 space-y-2 text-sm">
              {wa && (
                <li>
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 rounded-full bg-[#1f9d55] px-4 py-2 font-medium text-white"
                  >
                    <WhatsAppIcon className="size-4" /> Chat WhatsApp
                  </a>
                </li>
              )}
              {business.email && (
                <li>
                  <a
                    href={`mailto:${business.email}`}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
                  >
                    <Mail className="size-4" /> {business.email}
                  </a>
                </li>
              )}
              {ig && (
                <li>
                  <a
                    href={ig}
                    target="_blank"
                    rel="noopener"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
                  >
                    <InstagramIcon className="size-4" /> @{business.instagram}
                  </a>
                </li>
              )}
              {business.city && (
                <li className="text-muted-foreground inline-flex items-center gap-2">
                  <MapPin className="size-4" /> {business.city}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t">
        <p className="text-muted-foreground mx-auto max-w-6xl px-4 py-5 text-xs sm:px-6">
          © {new Date().getFullYear()} {business.name}. Undangan pernikahan online & undangan ulang
          tahun digital.
        </p>
      </div>
    </footer>
  );
}
