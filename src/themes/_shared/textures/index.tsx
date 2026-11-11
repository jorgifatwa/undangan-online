"use client";

import { useId, useMemo } from "react";

import { withAsset } from "../assets";
import { r2, rng } from "../ornaments/geom";
import { T } from "../ornaments/tokens";

/**
 * Tekstur latar dari CSS + SVG (tanpa gambar). Semua mengisi parent
 * (parent harus position: relative / absolute).
 *
 * Noise feTurbulence dirender sebagai data-URI (dirasterisasi sekali oleh
 * browser, lalu di-cache) dan diberi kelas .inv-noise → otomatis disembunyikan
 * di mode ringan (lihat runtime.css); yang tersisa gradien statis.
 */

const NOISE_FINE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
const NOISE_COARSE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.035' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.1 -.2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const fill: React.CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none" };

function Noise({
  opacity = 0.18,
  coarse = false,
  blend = "overlay" as React.CSSProperties["mixBlendMode"],
}) {
  return (
    <div
      className="inv-noise"
      aria-hidden
      style={{
        ...fill,
        backgroundImage: coarse ? NOISE_COARSE : NOISE_FINE,
        opacity,
        mixBlendMode: blend,
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Tirai beludru teater: lipatan vertikal tak beraturan, kerut di atas,
 * gelap di tepi (vinyet). Warna dari --inv-drape*.
 */
function VelvetDrapeSvg({
  className,
  style,
  swag = true,
}: {
  className?: string;
  style?: React.CSSProperties;
  swag?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const folds = useMemo(() => {
    const rand = rng(21);
    const out: { x: number; w: number }[] = [];
    let x = -4;
    while (x < 104) {
      const w = 3.5 + rand() * 6;
      out.push({ x, w });
      x += w * 0.82;
    }
    return out;
  }, []);
  return (
    <div className={className} style={{ ...fill, background: T.drape, ...style }} aria-hidden>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={fill}>
        <defs>
          <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style={{ stopColor: T.drapeDark }} />
            <stop offset="0.35" style={{ stopColor: T.drape }} />
            <stop offset="0.55" style={{ stopColor: T.drapeLight }} />
            <stop offset="0.75" style={{ stopColor: T.drape }} />
            <stop offset="1" style={{ stopColor: T.drapeDark }} />
          </linearGradient>
        </defs>
        {folds.map((f, i) => (
          // lipatan menyempit ke atas (kain dikumpulkan di rel)
          <path
            key={i}
            d={`M${r2(f.x + f.w * 0.3)} 0 L${r2(f.x + f.w * 0.7)} 0 L${r2(f.x + f.w)} 100 L${r2(f.x)} 100 Z`}
            style={{ fill: `url(#${id}f)`, opacity: 0.85 }}
          />
        ))}
      </svg>
      {swag && (
        // valance: lengkungan kain di atas
        <svg
          width="100%"
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
          style={{ position: "absolute", top: 0, left: 0, height: "9%" }}
        >
          <defs>
            <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: T.drapeDark }} />
              <stop offset="0.6" style={{ stopColor: T.drapeLight }} />
              <stop offset="1" style={{ stopColor: T.drape }} />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <path
                d={`M${i * 100 - 6} 0 Q${i * 100 + 50} 92 ${i * 100 + 106} 0 Z`}
                style={{ fill: `url(#${id}s)` }}
              />
              <path
                d={`M${i * 100 + 8} 6 Q${i * 100 + 50} 60 ${i * 100 + 92} 6`}
                fill="none"
                style={{ stroke: T.drapeDark, strokeWidth: 2, opacity: 0.5 }}
              />
              <path
                d={`M${i * 100 + 18} 4 Q${i * 100 + 50} 40 ${i * 100 + 82} 4`}
                fill="none"
                style={{ stroke: T.drapeLight, strokeWidth: 1.4, opacity: 0.45 }}
              />
            </g>
          ))}
        </svg>
      )}
      {/* kilau beludru (cahaya dari atas tengah) + vinyet tepi */}
      <div
        style={{
          ...fill,
          background:
            "radial-gradient(ellipse 70% 50% at 50% 35%, rgb(255 255 255 / .1), transparent 70%), radial-gradient(ellipse 120% 90% at 50% 50%, transparent 55%, rgb(0 0 0 / .55))",
        }}
      />
      <Noise opacity={0.22} />
    </div>
  );
}

/** Beludru datar (latar section marun). */
function VelvetTextureSvg({
  className,
  style,
  tone = "velvet",
}: {
  className?: string;
  style?: React.CSSProperties;
  tone?: "velvet" | "drape";
}) {
  const c =
    tone === "velvet"
      ? { b: T.velvet, d: T.velvetDark, l: T.velvetLight }
      : { b: T.drape, d: T.drapeDark, l: T.drapeLight };
  return (
    <div
      className={className}
      aria-hidden
      style={{
        ...fill,
        background: `radial-gradient(ellipse 60% 40% at 30% 20%, ${c.l}, transparent 70%), radial-gradient(ellipse 70% 50% at 80% 75%, ${c.l}, transparent 70%), radial-gradient(ellipse 120% 100% at 50% 50%, ${c.b} 40%, ${c.d})`,
        ...style,
      }}
    >
      <Noise opacity={0.3} />
      <Noise opacity={0.25} coarse blend="soft-light" />
    </div>
  );
}

