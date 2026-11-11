"use client";

import { motion } from "framer-motion";
import { useEffect, useId, useMemo, useRef } from "react";

import { AssetImg, useSlotAsset, type SlotProp } from "../assets";
import { r2, rng, type Pt, smoothPath } from "./geom";
import { T } from "./tokens";

/**
 * Segel lilin orisinal: tepi lilin tidak beraturan, cincin timbul, emblem.
 * Bisa pecah menjadi 3 keping (WaxSealBreak) — keping memakai gambar segel
 * yang sama, dipotong clip-path, sehingga potongannya pas satu sama lain.
 */

export type SealTone = "red" | "gold";
export type SealEmblem = "floral" | "butterfly" | "monogram";

const TONES: Record<SealTone, { base: string; light: string; dark: string }> = {
  red: { base: T.seal, light: T.sealLight, dark: T.sealDark },
  gold: { base: T.gold, light: T.goldLight, dark: T.goldDark },
};

/** Tepi lilin yang meleleh: lingkaran dengan tonjolan acak. */
function waxEdge(seed: number): string {
  const rand = rng(seed);
  const pts: Pt[] = [];
  const n = 26;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 45 + (rand() - 0.5) * 4.5 + (i % 7 === 0 ? 2.5 : 0);
    pts.push([50 + r * Math.cos(a), 50 + r * Math.sin(a)]);
  }
  return smoothPath(pts, true, 0.9);
}

function FloralEmblem({ c }: { c: { base: string; light: string; dark: string } }) {
  const petals = (count: number, len: number, w: number, rot: number) =>
    Array.from({ length: count }, (_, i) => {
      const a = (360 / count) * i + rot;
      return (
        <ellipse
          key={`${len}-${i}`}
          cx="50"
          cy={r2(50 - len / 2)}
          rx={w}
          ry={len / 2}
          transform={`rotate(${r2(a)} 50 50)`}
        />
      );
    });
  return (
    <g>
      {/* kelopak luar: sisi gelap lalu terang (efek timbul) */}
      <g style={{ fill: c.dark }} transform="translate(0.8 0.9)">
        {petals(8, 24, 6.4, 0)}
      </g>
      <g style={{ fill: c.base, stroke: c.light, strokeWidth: 0.5 }}>{petals(8, 24, 6.4, 0)}</g>
      <g style={{ fill: c.dark }} transform="translate(0.6 0.7)">
        {petals(6, 15, 4.6, 22)}
      </g>
      <g style={{ fill: c.base, stroke: c.light, strokeWidth: 0.45 }}>{petals(6, 15, 4.6, 22)}</g>
      <circle cx="50" cy="50" r="4.8" style={{ fill: c.dark }} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={r2(50 + 3.2 * Math.cos(a))}
            cy={r2(50 + 3.2 * Math.sin(a))}
            r="0.9"
            style={{ fill: c.light }}
          />
        );
      })}
    </g>
  );
}

function ButterflyEmblem({ c }: { c: { base: string; light: string; dark: string } }) {
  const wing = "M50 48 C 40 30, 24 28, 22 38 C 20 48, 34 52, 50 50 Z";
  const lower = "M50 51 C 38 54, 28 64, 34 70 C 40 74, 47 62, 50 53 Z";
  return (
    <g>
      {[1, -1].map((s) => (
        <g key={s} transform={s === -1 ? "translate(100 0) scale(-1 1)" : undefined}>
          <path d={wing} style={{ fill: c.dark }} transform="translate(0.7 0.8)" />
          <path d={wing} style={{ fill: c.base, stroke: c.light, strokeWidth: 0.6 }} />
          <path
            d="M48 46 C 40 38, 31 36, 27 39"
            fill="none"
            style={{ stroke: c.dark, strokeWidth: 0.6 }}
          />
          <path d={lower} style={{ fill: c.dark }} transform="translate(0.6 0.7)" />
          <path d={lower} style={{ fill: c.base, stroke: c.light, strokeWidth: 0.6 }} />
        </g>
      ))}
      <ellipse cx="50" cy="52" rx="1.6" ry="9" style={{ fill: c.dark }} />
      <path
        d="M49.4 43 C 47 37, 45 35, 43 34 M50.6 43 C 53 37, 55 35, 57 34"
        fill="none"
        style={{ stroke: c.dark, strokeWidth: 0.7 }}
      />
    </g>
  );
}

