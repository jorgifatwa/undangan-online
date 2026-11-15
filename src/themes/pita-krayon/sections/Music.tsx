"use client";

import Image from "next/image";

import { useAudio } from "../../_shared/runtime/audio";
import { useInvitation } from "../../_shared/runtime/context";
import { Section, txt, u, useDecor } from "../canvas";

/**
 * Kutipan + kartu pemutar musik (section "ayat", dikunci setelah pembuka —
 * pemutar tetap tampil walau kutipan kosong). Desain asli: grafik pemutar
 * statis + iframe YouTube; di sini pemutar BERFUNGSI (useAudio): progres
 * bisa digeser, prev/play/next, acak, ulang.
 */
const fmt = (s: number) => {
  if (!Number.isFinite(s) || s <= 0) return "00:00";
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

function Ic({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={u(size)} height={u(size)} aria-hidden fill="currentColor">
      <path d={d} />
    </svg>
  );
}
const ICON = {
  play: "M7 4.5v15l13-7.5z",
  pause: "M6 4h4.5v16H6zM13.5 4H18v16h-4.5z",
  prev: "M6 5h2.4v14H6zM20 5v14L9 12z",
  next: "M15.6 5H18v14h-2.4zM4 5l11 7-11 7z",
  shuffle:
    "M16 3h5v5l-1.8-1.8-4.4 4.4-1.4-1.4 4.4-4.4zM3 5.6 4.4 4.2 19.8 19.6 18.4 21zM14.6 13.2l1.4-1.4 3.2 3.2L21 13.2V21h-7.8l1.8-1.8z",
  repeat: "M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z",
};

function Player() {
  const a = useAudio();
  const { inv } = useInvitation();
  if (!a.tracks.length) return null;
  // foto kartu pemutar: isian tersendiri (grup Musik di editor)
  const thumb = inv.eventType === "BIRTHDAY" ? inv.data.musicPhoto : undefined;
  const elapsed = a.progress * a.duration;
  const btn: React.CSSProperties = {
    display: "grid",
    placeItems: "center",
    width: u(40),
    height: u(40),
    color: "#fff",
    borderRadius: "999px",
  };
  return (
    <div
      data-a="up"
      style={{
        ["--d" as string]: "0.3s",
        margin: `${u(26)} auto 0`,
        width: u(282),
        padding: u(9),
        display: "flex",
        gap: u(10),
        alignItems: "stretch",
        background: "var(--inv-card)",
        borderRadius: u(10),
        color: "#fff",
        boxShadow: `0 ${u(8)} ${u(18)} rgb(0 0 0 / 0.18)`,
      }}
    >
      <div
        style={{
          position: "relative",
          width: u(86),
          height: u(86),
          flexShrink: 0,
          borderRadius: u(8),
          overflow: "hidden",
          background: "#efe9e5",
        }}
      >
        {!thumb && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              fontSize: u(34),
              color: "var(--inv-red)",
            }}
          >
            ♪
          </span>
        )}
        {thumb && (
          <Image
            src={thumb.url}
            alt=""
            fill
            sizes="(max-width: 440px) 20vw, 86px"
            style={{
              objectFit: "cover",
              objectPosition: `${thumb.focusX ?? 50}% ${thumb.focusY ?? 35}%`,
            }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {!a.available && (
          <p style={{ ...txt(12, 1.2, { color: "#fff", align: "left" }) }}>Musik belum tersedia</p>
        )}
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(a.progress * 1000)}
          onChange={(e) => a.seek(Number(e.target.value) / 1000)}
          aria-label={`Posisi lagu${a.current?.title ? `: ${a.current.title}` : ""}`}
          className="pk-range"
          style={{ ["--p" as string]: `${(a.progress * 100).toFixed(1)}%`, marginTop: u(10) }}
          disabled={!a.available}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            ...txt(11, 1, { color: "rgb(255 255 255 / 0.8)", font: "system-ui, sans-serif" }),
            marginTop: u(4),
          }}
        >
          <span>{fmt(elapsed)}</span>
          <span>{fmt(a.duration)}</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
          }}
        >
          <button
            type="button"
            onClick={a.cycleRepeat}
            aria-label={`Ulang: ${a.repeat === "one" ? "satu lagu" : a.repeat === "all" ? "semua" : "mati"}`}
            style={{ ...btn, opacity: a.repeat === "off" ? 0.5 : 1, width: u(30) }}
          >
            <Ic d={ICON.repeat} size={15} />
          </button>
          <button type="button" onClick={a.prev} aria-label="Lagu sebelumnya" style={btn}>
            <Ic d={ICON.prev} />
          </button>
          <button
            type="button"
            onClick={a.toggle}
            aria-label={a.playing ? "Jeda musik" : "Putar musik"}
            style={btn}
          >
            <Ic d={a.playing ? ICON.pause : ICON.play} size={22} />
          </button>
          <button type="button" onClick={a.next} aria-label="Lagu berikutnya" style={btn}>
            <Ic d={ICON.next} />
          </button>
          <button
            type="button"
            onClick={a.toggleShuffle}
            aria-label={a.shuffle ? "Acak: aktif" : "Acak: mati"}
            aria-pressed={a.shuffle}
            style={{ ...btn, opacity: a.shuffle ? 1 : 0.5, width: u(30) }}
          >
            <Ic d={ICON.shuffle} size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Kutipan bawaan desain bila pengguna belum memilih kutipan (bisa diganti di editor). */
const DEFAULT_QUOTE = {
  en: {
    text: "Having a birthday is like reaching a higher peak on a mountain. Pause to admire the view; reflect on how far you have come.",
    source: "Richelle E. Goodrich",
  },
  id: {
    text: "Berulang tahun itu seperti mencapai puncak gunung yang lebih tinggi. Berhentilah sejenak menikmati pemandangan; renungkan sejauh apa kamu telah melangkah.",
    source: "Richelle E. Goodrich",
  },
} as const;

export function QuoteMusic() {
  const { inv } = useInvitation();
  const { t, lang } = useDecor();
  const own = inv.data.quote?.translation || inv.data.quote?.arabic;
  const q = own ? inv.data.quote : DEFAULT_QUOTE[lang];
  const text = own ?? DEFAULT_QUOTE[lang].text;
  const hasTracks = (inv.data.music?.tracks.length ?? 0) > 0;

  return (
    <Section id="ayat" style={{ padding: `${u(18)} ${u(62)} ${u(46)}` }}>
      <figure data-a="fade" style={{ margin: 0 }}>
        <blockquote style={{ ...txt(15, 1.22), whiteSpace: "pre-line", margin: 0 }}>
          &ldquo;{text}&rdquo;
        </blockquote>
        {q?.source && (
          <figcaption style={{ ...txt(15, 1.3), marginTop: u(14) }}>-{q.source}</figcaption>
        )}
      </figure>
      <Player />
      {hasTracks && (
        <p data-a="fade" style={{ ...txt(14, 1.3), marginTop: u(12), ["--d" as string]: "0.5s" }}>
          {t.listen}
        </p>
      )}
    </Section>
  );
}
