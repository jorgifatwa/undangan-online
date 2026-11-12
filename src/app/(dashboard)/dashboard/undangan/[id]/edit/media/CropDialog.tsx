"use client";

import { useEffect, useState } from "react";
import Cropper from "react-easy-crop";

import type { Area } from "@/lib/upload/client";
import { cn } from "@/lib/utils";

/**
 * Dialog potong foto (geser & cubit/zoom). Rasio mengikuti slot; galeri bisa
 * memilih rasio. Hasil = area piksel (dipotong di canvas oleh pemanggil).
 */
export function CropDialog({
  src,
  aspect,
  aspectOptions,
  title = "Atur potongan foto",
  onCancel,
  onDone,
}: {
  src: string;
  aspect: number;
  aspectOptions?: { label: string; value: number }[];
  title?: string;
  onCancel: () => void;
  onDone: (area: Area) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [ratio, setRatio] = useState(aspect);
  const [area, setArea] = useState<Area | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="font-medium">{title}</p>
        <button type="button" onClick={onCancel} className="text-sm text-white/80 hover:text-white">
          Batal
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={ratio}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, px) => setArea(px)}
          objectFit="contain"
          showGrid
        />
      </div>
      <div className="space-y-3 bg-black px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {aspectOptions && (
          <div className="flex justify-center gap-2" role="radiogroup" aria-label="Rasio">
            {aspectOptions.map((o) => (
              <button
                key={o.label}
                type="button"
                role="radio"
                aria-checked={ratio === o.value}
                onClick={() => setRatio(o.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  ratio === o.value
                    ? "border-white bg-white text-black"
                    : "border-white/40 text-white",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
        <label className="flex items-center gap-3 text-sm text-white">
          Zoom
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
            aria-label="Zoom foto"
          />
        </label>
        <button
          type="button"
          disabled={!area}
          onClick={() => area && onDone(area)}
          className="bg-primary text-primary-foreground w-full rounded-lg py-2.5 font-medium disabled:opacity-50"
        >
          Simpan potongan
        </button>
      </div>
    </div>
  );
}