/** Gambar segel utuh (viewBox 0 0 100 100). */
function SealArtSvg({
  tone = "red",
  emblem = "floral",
  monogram,
  seed = 7,
}: {
  tone?: SealTone;
  emblem?: SealEmblem;
  monogram?: string;
  seed?: number;
}) {
  const id = useId().replace(/:/g, "");
  const c = TONES[tone];
  const edge = useMemo(() => waxEdge(seed), [seed]);

  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      aria-hidden
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        <radialGradient id={`${id}b`} cx="38%" cy="32%" r="75%">
          <stop offset="0" style={{ stopColor: c.light }} />
          <stop offset="0.45" style={{ stopColor: c.base }} />
          <stop offset="1" style={{ stopColor: c.dark }} />
        </radialGradient>
        <radialGradient id={`${id}i`} cx="50%" cy="50%" r="50%">
          <stop offset="0.78" stopOpacity="0" style={{ stopColor: c.dark }} />
          <stop offset="1" stopOpacity="0.85" style={{ stopColor: c.dark }} />
        </radialGradient>
      </defs>
      {/* bayangan jatuh */}
      <path d={edge} transform="translate(1.6 2.4)" style={{ fill: "rgb(0 0 0 / .28)" }} />
      <path d={edge} style={{ fill: `url(#${id}b)` }} />
      {/* cekungan cap: cincin gelap + kilau */}
      <circle cx="50" cy="50" r="33" style={{ fill: c.base }} />
      <circle cx="50" cy="50" r="33" style={{ fill: `url(#${id}i)` }} />
      <circle
        cx="50"
        cy="50"
        r="33.5"
        fill="none"
        style={{ stroke: c.light, strokeWidth: 1.2, opacity: 0.7 }}
        strokeDasharray="60 150"
        transform="rotate(200 50 50)"
      />
      <circle
        cx="50"
        cy="50"
        r="29.5"
        fill="none"
        style={{ stroke: c.dark, strokeWidth: 0.8, opacity: 0.6 }}
      />
      {emblem === "floral" && <FloralEmblem c={c} />}
      {emblem === "butterfly" && <ButterflyEmblem c={c} />}
      {emblem === "monogram" && (
        <text
          x="50"
          y="58"
          textAnchor="middle"
          style={{
            fill: c.dark,
            fontFamily: "var(--inv-font-script, cursive)",
            fontSize: 26,
            stroke: c.light,
            strokeWidth: 0.4,
          }}
        >
          {monogram ?? "&"}
        </text>
      )}
      {/* kilau lilin */}
      <ellipse
        cx="34"
        cy="26"
        rx="10"
        ry="4"
        transform="rotate(-35 34 26)"
        style={{ fill: "#fff", opacity: 0.22 }}
      />
    </svg>
  );
}

/**
 * Segel (bisa ditukar dengan file asli: slot "wax-seal" / "wax-seal-gold").
 * Keping pecahan memakai komponen ini juga, jadi file asli pun ikut pecah
 * lewat clip-path (seperti di referensi).
 */
export function SealArt(props: Parameters<typeof SealArtSvg>[0] & SlotProp) {
  const { slot, ...rest } = props;
  const img = useSlotAsset(slot, rest.tone === "gold" ? "wax-seal-gold" : "wax-seal");
  if (img)
    return <AssetImg image={img} style={{ display: "block", width: "100%", height: "100%" }} />;
  return <SealArtSvg {...rest} />;
}

