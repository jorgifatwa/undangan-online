"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { MusicTrack } from "@/schemas/common";

/**
 * Pemutar musik undangan (playlist).
 * - Tidak pernah autoplay sebelum ada interaksi: play() dipanggil ThemeRoot
 *   saat tamu menekan "Buka Undangan" (gesture) sehingga diizinkan browser.
 * - Berhenti saat tab tidak aktif, lanjut lagi saat kembali (jika tadinya main).
 * - File yang belum ada / gagal dimuat → status "unavailable", tanpa error.
 */

export type RepeatMode = "all" | "one" | "off";

export interface AudioState {
  tracks: MusicTrack[];
  index: number;
  current: MusicTrack | null;
  playing: boolean;
  /** 0–1 */
  progress: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  /** false jika tidak ada lagu, atau file gagal dimuat. */
  available: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (fraction: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

const AudioContext = createContext<AudioState | null>(null);

export function useAudio(): AudioState {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio harus dipakai di dalam AudioProvider");
  return ctx;
}

export function AudioProvider({
  tracks,
  children,
}: {
  tracks: MusicTrack[];
  children: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("all");
  const [failed, setFailed] = useState<Set<number>>(() => new Set());
  /** Apakah user ingin musik main (dipakai untuk resume saat tab kembali aktif). */
  const wantPlaying = useRef(false);

  const current = tracks[index] ?? null;
  const available = tracks.length > 0 && failed.size < tracks.length;

  const play = useCallback(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    wantPlaying.current = true;
    // src baru dipasang saat pertama kali diputar → file musik TIDAK diunduh
    // sebelum tamu membuka undangan (cover tidak terhambat).
    if (!el.getAttribute("src")) el.src = current.url;
    el.play().catch(() => {
      // Ditolak browser (belum ada gesture) atau file tidak ada: diam saja.
    });
  }, [current]);

  const pause = useCallback(() => {
    wantPlaying.current = false;
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);

  const pickNext = useCallback(
    (dir: 1 | -1): number => {
      if (tracks.length <= 1) return 0;
      if (shuffle) {
        let n = index;
        while (n === index) n = Math.floor(Math.random() * tracks.length);
        return n;
      }
      return (index + dir + tracks.length) % tracks.length;
    },
    [index, shuffle, tracks.length],
  );

  const next = useCallback(() => setIndex(pickNext(1)), [pickNext]);
  const prev = useCallback(() => {
    const el = audioRef.current;
    // Seperti pemutar musik umumnya: >3 detik → ulang dari awal lagu ini.
    if (el && el.currentTime > 3) {
      el.currentTime = 0;
      return;
    }
    setIndex(pickNext(-1));
  }, [pickNext]);

  const seek = useCallback((fraction: number) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration)) return;
    el.currentTime = Math.min(Math.max(fraction, 0), 1) * el.duration;
  }, []);

  // Ganti lagu → muat ulang, lanjut main jika sebelumnya main. Selama musik
  // belum pernah diputar, src sengaja dibiarkan kosong (lihat play()).
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current || !el.getAttribute("src")) return;
    el.src = current.url;
    el.load();
    setProgress(0);
    if (wantPlaying.current) el.play().catch(() => undefined);
  }, [current]);

  // Pause saat tab tidak aktif, resume saat kembali.
  useEffect(() => {
    const onVisibility = () => {
      const el = audioRef.current;
      if (!el) return;
      if (document.hidden) el.pause();
      else if (wantPlaying.current) el.play().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const onEnded = () => {
    if (repeat === "one") {
      const el = audioRef.current;
      if (el) {
        el.currentTime = 0;
        el.play().catch(() => undefined);
      }
      return;
    }
    const isLast = !shuffle && index === tracks.length - 1;
    if (repeat === "off" && isLast) {
      wantPlaying.current = false;
      return;
    }
    if (tracks.length === 1) {
      audioRef.current?.play().catch(() => undefined);
      return;
    }
    next();
  };

  const value = useMemo<AudioState>(
    () => ({
      tracks,
      index,
      current,
      playing,
      progress,
      duration,
      shuffle,
      repeat,
      available,
      play,
      pause,
      toggle,
      next,
      prev,
      seek,
      toggleShuffle: () => setShuffle((s) => !s),
      cycleRepeat: () => setRepeat((r) => (r === "all" ? "one" : r === "one" ? "off" : "all")),
    }),
    [
      tracks,
      index,
      current,
      playing,
      progress,
      duration,
      shuffle,
      repeat,
      available,
      play,
      pause,
      toggle,
      next,
      prev,
      seek,
    ],
  );

  return (
    <AudioContext.Provider value={value}>
      {children}
      {tracks.length > 0 && (
        <audio
          ref={audioRef}
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={onEnded}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            if (el.duration) setProgress(el.currentTime / el.duration);
          }}
          onError={() => {
            setPlaying(false);
            setFailed((s) => new Set(s).add(index));
          }}
        />
      )}
    </AudioContext.Provider>
  );
}
