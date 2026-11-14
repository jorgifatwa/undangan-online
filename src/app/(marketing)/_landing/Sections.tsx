import {
  CalendarCheck,
  ChevronDown,
  EyeOff,
  FileSpreadsheet,
  Gift,
  ImageIcon,
  Link2,
  Lock,
  MapPin,
  MessagesSquare,
  Music,
  Palette,
  PenLine,
  QrCode,
  Quote,
  Send,
  Share2,
  Users,
} from "lucide-react";
import Link from "next/link";

import { WhatsAppIcon } from "@/components/marketing/BrandIcons";
import { business } from "@/config/business";
import { FAQ, minTierFor } from "@/lib/marketing/content";
import { PACKAGES } from "@/lib/packages";

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
    title: "Pilih tema",
    body: "Jelajahi tema pernikahan dan ulang tahun, lalu coba langsung dengan data contoh.",
  },
  {
    icon: PenLine,
    title: "Isi data",
    body: "Nama, acara, foto, musik, dan kutipan. Setiap perubahan langsung terlihat di pratinjau HP.",
  },
  {
    icon: Send,
    title: "Bagikan ke WhatsApp",
    body: "Terbitkan, ketik nama tamu, dan kirim. Setiap tamu disapa dengan namanya sendiri.",
  },
];

export function Steps() {
  return (
    <ol className="mt-12 grid gap-5 md:grid-cols-3">
      {STEPS.map((s, i) => (
        <li
          key={s.title}
          className="bg-card relative rounded-3xl border p-7"
          data-reveal
          style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}
        >
          <span className="font-heading text-gold/70 absolute top-5 right-6 text-5xl">{i + 1}</span>
          <s.icon className="text-primary size-7" aria-hidden />
          <h3 className="font-heading mt-5 text-2xl">{s.title}</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

// --------------------------------- Fitur ----------------------------------

const tier = (f: Parameters<typeof minTierFor>[0]) => {
  const t = minTierFor(f);
  return t && t !== "FREE" ? `Mulai ${PACKAGES[t].label}` : undefined;
};

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
        d: "Unggah dari HP (termasuk foto iPhone), atur bagian yang ditonjolkan, ukuran dioptimalkan otomatis.",
      },
      {
        icon: Music,
        t: "Musik latar",
        d: "Pilih dari koleksi bawaan, atau unggah lagu sendiri.",
        badge: tier("customMusic"),
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
        t: "RSVP & rekap kehadiran",
        d: "Hadir, tidak hadir, ragu, dan jumlah orang terekap otomatis di editor undangan.",
      },
      {
        icon: MessagesSquare,
        t: "Ucapan & doa",
        d: "Ucapan baru muncul langsung; sembunyikan atau hapus yang tidak pantas.",
      },
      {
        icon: Gift,
        t: "Amplop digital & hadiah",
        d: "Rekening, QRIS, dan alamat kirim hadiah dalam satu kartu.",
        badge: tier("digitalEnvelope"),
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

const SOON = [
  { icon: Users, t: "Daftar tamu" },
  { icon: FileSpreadsheet, t: "Impor tamu dari Excel" },
  { icon: Send, t: "Kirim WhatsApp massal" },
  { icon: QrCode, t: "QR check-in di lokasi" },
  { icon: Lock, t: "Mode privat dengan kata sandi" },
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
              <li
                key={it.t}
                className="bg-card flex gap-4 rounded-2xl border p-5"
                data-reveal
                style={{ ["--reveal-delay" as string]: `${i * 60}ms` }}
              >
                <span className="bg-sand text-primary grid size-10 shrink-0 place-items-center rounded-xl">
                  <it.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-medium">
                    {it.t}
                    {"badge" in it && it.badge && (
                      <span className="bg-accent text-accent-foreground ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap">
                        {it.badge}
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{it.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="rounded-3xl border border-dashed p-6" data-reveal>
        <p className="text-sm font-semibold">Segera hadir</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SOON.map((s) => (
            <li
              key={s.t}
              className="text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
            >
              <s.icon className="size-4" aria-hidden /> {s.t}
              <span className="sr-only"> (segera hadir)</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------- FAQ -----------------------------------

/** Tanpa JavaScript: <details> bawaan browser. */
export function Faq() {
  return (
    <div className="divide-border mx-auto mt-10 max-w-3xl divide-y border-y">
      {FAQ.map((f) => (
        <details key={f.q} className="group py-1" data-reveal>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-medium [&::-webkit-details-marker]:hidden">
            {f.q}
            <ChevronDown
              className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <p className="text-muted-foreground pb-5 leading-relaxed">{f.a}</p>
        </details>
      ))}
    </div>
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
          <li key={t.name} className="bg-card rounded-3xl border p-6" data-reveal>
            <p className="leading-relaxed">“{t.quote}”</p>
            <p className="mt-4 text-sm font-medium">{t.name}</p>
            <p className="text-muted-foreground text-xs">{t.event}</p>
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
          Coba semua tema gratis. Tingkatkan paket hanya saat undangan siap dibagikan.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/masuk"
            className="text-clay bg-background rounded-full px-7 py-3.5 font-medium transition-transform hover:-translate-y-0.5"
          >
            Buat Undangan Gratis
          </Link>
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3.5 font-medium hover:bg-white/10"
            >
              <WhatsAppIcon className="size-4" /> Tanya lewat WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
