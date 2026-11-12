"use client";

import { motion } from "framer-motion";
import { useId, useMemo } from "react";

import { AssetImg, useSlotAsset, withAsset, type SlotProp } from "../assets";
import { r2, rng } from "./geom";
import { T } from "./tokens";

/* =============================================================================
 * Kupu-kupu — sayap kiri & kanan terpisah, mengepak dengan CSS (murah).
 * Versi file asli (slot "butterfly") adalah WebP/GIF animasi satu lapis.
 * ========================================================================== */
function ButterflySvg({
  flapping = true,
  className,
  style,
  color = T.white,
}: {
  flapping?: boolean;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}) {
  const upper = "M50 46 C 44 26, 22 12, 10 20 C 0 28, 12 46, 30 50 C 38 52, 46 50, 50 48 Z";
  const lower = "M50 50 C 42 54, 26 60, 24 72 C 22 82, 36 82, 44 68 C 47 62, 49 56, 50 52 Z";
  const veins =
    "M50 47 C 38 38, 24 28, 14 24 M50 48 C 38 46, 26 44, 18 40 M50 52 C 42 60, 34 66, 30 74";
  const wing = (
    <>
      <path d={upper} style={{ fill: color, stroke: T.paperDark, strokeWidth: 0.6 }} />
      <path d={lower} style={{ fill: color, stroke: T.paperDark, strokeWidth: 0.6 }} />
      <path d={veins} fill="none" style={{ stroke: T.paperDark, strokeWidth: 0.5, opacity: 0.7 }} />
      <circle cx="20" cy="30" r="2.2" style={{ fill: T.paperDark, opacity: 0.35 }} />
    </>
  );
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={{ overflow: "visible", ...style }}
      aria-hidden
    >
      <g className={flapping ? "inv-wing-l" : undefined} style={{ transformOrigin: "50px 50px" }}>
        {wing}
      </g>
      {/* cermin di <g> luar (atribut SVG), animasi di <g> dalam (CSS) — dipisah
          karena transform CSS menimpa atribut transform pada elemen yang sama. */}
      <g transform="translate(100 0) scale(-1 1)">
        <g className={flapping ? "inv-wing-r" : undefined} style={{ transformOrigin: "50px 50px" }}>
          {wing}
        </g>
      </g>
      <ellipse cx="50" cy="52" rx="2" ry="11" style={{ fill: T.ink, opacity: 0.75 }} />
      <path
        d="M49 42 C 46 34, 43 31, 40 30 M51 42 C 54 34, 57 31, 60 30"
        fill="none"
        style={{ stroke: T.ink, strokeWidth: 0.6, opacity: 0.7 }}
      />
      <style>{`
        @keyframes inv-flap { 0%,100% { transform: scaleX(1) } 50% { transform: scaleX(.22) } }
        .inv-wing-l { animation: inv-flap .42s ease-in-out infinite; }
        .inv-wing-r { animation: inv-flap .42s ease-in-out infinite; }
      `}</style>
    </svg>
  );
}

/* =============================================================================
 * Kelopak sakura (ujung bertakik).
 * ========================================================================== */
export function Petal({
  className,
  style,
  color = T.petal,
}: {
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 20 24" className={className} style={style} aria-hidden>
      <path
        d="M10 24 C4.2 20.6 0.6 14.4 1.8 7.6 C2.6 3.6 5 1 7.6 1.8 L10 4.6 L12.4 1.8 C15 1 17.4 3.6 18.2 7.6 C19.4 14.4 15.8 20.6 10 24 Z"
        style={{ fill: color }}
      />
      <path
        d="M10 8.6 C9.6 13 9.8 17.6 10 21"
        fill="none"
        style={{ stroke: T.petalVein, strokeWidth: 0.7, opacity: 0.6 }}
      />
    </svg>
  );
}

/* =============================================================================
 * Piringan hitam (tombol musik Renda Rimba). Berputar saat `playing`.
 * ========================================================================== */
