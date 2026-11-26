"use client";

import { useEffect, useRef, useState } from "react";

import { formatRupiah } from "@/lib/format";
import type { ThemeManifest } from "@/themes/types";

import { createWebOrderAction } from "../actions";
import { readOrderDraft, rememberOrder } from "./order-storage";

const input =
  "h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30";

/**
 * Langkah terakhir pemesanan website: ringkasan tema + harga, data pemesan,
 * lalu "Pesan & bayar" → halaman pembayaran Midtrans.
 */
export function CheckoutStep({
  eventType,
  defaultThemeId,
  themes,
  flushSave,
  paymentReady,
  simulation,
}: {
  eventType: "WEDDING" | "BIRTHDAY";
  /** Tema awal (bila belum ada isian tersimpan di browser). */
  defaultThemeId: string;
  themes: ThemeManifest[];
  flushSave: () => Promise<boolean>;
  paymentReady: boolean;
  simulation: boolean;
}) {
  const [themeId, setThemeId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setThemeId(readOrderDraft(eventType)?.themeId ?? defaultThemeId);
  }, [eventType, defaultThemeId]);
  const theme = themes.find((t) => t.id === themeId);

  const submit = async () => {
    // bukan <form> (berada di dalam form editor) → validasi bawaan dipanggil manual
    const invalid = [...(box.current?.querySelectorAll("input") ?? [])].find(
      (i) => !i.checkValidity(),
    );
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    setBusy(true);
    setError(null);
    if (!(await flushSave())) {
      setBusy(false);
      setError("Masih ada isian yang belum valid. Periksa langkah sebelumnya.");
      return;
    }
    const d = readOrderDraft(eventType);
    if (!d) {
      setBusy(false);
      setError("Isian tidak ditemukan di browser. Muat ulang halaman.");
      return;
    }
    const r = await createWebOrderAction({
      themeId: d.themeId,
      colorVariant: d.variantId,
      eventType,
      data: d.data,
      buyer: { name, email, phone },
    }).catch(() => null);
    if (!r || !r.ok) {
      setBusy(false);
      setError(r?.error ?? "Gagal membuat pesanan. Periksa koneksi lalu coba lagi.");
      return;
    }
    rememberOrder(r.orderId, r.viewKey, eventType);
    window.location.href = r.redirectUrl;
  };

  return (
    <section className="bg-card space-y-4 rounded-2xl border p-4">
      <div>
        <h2 className="font-medium">Pesan & bayar</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Periksa pratinjau di samping. Setelah pembayaran berhasil, kami kirim{" "}
          <strong>link khusus</strong> ke email Anda untuk mengunggah foto, memilih alamat undangan,
          dan menayangkannya.
        </p>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5 text-sm">
        <span>Undangan tema {theme?.name ?? "…"}</span>
        <strong data-testid="order-price">{theme ? formatRupiah(theme.price) : "…"}</strong>
      </div>
      <div ref={box} className="space-y-3">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Nama pemesan</span>
          <input
            className={input}
            name="name"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Email</span>
          <input
            className={input}
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <span className="text-muted-foreground block text-xs">
            Link khusus & bukti pesanan dikirim ke email ini.
          </span>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">No. WhatsApp (opsional)</span>
          <input
            className={input}
            name="phone"
            inputMode="tel"
            placeholder="08…"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </label>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        {!paymentReady && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">
            Pembayaran online belum aktif. Silakan hubungi kami lewat WhatsApp.
          </p>
        )}
        <button
          type="button"
          onClick={() => void submit()}
          data-testid="order-submit"
          disabled={busy || !paymentReady || !theme}
          className="bg-primary text-primary-foreground w-full rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Memproses…" : `Pesan & bayar${theme ? ` ${formatRupiah(theme.price)}` : ""}`}
        </button>
        {simulation && (
          <p className="text-muted-foreground text-center text-[11px]">
            Mode development tanpa Midtrans: pembayaran bisa disimulasikan di halaman berikutnya.
          </p>
        )}
      </div>
    </section>
  );
}
