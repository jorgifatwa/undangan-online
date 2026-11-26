import type { Metadata } from "next";
import { Suspense } from "react";

import { OrderResult } from "./OrderResult";

export const metadata: Metadata = {
  title: "Status pesanan",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Kembali dari Midtrans (?order_id=…). Detail hanya untuk browser pemesan (kunci di localStorage). */
export default function SelesaiPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="bg-card w-full max-w-md rounded-2xl border p-8 text-center shadow-sm">
        <Suspense fallback={<p className="text-muted-foreground text-sm">Memuat…</p>}>
          <OrderResult />
        </Suspense>
      </div>
    </main>
  );
}
