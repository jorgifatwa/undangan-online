"use client";

import { useEffect, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import type { HatPos } from "@/schemas/birthday";
import type { Photo } from "@/schemas/common";
import { hatFromFace } from "@/themes/pita-krayon/hat";

import { CheckField } from "../forms/fields";
import { BgRemoveDialog } from "./BgRemoveDialog";

/**
 * Pengaturan foto & topi pesta (tema dengan editorFields "photoDecor").
 *  - Deteksi wajah OTOMATIS setiap foto cover/pembuka berganti (model dimuat
 *    hanya di editor, di Web Worker) → photoDecor.face; posisi topi manual
 *    yang dibuat untuk foto lama otomatis direset.
 *  - Topi bisa digeser di pratinjau; tombol perbesar/perkecil/miringkan/atur ulang.
 *  - Hapus latar otomatis (MODNet; cadangan mode ringan) → foto beralpha.
 */
type Section = "cover" | "hero";
const KEY: Record<Section, "photoDecor.coverHat" | "photoDecor.heroHat"> = {
  cover: "photoDecor.coverHat",
  hero: "photoDecor.heroHat",
};
const LABEL: Record<Section, string> = { cover: "cover", hero: "pembuka" };

/**
 * Petunjuk efek stiker — kotak berwarna yang langsung terbuka (dulu teks lipat
 * kecil yang jarang diperhatikan), tepat di bawah isian foto cover & pembuka.
 */
export function StickerTip() {
  return (
    <div
      className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
      role="note"
      data-testid="sticker-tip"
    >
      <p className="font-semibold">✨ Tips: foto tanpa latar = efek stiker</p>
      <p className="mt-1 text-xs">
        Foto biasa tetap tampil rapi dalam bingkai stiker. Untuk potongan siluet seperti stiker,
        tekan <strong>Hapus latar otomatis</strong> di bawah, atau buat sendiri di iPhone:
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs">
        <li>Buka foto di aplikasi Foto (iOS 16 ke atas).</li>
        <li>
          <strong>Tekan lama</strong> orangnya sampai muncul garis bercahaya, lalu pilih{" "}
          <strong>Bagikan</strong>.
        </li>
        <li>
          Pilih <strong>Simpan Gambar</strong>, lalu unggah hasilnya di &ldquo;Foto cover &amp;
          pembuka&rdquo; di atas.
        </li>
      </ol>
    </div>
  );
}

export function PhotoDecorPanel({ invitationId }: { invitationId: string }) {
  const { control, setValue, getValues } = useFormContext();
  const child = useWatch({ control, name: "celebrant.childPhoto" }) as Photo | undefined;
  // topi, hapus latar & bingkai stiker hanya untuk foto cover & pembuka
  const photo = child;
  const face = useWatch({ control, name: "photoDecor.face" }) as
    { x: number; y: number; w: number; r: number; for: string } | undefined;
  const checked = useWatch({ control, name: "photoDecor.faceChecked" }) as string | undefined;
  const hats = {
    cover: useWatch({ control, name: KEY.cover }) as HatPos | undefined,
    hero: useWatch({ control, name: KEY.hero }) as HatPos | undefined,
  };
  const [status, setStatus] = useState<"idle" | "detecting" | "error">("idle");
  const [cutout, setCutout] = useState(false);
  const running = useRef<string | null>(null);

  // Deteksi wajah otomatis setelah foto diunggah / diganti (tanpa menekan tombol).
  // Hasil dipakai selama URL-nya masih foto TERKINI (bukan bergantung siklus efek:
  // StrictMode / foto berganti saat deteksi berjalan tidak membuang hasil yang sah).
  const latest = useRef<string | undefined>(undefined);
  latest.current = photo?.url;
  useEffect(() => {
    const url = photo?.url;
    if (!url || checked === url || running.current === url) return;
    running.current = url;
    setStatus("detecting");
    (async () => {
      try {
        const { detectFace } = await import("@/lib/ml/client");
        const f = await detectFace(url);
        if (latest.current !== url) return;
        setValue("photoDecor.face", f ? { x: f.x, y: f.y, w: f.w, r: f.r, for: url } : undefined, {
          shouldDirty: true,
        });
        setValue("photoDecor.faceChecked", url, { shouldDirty: true });
        // foto diganti → posisi topi manual untuk foto lama direset
        for (const s of ["cover", "hero"] as const) {
          const h = getValues(KEY[s]) as HatPos | undefined;
          if (h?.for && h.for !== url)
            setValue(KEY[s], { show: h.show ?? true }, { shouldDirty: true });
        }
        setStatus("idle");
      } catch {
        if (latest.current === url) setStatus("error");
      } finally {
        if (running.current === url) running.current = null;
      }
    })();
  }, [photo?.url, checked, setValue, getValues]);

  /** Posisi efektif (persen relatif foto) untuk diubah tombol. */
  const current = (s: Section) => {
    const h = hats[s];
    if (
      photo &&
      h?.for === photo.url &&
      h.x !== undefined &&
      h.y !== undefined &&
      h.w !== undefined
    )
      return { x: h.x, y: h.y, w: h.w, r: h.r ?? 0 };
    if (photo && face?.for === photo.url) return hatFromFace(face);
    return { x: 86, y: 6, w: 30, r: 16 }; // kira-kira pojok kanan atas foto
  };
  const update = (
    s: Section,
    f: (p: ReturnType<typeof current>) => Partial<ReturnType<typeof current>>,
  ) => {
    if (!photo) return;
    const p = current(s);
    setValue(
      KEY[s],
      { show: hats[s]?.show ?? true, ...p, ...f(p), for: photo.url, src: "manual" },
      { shouldDirty: true },
    );
  };
  const source = (s: Section) => {
    const h = hats[s];
    if (photo && h?.for === photo.url && h.x !== undefined) return "digeser manual";
    if (photo && face?.for === photo.url) return "otomatis di kepala";
    return "pojok bingkai (wajah tidak terdeteksi)";
  };

  return (
    <div className="space-y-4 rounded-xl border p-3" data-testid="photo-decor">
      {photo && !photo.alpha && (
        <button
          type="button"
          onClick={() => setCutout(true)}
          className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium"
          data-testid="bg-remove"
        >
          ✂︎ Hapus latar otomatis
        </button>
      )}
      {photo?.alpha && (
        <p className="text-xs text-emerald-700">
          ✓ Foto tanpa latar — garis stiker mengikuti siluet.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <CheckField name="photoDecor.bw" label="Hitam-putih (foto cover & pembuka)" />
        <CheckField name="photoDecor.cake" label="Tampilkan ilustrasi kue" />
        <CheckField name="photoDecor.coverHat.show" label="Tampilkan topi pesta di cover" />
        <CheckField name="photoDecor.heroHat.show" label="Tampilkan topi pesta di pembuka" />
      </div>

      {photo && (
        <div className="space-y-2 text-xs">
          <p className="text-muted-foreground" role="status" data-testid="face-status">
            {status === "detecting"
              ? "Mencari wajah untuk menaruh topi…"
              : status === "error"
                ? "Wajah tidak bisa dicek di perangkat ini — topi di pojok bingkai."
                : "Geser topi di pratinjau dengan jari atau mouse."}
          </p>
          {(["cover", "hero"] as const).map((s) =>
            hats[s]?.show === false ? null : (
              <div key={s} className="flex flex-wrap items-center gap-1.5" data-testid={`hat-${s}`}>
                <span className="w-32">
                  Topi {LABEL[s]}: <em className="text-muted-foreground not-italic">{source(s)}</em>
                </span>
                <button
                  type="button"
                  className="rounded border px-2 py-1"
                  aria-label={`Perbesar topi ${LABEL[s]}`}
                  onClick={() => update(s, (p) => ({ w: Math.min(120, p.w * 1.15) }))}
                >
                  ＋
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1"
                  aria-label={`Perkecil topi ${LABEL[s]}`}
                  onClick={() => update(s, (p) => ({ w: Math.max(4, p.w / 1.15) }))}
                >
                  －
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1"
                  aria-label={`Miringkan topi ${LABEL[s]} ke kiri`}
                  onClick={() => update(s, (p) => ({ r: p.r - 8 }))}
                >
                  ↺
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1"
                  aria-label={`Miringkan topi ${LABEL[s]} ke kanan`}
                  onClick={() => update(s, (p) => ({ r: p.r + 8 }))}
                >
                  ↻
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1"
                  onClick={() => setValue(KEY[s], { show: true }, { shouldDirty: true })}
                >
                  Atur ulang
                </button>
              </div>
            ),
          )}
        </div>
      )}

      {cutout && photo && (
        <BgRemoveDialog
          invitationId={invitationId}
          photo={photo}
          onClose={() => setCutout(false)}
          onApply={(next, crop) => {
            // hasil dipangkas ke subjek → koordinat (persen) dipetakan ke gambar baru
            const mx = (x: number) => ((x - crop.x) / crop.w) * 100;
            const my = (y: number) => ((y - crop.y) / crop.h) * 100;
            setValue("celebrant.childPhoto", next, { shouldDirty: true });
            if (face?.for === photo.url)
              setValue(
                "photoDecor.face",
                {
                  ...face,
                  x: mx(face.x),
                  y: my(face.y),
                  w: (face.w / crop.w) * 100,
                  for: next.url,
                },
                { shouldDirty: true },
              );
            setValue("photoDecor.faceChecked", next.url, { shouldDirty: true });
            for (const s of ["cover", "hero"] as const) {
              const h = hats[s];
              if (
                h?.for === photo.url &&
                h.x !== undefined &&
                h.y !== undefined &&
                h.w !== undefined
              )
                setValue(
                  KEY[s],
                  { ...h, x: mx(h.x), y: my(h.y), w: (h.w / crop.w) * 100, for: next.url },
                  { shouldDirty: true },
                );
            }
            setCutout(false);
          }}
        />
      )}
    </div>
  );
}
