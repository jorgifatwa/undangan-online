import {
  CalendarCheck,
  Clock,
  EyeOff,
  Gift,
  ImageIcon,
  Link2,
  MapPin,
  MessagesSquare,
  Music,
  Palette,
  PenLine,
  Quote,
  Send,
  Share2,
} from "lucide-react";
import Link from "next/link";

import { WhatsAppIcon } from "@/components/marketing/BrandIcons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { business } from "@/config/business";
import { COMING_SOON, FAQ } from "@/lib/marketing/content";
import { LIMITS } from "@/lib/pricing";

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
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} data-reveal>
      <p className="text-gold text-[11px] font-semibold tracking-[0.24em] uppercase">{eyebrow}</p>
      <h2 className="font-heading mt-3 text-3xl leading-tight tracking-tight text-balance sm:text-5xl">
        {title}
      </h2>
      {lead && <p className="text-muted-foreground mt-4 text-pretty sm:text-lg">{lead}</p>}
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

// --------------------------------- Fitur ----------------------------------

const GROUPS = [
  {
    title: "Membuat undangan",
    lead: "Semua yang membuat undangan terasa milikmu.",
    items: [
      {
        icon: Palette,
        t: "Tema hangat & beranimasi",
        d: "Tema pernikahan dan ulang tahun dengan pilihan warna; ganti kapan saja tanpa kehilangan isian.",
      },
      {
        icon: ImageIcon,
        t: "Foto tanpa ribet",
        d: `Galeri hingga ${LIMITS.galleryPhotos} foto. Unggah dari HP (termasuk foto iPhone), atur bagian yang ditonjolkan, ukuran dioptimalkan otomatis.`,
      },
      {
        icon: Music,
        t: "Musik latar",
        d: `Pilih dari koleksi bawaan, atau unggah hingga ${LIMITS.customMusicTracks} lagu sendiri.`,
      },
      {
        icon: Quote,
        t: "Kutipan siap pakai",
        d: "Ayat Al-Qur'an, ayat Alkitab, dan kutipan umum lengkap dengan sumbernya.",
      },
    ],
  },
  {
    title: "Mengelola tamu",
    lead: "Tahu siapa yang datang, tanpa menghitung manual.",
    items: [
      {
        icon: Link2,
        t: "Link personal",
        d: 'Nama tamu tampil di cover undangan — "Kepada Yth. Bapak Hadi & Keluarga".',
      },
      {
        icon: CalendarCheck,
        t: "Daftar tamu & RSVP",
        d: "Tempel daftar tamu sekaligus, tandai yang sudah dikirimi, dan lihat rekap hadir, ragu, serta jumlah orang — bisa diunduh CSV.",
      },
      {
        icon: MessagesSquare,
        t: "Ucapan & doa",
        d: "Ucapan baru muncul langsung; sembunyikan atau hapus yang tidak pantas.",
      },
      {
        icon: Gift,
        t: "Amplop digital & hadiah",
        d: "Rekening, QRIS, dan alamat kirim hadiah dalam satu kartu (tampil di halaman tamu setelah tema dibeli).",
      },
    ],
  },
  {
    title: "Berbagi",
    lead: "Sampai ke tamu dengan rapi.",
    items: [
      {
        icon: Share2,
        t: "Kirim lewat WhatsApp",
        d: "Template pesan sopan yang bisa diubah, lengkap dengan link personal tiap tamu.",
      },
      {
        icon: ImageIcon,
        t: "Pratinjau link yang cantik",
        d: "Saat link dibagikan, muncul gambar berisi foto, nama, dan tanggal acara.",
      },
      {
        icon: MapPin,
        t: "Peta lokasi",
        d: "Tamu langsung membuka Google Maps menuju lokasi acara.",
      },
      {
        icon: EyeOff,
        t: "Tidak muncul di Google",
        d: "Halaman undangan tidak diindeks mesin pencari; data tamu hanya untukmu.",
      },
    ],
  },
];

export function Features() {
  return (
    <div className="mt-12 space-y-12">
      {GROUPS.map((g) => (
        <div key={g.title} className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div data-reveal>
            <h3 className="font-heading text-2xl">{g.title}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{g.lead}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {g.items.map((it, i) => (
              <li key={it.t} data-reveal style={{ ["--reveal-delay" as string]: `${i * 60}ms` }}>
                <Card className="h-full flex-row gap-4 rounded-2xl p-5 shadow-none transition-shadow hover:shadow-md">
                  <span className="bg-sand text-primary grid size-10 shrink-0 place-items-center rounded-xl">
                    <it.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-medium">{it.t}</p>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{it.d}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="rounded-3xl border border-dashed p-6" data-reveal>
        <p className="text-sm font-semibold">Segera hadir</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {COMING_SOON.map((t) => (
            <li key={t}>
              <Badge
                variant="outline"
                className="text-muted-foreground h-8 gap-2 px-3 text-sm font-normal"
              >
                <Clock aria-hidden /> {t}
                <span className="sr-only"> (segera hadir)</span>
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------- FAQ -----------------------------------

/** FAQ (shadcn Accordion). */
export function Faq() {
  return (
    <Accordion type="single" collapsible className="mx-auto mt-10 max-w-3xl border-y" data-reveal>
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
    <section className="bg-clay text-primary-foreground relative overflow-hidden">
      <div
        aria-hidden
        className="border-gold/40 absolute -top-32 -right-24 size-96 rounded-full border"
      />
      <div
        className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-24"
        data-reveal
      >
        <p className="text-gold text-[11px] font-semibold tracking-[0.24em] uppercase">
          Mulai hari ini
        </p>
        <h2 className="font-heading mt-4 text-3xl leading-tight text-balance sm:text-5xl">
          Undangan digital pertamamu bisa siap sebelum teh hangatmu dingin.
        </h2>
        <p className="mt-4 text-white/75">
          Coba tema apa pun tanpa bayar. Bayar sekali saat memesan — tanpa langganan.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="bg-background text-clay hover:bg-background/90 h-12 rounded-full px-7 text-base transition-transform hover:-translate-y-0.5"
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
    </section>
  );
}
