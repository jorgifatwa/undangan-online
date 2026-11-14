import { Heart, ShieldCheck, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { LegalContact } from "@/components/marketing/LegalPage";
import { business } from "@/config/business";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: `Tentang ${business.name}: ${business.tagline.toLowerCase()} — undangan pernikahan dan ulang tahun digital yang hangat dan menjaga privasi tamu.`,
  alternates: { canonical: "/tentang" },
};

const VALUES = [
  {
    icon: Heart,
    title: "Personal",
    body: "Setiap tamu disapa dengan namanya, dan setiap tema dirancang utuh — bukan sekadar template yang diganti warnanya.",
  },
  {
    icon: Smartphone,
    title: "Ringan di HP",
    body: "Undangan dibuka di HP tamu dengan berbagai kualitas sinyal, jadi kami menjaganya tetap cepat dan hemat data.",
  },
  {
    icon: ShieldCheck,
    title: "Menjaga privasi",
    body: "Undangan tidak diindeks mesin pencari, IP tamu tidak disimpan mentah, dan data tidak pernah dijual.",
  },
];

export default function TentangPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="text-gold text-[11px] font-semibold tracking-[0.24em] uppercase">
        Tentang kami
      </p>
      <h1 className="font-heading mt-3 text-4xl leading-tight tracking-tight text-balance sm:text-5xl">
        {business.tagline}
      </h1>
      <div className="text-muted-foreground mt-6 space-y-4 text-lg leading-relaxed">
        {business.about ? (
          <p>{business.about}</p>
        ) : (
          <p>
            {business.name} membantu Anda membuat undangan pernikahan online dan undangan ulang
            tahun digital yang terasa hangat seperti undangan cetak — lalu membagikannya ke setiap
            tamu lewat WhatsApp, lengkap dengan RSVP dan ucapan.
          </p>
        )}
      </div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-3">
        {VALUES.map((v) => (
          <li key={v.title} className="bg-card rounded-3xl border p-6">
            <v.icon className="text-primary size-6" aria-hidden />
            <h2 className="font-heading mt-4 text-xl">{v.title}</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{v.body}</p>
          </li>
        ))}
      </ul>

      <section className="mt-14" aria-labelledby="kontak">
        <h2 id="kontak" className="font-heading text-2xl">
          Kontak
        </h2>
        <div className="text-muted-foreground mt-3">
          <LegalContact />
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/masuk"
          className="bg-primary text-primary-foreground rounded-full px-6 py-3 font-medium"
        >
          Buat Undangan Gratis
        </Link>
        <Link
          href="/tema"
          className="border-foreground/15 hover:bg-sand rounded-full border px-6 py-3 font-medium"
        >
          Lihat Tema
        </Link>
      </div>
    </main>
  );
}
