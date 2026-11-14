import type { Metadata } from "next";
import Link from "next/link";

import { ThemePricing } from "@/components/marketing/ThemePricing";
import { formatRupiah } from "@/lib/format";
import {
  COMING_SOON,
  INCLUDED,
  PAYMENT_TEXT,
  REFUND_TEXT,
  THEME_CHANGE_TEXT,
} from "@/lib/marketing/content";
import { PAID_ACTIVE, priceRange, TRIAL_DAYS } from "@/lib/pricing";
import { THEME_MANIFESTS } from "@/themes/registry";

const { min } = priceRange();

export const metadata: Metadata = {
  title: "Harga Undangan Digital per Tema",
  description: `Harga undangan pernikahan online & undangan ulang tahun online per tema, mulai ${formatRupiah(min)}. Sekali bayar per undangan, semua fitur termasuk, coba gratis ${TRIAL_DAYS} hari.`,
  alternates: { canonical: "/harga" },
};

/** Harga per tema (sumber: manifest tema) + yang termasuk + aturan ganti tema. */
export default function HargaPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-gold text-[11px] font-semibold tracking-[0.24em] uppercase">Harga</p>
        <h1 className="font-heading mt-3 text-4xl leading-tight tracking-tight sm:text-5xl">
          Harga per tema, semua fitur termasuk
        </h1>
        <p className="text-muted-foreground mt-4 sm:text-lg">
          Pilih tema yang kamu suka, bayar sekali untuk satu undangan — tanpa paket, tanpa
          langganan. Semua tema bisa dicoba gratis {TRIAL_DAYS} hari.
        </p>
      </div>

      <div className="mt-12">
        <ThemePricing themes={[...THEME_MANIFESTS]} included={INCLUDED} trialDays={TRIAL_DAYS} />
      </div>

      <section className="mt-20 grid gap-6 md:grid-cols-2" aria-label="Ketentuan">
        <div className="bg-sand rounded-3xl border p-6">
          <h2 className="font-heading text-2xl">Masa uji & masa aktif</h2>
          <ul className="text-muted-foreground mt-3 list-disc space-y-2 pl-5 text-sm">
            <li>
              Masa uji gratis: {TRIAL_DAYS} hari sejak undangan pertama kali diterbitkan, dengan
              watermark. Membatalkan terbit tidak menghentikan hitungan.
            </li>
            <li>Setelah tema dibeli: {PAID_ACTIVE.long}</li>
            <li>Pembelian berlaku untuk satu undangan.</li>
          </ul>
        </div>
        <div className="bg-sand rounded-3xl border p-6">
          <h2 className="font-heading text-2xl">Ganti tema</h2>
          <p className="text-muted-foreground mt-3 text-sm">{THEME_CHANGE_TEXT}</p>
        </div>
        <div className="rounded-3xl border p-6">
          <h2 className="font-heading text-2xl">Pembayaran & pengembalian dana</h2>
          <p className="text-muted-foreground mt-3 text-sm">{PAYMENT_TEXT}</p>
          <p className="text-muted-foreground mt-2 text-sm">
            {REFUND_TEXT}{" "}
            <Link href="/syarat" className="underline underline-offset-4">
              Syarat & Ketentuan
            </Link>
          </p>
        </div>
        <div className="rounded-3xl border border-dashed p-6">
          <h2 className="font-heading text-2xl">Segera hadir</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {COMING_SOON.map((c) => (
              <li key={c} className="text-muted-foreground rounded-full border px-3 py-1.5 text-sm">
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
