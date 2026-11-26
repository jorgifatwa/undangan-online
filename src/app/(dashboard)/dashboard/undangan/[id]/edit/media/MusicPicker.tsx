"use client";

import { useEffect, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { ClientUploadError, uploadMusic } from "@/lib/upload/client";
import { cn } from "@/lib/utils";

import { mediaStatusAction } from "../media-actions";
import { UploadsDisabledNote, useMedia } from "./MediaContext";
import { LimitNotice } from "./LimitNotice";

export interface LibraryTrack {
  id: string;
  title: string;
  artist: string | null;
  url: string;
  category: string | null;
}
export interface UploadedAudio {
  id: string;
  status: "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
  url: string | null;
  error: string | null;
  title: string;
}

type Track = { url: string; title?: string; artist?: string };

/** Satu pemutar contoh bersama (preload none: baru diunduh saat diputar). */
function usePreview() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  useEffect(() => () => audio.current?.pause(), []);
  const toggle = (url: string) => {
    if (!audio.current) {
      audio.current = new Audio();
      audio.current.preload = "none";
      audio.current.onended = () => setPlaying(null);
    }
    if (playing === url) {
      audio.current.pause();
      setPlaying(null);
      return;
    }
    audio.current.src = url;
    void audio.current.play().then(
      () => setPlaying(url),
      () => setPlaying(null),
    );
  };
  return { playing, toggle };
}

