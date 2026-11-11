"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

interface Props {
  themeName: string;
  variants: { id: string; name: string; swatch: string[] }[];
  eventTypes: ("WEDDING" | "BIRTHDAY")[];
  current: { variantId: string; eventType: "WEDDING" | "BIRTHDAY"; guest: string; lite: boolean };
}

/**
 * Panel kontrol preview. Sengaja berada DI LUAR wrapper tema (gaya website,
 * bukan token --inv-*). Semua pilihan disimpan di URL supaya bisa dibagikan.
 */
export function PreviewToolbar({ themeName, variants, eventTypes, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [guest, setGuest] = useState(current.guest);
  const [pending, startTransition] = useTransition();

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className="fixed top-3 left-3 z-[200] font-sans text-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="bg-background/90 text-foreground flex items-center gap-2 rounded-full border px-3.5 py-2 shadow-lg backdrop-blur"
      >
        <span aria-hidden>🎨</span>
        <span className="font-medium">{open ? "Tutup" : "Preview"}</span>
        {pending && <span className="text-muted-foreground text-xs">…</span>}
      </button>

      {open && (
        <div className="bg-background text-foreground mt-2 w-72 rounded-2xl border p-4 shadow-xl">
          <p className="font-heading text-lg">{themeName}</p>
          <Link href="/tema" className="text-muted-foreground text-xs underline underline-offset-2">
            ← Semua tema
          </Link>

          <p className="mt-4 mb-2 text-xs font-semibold tracking-wide uppercase">Varian warna</p>
          <div className="flex flex-col gap-1.5">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => update({ variant: v.id })}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                  v.id === current.variantId ? "border-primary bg-primary/5" : "hover:bg-muted"
                }`}
              >
                <span className="flex -space-x-1.5">
                  {v.swatch.map((c) => (
                    <span
                      key={c}
                      className="size-5 rounded-full border-2 border-white"
                      style={{ background: c }}
                    />
                  ))}
                </span>
                {v.name}
              </button>
            ))}
          </div>

          {eventTypes.length > 1 && (
            <>
              <p className="mt-4 mb-2 text-xs font-semibold tracking-wide uppercase">Jenis acara</p>
              <div className="grid grid-cols-2 gap-1.5">
                {eventTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => update({ acara: t === "WEDDING" ? "wedding" : "ultah" })}
                    className={`rounded-lg border px-3 py-2 ${t === current.eventType ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                  >
                    {t === "WEDDING" ? "Pernikahan" : "Ulang tahun"}
                  </button>
                ))}
              </div>
            </>
          )}

          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              update({ to: guest.trim() || null, k: String(Date.now()), open: null });
            }}
          >
            <label className="text-xs font-semibold tracking-wide uppercase" htmlFor="pv-guest">
              Nama tamu (?to=)
            </label>
            <div className="mt-2 flex gap-1.5">
              <input
                id="pv-guest"
                value={guest}
                onChange={(e) => setGuest(e.target.value)}
                placeholder="Bapak Budi"
                className="min-w-0 flex-1 rounded-lg border px-3 py-2"
              />
              <button type="submit" className="bg-primary text-primary-foreground rounded-lg px-3">
                OK
              </button>
            </div>
          </form>

          <label className="mt-4 flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={current.lite}
              onChange={(e) => update({ lite: e.target.checked ? "1" : null })}
              className="size-4"
            />
            Paksa mode ringan (?lite=1)
          </label>

          <div className="mt-4 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => update({ k: String(Date.now()), open: null })}
              className="hover:bg-muted rounded-lg border px-3 py-2"
            >
              ↺ Ulangi cover
            </button>
            <button
              type="button"
              onClick={() => update({ open: "1", k: String(Date.now()) })}
              className="hover:bg-muted rounded-lg border px-3 py-2"
            >
              Lewati cover
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
