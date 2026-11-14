"use client";

import { useState, useTransition } from "react";

import { PaymentSoon } from "@/components/billing/PaymentSoon";
import { ThemeCard } from "@/components/themes/ThemeCard";
import { formatRupiah } from "@/lib/format";
import { PAID_ACTIVE, quoteTheme, type PurchaseState } from "@/lib/pricing";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { ThemeManifest } from "@/themes/types";

import { updateSlug } from "./actions";
import { inputClass } from "./forms/fields";

/**
 * Ganti tema & varian. Data undangan tidak pernah dihapus saat ganti tema.
 * Harga per tema (manifest), berlaku per undangan:
 *  - draf belum dibeli: bebas mencoba semua tema
 *  - sudah membeli: tema yang dimiliki / harga ≤ kredit → gratis; lebih mahal →
 *    hanya PRATINJAU sampai selisihnya dibayar (server juga menolaknya)
 */
export function ThemePicker({
  themes,
  themeId,
  variantId,
  purchase,
  previewThemeId,
  onPreviewTheme,
  onTheme,
  onVariant,
}: {
  themes: ThemeManifest[];
  themeId: string;
  variantId: string | null;
  purchase: { purchased: boolean; themeCredit: number; ownedThemeIds: string[] };
  previewThemeId: string | null;
  onPreviewTheme: (id: string | null) => void;
  onTheme: (id: string) => void;
  onVariant: (id: string) => void;
}) {
  const [buying, setBuying] = useState(false);
  const current = themes.find((t) => t.id === themeId) ?? themes[0];
  const state: PurchaseState = {
    themeId,
    purchasedAt: purchase.purchased ? "dibeli" : null,
    themeCredit: purchase.themeCredit,
    ownedThemeIds: purchase.ownedThemeIds,
  };
  const previewing = previewThemeId ? themes.find((t) => t.id === previewThemeId) : undefined;
  const previewQuote = previewing ? quoteTheme(state, previewing.id) : null;

  const badge = (t: ThemeManifest) => {
    const q = quoteTheme(state, t.id);
    if (!q) return null;
    if (q.kind === "buy") return `${formatRupiah(q.price)}`;
    if (q.kind === "owned")
      return purchase.ownedThemeIds.includes(t.id) ? "Dimiliki" : "Gratis (sudah termasuk)";
    return `Bayar selisih ${formatRupiah(q.amount)}`;
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium">Varian warna — {current.name}</p>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Varian warna">
          {current.variants.map((v) => {
            const on = (variantId ?? current.variants[0].id) === v.id;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onVariant(v.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                  on ? "border-primary bg-primary/5" : "hover:bg-muted",
                )}
              >
                <span className="flex -space-x-1">
                  {v.swatch.map((c) => (
                    <span
                      key={c}
                      className="size-4 rounded-full border border-white"
                      style={{ background: c }}
                    />
                  ))}
                </span>
                {v.name}
              </button>
            );
          })}
        </div>
        <div className="text-muted-foreground mt-3 space-y-2 text-xs" data-theme-pricing>
          {purchase.purchased ? (
            <p>
              Tema <strong>{current.name}</strong> sudah dibeli untuk undangan ini.{" "}
              {PAID_ACTIVE.short}.
            </p>
          ) : (
            <>
              <p>
                Tema <strong>{current.name}</strong>: {formatRupiah(current.price)}, sekali bayar
                untuk undangan ini. Draf gratis diisi & dipratinjau; undangan bisa diterbitkan
                setelah tema dibeli.
              </p>
              <button
                type="button"
                onClick={() => setBuying((b) => !b)}
                className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium"
              >
                Beli tema {formatRupiah(current.price)}
              </button>
              {buying && <PaymentSoon what={`membeli tema ${current.name}`} />}
            </>
          )}
        </div>
      </div>

      {previewing && previewQuote?.kind === "upgrade" && (
        <div
          className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
          role="status"
          data-theme-upgrade
        >
          <p>
            Sedang mempratinjau <strong>{previewing.name}</strong> (
            {formatRupiah(previewQuote.price)}
            ). Untuk memakainya, bayar selisih <strong>{formatRupiah(previewQuote.amount)}</strong>.
            Data undangan tetap utuh.
          </p>
          <PaymentSoon what={`ganti ke tema ${previewing.name} (bayar selisih)`} />
          <button
            type="button"
            onClick={() => onPreviewTheme(null)}
            className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm"
          >
            Kembali ke tema saya
          </button>
        </div>
      )}

      <div>
        <p className="text-sm font-medium">Tema</p>
        <ul
          className="mt-2 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3"
          role="radiogroup"
          aria-label="Tema"
        >
          {themes.map((t) => {
            const q = quoteTheme(state, t.id);
            const locked = q?.kind === "upgrade";
            return (
              <li key={t.id} data-theme-option={t.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={t.id === themeId}
                  onClick={() => (locked ? onPreviewTheme(t.id) : onTheme(t.id))}
                  className="group block w-full text-left"
                >
                  {/* centang hanya untuk tema TERSIMPAN; yang dipratinjau diberi label */}
                  <ThemeCard
                    theme={t}
                    selected={t.id === themeId}
                    priceNote={
                      t.id === previewThemeId
                        ? `Sedang dipratinjau · ${badge(t) ?? ""}`
                        : (badge(t) ?? undefined)
                    }
                  />
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-muted-foreground mt-3 text-xs">
          Ganti tema tidak menghapus data.{" "}
          {purchase.purchased
            ? "Pindah ke tema dengan harga sama atau lebih murah gratis (tanpa pengembalian dana); ke tema lebih mahal cukup bayar selisihnya."
            : "Sebelum membeli, semua tema bebas dicoba."}{" "}
          Section yang tidak didukung tema tetap tersimpan dan ditandai &ldquo;tidak tampil di tema
          ini&rdquo;.
        </p>
      </div>
    </div>
  );
}

/** Alamat undangan: domain/{slug}. */
export function SlugField({
  id,
  slug,
  onSaved,
}: {
  id: string;
  slug: string;
  onSaved: (slug: string, updatedAt: string) => void;
}) {
  const [value, setValue] = useState(slug);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = value.trim().toLowerCase() !== slug;
  return (
    <div className="space-y-1">
      <label htmlFor="f-slug" className="text-sm font-medium">
        Alamat undangan
      </label>
      <div className="flex gap-2">
        <div className="flex min-w-0 flex-1 items-center rounded-md border pl-3 text-sm">
          <span className="text-muted-foreground shrink-0">
            {siteConfig.appUrl.replace(/^https?:\/\//, "")}/
          </span>
          <input
            id="f-slug"
            value={value}
            onChange={(e) => {
              setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
              setMsg(null);
            }}
            maxLength={40}
            className={cn(inputClass, "border-0 pl-0.5 shadow-none focus-visible:ring-0")}
            aria-describedby="f-slug-msg"
          />
        </div>
        <button
          type="button"
          disabled={!dirty || pending}
          onClick={() =>
            start(async () => {
              const r = await updateSlug(id, value);
              if (r.ok) {
                setValue(r.value.slug);
                onSaved(r.value.slug, r.value.updatedAt);
                setMsg({ ok: true, text: "Alamat disimpan." });
              } else setMsg({ ok: false, text: r.error });
            })
          }
          className="bg-primary text-primary-foreground shrink-0 rounded-md px-3 text-sm disabled:opacity-50"
        >
          {pending ? "…" : "Simpan"}
        </button>
      </div>
      <p
        id="f-slug-msg"
        className={cn(
          "text-xs",
          msg ? (msg.ok ? "text-emerald-700" : "text-destructive") : "text-muted-foreground",
        )}
      >
        {msg?.text ?? "Huruf kecil, angka, dan tanda hubung."}
      </p>
    </div>
  );
}
