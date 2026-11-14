"use client";

import { useEffect, useRef, useState } from "react";

import { ClientUploadError, uploadPhoto } from "@/lib/upload/client";
import type { CropBox } from "@/lib/ml/types";
import type { Photo } from "@/schemas/common";

import { useMedia } from "./MediaContext";

/**
 * Hapus latar otomatis — sepenuhnya di browser (Web Worker), foto tidak
 * dikirim ke pihak ketiga. MODNet (±9 MB, sekali) dengan cadangan otomatis
 * mode ringan (Selfie Segmenter) bila perangkat lemah, MODNet gagal dimuat /
 * memproses, atau pengguna memilih "Mode hemat kuota".
 * Hasil diunggah lewat pipeline media biasa sebagai gambar beralpha.
 */
type Stage =
  | { k: "checking" }
  | { k: "confirm" }
  | { k: "download"; p: number }
  | { k: "process" }
  | { k: "preview"; url: string; blob: Blob; crop: CropBox; lite: boolean; ms: number }
  | { k: "upload"; p: number }
  | { k: "error"; text: string };

export function BgRemoveDialog({
  invitationId,
  photo,
  onApply,
  onClose,
}: {
  invitationId: string;
  photo: Photo;
  /** foto beralpha baru + potongan (persen foto lama) untuk memetakan ulang wajah & topi */
  onApply: (p: Photo, crop: CropBox) => void;
  onClose: () => void;
}) {
  const media = useMedia();
  const [stage, setStage] = useState<Stage>({ k: "checking" });
  const started = useRef(false);
  const [lite, setLite] = useState(false);
  const [weak, setWeak] = useState(false);

  // perangkat lemah → mode ringan otomatis; model sudah tersimpan → langsung proses
  useEffect(() => {
    let alive = true;
    (async () => {
      const ml = await import("@/lib/ml/client");
      if (!alive) return;
      const w = ml.weakDevice();
      setWeak(w);
      if (w) setLite(true);
      // model sudah tersimpan di perangkat → tanpa dialog ukuran unduhan
      if (!w && (await ml.cutoutCached())) {
        if (alive) run(false);
      } else if (alive) setStage({ k: "confirm" });
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && stage.k !== "upload" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, stage.k]);

  const run = async (useLite: boolean) => {
    if (started.current) return; // hanya satu proses (sesi model tidak boleh paralel)
    started.current = true;
    setStage(useLite ? { k: "process" } : { k: "download", p: 0 });
    try {
      const ml = await import("@/lib/ml/client");
      const r = await ml.removeBackground(photo.url, {
        lite: useLite,
        onProgress: (p) => setStage(p < 1 ? { k: "download", p } : { k: "process" }),
      });
      setStage({
        k: "preview",
        url: URL.createObjectURL(r.blob),
        blob: r.blob,
        crop: r.crop,
        lite: r.mode === "lite",
        ms: r.ms,
      });
    } catch (e) {
      console.warn("hapus latar gagal:", e);
      setStage({
        k: "error",
        text: "Maaf, latar belum bisa dihapus di perangkat ini. Foto tetap tampil rapi dalam bingkai stiker.",
      });
    }
  };

  const apply = async (blob: Blob, crop: CropBox) => {
    setStage({ k: "upload", p: 0 });
    try {
      const res = await uploadPhoto(invitationId, "child", blob, (p) =>
        setStage({ k: "upload", p }),
      );
      onApply(
        { url: res.url, width: res.width, height: res.height, alpha: true, alt: photo.alt },
        crop,
      );
      media.releaseUrl(photo.url);
      media.saveSoon();
    } catch (e) {
      setStage({
        k: "error",
        text: e instanceof ClientUploadError ? e.message : "Unggahan gagal. Coba lagi.",
      });
    }
  };

  const pct = (p: number) => `${Math.round(p * 100)}%`;
  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-black/50 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Hapus latar otomatis"
    >
      <div className="bg-background max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl p-5 sm:max-w-md sm:rounded-2xl">
        <h2 className="font-heading text-xl">Hapus latar otomatis</h2>

        {stage.k === "checking" && (
          <p className="text-muted-foreground mt-4 text-sm" role="status">
            Menyiapkan…
          </p>
        )}
        {stage.k === "confirm" && (
          <div className="mt-3 space-y-3 text-sm">
            <p>
              Mengunduh alat penghapus latar, <strong>sekitar 9 MB, hanya sekali</strong>. Foto
              diproses di perangkatmu dan tidak dikirim ke layanan lain.
            </p>
            {weak && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-950">
                Perangkat ini memorinya terbatas, jadi dipakai mode ringan (±0,3 MB).
              </p>
            )}
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={lite}
                onChange={(e) => setLite(e.target.checked)}
                className="mt-1"
              />
              <span>
                Mode hemat kuota{" "}
                <span className="text-muted-foreground">(±0,3 MB, tepi lebih kasar)</span>
              </span>
            </label>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => run(lite)}
                className="bg-primary text-primary-foreground rounded-md px-4 py-2 font-medium"
              >
                Lanjut
              </button>
              <button type="button" onClick={onClose} className="rounded-md border px-4 py-2">
                Batal
              </button>
            </div>
          </div>
        )}

        {stage.k === "download" && (
          <div className="mt-4 space-y-2 text-sm" role="status">
            <p>Mengunduh alat penghapus latar… {pct(stage.p)}</p>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-[width]"
                style={{ width: pct(stage.p) }}
              />
            </div>
          </div>
        )}
        {stage.k === "process" && (
          <p className="mt-4 text-sm" role="status">
            Memisahkan orang dari latar… biasanya beberapa detik.
          </p>
        )}

        {stage.k === "preview" && (
          <div className="mt-3 space-y-3 text-sm">
            <div
              className="mx-auto flex max-h-[50dvh] justify-center overflow-hidden rounded-lg"
              style={{
                background: "repeating-conic-gradient(#e5e5e5 0 25%, #fff 0 50%) 0 0/18px 18px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau blob lokal */}
              <img
                src={stage.url}
                alt="Hasil hapus latar"
                className="max-h-[50dvh] object-contain"
                data-testid="cutout-preview"
              />
            </div>
            {stage.lite && (
              <p className="text-muted-foreground text-xs" data-testid="cutout-lite">
                Hasil memakai mode ringan, jadi tepinya bisa sedikit kasar.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => apply(stage.blob, stage.crop)}
                className="bg-primary text-primary-foreground rounded-md px-4 py-2 font-medium"
              >
                Pakai
              </button>
              <button type="button" onClick={onClose} className="rounded-md border px-4 py-2">
                Kembali ke bingkai biasa
              </button>
            </div>
          </div>
        )}

        {stage.k === "upload" && (
          <p className="mt-4 text-sm" role="status">
            Menyimpan… {pct(stage.p)}
          </p>
        )}

        {stage.k === "error" && (
          <div className="mt-3 space-y-3 text-sm">
            <p role="alert">{stage.text}</p>
            <button type="button" onClick={onClose} className="rounded-md border px-4 py-2">
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
