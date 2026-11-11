"use client";

import { useId, useMemo } from "react";

import { AssetImg, useSlotAsset, withAsset, type SlotProp } from "../assets";
import { ellipseNormal, onEllipse, type Pt, r2 } from "./geom";
import { T } from "./tokens";

/**
 * Renda prosedural. Semua bentuk dihitung dari geometri (bukan gambar),
 * sehingga tajam di layar apa pun dan warnanya mengikuti token tema.
 */

/** Tepi renda di sepanjang garis A→B: scallop ke arah `side` (+1/-1 terhadap normal kiri). */
export function laceEdgeAlong(a: Pt, b: Pt, opts: { size?: number; side?: 1 | -1 } = {}) {
  const { size = 6, side = 1 } = opts;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy * side;
  const ny = ux * side;
  const count = Math.max(2, Math.round(len / size));
  const step = len / count;
  let scallops = `M${r2(a[0])} ${r2(a[1])}`;
  const holes: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const ex = a[0] + ux * step * (i + 1);
    const ey = a[1] + uy * step * (i + 1);
    const r = step / 2;
    scallops += ` A${r2(r)} ${r2(r * 0.9)} 0 0 ${side === 1 ? 0 : 1} ${r2(ex)} ${r2(ey)}`;
    const mx = a[0] + ux * step * (i + 0.5) + nx * r * 0.45;
    const my = a[1] + uy * step * (i + 0.5) + ny * r * 0.45;
    holes.push([mx, my]);
  }
  return { scallops, holes, step };
}

/**
 * Kartu renda oval (doily) — dipakai kartu ayat Tirai Beludru.
 * viewBox 0 0 300 430.
 */