export function Vinyl({
  playing = false,
  className,
  style,
  children,
  slot,
}: SlotProp & {
  playing?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Isi label tengah (mis. ikon play/pause). */
  children?: React.ReactNode;
}) {
  const id = useId().replace(/:/g, "");
  // File asli (slot "vinyl") tetap ditaruh di lapisan yang berputar.
  const img = useSlotAsset(slot, "vinyl");
  return (
    <div className={className} style={{ position: "relative", aspectRatio: "1", ...style }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          animation: playing ? "inv-vinyl-spin 3.2s linear infinite" : undefined,
        }}
      >
        {img && <AssetImg image={img} mode="fill" />}
        <svg
          viewBox="0 0 100 100"
          width="100%"
          height="100%"
          aria-hidden
          style={img ? { display: "none" } : undefined}
        >
          <defs>
            <radialGradient id={`${id}l`} cx="40%" cy="35%" r="70%">
              <stop offset="0" style={{ stopColor: T.velvetLight }} />
              <stop offset="1" style={{ stopColor: T.velvet }} />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="49" fill="#0d0d0d" />
          {Array.from({ length: 14 }, (_, i) => (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={r2(46 - i * 2)}
              fill="none"
              stroke="#fff"
              strokeOpacity={i % 3 === 0 ? 0.09 : 0.04}
              strokeWidth="0.5"
            />
          ))}
          <circle cx="50" cy="50" r="17" style={{ fill: `url(#${id}l)` }} />
          <circle
            cx="50"
            cy="50"
            r="15.5"
            fill="none"
            stroke="#fff"
            strokeOpacity=".25"
            strokeWidth=".4"
          />
          <circle cx="50" cy="50" r="2" fill="#0d0d0d" />
        </svg>
      </div>
      {/* kilau statis (tidak ikut berputar → terlihat seperti cahaya) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "1%",
          borderRadius: "50%",
          background:
            "conic-gradient(from 20deg, transparent 0 8%, rgb(255 255 255 / .16) 12%, transparent 18% 58%, rgb(255 255 255 / .1) 62%, transparent 68%)",
          boxShadow: "0 6px 16px rgb(0 0 0 / .45)",
        }}
      />
      {children && <div className="absolute inset-0 grid place-items-center">{children}</div>}
      <style>{`@keyframes inv-vinyl-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* =============================================================================
 * Polaroid berselotip. children = foto.
 * ========================================================================== */
export function Polaroid({
  children,
  rotate = -6,
  className,
  style,
}: {
  children?: React.ReactNode;
  rotate?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        background: T.white,
        padding: "6% 6% 22%",
        transform: `rotate(${rotate}deg)`,
        boxShadow: "0 10px 24px rgb(0 0 0 / .35), 0 1px 2px rgb(0 0 0 / .2)",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "1",
          overflow: "hidden",
          background: T.paperShade,
        }}
      >
        {children}
      </div>
      {/* selotip kertas dengan ujung bergerigi */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-5%",
          left: "32%",
          width: "36%",
          height: "11%",
          background: T.paperShade,
          opacity: 0.85,
          transform: "rotate(3deg)",
          clipPath:
            "polygon(0 8%, 6% 0, 12% 10%, 20% 0, 80% 0, 88% 10%, 94% 0, 100% 8%, 100% 92%, 94% 100%, 88% 90%, 80% 100%, 20% 100%, 12% 90%, 6% 100%, 0 92%)",
        }}
      />
    </div>
  );
}

/* =============================================================================
 * Kartu bertepi perangko (perforasi). children = isi kartu.
 * ========================================================================== */
