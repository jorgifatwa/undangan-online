"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { PaymentSoon } from "@/components/billing/PaymentSoon";
import { PAID_ACTIVE } from "@/lib/pricing";
import type { ChecklistItem } from "@/lib/invitations/publish";
import { invitationUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

import {
  checklistAction,
  publishAction,
  unpublishAction,
  type PublishState,
} from "./publish-actions";

/**
 * Dialog Terbitkan: simpan dulu → checklist dari data tersimpan → terbit.
 * Terbit hanya setelah tema dibeli (dicek ulang di server); draf tetap gratis
 * diisi & dipratinjau. Undangan ditangguhkan admin tidak bisa diterbitkan.
 */
export function PublishDialog({
  id,
  state,
  flushSave,
  onState,
  onShare,
  onClose,
}: {
  id: string;
  state: PublishState;
  flushSave: () => Promise<boolean>;
  onState: (s: PublishState) => void;
  /** Buka dialog Bagikan lewat WhatsApp. */
  onShare: () => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [justPublished, setJustPublished] = useState(false);
  const [buying, setBuying] = useState(false);
  const published = state.status === "PUBLISHED" && !state.suspended;

  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await flushSave();
      if (!alive) return;
      if (!saved) {
        setError(
          "Ada isian yang belum valid atau belum tersimpan. Perbaiki dulu isian bertanda merah.",
        );
        setItems([]);
        return;
      }
      const r = await checklistAction(id);
      if (!alive) return;
      if (!r.ok) return setError(r.error);
      setItems(r.items);
      onState(r.state);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const blocking = (items ?? []).filter((i) => i.severity === "error" && !i.ok);
  const url = invitationUrl(state.slug);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-black/50 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Terbitkan undangan"
    >
      <div className="bg-background max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl p-5 sm:max-w-md sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-heading text-2xl">
            {justPublished
              ? "Undangan terbit 🎉"
              : published
                ? "Undangan sudah terbit"
                : "Terbitkan undangan"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground text-sm"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {published || justPublished ? (
          <div className="mt-4 space-y-3 text-sm">
            <p>Tamu sudah bisa membuka undangan di:</p>
            <div className="flex gap-2">
              <code className="bg-muted min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-xs">
                {url}
              </code>
              <button
                type="button"
                className="rounded-md border px-3 text-xs"
                onClick={() => {
                  void navigator.clipboard.writeText(url).then(() => toast.success("Link disalin"));
                }}
              >
                Salin
              </button>
            </div>
            <p className="text-muted-foreground text-xs">{PAID_ACTIVE.long}</p>
            <p className="text-muted-foreground text-xs">
              Perubahan di editor langsung tampil di halaman undangan.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={onShare}
                className="rounded-md bg-[#1f9d55] px-3 py-2 text-sm font-medium text-white"
              >
                Bagikan lewat WhatsApp
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener"
                className="rounded-md border px-3 py-2 text-sm"
              >
                Buka undangan
              </a>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (
                    !window.confirm(
                      "Batalkan terbit? Tamu tidak bisa membuka undangan sampai diterbitkan lagi.",
                    )
                  )
                    return;
                  start(async () => {
                    const r = await unpublishAction(id);
                    if (!r.ok) return setError(r.error);
                    onState(r.state);
                    setJustPublished(false);
                    toast("Undangan kembali menjadi draf");
                    onClose();
                  });
                }}
                className="hover:text-destructive rounded-md border px-3 py-2 text-sm"
              >
                Batalkan terbit
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {items === null ? (
              <p className="text-muted-foreground text-sm" role="status">
                Menyimpan & memeriksa…
              </p>
            ) : (
              <ul className="space-y-2" aria-label="Checklist sebelum terbit">
                {items.map((i) => (
                  <li key={i.key} className="flex gap-2 text-sm">
                    <span
                      aria-hidden
                      className={cn(
                        "w-5 shrink-0 text-center",
                        i.ok
                          ? "text-emerald-600"
                          : i.severity === "error"
                            ? "text-destructive"
                            : "text-amber-600",
                      )}
                    >
                      {i.ok ? "✓" : i.severity === "error" ? "✕" : "!"}
                    </span>
                    <span>
                      {i.label}
                      {!i.ok && i.message && (
                        <span className="text-muted-foreground block text-xs">{i.message}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {!state.purchased && !state.suspended && (
              <p className="text-muted-foreground rounded-xl border px-3 py-2.5 text-xs">
                Draf gratis diisi & dipratinjau sepuasnya. Setelah tema dibeli, undangan bisa
                diterbitkan dan{" "}
                {PAID_ACTIVE.long.charAt(0).toLowerCase() + PAID_ACTIVE.long.slice(1)}
              </p>
            )}

            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
            {blocking.some((b) => b.key === "purchase" || b.key === "theme") && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBuying(true)}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950"
                  >
                    {blocking.some((b) => b.key === "theme") ? "Bayar selisih tema" : "Beli tema"}
                  </button>
                  <Link
                    href="/harga"
                    target="_blank"
                    className="text-primary text-sm font-semibold underline"
                  >
                    Lihat harga →
                  </Link>
                </div>
                {buying && <PaymentSoon what={`membeli tema untuk undangan /${state.slug}`} />}
              </div>
            )}
            <button
              type="button"
              disabled={items === null || blocking.length > 0 || !!error || pending}
              onClick={() =>
                start(async () => {
                  const r = await publishAction(id);
                  if (!r.ok) return setError(r.error);
                  onState(r.state);
                  setJustPublished(true);
                })
              }
              className="bg-primary text-primary-foreground w-full rounded-lg py-2.5 font-medium disabled:opacity-50"
            >
              {pending ? "Menerbitkan…" : "Terbitkan sekarang"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
