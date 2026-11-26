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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PAID_ACTIVE, priceRange } from "@/lib/pricing";
import { THEME_MANIFESTS } from "@/themes/registry";

const { min } = priceRange();

export const metadata: Metadata = {
  title: "Harga Undangan Digital per Tema",
  description: `Harga undangan pernikahan online & undangan ulang tahun online per tema, mulai ${formatRupiah(min)}. Sekali bayar per undangan, semua fitur termasuk. Coba semua tema gratis.`,
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
          langganan. Coba tema apa pun gratis; bayar saat memesan.
        </p>
      </div>

      <div className="mt-12">
        <ThemePricing themes={[...THEME_MANIFESTS]} included={INCLUDED} />
      </div>

      <section className="mt-20 grid gap-6 md:grid-cols-2" aria-label="Ketentuan">
        <Card className="bg-sand rounded-3xl shadow-none">
          <CardHeader>
            <CardTitle className="font-heading text-2xl font-normal">
              Cara pesan & masa aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-sm">
              <li>Coba semua tema gratis dengan data contoh, tanpa daftar akun.</li>
              <li>
                Saat memesan, isi undangan langkah demi langkah sambil melihat pratinjaunya, lalu
                bayar sekali.
              </li>
              <li>
                Setelah lunas, kami kirim link khusus untuk mengunggah foto, memilih alamat
                undangan, dan menayangkannya.
              </li>
              <li>Setelah tayang: {PAID_ACTIVE.long}</li>
              <li>Pembelian berlaku untuk satu undangan.</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="bg-sand rounded-3xl shadow-none">
          <CardHeader>
            <CardTitle className="font-heading text-2xl font-normal">Ganti tema</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">{THEME_CHANGE_TEXT}</CardContent>
        </Card>
        <Card className="rounded-3xl shadow-none">
          <CardHeader>
            <CardTitle className="font-heading text-2xl font-normal">
              Pembayaran & pengembalian dana
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2 text-sm">
            <p>{PAYMENT_TEXT}</p>
            <p>
              {REFUND_TEXT}{" "}
              <Link href="/syarat" className="underline underline-offset-4">
                Syarat & Ketentuan
              </Link>
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-dashed shadow-none">
          <CardHeader>
            <CardTitle className="font-heading text-2xl font-normal">Segera hadir</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {COMING_SOON.map((c) => (
                <li key={c}>
                  <Badge
                    variant="outline"
                    className="text-muted-foreground h-8 px-3 text-sm font-normal"
                  >
                    {c}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
