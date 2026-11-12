"use client";

import { useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { ClientUploadError, cropToBlob, preparePhoto, uploadPhoto } from "@/lib/upload/client";
import type { Photo } from "@/schemas";

import { CropDialog } from "./CropDialog";
import { useMedia } from "./MediaContext";
import { UpgradeNotice } from "./UpgradeNotice";

/**
 * Satu foto (profil, cover, strip, penutup, …): pilih → (HEIC→JPEG) → potong
 * sesuai rasio slot → unggah dengan progres → server kompres WebP. Foto lama
 * dihapus dari penyimpanan setelah data baru tersimpan.
 */
export function PhotoField({
  name,
  slot,
  label,
  aspect,
  hint,
  crop = true,
}: {
  name: string;
  slot: string;
  label: string;
  /** lebar / tinggi */
  aspect: number;
  hint?: string;
  crop?: boolean;
}) {
  const media = useMedia();
  const { control, setValue } = useFormContext();
  const value = useWatch({ control, name }) as Photo | undefined;
  const input = useRef<HTMLInputElement | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);

  const finish = async (blob: Blob) => {
    setProgress(0);
    setError(null);
    try {
      const res = await uploadPhoto(media.invitationId, slot, blob, setProgress);
      const old = value?.url;
      setValue(name, { url: res.url, width: res.width, height: res.height }, { shouldDirty: true });
      if (old && old !== res.url) media.releaseUrl(old);
      media.saveSoon();
    } catch (e) {
      setError(
        e instanceof ClientUploadError
          ? { message: e.message, code: e.code }
          : { message: "Unggahan gagal." },
      );
    } finally {
      setProgress(null);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const prepared = await preparePhoto(file);
      if (crop) setCropSrc(URL.createObjectURL(prepared));
      else await finish(prepared);
    } catch (e) {
      setError({ message: e instanceof ClientUploadError ? e.message : "Foto tidak bisa dibuka." });
    }
  };

  const closeCrop = () => {
    if (cropSrc?.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const busy = progress !== null;
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-start gap-3">
        <div
          className="relative w-24 shrink-0 overflow-hidden rounded-lg border bg-neutral-100"
          style={{ aspectRatio: String(aspect) }}
        >
          {value?.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- pratinjau kecil di editor
            <img src={value.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="text-muted-foreground absolute inset-0 grid place-items-center text-xs">
              Belum ada
            </span>
          )}
          {busy && (
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/20">
              <div
                className="bg-primary h-full transition-[width]"
                style={{ width: `${Math.round(progress! * 100)}%` }}
              />
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-1.5 text-sm">
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label={`Pilih ${label}`}
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="hover:bg-muted rounded-md border px-3 py-1.5 disabled:opacity-50"
          >
            {busy
              ? `Mengunggah… ${Math.round(progress! * 100)}%`
              : value?.url
                ? "Ganti foto"
                : "Unggah foto"}
          </button>
          {value?.url && !busy && (
            <div className="flex gap-3">
              {crop && (
                <button
                  type="button"
                  className="text-primary text-xs"
                  onClick={() => setCropSrc(value.url)}
                >
                  Atur potongan
                </button>
              )}
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive text-xs"
                onClick={() => {
                  media.releaseUrl(value.url);
                  setValue(name, undefined, { shouldDirty: true });
                  media.saveSoon();
                }}
              >
                Hapus
              </button>
            </div>
          )}
          {hint && !error && <p className="text-muted-foreground text-xs">{hint}</p>}
        </div>
      </div>
      {error &&
        (error.code === "QUOTA" ? (
          <UpgradeNotice message={error.message} compact />
        ) : (
          <p className="text-destructive text-xs" role="alert">
            {error.message}
          </p>
        ))}
      {cropSrc && (
        <CropDialog
          src={cropSrc}
          aspect={aspect}
          title={label}
          onCancel={closeCrop}
          onDone={async (area) => {
            const src = cropSrc;
            setCropSrc(null);
            try {
              await finish(await cropToBlob(src, area));
            } finally {
              if (src.startsWith("blob:")) URL.revokeObjectURL(src);
            }
          }}
        />
      )}
    </div>
  );
}
