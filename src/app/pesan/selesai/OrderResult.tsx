"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { business, waLink } from "@/config/business";
import { formatRupiah } from "@/lib/format";
import type { WebOrderView } from "@/lib/web-orders/service";

import { simulatePayAction, webOrderViewAction } from "../actions";
import { clearOrderDraft, orderKey } from "../[themeId]/order-storage";

type State =
  | { kind: "loading" }
  | { kind: "unknown" }
  | { kind: "ok"; order: WebOrderView; eventType: string; key: string };

/**
 * Status pesanan setelah kembali dari Midtrans. Masih menunggu → dicek ulang
 * berkala. Lunas → link khusus tampil (juga dikirim ke email) & isian di
 * browser dihapus (sudah tersimpan di undangan).
 */
export function OrderResult() {
  const params = useSearchParams();
  const orderId = params.get("order_id") ?? "";
  const [state, setState] = useState<State>({ kind: "loading" });
  const [simBusy, setSimBusy] = useState(false);

  const load = useCallback(async () => {
    const saved = orderKey(orderId);
    if (!orderId || !saved) return setState({ kind: "unknown" });
    const r = await webOrderViewAction(orderId, saved.key).catch(() => null);
    if (!r || !r.ok) return setState({ kind: "unknown" });
    setState({ kind: "ok", order: r.order, eventType: saved.eventType, key: saved.key });
    if (r.order.status === "PAID" && r.order.claimUrl) clearOrderDraft(saved.eventType);
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);
  // menunggu pembayaran / pembuatan link → cek ulang tiap 5 dtk
  const waiting =
    state.kind === "ok" &&
    (state.order.status === "PENDING" || (state.order.status === "PAID" && !state.order.claimUrl));
  useEffect(() => {
    if (!waiting) return;
    const t = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(t);
  }, [waiting, load]);

  if (state.kind === "loading")
    return (
      <div className="space-y-3">
        <Skeleton className="mx-auto h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  if (state.kind === "unknown") {
    const wa = waLink(`Halo ${business.name}, saya ingin menanyakan pesanan ${orderId}.`);
    return (
      <>
        <h1 className="font-heading text-3xl">Pesanan tidak ditemukan</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Status pesanan hanya bisa dilihat dari browser yang dipakai memesan. Bila pembayaran sudah
          berhasil, link khusus juga dikirim ke email Anda.
        </p>
        {wa && (
          <Button asChild variant="outline" className="mt-5">
            <a href={wa}>Hubungi kami lewat WhatsApp</a>
          </Button>
        )}
      </>
    );
  }

  const o = state.order;
  if (o.status === "PAID")
    return (
      <>
        <h1 className="font-heading text-3xl">Pembayaran berhasil 🎉</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Pesanan <span className="font-mono">{o.orderId}</span> · tema {o.themeName} ·{" "}
          {formatRupiah(o.amount)}
        </p>
        {o.claimUrl ? (
          <>
            <p className="text-muted-foreground mt-4 text-sm">
              Isian Anda sudah tersimpan. Lanjutkan lewat link khusus di bawah untuk mengunggah
              foto, memilih alamat undangan, lalu menayangkannya.
              {o.emailSent && ` Link yang sama sudah dikirim ke ${o.buyerEmail}.`}
            </p>
            <Button asChild size="lg" className="mt-5 h-11 w-full">
              <a href={o.claimUrl} data-testid="claim-link">
                Lanjutkan isi undangan
              </a>
            </Button>
            <p className="text-muted-foreground mt-3 text-xs">
              Simpan link ini dan jangan bagikan ke orang lain.
            </p>
          </>
        ) : (
          <p className="text-muted-foreground mt-4 text-sm">Menyiapkan link khusus Anda…</p>
        )}
      </>
    );
  if (o.status === "PENDING")
    return (
      <>
        <h1 className="font-heading text-3xl">Menunggu pembayaran</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Pesanan <span className="font-mono">{o.orderId}</span> · {formatRupiah(o.amount)}. Halaman
          ini diperbarui otomatis setelah pembayaran diterima.
        </p>
        {o.canSimulate && (
          <Button
            type="button"
            variant="outline"
            className="mt-5 w-full border-dashed"
            disabled={simBusy}
            onClick={async () => {
              setSimBusy(true);
              await simulatePayAction(o.orderId, state.key).catch(() => null);
              await load();
              setSimBusy(false);
            }}
          >
            {simBusy ? "Memproses…" : "Simulasi bayar (development)"}
          </Button>
        )}
      </>
    );
  return (
    <>
      <h1 className="font-heading text-3xl">
        {o.status === "EXPIRED" ? "Waktu pembayaran habis" : "Pembayaran gagal"}
      </h1>
      <p className="text-muted-foreground mt-3 text-sm">
        Isian undangan Anda masih tersimpan di browser ini. Silakan pesan ulang.
      </p>
      <Button asChild variant="outline" className="mt-5">
        <Link href="/tema">Kembali ke tema</Link>
      </Button>
    </>
  );
}
