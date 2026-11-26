"use client";

import { useEffect, useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRupiah } from "@/lib/format";
import type { ThemeManifest } from "@/themes/types";

import { sendVisit } from "@/components/analytics/VisitBeacon";

import { createWebOrderAction } from "../actions";
import { readOrderDraft, rememberOrder } from "./order-storage";

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
    sendVisit("pesan_bayar");
    window.location.href = r.redirectUrl;
  };

  return (
    <section className="space-y-6">
      <p className="text-muted-foreground text-sm leading-relaxed">
        Periksa pratinjau undangan. Setelah pembayaran berhasil, kami kirim{" "}
        <strong className="text-foreground">link khusus</strong> ke email Anda untuk mengunggah
        foto, memilih alamat undangan, dan menayangkannya.
      </p>
      <div className="bg-muted/60 flex items-center justify-between rounded-xl px-4 py-3 text-sm">
        <span>Undangan tema {theme?.name ?? "…"}</span>
        <strong className="font-heading text-xl font-normal" data-testid="order-price">
          {theme ? formatRupiah(theme.price) : "…"}
        </strong>
      </div>
      <div ref={box} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="buyer-name">Nama pemesan</Label>
          <Input
            id="buyer-name"
            name="name"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="buyer-email">Email</Label>
          <Input
            id="buyer-email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <p className="text-muted-foreground text-xs">
            Link khusus & bukti pesanan dikirim ke email ini.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="buyer-phone">No. WhatsApp (opsional)</Label>
          <Input
            id="buyer-phone"
            name="phone"
            inputMode="tel"
            placeholder="08…"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        {!paymentReady && (
          <Alert>
            <AlertDescription>
              Pembayaran online belum aktif. Silakan hubungi kami lewat WhatsApp.
            </AlertDescription>
          </Alert>
        )}
        <Button
          type="button"
          size="lg"
          className="h-11"
          onClick={() => void submit()}
          data-testid="order-submit"
          disabled={busy || !paymentReady || !theme}
        >
          {busy ? "Memproses…" : `Pesan & bayar${theme ? ` ${formatRupiah(theme.price)}` : ""}`}
        </Button>
        {simulation && (
          <p className="text-muted-foreground text-center text-[11px]">
            Mode development tanpa Midtrans: pembayaran bisa disimulasikan di halaman berikutnya.
          </p>
        )}
      </div>
    </section>
  );
}
