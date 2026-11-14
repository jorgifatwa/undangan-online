import type { Metadata } from "next";
import Link from "next/link";

import { Pricing } from "@/components/marketing/Pricing";
import { business, waLink } from "@/config/business";
import { PAYMENT_TEXT } from "@/lib/marketing/content";
import { landingJsonLd } from "@/lib/marketing/jsonld";
import { pricingData } from "@/lib/marketing/pricing";
import { siteConfig } from "@/lib/site";
import { THEME_MANIFESTS, themeThumb } from "@/themes/registry";

import { Demo, type DemoTheme } from "./_landing/Demo";
import { Hero } from "./_landing/Hero";
import { Faq, Features, FinalCta, SectionHead, Steps, Testimonials } from "./_landing/Sections";
import { Showcase } from "./_landing/Showcase";
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
  const wa = waLink(`Halo ${business.name}, saya ingin bertanya tentang undangan digital.`);
  return (
    <main>
      <script
        type="application/ld+json"

        dangerouslySetInnerHTML={{
          __html: JSON.stringify(landingJsonLd()).replace(/</g, "\\u003c"),
        }}
      />
      <div id="hero">
        <Hero />
      </div>

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

      <section id="tema" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6 sm:py-24">
        <SectionHead
          eyebrow="Tema"
          title="Tema undangan pernikahan & ulang tahun"
          lead="Setiap tema dirancang utuh — dari cover, animasi pembuka, sampai kartu ucapan. Semua bisa dicoba gratis."
        />
        <div className="mt-10">
          <Showcase themes={[...THEME_MANIFESTS]} />
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

      <section id="fitur" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6 sm:py-24">
        <SectionHead
          center={false}
          eyebrow="Fitur"
          title="Lebih dari sekadar undangan digital"
          lead="Dari membuat, mengelola tamu, sampai membagikannya — semuanya di satu tempat."
        />
        <Features />
      </section>

      <section id="harga" className="bg-sand paper scroll-mt-16 border-y">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <SectionHead
            eyebrow="Harga"
            title="Coba gratis, bayar saat siap disebar"
            lead="Sekali bayar per undangan, tanpa langganan. Tingkatkan paket kapan saja tanpa kehilangan isian."
          />
          <div className="mt-10">
            <Pricing wedding={pricingData("WEDDING")} birthday={pricingData("BIRTHDAY")} compact />
          </div>
          <p className="text-muted-foreground mx-auto mt-8 max-w-2xl text-center text-sm">
            {PAYMENT_TEXT}{" "}
            <Link href="/harga" className="text-foreground underline underline-offset-4">
              Bandingkan semua fitur paket
            </Link>
          </p>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6 sm:py-24">
        <SectionHead eyebrow="FAQ" title="Pertanyaan yang sering diajukan" />
        <Faq />
      </section>

      <Testimonials />

      <div id="cta-akhir">
        <FinalCta waHref={wa} />
      </div>
      <StickyCta />
    </main>
  );
}
