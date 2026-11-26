import { Palette, PenLine, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { WhatsAppIcon } from "@/components/marketing/BrandIcons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { business } from "@/config/business";
import { FAQ } from "@/lib/marketing/content";

import { bouquetHanging, velvetBg, waxSeal } from "./art";

/** Judul section: label kecil emas + H2 Fraunces. */
export function SectionHead({
  eyebrow,
  title,
  lead,
  center = true,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-gold text-[11px] font-semibold tracking-[0.24em] uppercase" data-reveal>
        {eyebrow}
      </p>
      <h2
        className="font-heading mt-3 text-3xl leading-tight tracking-tight text-balance sm:text-5xl"
        data-reveal="mask"
        style={{ ["--reveal-delay" as string]: "80ms" }}
      >
        {title}
      </h2>
      {lead && (
        <p
          className="text-muted-foreground mt-4 text-pretty sm:text-lg"
          data-reveal
          style={{ ["--reveal-delay" as string]: "200ms" }}
        >
          {lead}
        </p>
      )}
    </div>
  );
}

// ------------------------------- Cara kerja -------------------------------

const STEPS = [
  {
    icon: Palette,
    title: "Pilih & coba tema",
    body: "Jelajahi tema pernikahan dan ulang tahun, lalu coba langsung dengan data contoh — gratis, tanpa daftar.",
  },
  {
    icon: PenLine,
    title: "Isi & bayar",
    body: "Isi nama, acara, dan kutipan langkah demi langkah sambil melihat pratinjau HP. Bayar online sekali, lalu lengkapi foto lewat link khusus.",
  },
  {
    icon: Send,
    title: "Tayang & kirim",
    body: "Pilih alamat undanganmu, tayangkan, lalu kirim ke tamu lewat WhatsApp — setiap tamu disapa dengan namanya.",
  },
];

export function Steps() {
  return (
    <ol className="mt-12 grid gap-5 md:grid-cols-3">
      {STEPS.map((s, i) => (
        <li key={s.title} data-reveal style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}>
          <Card className="relative h-full rounded-3xl p-1 shadow-none">
            <CardHeader className="pt-6">
              <span className="font-heading text-gold/70 absolute top-5 right-6 text-5xl">
                {i + 1}
              </span>
              <span className="bg-sand text-primary grid size-12 place-items-center rounded-2xl">
                <s.icon className="size-6" aria-hidden />
              </span>
              <CardTitle className="font-heading mt-4 text-2xl font-normal">{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <CardDescription className="leading-relaxed">{s.body}</CardDescription>
            </CardContent>
          </Card>
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------- FAQ -----------------------------------

/** FAQ (shadcn Accordion) — kolom kanan; judul di kolom kiri (page.tsx). */
export function Faq() {
  return (
    <Accordion type="single" collapsible className="border-y" data-reveal>
      {FAQ.map((f, i) => (
        <AccordionItem key={f.q} value={`faq-${i}`}>
          <AccordionTrigger className="py-5 text-base">{f.q}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-[15px] leading-relaxed">
            {f.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

// ------------------------------- Testimoni --------------------------------

/** Tampil HANYA bila ada testimoni asli di config/business.ts. */
export function Testimonials() {
  if (!business.testimonials.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="testimoni">
      <SectionHead eyebrow="Kata mereka" title={<span id="testimoni">Dari pengguna kami</span>} />
      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {business.testimonials.map((t) => (
          <li key={t.name} data-reveal>
            <Card className="h-full rounded-3xl p-6 shadow-none">
              <p className="leading-relaxed">“{t.quote}”</p>
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-muted-foreground text-xs">{t.event}</p>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ------------------------------ CTA penutup -------------------------------

export function FinalCta({ waHref }: { waHref: string | null }) {
  return (
    <section className="mx-auto max-w-[1320px] px-2 pb-6 sm:px-4">
      <div
        className="photo-panel text-primary-foreground relative overflow-hidden rounded-[32px]"
        data-reveal="curtain"
      >
        <Image src={velvetBg} alt="" fill sizes="100vw" className="object-cover" />
        <Image
          src={bouquetHanging}
          alt=""
          width={300}
          className="pointer-events-none absolute -top-4 -right-6 z-[1] hidden w-56 drop-shadow-2xl md:block lg:w-72"
        />
        <Image
          src={waxSeal}
          alt=""
          width={110}
          className="pointer-events-none absolute bottom-8 left-8 z-[1] hidden w-20 drop-shadow-xl sm:block"
        />
        <div
          className="relative z-[2] mx-auto max-w-3xl px-6 py-20 text-center sm:py-28"
          data-reveal
        >
          <p className="text-gold text-[11px] font-semibold tracking-[0.24em] uppercase">
            Mulai hari ini
          </p>
          <h2 className="font-heading mt-4 text-4xl leading-tight text-balance sm:text-6xl">
            Undangan digital pertamamu bisa siap sebelum teh hangatmu dingin.
          </h2>
          <p className="mt-5 text-white/75">
            Coba tema apa pun tanpa bayar. Bayar sekali saat memesan — tanpa langganan.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-background text-clay hover:bg-background/90 h-12 rounded-full px-7 text-base"
            >
              <Link href="/tema">Pilih tema</Link>
            </Button>
            {waHref && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/30 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white"
              >
                <a href={waHref} target="_blank" rel="noopener">
                  <WhatsAppIcon className="size-4" /> Tanya lewat WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
