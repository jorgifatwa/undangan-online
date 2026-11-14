import type { EventType } from "@prisma/client";

import type { PriceCard } from "@/components/marketing/Pricing";
import { formatRupiah } from "@/lib/format";
import { PACKAGE_ORDER, PACKAGES } from "@/lib/packages";

import { PRICE_ROWS } from "./content";

/** Kartu harga per jenis acara, dari lib/packages.ts (sumber kebenaran harga). */
export function pricingData(eventType: EventType): PriceCard[] {
  return PACKAGE_ORDER.map((tier) => {
    const p = PACKAGES[tier];
    const price = p.prices[eventType];
    return {
      tier,
      label: p.label,
      price: price === undefined ? null : formatRupiah(price),
      note:
        tier === "FREE"
          ? "Coba semua tema · 3 hari · ada watermark"
          : `Sekali bayar per undangan ${eventType === "WEDDING" ? "pernikahan" : "ulang tahun"}`,
      popular: tier === "PREMIUM",
      rows: PRICE_ROWS.map((r) => ({
        label: r.label,
        value: r.value(p.features),
        soon: r.soon,
        valueOnly: r.valueOnly,
      })),
      cta: tier === "FREE" ? "Mulai gratis" : `Pilih ${p.label}`,
    };
  });
}
