import type { Metadata } from "next";
import { Suspense } from "react";

import { Card } from "@/components/ui/card";

import { OrderResult } from "./OrderResult";

export const metadata: Metadata = {
  title: "Status pesanan",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Kembali dari Midtrans (?order_id=…). Detail hanya untuk browser pemesan (kunci di localStorage). */
export default function SelesaiPage() {
  return (
    <main className="bg-sand paper flex min-h-dvh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md rounded-[28px] px-8 py-10 text-center shadow-[0_30px_80px_-40px_rgb(80_40_20/0.35)]">
        <p className="text-gold text-[11px] font-semibold tracking-[0.24em] uppercase">
          Status pesanan
        </p>
        <Suspense fallback={<p className="text-muted-foreground text-sm">Memuat…</p>}>
          <OrderResult />
        </Suspense>
      </Card>
    </main>
  );
}
