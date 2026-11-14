"use client";

import { useState, useTransition } from "react";

import { ThemeCard } from "@/components/themes/ThemeCard";
import type { PackageTier } from "@prisma/client";

import { PACKAGES, isTierAtLeast } from "@/lib/packages";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { ThemeManifest } from "@/themes/types";

import { updateSlug } from "./actions";
import { inputClass } from "./forms/fields";

/**
 * Ganti tema & varian kapan saja. Data undangan tidak pernah dihapus saat
 * ganti tema; section yang tidak didukung tema baru ditandai di daftar section.
 */
export function ThemePicker({
  themes,
  themeId,
  variantId,
  pkg,
  onTheme,
  onVariant,
}: {
  themes: ThemeManifest[];
  themeId: string;
  variantId: string | null;
  pkg: PackageTier;
  onTheme: (id: string) => void;
  onVariant: (id: string) => void;
}) {
  const current = themes.find((t) => t.id === themeId) ?? themes[0];
  const permanent = current.minPackage === "FREE" ? "BASIC" : current.minPackage;
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
        <p className="text-muted-foreground mt-2 text-xs">
          Aktif penuh (12 bulan setelah acara) mulai paket{" "}
          <strong>{PACKAGES[permanent].label}</strong>.{" "}
          {!isTierAtLeast(pkg, permanent) &&
            (pkg === "FREE"
              ? "Paket Gratis bisa memakai tema ini selama masa uji coba 3 hari."
              : `Paket ${PACKAGES[pkg].label} perlu ditingkatkan agar undangan dengan tema ini aktif penuh.`)}
        </p>
      </div>
      <div>
        <p className="text-sm font-medium">Tema</p>
        <ul
          className="mt-2 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3"
          role="radiogroup"
          aria-label="Tema"
        >
          {themes.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                role="radio"
                aria-checked={t.id === themeId}
                onClick={() => onTheme(t.id)}
                className="group block w-full text-left"
              >
                <ThemeCard theme={t} selected={t.id === themeId} />
              </button>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground mt-3 text-xs">
          Ganti tema tidak menghapus data. Section yang tidak didukung tema tetap tersimpan dan
          ditandai &ldquo;tidak tampil di tema ini&rdquo;.
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