export function StampCard({
  children,
  className,
  style,
  hole = 7,
  slot,
}: SlotProp & {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hole?: number;
}) {
  // Grid lubang digeser setengah sel → pusat lubang tepat di garis tepi
  // (jadi terlihat gigitan setengah lingkaran); bagian tengah ditutup penuh.
  const d = hole * 2.6;
  const mask = `radial-gradient(circle ${hole}px, #0000 96%, #000) ${-d / 2}px ${-d / 2}px / ${d}px ${d}px`;
  const img = useSlotAsset(slot, "stamp-card");
  if (img) {
    // File asli (kertas bertepi perangko) direntangkan di belakang isi kartu.
    return (
      <div className={className} style={{ position: "relative", padding: hole * 3, ...style }}>
        <AssetImg image={img} mode="fill" fit="fill" />
        <div style={{ position: "relative" }}>{children}</div>
      </div>
    );
  }
  return (
    <div
      className={className}
      style={{ position: "relative", filter: "drop-shadow(0 6px 14px rgb(0 0 0 / .35))", ...style }}
    >
      <div
        style={{
          background: T.paper,
          padding: hole * 3,
          WebkitMask: `${mask}, linear-gradient(#000 0 0) center / calc(100% - ${hole * 2}px) calc(100% - ${hole * 2}px) no-repeat`,
          mask: `${mask}, linear-gradient(#000 0 0) center / calc(100% - ${hole * 2}px) calc(100% - ${hole * 2}px) no-repeat`,
        }}
      >
        <div style={{ outline: `1px solid ${T.paperDark}`, outlineOffset: hole * 0.8 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
 * Kotak kado garis (sketsa) dengan tutup terpisah yang bisa terangkat.
 * ========================================================================== */
export function GiftBox({
  open = false,
  lite = false,
  className,
  style,
  color = T.white,
  slot,
}: SlotProp & {
  open?: boolean;
  lite?: boolean;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}) {
  const line = {
    fill: "none",
    stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const img = useSlotAsset(slot, "gift-box");
  if (img) {
    // Satu file → dua lapisan lewat clip-path: badan (di bawah garis tutup, 46%)
    // dan tutup (di atasnya) yang tetap bisa terangkat.
    return (
      <div
        className={className}
        style={{ position: "relative", aspectRatio: `${img.width} / ${img.height}`, ...style }}
      >
        <div style={{ position: "absolute", inset: 0, clipPath: "inset(46% 0 0 0)" }}>
          <AssetImg image={img} mode="fill" />
        </div>
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: "inset(0 0 54% 0)",
            transformOrigin: "20% 46%",
          }}
          initial={false}
          animate={
            open ? { y: lite ? "-14%" : "-26%", rotate: lite ? 0 : -14 } : { y: "0%", rotate: 0 }
          }
          transition={{
            type: lite ? "tween" : "spring",
            stiffness: 140,
            damping: 11,
            duration: 0.4,
          }}
        >
          <AssetImg image={img} mode="fill" />
        </motion.div>
      </div>
    );
  }
  return (
    <div className={className} style={{ position: "relative", aspectRatio: "1", ...style }}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        aria-hidden
        style={{ overflow: "visible" }}
      >
        {/* badan kotak (sedikit tidak rata = gaya sketsa) */}
        <path d="M20 46 L21 90 Q21 92 23 92 L78 91 Q80 91 80 89 L79 46" style={line} />
        <path d="M47 46 L47.5 91 M53 46 L53 91" style={line} />
        <path d="M24 52 L76 51" style={{ ...line, strokeWidth: 0.8, opacity: 0.6 }} />
      </svg>
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        aria-hidden
        style={{ overflow: "visible", transformOrigin: "20% 46%" }}
        initial={false}
        animate={
          open ? { y: lite ? "-14%" : "-26%", rotate: lite ? 0 : -14 } : { y: "0%", rotate: 0 }
        }
        transition={{ type: lite ? "tween" : "spring", stiffness: 140, damping: 11, duration: 0.4 }}
      >
        {/* tutup + pita kupu-kupu */}
        <path d="M15 34 L85 33 L85 46 L15 47 Z" style={line} />
        <path d="M47 34 L47 46 M53 33.5 L53 46" style={line} />
        <path
          d="M50 33 C 40 18, 26 20, 32 30 C 35 34, 44 34, 50 33 Z M50 33 C 60 18, 74 20, 68 30 C 65 34, 56 34, 50 33 Z"
          style={line}
        />
        <path
          d="M50 33 C 46 40, 42 42, 38 44 M50 33 C 54 40, 58 42, 62 44"
          style={{ ...line, strokeWidth: 1.1 }}
        />
      </motion.svg>
    </div>
  );
}

/* =============================================================================
 * Rumbai sutra (tassel) dengan kepala bulat, berayun pelan.
 * ========================================================================== */
function TasselSvg({
  className,
  style,
  sway = true,
  tone = "velvet",
}: {
  className?: string;
  style?: React.CSSProperties;
  sway?: boolean;
  tone?: "velvet" | "drape";
}) {
  const id = useId().replace(/:/g, "");
  const c =
    tone === "velvet"
      ? { b: T.velvet, l: T.velvetLight, d: T.velvetDark }
      : { b: T.drape, l: T.drapeLight, d: T.drapeDark };
  const threads = useMemo(() => {
    const rand = rng(11);
    return Array.from({ length: 34 }, (_, i) => {
      const x0 = 38 + (i / 33) * 24;
      const x1 = 26 + (i / 33) * 48 + (rand() - 0.5) * 3;
      const y1 = 196 + rand() * 6;
      return `M${r2(x0)} 86 C${r2(x0)} 130, ${r2(x1)} 160, ${r2(x1)} ${r2(y1)}`;
    });
  }, []);
  return (
    <svg
      viewBox="0 0 100 205"
      className={className}
      style={{
        overflow: "visible",
        transformOrigin: "50% 0%",
        animation: sway ? "inv-tassel 4.5s ease-in-out infinite" : undefined,
        ...style,
      }}
      aria-hidden
    >
      <defs>
        <radialGradient id={`${id}k`} cx="38%" cy="35%" r="70%">
          <stop offset="0" style={{ stopColor: c.l }} />
          <stop offset="1" style={{ stopColor: c.d }} />
        </radialGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: c.d }} />
          <stop offset="0.45" style={{ stopColor: c.l }} />
          <stop offset="1" style={{ stopColor: c.d }} />
        </linearGradient>
      </defs>
      <path d="M50 0 V30" style={{ stroke: c.d, strokeWidth: 1.6 }} />
      <circle cx="50" cy="40" r="12" style={{ fill: `url(#${id}k)` }} />
      <path
        d="M38 52 C 36 64, 40 76, 38 88 L62 88 C 60 76, 64 64, 62 52 Z"
        style={{ fill: `url(#${id}f)` }}
      />
      <path d="M37 72 H63 M37 77 H63" style={{ stroke: c.d, strokeWidth: 1.4 }} />
      <g fill="none" style={{ stroke: `url(#${id}f)`, strokeWidth: 1.3 }}>
        {threads.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <style>{`@keyframes inv-tassel{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2.5deg)}}`}</style>
    </svg>
  );
}

/* =============================================================================
 * Untaian mutiara menggantung (beberapa untai vertikal, ujung bawah melengkung).
 * ========================================================================== */
function PearlStrandsSvg({
  strands = [180, 120, 150, 90],
  className,
  style,
  sway = true,
}: {
  /** Panjang tiap untai (unit viewBox). */
  strands?: number[];
  className?: string;
  style?: React.CSSProperties;
  sway?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const width = strands.length * 22;
  const height = Math.max(...strands) + 24;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ overflow: "visible", ...style }}
      aria-hidden
    >
      <defs>
        <radialGradient id={`${id}p`} cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.5" style={{ stopColor: T.pearl }} />
          <stop offset="1" style={{ stopColor: T.laceShade }} />
        </radialGradient>
      </defs>
      {strands.map((len, s) => {
        const x = 11 + s * 22;
        const count = Math.floor(len / 7.4);
        return (
          <g
            key={s}
            style={{
              transformOrigin: `${x}px 0px`,
              animation: sway
                ? `inv-pearl-sway ${4 + s * 0.7}s ease-in-out ${s * 0.4}s infinite`
                : undefined,
            }}
          >
            <path d={`M${x} 0 V${len}`} style={{ stroke: T.laceShade, strokeWidth: 0.5 }} />
            {Array.from({ length: count }, (_, i) => (
              <circle
                key={i}
                cx={x + Math.sin(i * 0.25) * 0.8}
                cy={4 + i * 7.4}
                r="3.4"
                style={{ fill: `url(#${id}p)` }}
              />
            ))}
            {/* manik penutup emas */}
            <path d={`M${x - 3} -3 h6 l-1 5 h-4 z`} style={{ fill: T.gold }} />
          </g>
        );
      })}
      <style>{`@keyframes inv-pearl-sway{0%,100%{transform:rotate(-1.6deg)}50%{transform:rotate(1.6deg)}}`}</style>
    </svg>
  );
}

