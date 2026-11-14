import { Check, Minus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Pricing } from "@/components/marketing/Pricing";
import { PAYMENT_TEXT, PRICE_ROWS, REFUND_TEXT } from "@/lib/marketing/content";
import { pricingData } from "@/lib/marketing/pricing";
import { PACKAGE_ORDER, PACKAGES, PAID_ACTIVE } from "@/lib/packages";

export const metadata: Metadata = {
  title: "Harga Undangan Digital",
  description: `Harga undangan pernikahan online dan undangan ulang tahun online: coba gratis, bayar sekali per undangan. ${PAID_ACTIVE.long}`,
  alternates: { canonical: "/harga" },
};

/** Harga & perbandingan paket (sumber: lib/packages.ts — sama dengan section harga di landing). */
export default function HargaPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-gold text-[11px] font-semibold tracking-[0.24em] uppercase">Harga</p>
        <h1 className="font-heading mt-3 text-4xl leading-tight tracking-tight sm:text-5xl">
          Harga undangan digital
        </h1>
        <p className="text-muted-foreground mt-4 sm:text-lg">
          Semua tema bisa dicoba gratis. Sekali bayar per undangan, tanpa langganan — tingkatkan
          paket kapan saja tanpa kehilangan isian.
        </p>
      </div>

      <div className="mt-12">
        <Pricing wedding={pricingData("WEDDING")} birthday={pricingData("BIRTHDAY")} compact />
      </div>

      <section className="mt-20" aria-labelledby="banding">
        <h2 id="banding" className="font-heading text-3xl">
          Perbandingan fitur
        </h2>
        <div className="mt-6 overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-sand">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-medium">
                  Fitur
                </th>
                {PACKAGE_ORDER.map((t) => (
                  <th key={t} scope="col" className="px-4 py-3 text-left font-medium">
                    {PACKAGES[t].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRICE_ROWS.map((r) => (
                <tr key={r.label} className="border-t">
                  <th scope="row" className="px-4 py-3 text-left font-normal">
                    {r.label}
                    {r.soon && (
                      <span className="bg-accent text-accent-foreground ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap">
                        Segera hadir
                      </span>
                    )}
                  </th>
                  {PACKAGE_ORDER.map((t) => {
                    const v = r.value(PACKAGES[t].features);
                    return (
                      <td key={t} className="px-4 py-3">
                        {typeof v === "string" ? (
                          v
                        ) : v ? (
                          <Check className="text-primary size-4" aria-label="Termasuk" />
                        ) : (
                          <Minus
                            className="text-muted-foreground/50 size-4"
                            aria-label="Tidak termasuk"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-muted-foreground mt-6 space-y-2 text-sm">
          <p>
            <strong className="text-foreground">Masa aktif paket berbayar:</strong>{" "}
            {PAID_ACTIVE.long}
          </p>
          <p>
            <strong className="text-foreground">Cara bayar:</strong> {PAYMENT_TEXT}
          </p>
          <p>
            <strong className="text-foreground">Pengembalian dana:</strong> {REFUND_TEXT}{" "}
            <Link href="/syarat" className="underline underline-offset-4">
              Syarat & Ketentuan
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
