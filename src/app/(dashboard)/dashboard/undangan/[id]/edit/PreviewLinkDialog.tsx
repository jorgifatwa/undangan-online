"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { formatTanggal } from "@/lib/format";
import { PREVIEW_LINK_DAYS } from "@/lib/invitations/preview-link-config";

import { createPreviewLinkAction, revokePreviewLinkAction } from "./preview-link-actions";

/**
 * Dialog "Bagikan pratinjau": link rahasia untuk keluarga/pasangan melihat draf
 * tanpa login. Link hanya bisa disalin saat dibuat (yang disimpan server hanya
 * hash-nya); membuat link baru mencabut link lama.
 */
export function PreviewLinkDialog({
  id,
  initialExpiresAt,
  flushSave,
  onClose,
}: {
  id: string;
  /** Kedaluwarsa link yang masih aktif (ISO) — null bila tidak ada. */
  initialExpiresAt: string | null;
  flushSave: () => Promise<boolean>;
  onClose: () => void;
}) {
  const [active, setActive] = useState<string | null>(
    initialExpiresAt && Date.parse(initialExpiresAt) > Date.now() ? initialExpiresAt : null,
  );
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const create = () =>
    start(async () => {
      setError(null);
      await flushSave();
      const r = await createPreviewLinkAction(id);
      if (!r.ok) return setError(r.error);
      setUrl(r.url);
      setActive(r.expiresAt);
    });

  const revoke = () =>
    start(async () => {
      if (
        !window.confirm(
          "Cabut link pratinjau? Siapa pun yang memegang link tidak bisa membukanya lagi.",
        )
      )
        return;
      const r = await revokePreviewLinkAction(id);
      if (!r.ok) return setError(r.error);
      setUrl(null);
      setActive(null);
      toast("Link pratinjau dicabut");
    });

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-black/50 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Bagikan pratinjau"
    >
      <div className="bg-background max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl p-5 sm:max-w-md sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-heading text-2xl">Bagikan pratinjau</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground text-sm"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>
        <div className="mt-3 space-y-3 text-sm">
          <p className="text-muted-foreground">
            Kirim link rahasia ke keluarga atau pasangan untuk melihat draf ini tanpa login. Isinya
            selalu mengikuti perubahan terbaru.
          </p>
          <ul className="text-muted-foreground list-disc space-y-0.5 pl-5 text-xs">
            <li>
              Bertanda &ldquo;PRATINJAU — belum diterbitkan&rdquo; yang tidak bisa disembunyikan.
            </li>
            <li>RSVP, ucapan, dan amplop digital tidak aktif.</li>
            <li>
              Berlaku {PREVIEW_LINK_DAYS} hari dan bisa dicabut kapan saja. Hanya satu link aktif.
            </li>
          </ul>

          {url ? (
            <div className="space-y-2" data-testid="preview-link-new">
              <div className="flex gap-2">
                <code className="bg-muted min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-xs">
                  {url}
                </code>
                <button
                  type="button"
                  className="rounded-md border px-3 text-xs"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(url)
                      .then(() => toast.success("Link disalin"));
                  }}
                >
                  Salin
                </button>
              </div>
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">
                Salin sekarang — demi keamanan link ini tidak bisa ditampilkan lagi. Berlaku sampai{" "}
                <strong>{formatTanggal(active!)}</strong>.
              </p>
            </div>
          ) : active ? (
            <p className="rounded-lg border px-3 py-2 text-xs" data-testid="preview-link-active">
              Ada link pratinjau aktif sampai <strong>{formatTanggal(active)}</strong>. Lupa
              menyalin? Buat link baru — link lama otomatis tidak berlaku.
            </p>
          ) : null}

          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={pending}
              onClick={create}
              className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              {pending ? "Memproses…" : active ? "Buat link baru" : "Buat link pratinjau"}
            </button>
            {active && (
              <button
                type="button"
                disabled={pending}
                onClick={revoke}
                className="hover:text-destructive rounded-md border px-3 py-2 text-sm"
              >
                Cabut link
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