function LaceDoilySvg({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const id = useId().replace(/:/g, "");
  const cx = 150;
  const cy = 215;
  const geo = useMemo(() => {
    const out = {
      scallop: "",
      holes: [] as Pt[],
      petals: [] as { p: Pt; a: number }[],
      dots: [] as Pt[],
    };
    // Tepi luar: 44 lengkungan besar di sekeliling elips.
    const n = 44;
    const rx = 140;
    const ry = 205;
    const pts: Pt[] = [];
    for (let i = 0; i <= n; i++) pts.push(onEllipse(cx, cy, rx, ry, (i / n) * Math.PI * 2));
    out.scallop = `M${r2(pts[0][0])} ${r2(pts[0][1])}`;
    for (let i = 1; i <= n; i++) {
      const a = ((i - 0.5) / n) * Math.PI * 2;
      const [mx, my] = onEllipse(cx, cy, rx, ry, a);
      const [nx, ny] = ellipseNormal(rx, ry, a);
      // kontrol keluar → lengkungan scallop
      out.scallop += ` Q${r2(mx + nx * 17)} ${r2(my + ny * 17)} ${r2(pts[i][0])} ${r2(pts[i][1])}`;
      // lubang renda: satu besar + dua kecil per lengkungan
      out.holes.push([mx + nx * 6.5, my + ny * 6.5]);
      out.petals.push({
        p: [mx - nx * 7, my - ny * 7],
        a: (Math.atan2(ny, nx) * 180) / Math.PI + 90,
      });
    }
    // Cincin titik-titik bagian dalam.
    const m = 90;
    for (let i = 0; i < m; i++) out.dots.push(onEllipse(cx, cy, 116, 178, (i / m) * Math.PI * 2));
    return out;
  }, []);

  return (
    <svg viewBox="0 0 300 430" className={className} style={style} aria-hidden>
      <defs>
        <radialGradient id={`${id}p`} cx="50%" cy="45%" r="60%">
          <stop offset="0.7" style={{ stopColor: T.lace }} />
          <stop offset="1" style={{ stopColor: T.laceShade }} />
        </radialGradient>
        <filter id={`${id}s`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.35" />
        </filter>
      </defs>
      <g filter={`url(#${id}s)`}>
        <path d={geo.scallop} style={{ fill: T.lace }} />
      </g>
      {/* lubang-lubang renda (warna latar menembus = digambar sebagai bayangan) */}
      {geo.holes.map(([x, y], i) => (
        <circle key={`h${i}`} cx={r2(x)} cy={r2(y)} r="3.6" style={{ fill: T.laceShade }} />
      ))}
      {geo.petals.map(({ p: [x, y], a }, i) => (
        <ellipse
          key={`p${i}`}
          cx={r2(x)}
          cy={r2(y)}
          rx="2.2"
          ry="5"
          transform={`rotate(${r2(a)} ${r2(x)} ${r2(y)})`}
          style={{ fill: "none", stroke: T.laceShade, strokeWidth: 1 }}
        />
      ))}
      {/* bidang tengah */}
      <ellipse
        cx={cx}
        cy={cy}
        rx="124"
        ry="188"
        style={{ fill: `url(#${id}p)`, stroke: T.laceShade, strokeWidth: 1.2 }}
      />
      {geo.dots.map(([x, y], i) => (
        <circle key={`d${i}`} cx={r2(x)} cy={r2(y)} r="1.5" style={{ fill: T.laceShade }} />
      ))}
      <ellipse
        cx={cx}
        cy={cy}
        rx="108"
        ry="168"
        style={{ fill: "none", stroke: T.laceShade, strokeWidth: 0.8, strokeDasharray: "2 3" }}
      />
    </svg>
  );
}

/**
 * Bingkai renda persegi panjang (kartu mempelai & RSVP Renda Rimba).
 * Menyesuaikan ukuran kontainer apa pun. Dibangun dari CSS mask:
 *   - tepi bergelombang (scallop) dari radial-gradient berulang di 4 sisi,
 *   - deretan lubang renda di pita tepi,
 *   - garis jahitan putus-putus di dalam.
 * Warna dari token (--inv-lace / --inv-lace-shade).
 */
export function LaceBorder({
  children,
  className,
  style,
  band = 22,
  scallop = 7,
  slot,
}: SlotProp & {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Lebar pita renda (px). */
  band?: number;
  /** Jari-jari lengkungan tepi (px). */
  scallop?: number;
}) {
  const s = scallop;
  const d = s * 2;
  const dot = `radial-gradient(circle ${s}px, #000 97%, #0000)`;
  const edgeMask = [
    `${dot} top / ${d}px ${d}px repeat-x`,
    `${dot} bottom / ${d}px ${d}px repeat-x`,
    `${dot} left / ${d}px ${d}px repeat-y`,
    `${dot} right / ${d}px ${d}px repeat-y`,
    `linear-gradient(#000 0 0) center / calc(100% - ${d}px) calc(100% - ${d}px) no-repeat`,
  ].join(", ");
  const bandMask = "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)";
  const img = useSlotAsset(slot, "lace-card");
  if (img) {
    // File asli kartu renda direntangkan di belakang isi.
    return (
      <div
        className={className}
        style={{
          position: "relative",
          padding: band,
          filter: "drop-shadow(0 4px 10px rgb(0 0 0 / .28))",
          ...style,
        }}
      >
        <AssetImg image={img} mode="fill" fit="fill" />
        <div style={{ position: "relative" }}>{children}</div>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        position: "relative",
        padding: band,
        filter: "drop-shadow(0 4px 10px rgb(0 0 0 / .28))",
        ...style,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: T.lace,
          WebkitMask: edgeMask,
          mask: edgeMask,
        }}
      >
        {/* lubang renda di sepanjang pita */}
        <div
          style={{
            position: "absolute",
            inset: s * 0.55,
            padding: band - s * 1.4,
            backgroundImage: `radial-gradient(circle 2.3px, ${T.laceShade} 96%, transparent), radial-gradient(circle 1.2px, ${T.laceShade} 96%, transparent)`,
            backgroundSize: `${d}px ${d}px, ${d}px ${d}px`,
            backgroundPosition: `0 0, ${s}px ${s}px`,
            WebkitMask: bandMask,
            WebkitMaskComposite: "xor",
            mask: bandMask,
          }}
        />
        {/* garis jahitan */}
        <div
          style={{
            position: "absolute",
            inset: band - 5,
            border: `1px dashed ${T.laceShade}`,
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: band - 1,
            border: `1px solid ${T.laceShade}`,
            opacity: 0.6,
          }}
        />
      </div>
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

/* ---------- versi yang bisa ditukar dengan file asli ---------- */
export const LaceDoily = withAsset("lace-doily", LaceDoilySvg);
