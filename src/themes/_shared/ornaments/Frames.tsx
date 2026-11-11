"use client";

import { useId, useMemo } from "react";

import { AssetImg, useSlotAsset, type SlotProp } from "../assets";
import { ellipseNormal, onEllipse, r2, superellipse } from "./geom";
import { T } from "./tokens";

/** Gradien emas berbevel (dipakai semua bingkai emas). */
function GoldDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={{ stopColor: T.goldLight }} />
        <stop offset="0.3" style={{ stopColor: T.gold }} />
        <stop offset="0.55" style={{ stopColor: T.goldDark }} />
        <stop offset="0.75" style={{ stopColor: T.goldLight }} />
        <stop offset="1" style={{ stopColor: T.gold }} />
      </linearGradient>
      <linearGradient id={`${id}h`} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" style={{ stopColor: T.goldDark }} />
        <stop offset="0.5" style={{ stopColor: T.goldLight }} />
        <stop offset="1" style={{ stopColor: T.goldDark }} />
      </linearGradient>
    </defs>
  );
}

/** Ornamen salib/bintang kecil di sudut bingkai kapsul. */
function CrossStar({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -9 L1.4 -1.4 L9 0 L1.4 1.4 L0 9 L-1.4 1.4 L-9 0 L-1.4 -1.4 Z" />
      <circle r="1.6" />
    </g>
  );
}

/**
 * Bingkai kapsul emas (stadium) dengan ornamen di sudut & sisi.
 * children = foto (diisi penuh, terpotong bentuk kapsul).
 */