/** Suede hijau berbintik (latar section acara/ucapan Tirai Beludru). */
function SuedeTextureSvg({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      aria-hidden
      style={{
        ...fill,
        background: `radial-gradient(circle at 20% 15%, color-mix(in srgb, ${T.suede} 70%, white), transparent 35%), radial-gradient(circle at 85% 40%, ${T.suedeDark}, transparent 40%), radial-gradient(circle at 30% 80%, color-mix(in srgb, ${T.suede} 75%, white), transparent 38%), ${T.suede}`,
        ...style,
      }}
    >
      <Noise opacity={0.45} coarse blend="soft-light" />
      <Noise opacity={0.28} />
    </div>
  );
}

/** Kertas krem dengan serat halus. */
export function PaperTexture({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      aria-hidden
      style={{
        ...fill,
        background: `radial-gradient(ellipse 90% 80% at 50% 45%, ${T.paper} 60%, ${T.paperShade})`,
        ...style,
      }}
    >
      <Noise opacity={0.12} blend="multiply" />
    </div>
  );
}

/** Kulit cokelat berkerut (kartu acara Renda Rimba). */
function LeatherTextureSvg({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      aria-hidden
      style={{
        ...fill,
        background: `radial-gradient(ellipse 50% 40% at 30% 30%, ${T.wood}, transparent 70%), radial-gradient(ellipse 60% 50% at 75% 70%, ${T.wood}, transparent 70%), radial-gradient(ellipse 110% 100% at 50% 50%, ${T.leather} 45%, ${T.leatherDark})`,
        ...style,
      }}
    >
      <Noise opacity={0.6} coarse blend="overlay" />
      <Noise opacity={0.25} />
    </div>
  );
}

/** Karpet damask marun (lantai panggung Tirai Beludru). */
export function DamaskCarpet({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={className} aria-hidden style={{ ...fill, background: T.velvetDark, ...style }}>
      <svg width="100%" height="100%" style={fill}>
        <defs>
          <pattern id={`${id}d`} width="56" height="64" patternUnits="userSpaceOnUse">
            {/* motif damask: medali tengah + kuncup sudut */}
            <g style={{ fill: T.velvet }}>
              <path d="M28 6 C34 16, 44 20, 44 32 C44 44, 34 48, 28 58 C22 48, 12 44, 12 32 C12 20, 22 16, 28 6 Z" />
              <path d="M0 0 C6 6, 6 12, 0 16 C-6 12, -6 6, 0 0 Z M56 0 C62 6, 62 12, 56 16 C50 12, 50 6, 56 0 Z M0 64 C6 58, 6 52, 0 48 C-6 52, -6 58, 0 64 Z M56 64 C62 58, 62 52, 56 48 C50 52, 50 58, 56 64 Z" />
            </g>
            <g fill="none" style={{ stroke: T.velvetLight, strokeWidth: 1, opacity: 0.6 }}>
              <path d="M28 16 C32 22, 36 26, 36 32 C36 38, 32 42, 28 48 C24 42, 20 38, 20 32 C20 26, 24 22, 28 16 Z" />
              <path d="M28 24 V40 M22 32 H34" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" style={{ fill: `url(#${id}d)` }} />
      </svg>
      <div
        style={{
          ...fill,
          background:
            "linear-gradient(to bottom, rgb(0 0 0 / .55), transparent 40%, rgb(0 0 0 / .3))",
        }}
      />
      <Noise opacity={0.25} />
    </div>
  );
}

/** Motif daun tropis (latar hijau Renda Rimba). */
function LeafPatternSvg({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const id = useId().replace(/:/g, "");
  const leaf = "M0 0 C-18 -10, -24 -40, 0 -70 C24 -40, 18 -10, 0 0 Z";
  return (
    <div className={className} aria-hidden style={{ ...fill, background: T.drape, ...style }}>
      <svg width="100%" height="100%" style={fill}>
        <defs>
          <pattern
            id={`${id}l`}
            width="150"
            height="150"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-12)"
          >
            <g fill="none" style={{ stroke: T.drapeLight, strokeWidth: 1.2, opacity: 0.5 }}>
              {[
                [30, 90, -30],
                [110, 60, 40],
                [80, 150, 160],
                [140, 140, -120],
                [20, 20, 200],
              ].map(([x, y, a], i) => (
                <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
                  <path d={leaf} style={{ fill: T.drapeLight, fillOpacity: 0.18 }} />
                  <path d="M0 0 V-66 M0 -16 L-10 -24 M0 -16 L10 -24 M0 -34 L-11 -43 M0 -34 L11 -43 M0 -50 L-7 -58 M0 -50 L7 -58" />
                </g>
              ))}
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" style={{ fill: `url(#${id}l)` }} />
      </svg>
      <div
        style={{
          ...fill,
          background:
            "radial-gradient(ellipse 110% 90% at 50% 45%, transparent 50%, rgb(0 0 0 / .45))",
        }}
      />
      <Noise opacity={0.2} />
    </div>
  );
}

/* ---------- versi yang bisa ditukar dengan file asli (foto tekstur) ---------- */
const TEXTURE = { mode: "fill", fit: "cover" } as const;
export const VelvetDrape = withAsset("drape-bg", VelvetDrapeSvg, TEXTURE);
export const VelvetTexture = withAsset<Parameters<typeof VelvetTextureSvg>[0]>(
  (p) => (p.tone === "drape" ? "drape-bg" : "velvet-bg"),
  VelvetTextureSvg,
  TEXTURE,
);
export const SuedeTexture = withAsset("suede-bg", SuedeTextureSvg, TEXTURE);
export const LeatherTexture = withAsset("card-texture", LeatherTextureSvg, TEXTURE);
export const LeafPattern = withAsset("leaf-bg", LeafPatternSvg, TEXTURE);
