"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  defaultTemplate,
  MAX_TEMPLATE,
  normalizeWaNumber,
  PLACEHOLDERS,
  renderShareMessage,
  waLink,
  type ShareInfo,
} from "@/lib/invitations/share";
import { guestLink } from "@/lib/site";

import { saveShareTemplateAction } from "./share-actions";

/**
 * Bagikan lewat WhatsApp: nama tamu → link personal (?to=Nama), template pesan
 * yang bisa diubah (disimpan otomatis), pratinjau pesan, lalu buka wa.me.
 */
export function ShareDialog({
  id,
  slug,
  info,
  initialTemplate,
  onSaved,
  active,
  onClose,
}: {
  id: string;
  slug: string;
  info: ShareInfo;
  initialTemplate: string | null;
  onSaved: (template: string | null) => void;
  /** false = belum terbit / masa aktif habis → link belum bisa dibuka tamu. */
  active: boolean;
  onClose: () => void;
}) {
  const fallback = useMemo(() => defaultTemplate(info), [info]);
  const [template, setTemplate] = useState(initialTemplate ?? fallback);
  const [guest, setGuest] = useState("");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const area = useRef<HTMLTextAreaElement>(null);
  /** Template terakhir yang tersimpan — simpan hanya bila berbeda. */
  const saved = useRef(initialTemplate ?? fallback);

  const link = guestLink(slug, guest);
  const message = renderShareMessage(template, { guestName: guest, link, info });
  const phone = normalizeWaNumber(phoneRaw);
  const phoneInvalid = phoneRaw.trim() !== "" && !phone;

  // Simpan template otomatis (null bila sama dengan bawaan).
  useEffect(() => {
    if (template === saved.current) return;
    setSaveState("saving");
    const t = window.setTimeout(async () => {
      const value = template.trim() === fallback.trim() ? null : template;
      const r = await saveShareTemplateAction(id, value);
      setSaveState(r.ok ? "saved" : "error");
      if (r.ok) {
        saved.current = template;
        onSaved(value);
      } else toast.error(r.error);
    }, 700);
    return () => window.clearTimeout(t);
  }, [template, fallback, id, onSaved]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const insert = (key: string) => {
    const el = area.current;
    if (!el) return setTemplate((t) => t + key);
    const { selectionStart: a, selectionEnd: b } = el;
    const next = template.slice(0, a) + key + template.slice(b);
    setTemplate(next.slice(0, MAX_TEMPLATE));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + key.length, a + key.length);
    });
  };
  const copy = (text: string, label: string) =>
    void navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} disalin`),
      () => toast.error("Gagal menyalin. Salin manual dari kotak pratinjau."),
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-background max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl p-5 sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 id="share-title" className="font-heading text-2xl">
            Bagikan lewat WhatsApp
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

        {!active && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950" role="status">
            Undangan belum bisa dibuka tamu (belum terbit atau masa aktif habis). Template tetap
            bisa disiapkan, tapi tombol kirim nonaktif.
          </p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">Nama tamu</span>
            <input
              id="share-guest"
              value={guest}
              maxLength={60}
              onChange={(e) => setGuest(e.target.value)}
              placeholder="mis. Bapak Hadi & Keluarga"
              className="mt-1 w-full rounded-md border px-3 py-2"
              autoComplete="off"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">
              Nomor WhatsApp <span className="text-muted-foreground font-normal">(opsional)</span>
            </span>
            <input
              id="share-phone"
              value={phoneRaw}
              inputMode="tel"
              onChange={(e) => setPhoneRaw(e.target.value)}
              placeholder="08xx atau +62xx"
              className="mt-1 w-full rounded-md border px-3 py-2"
              aria-invalid={phoneInvalid}
              autoComplete="off"
            />
            {phoneInvalid && (
              <span className="text-destructive mt-1 block text-xs">Nomor tidak valid.</span>
            )}
          </label>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Nama tamu tampil di sampul undangan. Kosongkan untuk link umum.
        </p>

        <div className="mt-3 flex gap-2">
          <code
            className="bg-muted min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-xs"
            data-share-link
          >
            {link}
          </code>
          <button
            type="button"
            className="rounded-md border px-3 text-xs"
            onClick={() => copy(link, "Link")}
          >
            Salin link
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="share-template" className="text-sm font-medium">
              Template pesan
            </label>
            <span className="text-muted-foreground text-xs" role="status" aria-live="polite">
              {saveState === "saving"
                ? "Menyimpan…"
                : saveState === "saved"
                  ? "Template tersimpan"
                  : saveState === "error"
                    ? "Gagal menyimpan"
                    : ""}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5" aria-label="Sisipkan isian otomatis">
            {PLACEHOLDERS.map((p) => (
              <button
                key={p.key}
                type="button"
                title={p.label}
                onClick={() => insert(p.key)}
                className="bg-muted hover:bg-muted/70 rounded-full px-2.5 py-1 font-mono text-[11px]"
              >
                {p.key}
              </button>
            ))}
          </div>
          <textarea
            id="share-template"
            ref={area}
            value={template}
            maxLength={MAX_TEMPLATE}
            onChange={(e) => setTemplate(e.target.value)}
            rows={8}
            className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
          />
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>
              {"{nama_tamu}"} kosong → &ldquo;Bapak/Ibu/Saudara/i&rdquo;. *teks* = tebal di
              WhatsApp.
            </span>
            {template !== fallback && (
              <button type="button" className="underline" onClick={() => setTemplate(fallback)}>
                Kembalikan ke bawaan
              </button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium">Pratinjau pesan</p>
          <div
            className="mt-1 max-h-56 overflow-y-auto rounded-xl bg-[#e7ffdb] px-3 py-2 text-sm whitespace-pre-wrap text-neutral-900"
            data-share-preview
          >
            {message}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={active ? waLink(message, phone) : undefined}
            target="_blank"
            rel="noopener"
            aria-disabled={!active || phoneInvalid}
            data-share-wa
            className={`rounded-md bg-[#1f9d55] px-4 py-2 text-sm font-medium text-white ${
              !active || phoneInvalid ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Kirim lewat WhatsApp
          </a>
          <button
            type="button"
            className="rounded-md border px-4 py-2 text-sm"
            onClick={() => copy(message, "Pesan")}
          >
            Salin pesan
          </button>
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          Untuk tamu berikutnya, ganti nama (dan nomor) lalu kirim lagi.
          {phone ? "" : " Tanpa nomor, WhatsApp akan meminta Anda memilih kontak."}
        </p>
      </div>
    </div>
  );
}