export function CapsuleFrame({
  children,
  className,
  style,
  slot,
}: SlotProp & {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  const img = useSlotAsset(slot, "capsule-frame");
  return (
    <div className={className} style={{ position: "relative", aspectRatio: "200 / 260", ...style }}>
      {img && <AssetImg image={img} mode="fill" style={{ zIndex: 1 }} />}
      <div
        className="absolute overflow-hidden"
        style={{ left: "17%", right: "17%", top: "9%", bottom: "9%", borderRadius: "999px" }}
      >
        {children}
      </div>
      <svg
        viewBox="0 0 200 260"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
        style={{ overflow: "visible", display: img ? "none" : undefined }}
      >
        <GoldDefs id={id} />
        <g fill="none" style={{ stroke: `url(#${id}g)` }}>
          <rect x="34" y="23" width="132" height="214" rx="66" strokeWidth="3" />
          <rect x="28" y="16" width="144" height="228" rx="72" strokeWidth="1.2" />
          {/* garis sudut persegi tipis (khas bingkai) */}
          <path
            d="M18 40 V18 H40 M160 18 H182 V40 M182 220 V242 H160 M40 242 H18 V220"
            strokeWidth="1.2"
          />
        </g>
        <g style={{ fill: `url(#${id}h)` }}>
          <CrossStar x={18} y={18} s={1.1} />
          <CrossStar x={182} y={18} s={1.1} />
          <CrossStar x={18} y={242} s={1.1} />
          <CrossStar x={182} y={242} s={1.1} />
          <CrossStar x={100} y={8} s={0.8} />
          <CrossStar x={100} y={252} s={0.8} />
          <CrossStar x={20} y={130} s={0.7} />
          <CrossStar x={180} y={130} s={0.7} />
        </g>
      </svg>
    </div>
  );
}

/**
 * Bingkai oval barok emas berukir (cover Renda Rimba).
 * Ukiran dibangun prosedural: gulungan-C bergantian di sekeliling oval,
 * deret manik, mahkota kipas di atas, dan cangkang di bawah.
 */
export function OvalBaroqueFrame({
  children,
  className,
  style,
  slot,
}: SlotProp & {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  const img = useSlotAsset(slot, "oval-frame");
  const cx = 150;
  const cy = 182;
  const geo = useMemo(() => {
    const scrolls: { x: number; y: number; a: number; flip: boolean; big: boolean }[] = [];
    const n = 22;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      // sisakan ruang untuk mahkota (atas) & cangkang (bawah)
      const deg = ((a * 180) / Math.PI + 450) % 360;
      if (deg < 18 || deg > 342 || (deg > 162 && deg < 198)) continue;
      const [x, y] = onEllipse(cx, cy, 123, 160, a);
      const [nx, ny] = ellipseNormal(123, 160, a);
      scrolls.push({
        x: x + nx * 4,
        y: y + ny * 4,
        a: (Math.atan2(ny, nx) * 180) / Math.PI + 90,
        flip: i % 2 === 0,
        big: i % 3 === 0,
      });
    }
    const beads: [number, number][] = [];
    for (let i = 0; i < 64; i++) beads.push(onEllipse(cx, cy, 104, 141, (i / 64) * Math.PI * 2));
    return { scrolls, beads };
  }, []);

  // Gulungan-C (acanthus sederhana) sebelum diputar, titik pangkal di (0,0).
  const scroll =
    "M-14 0 C-14 -14, 6 -18, 8 -6 C9 2, 0 4, -2 -2 C-3 -6, 2 -8, 3 -5 M8 -6 C14 -8, 18 -2, 14 4 C11 8, 4 6, 6 2";
  const leaf = "M-4 2 C-10 -4, -8 -14, 0 -18 C8 -14, 10 -4, 4 2 Z";

  return (
    <div className={className} style={{ position: "relative", aspectRatio: "300 / 370", ...style }}>
      {img && <AssetImg image={img} mode="fill" style={{ zIndex: 1 }} />}
      <div
        className="absolute overflow-hidden"
        style={{ left: "17%", right: "17%", top: "14%", bottom: "11.5%", borderRadius: "50%" }}
      >
        {children}
      </div>
      <svg
        viewBox="0 0 300 370"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
        style={{ overflow: "visible", display: img ? "none" : undefined }}
      >
        <GoldDefs id={id} />
        <filter id={`${id}d`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.45" />
        </filter>
        <g filter={`url(#${id}d)`}>
          {/* cincin utama berbevel */}
          <ellipse
            cx={cx}
            cy={cy}
            rx="114"
            ry="151"
            fill="none"
            strokeWidth="20"
            style={{ stroke: T.goldDark }}
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx="114"
            ry="151"
            fill="none"
            strokeWidth="16"
            style={{ stroke: `url(#${id}g)` }}
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx="121"
            ry="158"
            fill="none"
            strokeWidth="2"
            style={{ stroke: T.goldLight, opacity: 0.8 }}
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx="106"
            ry="143"
            fill="none"
            strokeWidth="2.5"
            style={{ stroke: T.goldDark }}
          />
          {/* gulungan berukir */}
          {geo.scrolls.map((s, i) => (
            <g
              key={i}
              transform={`translate(${r2(s.x)} ${r2(s.y)}) rotate(${r2(s.a)}) scale(${s.flip ? -1 : 1} 1) scale(${s.big ? 1.25 : 1})`}
            >
              <path
                d={leaf}
                transform="translate(0 -6) scale(.9)"
                style={{ fill: `url(#${id}h)`, stroke: T.goldDark, strokeWidth: 0.6 }}
              />
              <path
                d={scroll}
                fill="none"
                strokeLinecap="round"
                style={{ stroke: T.goldDark, strokeWidth: 4.5 }}
              />
              <path
                d={scroll}
                fill="none"
                strokeLinecap="round"
                style={{ stroke: `url(#${id}g)`, strokeWidth: 3 }}
              />
            </g>
          ))}
          {/* mahkota kipas di atas */}
          <g transform={`translate(${cx} 30)`}>
            {Array.from({ length: 9 }, (_, i) => {
              const a = -64 + i * 16;
              return (
                <path
                  key={i}
                  d="M0 6 C-6 -4, -5 -22, 0 -30 C5 -22, 6 -4, 0 6 Z"
                  transform={`rotate(${a})`}
                  style={{ fill: `url(#${id}g)`, stroke: T.goldDark, strokeWidth: 0.8 }}
                />
              );
            })}
            <circle
              cy="6"
              r="9"
              style={{ fill: `url(#${id}h)`, stroke: T.goldDark, strokeWidth: 1 }}
            />
            <circle cy="6" r="4" style={{ fill: T.goldLight }} />
          </g>
          {/* cangkang di bawah */}
          <g transform={`translate(${cx} 340)`}>
            {Array.from({ length: 7 }, (_, i) => (
              <path
                key={i}
                d="M0 -4 C-5 4, -4 18, 0 22 C4 18, 5 4, 0 -4 Z"
                transform={`rotate(${-54 + i * 18}) translate(0 2)`}
                style={{ fill: `url(#${id}g)`, stroke: T.goldDark, strokeWidth: 0.7 }}
              />
            ))}
            <ellipse
              cy="-4"
              rx="12"
              ry="7"
              style={{ fill: `url(#${id}h)`, stroke: T.goldDark, strokeWidth: 1 }}
            />
          </g>
        </g>
        {/* deret manik di tepi dalam */}
        {geo.beads.map(([x, y], i) => (
          <circle
            key={i}
            cx={r2(x)}
            cy={r2(y)}
            r="2"
            style={{ fill: T.goldLight, stroke: T.goldDark, strokeWidth: 0.5 }}
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * Kartu bertepi scallop (superelips bergelombang) dengan cincin marun di
 * atas, bawah, dan sisi — kartu ayat Renda Rimba. children = isi kartu.
 */
export function ScallopFrame({
  children,
  className,
  style,
}: {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  const shape = useMemo(() => superellipse(150, 210, 132, 196, 3.2, { waves: 16, amp: 0.022 }), []);
  const rings: [number, number][] = [
    [150, 12],
    [150, 408],
    [18, 140],
    [282, 140],
    [18, 280],
    [282, 280],
  ];
  return (
    <div className={className} style={{ position: "relative", aspectRatio: "300 / 420", ...style }}>
      <svg
        viewBox="0 0 300 420"
        className="absolute inset-0 h-full w-full"
        aria-hidden
        style={{ overflow: "visible" }}
      >
        <defs>
          <radialGradient id={`${id}p`} cx="50%" cy="40%" r="70%">
            <stop offset="0.6" style={{ stopColor: T.paper }} />
            <stop offset="1" style={{ stopColor: T.paperShade }} />
          </radialGradient>
        </defs>
        <path d={shape} transform="translate(0 4)" style={{ fill: "#000", opacity: 0.3 }} />
        <path d={shape} style={{ fill: `url(#${id}p)`, stroke: T.velvet, strokeWidth: 7 }} />
        <path
          d={shape}
          transform="translate(150 210) scale(.955) translate(-150 -210)"
          fill="none"
          style={{ stroke: T.velvet, strokeWidth: 1, opacity: 0.5 }}
        />
        {rings.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="9" style={{ fill: T.velvet }} />
            <circle cx={x} cy={y} r="4.2" style={{ fill: T.paper }} />
            <circle cx={x - 2.5} cy={y - 3} r="1.6" style={{ fill: "#fff", opacity: 0.4 }} />
          </g>
        ))}
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center text-center"
        style={{ inset: "9% 11%" }}
      >
        {children}
      </div>
    </div>
  );
}
