import { EyeOff, MessageCircle, RotateCcw, ShieldCheck } from "lucide-react";

import { business } from "@/config/business";

/**
 * Penguat kepercayaan — HANYA fakta layanan (bukan testimoni/angka karangan):
 * pembayaran Midtrans, pengembalian dana 3 hari (lihat REFUND_TEXT), undangan
 * tidak diindeks mesin pencari, bantuan WhatsApp (bila nomornya diisi).
 */
export function TrustStrip() {
  const items = [
    { icon: ShieldCheck, t: "Pembayaran aman", d: "QRIS, transfer bank & e-wallet lewat Midtrans" },
    { icon: RotateCcw, t: "Uang kembali 3 hari", d: "Selama undangan belum ditayangkan" },
    { icon: EyeOff, t: "Privat untuk tamu", d: "Undangan tidak muncul di Google" },
    ...(business.whatsapp
      ? [{ icon: MessageCircle, t: "Dibantu manusia", d: "Tanya apa saja lewat WhatsApp" }]
      : []),
  ];
  return (
    <section aria-label="Jaminan layanan" className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <ul className="grid grid-cols-2 gap-x-6 gap-y-5 border-y py-6 lg:grid-cols-4">
        {items.map((it, i) => (
          <li
            key={it.t}
            className="flex items-start gap-3"
            data-reveal
            style={{ ["--reveal-delay" as string]: `${i * 80}ms` }}
          >
            <span className="bg-sand text-primary grid size-9 shrink-0 place-items-center rounded-full">
              <it.icon className="size-4" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-medium">{it.t}</span>
              <span className="text-muted-foreground block text-xs leading-snug">{it.d}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
