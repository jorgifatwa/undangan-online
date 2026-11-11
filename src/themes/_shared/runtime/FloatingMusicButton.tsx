"use client";

import { useAudio } from "./audio";

/** Tombol play/pause melayang standar (tema bisa menggantinya via MusicControl). */
export function FloatingMusicButton() {
  const { playing, toggle, available, tracks } = useAudio();
  if (tracks.length === 0) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!available}
      aria-label={!available ? "Musik belum tersedia" : playing ? "Jeda musik" : "Putar musik"}
      title={!available ? "Musik belum tersedia" : undefined}
      className="pointer-events-auto absolute right-4 bottom-5 grid size-11 place-items-center rounded-full shadow-lg transition-transform active:scale-95 disabled:opacity-50"
      style={{ background: "var(--inv-primary)", color: "var(--inv-primary-text)" }}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        style={{ animation: playing ? "inv-spin 4s linear infinite" : undefined }}
        aria-hidden
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="5 3"
          opacity=".6"
        />
        {playing ? (
          <path d="M9 7.5h2v9H9zm4 0h2v9h-2z" fill="currentColor" />
        ) : (
          <path d="M10 7.8v8.4l6.5-4.2z" fill="currentColor" />
        )}
      </svg>
      <style>{`@keyframes inv-spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  );
}
