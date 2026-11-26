import type { Metadata } from "next";
import Link from "next/link";

import { VisitBeacon } from "@/components/analytics/VisitBeacon";
import { Button } from "@/components/ui/button";
import { business, waLink } from "@/config/business";
import { INCLUDED, PAYMENT_TEXT } from "@/lib/marketing/content";
import { landingJsonLd } from "@/lib/marketing/jsonld";
import { priceRange } from "@/lib/pricing";
import { formatRupiah } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { THEME_MANIFESTS, themeThumb } from "@/themes/registry";

import { Demo, type DemoTheme } from "./_landing/Demo";
import { Hero } from "./_landing/Hero";
import { About } from "./_landing/About";
import { IntroCurtain } from "./_landing/IntroCurtain";
import { ThemeMarquee } from "./_landing/Marquee";
import { Numbered } from "./_landing/Numbered";
import { PriceList } from "./_landing/PriceList";
import { Faq, FinalCta, SectionHead, Steps, Testimonials } from "./_landing/Sections";
import { SelectedThemes } from "./_landing/SelectedThemes";
import { StoryPhone } from "./_landing/StoryPhone";
import { StickyCta } from "./_landing/StickyCta";

const TITLE = `${business.name} — Undangan Pernikahan Online & Undangan Digital Ulang Tahun`;
const DESCRIPTION =
  "Buat undangan pernikahan online dan undangan ulang tahun online yang hangat dan personal. Nama tamu di setiap link, RSVP & ucapan, kirim lewat WhatsApp. Coba gratis.";

/** Gambar pratinjau website (src/app/opengraph-image.tsx); objek openGraph di
 *  halaman ini menimpa gambar bawaan, jadi dicantumkan eksplisit. */
const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${business.name} — ${business.tagline}`,
};

/** Landing page diindeks mesin pencari (berbeda dengan halaman undangan). */
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    "undangan pernikahan online",
    "undangan digital",
    "undangan ulang tahun online",
    "undangan pernikahan digital",
    "undangan online WhatsApp",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: business.name,
    url: siteConfig.appUrl,
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default function HomePage() {
  // Tema pernikahan lebih dulu (urutan registry alfabetis).
  const demoThemes: DemoTheme[] = [...THEME_MANIFESTS]
    .sort(
      (a, b) =>
        Number(!a.eventTypes.includes("WEDDING")) - Number(!b.eventTypes.includes("WEDDING")),
    )
    .map((m) => ({
      id: m.id,
      name: m.name,
      eventType: m.eventTypes[0],
      thumb: themeThumb(m.id) ?? null,
      background: m.thumbnail.background,
    }));
  // Tirai Beludru = tema andalan → tampil paling depan & lebar
  const featuredFirst = [...THEME_MANIFESTS].sort(
    (a, b) => Number(b.id === "tirai-beludru") - Number(a.id === "tirai-beludru"),
  );
  const wa = waLink(`Halo ${business.name}, saya ingin bertanya tentang undangan digital.`);
  return (
    <main>
      <script
        type="application/ld+json"

        dangerouslySetInnerHTML={{
          __html: JSON.stringify(landingJsonLd()).replace(/</g, "\\u003c"),
        }}
      />
      <IntroCurtain />
      <div id="hero">
        <Hero />
      </div>

      <ThemeMarquee />

      <section id="lihat" className="mx-auto max-w-6xl scroll-mt-16 px-4 pt-10 pb-20 sm:px-6">
        <SectionHead
          center={false}
          eyebrow="Lihat undanganmu hidup"
          title="Satu undangan, dari sampul sampai doa tamu"
          lead="Gulir pelan — beginilah tamu membuka undangan tema Tirai Beludru di HP mereka."
        />
        <div className="mt-6">
          <StoryPhone />
        </div>
      </section>

      <div className="bg-sand paper border-y">
        <About />
      </div>

      <section id="tema" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6 sm:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            center={false}
            eyebrow="Tema pilihan"
            title="Dirancang utuh, dari cover sampai ucapan"
            lead="Setiap tema bisa dicoba gratis dengan data contoh — atau dengan namamu sendiri."
          />
          <Button asChild variant="outline" className="rounded-full bg-transparent">
            <Link href="/tema">Semua tema ({THEME_MANIFESTS.length})</Link>
          </Button>
        </div>
        <div className="mt-12">
          <SelectedThemes themes={featuredFirst} />
        </div>
      </section>

      <section id="cara-kerja" className="bg-sand paper scroll-mt-16 border-y">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <SectionHead
            eyebrow="Cara kerja"
            title="Tiga langkah, dari HP saja"
            lead="Tidak perlu aplikasi atau keahlian desain."
          />
          <Steps />
        </div>
      </section>

      <section id="fitur" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6 sm:py-28">
        <SectionHead
          center={false}
          eyebrow="Fitur"
          title="Semua yang dibutuhkan undanganmu"
          lead="Dari membuat, mengelola tamu, sampai membagikannya — di satu tempat."
        />
        <Numbered />
      </section>

      <section id="demo" className="bg-sand paper scroll-mt-16 border-y">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <SectionHead
            center={false}
            eyebrow="Coba sekarang"
            title="Ketik namamu, lihat undanganmu"
            lead="Tanpa daftar dulu. Nama yang kamu ketik langsung tampil di cover undangan digital sungguhan."
          />
          <div className="mt-10">
            <Demo themes={demoThemes} />
          </div>
        </div>
      </section>

      <section id="harga" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6 sm:py-28">
        <SectionHead
          eyebrow="Harga"
          title="Harga per tema, semua fitur termasuk"
          lead={`Mulai ${formatRupiah(priceRange().min)}, sekali bayar per undangan — tanpa paket, tanpa langganan.`}
        />
        <div className="mt-12">
          <PriceList themes={[...THEME_MANIFESTS]} included={INCLUDED} />
        </div>
        <p className="text-muted-foreground mx-auto mt-8 max-w-2xl text-center text-sm">
          {PAYMENT_TEXT}{" "}
          <Link href="/harga" className="text-foreground underline underline-offset-4">
            Lihat ketentuan harga & ganti tema
          </Link>
        </p>
      </section>

      <section id="faq" className="bg-sand paper scroll-mt-16 border-y">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1fr_1.4fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SectionHead
              center={false}
              eyebrow="FAQ"
              title="Pertanyaan yang sering diajukan"
              lead="Belum terjawab? Tanya langsung lewat WhatsApp."
            />
          </div>
          <Faq />
        </div>
      </section>

      <Testimonials />

      <div id="cta-akhir" className="pt-16">
        <FinalCta waHref={wa} />
      </div>
      <StickyCta />
      <VisitBeacon k="landing" />
    </main>
  );
}
