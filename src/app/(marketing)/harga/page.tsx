import type { Metadata } from "next";
import Link from "next/link";

import { formatRupiah } from "@/lib/format";
import { PACKAGES, PACKAGE_ORDER, type PackageFeatures } from "@/lib/packages";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Harga Paket",
  description: "Pilih paket undangan digital: gratis untuk mencoba, berbayar untuk aktif permanen.",
};

const ROWS: { label: string; get: (f: PackageFeatures) => string | boolean }[] = [
  { label: "Masa aktif", get: (f) => (f.activeDays ? `${f.activeDays} hari` : "Permanen") },
  { label: "Tanpa watermark", get: (f) => !f.watermark },
  {
    label: "Foto galeri",
    get: (f) => (f.galleryLimit === null ? "Tanpa batas" : `Maks. ${f.galleryLimit}`),
  },
  {
    label: "Penyimpanan foto & musik",
    get: (f) =>
      `${f.storageQuotaMb >= 1000 ? `${f.storageQuotaMb / 1000} GB` : `${f.storageQuotaMb} MB`}`,
  },
  { label: "Unggah musik sendiri", get: (f) => f.customMusic },
  { label: "RSVP & ucapan", get: (f) => f.rsvp && f.wishes },
  { label: "Amplop digital", get: (f) => f.digitalEnvelope },
  { label: "Nama tamu personal & kirim WhatsApp", get: (f) => f.personalGuestNames },
  { label: "QR check-in", get: (f) => f.qrCheckIn },
  { label: "Mode privat", get: (f) => f.privateMode },
];

/** Harga & fitur paket (sumber: lib/packages.ts). Pembayaran dibuat di tahap berikutnya. */
export default function HargaPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <h1 className="font-heading text-4xl sm:text-5xl">Harga paket</h1>
      <p className="text-muted-foreground mt-3 max-w-xl">
        Semua tema bisa dicoba gratis. Tingkatkan paket kapan saja tanpa kehilangan data undangan.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PACKAGE_ORDER.map((tier) => {
          const p = PACKAGES[tier];
          const price = p.prices.WEDDING;
          return (
            <section
              key={tier}
              className={cn(
                "bg-card rounded-2xl border p-5",
                tier === "PREMIUM" && "border-primary ring-primary/20 ring-2",
              )}
            >
              <h2 className="font-heading text-2xl">{p.label}</h2>
              <p className="mt-1 text-sm">
                {price === undefined
                  ? "Segera hadir"
                  : price === 0
                    ? "Gratis"
                    : `${formatRupiah(price)} / pernikahan`}
                {p.prices.BIRTHDAY ? (
                  <span className="text-muted-foreground block text-xs">
                    Ulang tahun{" "}
                    {p.prices.BIRTHDAY === 0 ? "gratis" : formatRupiah(p.prices.BIRTHDAY)}
                  </span>
                ) : null}
              </p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {ROWS.map((r) => {
                  const v = r.get(p.features);
                  return (
                    <li
                      key={r.label}
                      className={cn(
                        "flex justify-between gap-2",
                        v === false && "text-muted-foreground line-through",
                      )}
                    >
                      <span>{r.label}</span>
                      <span className="shrink-0 font-medium">
                        {v === true ? "✓" : v === false ? "—" : v}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="text-muted-foreground mt-8 text-sm">
        Pembayaran online (QRIS, e-wallet, transfer) segera tersedia. Butuh paket sekarang?{" "}
        <Link href="/dashboard" className="text-primary underline">
          Buka dashboard
        </Link>
        .
      </p>
    </main>
  );
}