/* =============================================================================
 * Gugus kilau bintang berkelip (pengganti animasi Lottie referensi).
 * ========================================================================== */
export function Sparkles({
  className,
  style,
  color = T.goldLight,
}: {
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}) {
  const stars = [
    { x: 30, y: 30, s: 1, d: 0 },
    { x: 66, y: 18, s: 0.55, d: 0.6 },
    { x: 62, y: 62, s: 0.75, d: 1.1 },
    { x: 18, y: 70, s: 0.45, d: 1.6 },
  ];
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={{ overflow: "visible", ...style }}
      aria-hidden
    >
      {stars.map((st, i) => (
        <path
          key={i}
          d="M0 -14 C1 -4, 4 -1, 14 0 C4 1, 1 4, 0 14 C-1 4, -4 1, -14 0 C-4 -1, -1 -4, 0 -14 Z"
          transform={`translate(${st.x} ${st.y}) scale(${st.s})`}
          style={{
            fill: color,
            transformBox: "fill-box",
            transformOrigin: "center",
            animation: `inv-twinkle 2.2s ease-in-out ${st.d}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes inv-twinkle{0%,100%{opacity:.15;scale:.6}50%{opacity:1;scale:1}}`}</style>
    </svg>
  );
}

/* =============================================================================
 * Ukiran kayu sudut (filigri) — galeri Renda Rimba. Letakkan di kiri atas;
 * cerminkan dengan transform untuk sudut lain.
 * ========================================================================== */
function CarvedCornerSvg({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  // Setengah ukiran (lengan atas). Lengan kiri = cermin diagonal (y = x).
  const arm =
    "M8 8 C 30 6, 44 14, 62 12 C 78 10, 92 6, 102 14 C 110 20, 106 32, 96 30 C 90 29, 90 22, 95 22";
  const curl = "M44 13 C 46 24, 38 30, 33 26 C 30 23, 33 19, 36 21";
  const curl2 = "M80 9 C 82 18, 76 22, 72 19 C 70 17, 72 14, 74 15";
  const diag = "M8 8 C 24 24, 30 26, 40 40 C 48 52, 40 62, 32 56 C 26 52, 30 44, 36 46";
  const leaf = "M0 0 C -5 6, -4 14, 0 18 C 4 14, 5 6, 0 0 Z";
  const leaves = [
    { x: 58, y: 13, r: 168 },
    { x: 88, y: 9, r: 196 },
    { x: 24, y: 9, r: 150 },
  ];
  const half = (layer: "shadow" | "wood" | "light") => {
    const stroke = layer === "shadow" ? T.woodDark : layer === "wood" ? T.wood : "#fff";
    const w = layer === "shadow" ? 7 : layer === "wood" ? 4.4 : 1;
    return (
      <g
        fill="none"
        strokeLinecap="round"
        style={{ stroke, strokeWidth: w, opacity: layer === "light" ? 0.22 : 1 }}
        transform={layer === "light" ? "translate(-0.8 -1)" : undefined}
      >
        <path d={arm} />
        <path d={curl} style={{ strokeWidth: w * 0.75 }} />
        <path d={curl2} style={{ strokeWidth: w * 0.6 }} />
      </g>
    );
  };
  const leafGroup = (
    <g>
      {leaves.map((l, i) => (
        <path
          key={i}
          d={leaf}
          transform={`translate(${l.x} ${l.y}) rotate(${l.r})`}
          style={{ fill: T.wood, stroke: T.woodDark, strokeWidth: 1.2 }}
        />
      ))}
      <circle
        cx="95"
        cy="25"
        r="2.6"
        style={{ fill: T.wood, stroke: T.woodDark, strokeWidth: 1 }}
      />
    </g>
  );
  const mirror = "matrix(0 1 1 0 0 0)";
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      style={{
        overflow: "visible",
        filter: "drop-shadow(1px 2px 1.5px rgb(0 0 0 / .35))",
        ...style,
      }}
      aria-hidden
    >
      {(["shadow", "wood", "light"] as const).map((layer) => (
        <g key={layer}>
          {half(layer)}
          <g transform={mirror}>{half(layer)}</g>
          <path
            d={diag}
            fill="none"
            strokeLinecap="round"
            style={{
              stroke: layer === "shadow" ? T.woodDark : layer === "wood" ? T.wood : "#fff",
              strokeWidth: layer === "shadow" ? 6.5 : layer === "wood" ? 4 : 0.9,
              opacity: layer === "light" ? 0.22 : 1,
            }}
          />
        </g>
      ))}
      {leafGroup}
      <g transform={mirror}>{leafGroup}</g>
      <circle
        cx="9"
        cy="9"
        r="5.5"
        style={{ fill: T.wood, stroke: T.woodDark, strokeWidth: 1.6 }}
      />
      <circle cx="7.5" cy="7.5" r="1.6" style={{ fill: "#fff", opacity: 0.25 }} />
    </svg>
  );
}

/* =============================================================================
 * Hati kecil (penanda tanggal di kalender).
 * ========================================================================== */
function HeartSvg({
  className,
  style,
  color = T.velvet,
}: {
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 24 22" className={className} style={style} aria-hidden>
      <path
        d="M12 21 C 4 15, 0 11, 0 6.5 C 0 3, 2.7 0.5 6 0.5 C 8.6 0.5 10.6 2 12 4 C 13.4 2 15.4 0.5 18 0.5 C 21.3 0.5 24 3 24 6.5 C 24 11 20 15 12 21 Z"
        style={{ fill: color }}
      />
    </svg>
  );
}

/* =============================================================================
 * Basmalah sebagai TEKS (font Amiri via --inv-font-arabic), bukan gambar.
 * ========================================================================== */
function BasmalahText({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <p
      dir="rtl"
      lang="ar"
      className={className}
      style={{ fontFamily: "var(--inv-font-arabic, 'Amiri', serif)", lineHeight: 1.6, ...style }}
    >
      بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
    </p>
  );
}

/* =============================================================================
 * Versi yang bisa ditukar dengan file asli (lihat _shared/assets.tsx).
 * ========================================================================== */
export const Butterfly = withAsset("butterfly", ButterflySvg);
export const Tassel = withAsset<Parameters<typeof TasselSvg>[0]>(
  (p) => (p.tone === "drape" ? "tassel-alt" : "tassel"),
  TasselSvg,
);
export const PearlStrands = withAsset("pearls", PearlStrandsSvg);
export const CarvedCorner = withAsset("carved-corner", CarvedCornerSvg);
export const Heart = withAsset("heart", HeartSvg);
export const Basmalah = withAsset("basmalah", BasmalahText);