export function MusicPicker({
  library,
  themeDefault,
  uploaded: initialUploaded,
}: {
  library: LibraryTrack[];
  themeDefault?: { title: string; artist: string; url: string };
  uploaded: UploadedAudio[];
}) {
  const media = useMedia();
  const { control, setValue } = useFormContext();
  const tracks = (useWatch({ control, name: "music.tracks" }) as Track[] | undefined) ?? [];
  const selected = tracks[0]?.url ?? null;
  const { playing, toggle } = usePreview();
  const [uploaded, setUploaded] = useState<UploadedAudio[]>(initialUploaded);
  const [consent, setConsent] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const input = useRef<HTMLInputElement | null>(null);

  const choose = (t: Track | null) => {
    setValue("music", t ? { tracks: [t], autoplay: true } : undefined, { shouldDirty: true });
  };

  // Pantau musik yang sedang diproses; begitu siap otomatis dipilih.
  const processing = uploaded.filter((u) => u.status === "PROCESSING" || u.status === "UPLOADING");
  useEffect(() => {
    if (processing.length === 0) return;
    const t = window.setInterval(async () => {
      for (const u of processing) {
        const r = await mediaStatusAction(u.id);
        if (!r.ok || r.media.status === u.status) continue;
        setUploaded((list) =>
          list.map((x) =>
            x.id === u.id
              ? { ...x, status: r.media.status, url: r.media.url, error: r.media.error }
              : x,
          ),
        );
        if (r.media.status === "READY" && r.media.url) {
          choose({ url: r.media.url, title: u.title });
          // Lagu lama diganti → file-nya dihapus setelah data baru tersimpan
          // (hanya bila tidak lagi dirujuk data tersimpan).
          const olds = uploaded.filter((x) => x.id !== u.id && x.status === "READY" && x.url);
          olds.forEach((x) => media.releaseUrl(x.url!));
          if (olds.length)
            setUploaded((list) => list.filter((x) => !olds.some((o) => o.id === x.id)));
          media.saveSoon();
        }
      }
    }, 2000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processing.map((p) => p.id + p.status).join()]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!consent)
      return setError({ message: "Centang pernyataan hak penggunaan lagu terlebih dahulu." });
    setProgress(0);
    try {
      const title = file.name.replace(/\.[^.]+$/, "").slice(0, 80) || "Musik saya";
      const replace = uploaded.some((u) => u.status === "READY" && u.url);
      const id = await uploadMusic(media.invitationId, file, consent, setProgress, replace);
      setUploaded((l) => [{ id, status: "PROCESSING", url: null, error: null, title }, ...l]);
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

  // Satu lagu unggahan per undangan: bila sudah ada, unggahan berikutnya MENGGANTI.
  const ready = uploaded.filter((u) => u.status === "READY" && u.url);
  const current = ready.length === 1 ? ready[0] : null;
  const overLimit = ready.length > media.musicLimit;

  /** Hapus lagu unggahan: file dihapus dari penyimpanan setelah data tersimpan. */
  const removeUploaded = (u: UploadedAudio) => {
    if (!u.url) return;
    if (!window.confirm(`Hapus lagu "${u.title}"?`)) return;
    if (selected === u.url) choose(null);
    media.releaseUrl(u.url);
    media.saveSoon();
    setUploaded((list) => list.filter((x) => x.id !== u.id));
    setError(null);
  };

  const row = (
    key: string,
    label: string,
    sub: string | null,
    url: string | null,
    onPick: () => void,
    active: boolean,
    onDelete?: () => void,
  ) => (
    <li
      key={key}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2",
        active && "border-primary bg-primary/5",
      )}
    >
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm">
        <input type="radio" name="music-choice" checked={active} onChange={onPick} />
        <span className="min-w-0">
          <span className="block truncate font-medium">{label}</span>
          {sub && <span className="text-muted-foreground block truncate text-xs">{sub}</span>}
        </span>
      </label>
      {url && (
        <button
          type="button"
          onClick={() => toggle(url)}
          className="hover:bg-muted shrink-0 rounded-full border px-2.5 py-1 text-xs"
          aria-label={playing === url ? `Hentikan ${label}` : `Dengar ${label}`}
        >
          {playing === url ? "■ Stop" : "▶ Dengar"}
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive shrink-0 rounded-full border px-2.5 py-1 text-xs"
          aria-label={`Hapus ${label}`}
        >
          Hapus
        </button>
      )}
    </li>
  );

  return (
    <div className="space-y-4">
      <ul className="space-y-2" aria-label="Pilihan musik">
        {row(
          "theme",
          "Musik bawaan tema",
          themeDefault ? `${themeDefault.title} — ${themeDefault.artist}` : null,
          themeDefault?.url ?? null,
          () => choose(null),
          !selected,
        )}
        {library.map((t) =>
          row(
            t.id,
            t.title,
            [t.artist, t.category].filter(Boolean).join(" · "),
            t.url,
            () => choose({ url: t.url, title: t.title, artist: t.artist ?? undefined }),
            selected === t.url,
          ),
        )}
        {uploaded
          .filter((u) => u.status === "READY" && u.url)
          .map((u) =>
            row(
              u.id,
              u.title,
              "Musik saya",
              u.url,
              () => choose({ url: u.url!, title: u.title }),
              selected === u.url,
              () => removeUploaded(u),
            ),
          )}
      </ul>

      {media.uploadsDisabled ? (
        <UploadsDisabledNote message={media.uploadsDisabled} />
      ) : (
        <fieldset className="space-y-2 rounded-xl border p-3" data-testid="music-upload">
          <legend className="px-1 text-sm font-medium">
            {current ? "Ganti musik" : "Unggah musik sendiri"}
          </legend>
          {overLimit ? (
            // data lama (sebelum batas 1 lagu): sisakan satu dulu
            <LimitNotice
              message={`Ada ${ready.length} lagu unggahan, sekarang maksimal ${media.musicLimit} per undangan.`}
              hint="Hapus lagu yang tidak dipakai hingga tersisa satu, lalu musik bisa diganti kapan saja."
            />
          ) : (
            <>
              <p className="text-muted-foreground text-xs">
                {current ? (
                  <>
                    Musik saya &ldquo;{current.title}&rdquo; akan diganti. Lagu lama otomatis
                    dihapus begitu lagu baru siap (bila gagal diproses, lagu lama tetap dipakai).
                  </>
                ) : (
                  <>
                    Satu lagu per undangan, bisa diganti kapan saja. MP3, M4A, WAV, OGG, atau FLAC,
                    maks. 10 MB — dikompres otomatis agar ringan diputar tamu.
                  </>
                )}
              </p>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>Saya bertanggung jawab atas hak penggunaan lagu ini.</span>
              </label>
              <input
                ref={input}
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac"
                className="sr-only"
                aria-label="Pilih file musik"
                onChange={(e) => {
                  void onFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={!consent || progress !== null || processing.length > 0}
                onClick={() => input.current?.click()}
                className="hover:bg-muted rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {progress !== null
                  ? `Mengunggah… ${Math.round(progress * 100)}%`
                  : current
                    ? "Ganti musik"
                    : "Pilih file musik"}
              </button>
            </>
          )}
          {processing.map((u) => (
            <p key={u.id} className="text-muted-foreground text-sm" role="status">
              ⏳ {u.title}: sedang diproses…
            </p>
          ))}
          {uploaded
            .filter((u) => u.status === "FAILED")
            .map((u) => (
              <p key={u.id} className="text-destructive text-sm" role="alert">
                {u.title}: {u.error ?? "gagal diproses"}
              </p>
            ))}
          {error &&
            (error.code === "MUSIC_LIMIT" || error.code === "QUOTA" ? (
              <LimitNotice message={error.message} />
            ) : (
              <p className="text-destructive text-sm" role="alert">
                {error.message}
              </p>
            ))}
        </fieldset>
      )}
    </div>
  );
}