/** Tiga keping segel (persen kotak segel) dan garis retakannya. */
export const SEAL_SHARDS = [
  {
    clip: "0 0, 51% 0, 48% 15%, 55% 30%, 52% 47%, 38% 58%, 30% 72%, 0 85%",
    dir: [-1, -0.6] as const,
    spin: -38,
  },
  {
    clip: "51% 0, 100% 0, 100% 50%, 80% 44%, 68% 52%, 52% 47%, 55% 30%, 48% 15%",
    dir: [1, -0.8] as const,
    spin: 44,
  },
  {
    clip: "0 85%, 30% 72%, 38% 58%, 52% 47%, 68% 52%, 80% 44%, 100% 50%, 100% 100%, 0 100%",
    dir: [0.15, 1] as const,
    spin: -24,
  },
];
const SEAL_CRACKS = [
  "52,47 55,30 48,15 50,7",
  "52,47 38,58 30,72 15,81",
  "52,47 68,52 80,44 93,48",
];

/**
 * Segel yang bisa retak & pecah.
 *  state "whole"  → utuh (opsional berputar pelan: spin)
 *  state "broken" → retakan tergambar (0,35 s) lalu 3 keping terlempar dengan
 *                   rotasi berbeda dan jatuh (gravitasi), memudar.
 * lite → retakan dilewati, keping hanya memudar & bergeser sedikit.
 */
export function WaxSealBreak({
  state,
  tone = "red",
  emblem = "floral",
  spin = false,
  lite = false,
  onBroken,
  className,
  style,
}: {
  state: "whole" | "broken";
  tone?: SealTone;
  emblem?: SealEmblem;
  spin?: boolean;
  lite?: boolean;
  onBroken?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const broken = state === "broken";
  const crackDur = lite ? 0 : 0.35;
  const c = TONES[tone];

  // onBroken dipanggil saat keping MULAI terlempar (bukan setelah hilang), supaya
  // animasi berikutnya (tutup amplop) tumpang-tindih tanpa jeda kosong.
  const onBrokenRef = useRef(onBroken);
  onBrokenRef.current = onBroken;
  useEffect(() => {
    if (!broken) return;
    const t = window.setTimeout(
      () => onBrokenRef.current?.(),
      (crackDur + (lite ? 0.12 : 0.28)) * 1000,
    );
    return () => window.clearTimeout(t);
  }, [broken, crackDur, lite]);

  return (
    <div className={className} style={{ position: "relative", ...style }} aria-hidden>
      {!broken && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            animation: spin ? "inv-seal-spin 24s linear infinite" : undefined,
          }}
        >
          <SealArt tone={tone} emblem={emblem} />
        </div>
      )}
      {broken &&
        SEAL_SHARDS.map((s, i) => (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `polygon(${s.clip})`,
              willChange: "transform",
            }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={
              lite
                ? { opacity: 0, x: `${s.dir[0] * 12}%`, y: `${s.dir[1] * 12}%` }
                : {
                    // lempar keluar, lalu jatuh (keyframe y kedua lebih besar = gravitasi)
                    x: ["0%", `${s.dir[0] * 34}%`, `${s.dir[0] * 52}%`],
                    y: ["0%", `${s.dir[1] * 26}%`, `${s.dir[1] * 26 + 160}%`],
                    rotate: [0, s.spin * 0.6, s.spin * 2.2],
                    opacity: [1, 1, 0],
                  }
            }
            transition={{
              delay: crackDur + i * 0.04,
              duration: lite ? 0.35 : 0.95,
              times: lite ? undefined : [0, 0.3, 1],
              ease: lite ? "easeOut" : [0.3, 0, 0.6, 1],
            }}
          >
            <SealArt tone={tone} emblem={emblem} />
          </motion.div>
        ))}
      {broken && !lite && (
        <motion.svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: crackDur + 0.05, duration: 0.2 }}
        >
          {SEAL_CRACKS.map((points) => (
            <motion.polyline
              key={points}
              points={points}
              fill="none"
              strokeLinejoin="round"
              style={{ stroke: c.dark, strokeWidth: 2.4 }}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: crackDur, ease: "easeOut" }}
            />
          ))}
        </motion.svg>
      )}
      <style>{`@keyframes inv-seal-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
