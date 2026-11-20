"use client";

/**
 * Bunga "foto potong" Lili, digambar ulang dari desain sebagai SVG: lili pink,
 * alstroemeria, anggrek hijau, dan gladiol. Setiap bunga bertepi putih seperti
 * stiker (siluet digambar dulu dengan garis putih tebal). Gradasi memakai
 * `gradientUnits="objectBoundingBox"` per kelopak, jadi satu <defs> cukup
 * untuk semua bunga. Koordinat lokal: pusat bunga = (0,0).
 */

const f = (v: number) => v.toFixed(1);
/** Bulatkan 2 desimal: hasil trigonometri server & browser bisa beda (hidrasi). */
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Kelopak runcing lebar: pangkal (0,0), ujung (0,-len). */
function petal(len: number, w: number, belly = 0.5) {
  return `M0 0 C${f(w * 0.7)} ${f(-len * 0.1)} ${f(w)} ${f(-len * belly)} 0 ${f(-len)} C${f(-w)} ${f(-len * belly)} ${f(-w * 0.7)} ${f(-len * 0.1)} 0 0Z`;
}
/** Kelopak membulat (alstroemeria / anggrek). */
function round(len: number, w: number) {
  return `M0 0 C${f(w * 1.1)} ${f(-len * 0.15)} ${f(w * 1.05)} ${f(-len)} 0 ${f(-len)} C${f(-w * 1.05)} ${f(-len)} ${f(-w * 1.1)} ${f(-len * 0.15)} 0 0Z`;
}

/** Definisi gradasi bersama — pasang SEKALI per <svg> yang memakai bunga. */
export function FlowerDefs({ id }: { id: string }) {
  return (
    <>
      <linearGradient id={`${id}-lily`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#f3f0dc" />
        <stop offset="0.3" stopColor="#f8dfe5" />
        <stop offset="0.72" stopColor="#f5c3d0" />
        <stop offset="1" stopColor="#f9d3dc" />
      </linearGradient>
      <linearGradient id={`${id}-lilyw`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#eef0cf" />
        <stop offset="0.35" stopColor="#fbf6ea" />
        <stop offset="1" stopColor="#fffdf7" />
      </linearGradient>
      <linearGradient id={`${id}-alst`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#efe39a" />
        <stop offset="0.45" stopColor="#f6dfc8" />
        <stop offset="1" stopColor="#f6c4d0" />
      </linearGradient>
      <linearGradient id={`${id}-alst-o`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#faeceb" />
        <stop offset="1" stopColor="#f6c9d4" />
      </linearGradient>
      <radialGradient id={`${id}-orch`} cx="30%" cy="85%" r="95%">
        <stop offset="0" stopColor="#97ad78" />
        <stop offset="0.55" stopColor="#afc394" />
        <stop offset="1" stopColor="#d2dfbf" />
      </radialGradient>
      <linearGradient id={`${id}-glad`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#f8e3ea" />
        <stop offset="1" stopColor="#ee9fb9" />
      </linearGradient>
    </>
  );
}

type FlowerProps = {
  id: string;
  x: number;
  y: number;
  s?: number;
  rot?: number;
  /** Lili putih krem (hamparan bunga penutup). */
  white?: boolean;
};

const at = ({ x, y, s = 1, rot = 0 }: FlowerProps) =>
  `translate(${r2(x)} ${r2(y)}) rotate(${r2(rot)}) scale(${r2(s)})`;

/** Kelopak dengan tepi putih (stiker): putih tebal di bawah, isi di atas. */
function P({ d, fill, rot, edge = 2.6 }: { d: string; fill: string; rot: number; edge?: number }) {
  return (
    <g transform={`rotate(${r2(rot)})`}>
      <path d={d} fill="#fff" stroke="#fdfbf8" strokeWidth={edge} strokeLinejoin="round" />
      <path d={d} fill={fill} />
    </g>
  );
}

/** Lili pink (stargazer pucat), diameter ±124. */
export function PinkLily(p: FlowerProps) {
  const petals = [-80, -18, 44, 106, 168, 230];
  return (
    <g transform={at(p)}>
      {petals.map((r, i) => (
        <P
          key={r}
          rot={r}
          d={petal(i % 2 ? 58 : 64, i % 2 ? 27 : 30, 0.45)}
          fill={`url(#${p.id}-${p.white ? "lilyw" : "lily"})`}
        />
      ))}
      {/* urat tengah pink tua */}
      {petals.map((r, i) => (
        <path
          key={`v${r}`}
          d={`M0 -6 C2 -24 1 -40 0 ${-(i % 2 ? 50 : 56)}`}
          transform={`rotate(${r})`}
          fill="none"
          stroke={p.white ? "#e9dcc0" : "#ee9db4"}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.4}
        />
      ))}
      <circle r={12} fill="#eef0cf" opacity={0.9} />
      {/* bintik merah dekat pusat */}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const d = 13 + (i % 3) * 4;
        return (
          <circle
            key={i}
            cx={r2(Math.cos(a) * d)}
            cy={r2(Math.sin(a) * d)}
            r={1.1}
            fill="#c4566f"
          />
        );
      })}
      {/* benang sari: tangkai pink + kepala merah tua */}
      {[-150, -120, -95, -70, -45, -20].map((deg) => {
        const a = (deg * Math.PI) / 180;
        const x = r2(Math.cos(a) * 20);
        const y = r2(Math.sin(a) * 20);
        return (
          <g key={deg}>
            <line x1={0} y1={0} x2={x} y2={y} stroke="#e9a3b4" strokeWidth={1.1} />
            <ellipse
              cx={x}
              cy={y}
              rx={2.6}
              ry={1.4}
              transform={`rotate(${deg + 90} ${x} ${y})`}
              fill="#6e1d2c"
            />
          </g>
        );
      })}
    </g>
  );
}

/** Alstroemeria: 3 kelopak luar pink + 3 dalam kuning bergaris coklat, diameter ±90. */
export function Alstroemeria(p: FlowerProps) {
  const outer = [-90, 30, 150];
  const inner = [-30, 90, 210];
  return (
    <g transform={at(p)}>
      {outer.map((r) => (
        <P key={r} rot={r} d={round(44, 22)} fill={`url(#${p.id}-alst-o)`} />
      ))}
      {inner.map((r) => (
        <g key={r}>
          <P rot={r} d={round(38, 15)} fill={`url(#${p.id}-alst)`} />
          {/* garis-garis coklat */}
          {[-6, -2, 2, 6].map((dx, k) => (
            <path
              key={dx}
              d={`M${dx * 0.6} ${-10 - k} L${dx} ${-22 - (k % 2) * 4}`}
              transform={`rotate(${r})`}
              stroke="#9b4b34"
              strokeWidth={0.9}
              strokeLinecap="round"
              strokeDasharray="2 2"
            />
          ))}
        </g>
      ))}
      <circle r={6} fill="#dfe0a2" />
      {[-60, -40, -20, 0, 20].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <path
            key={deg}
            d={`M0 0 Q${r2(Math.cos(a) * 9)} ${r2(Math.sin(a) * 9 - 6)} ${r2(Math.cos(a) * 17)} ${r2(Math.sin(a) * 17)}`}
            fill="none"
            stroke="#c2a35a"
            strokeWidth={0.9}
          />
        );
      })}
    </g>
  );
}

/** Anggrek bulan hijau pucat, lebar ±104. */
export function GreenOrchid(p: FlowerProps) {
  const fill = `url(#${p.id}-orch)`;
  return (
    <g transform={at(p)}>
      {/* kelopak punggung (atas) & dua sepal bawah */}
      <P rot={0} d={round(46, 17)} fill={fill} />
      <P rot={140} d={round(40, 14)} fill={fill} />
      <P rot={-140} d={round(40, 14)} fill={fill} />
      {/* dua kelopak samping besar membulat */}
      <P rot={-82} d={round(52, 27)} fill={fill} />
      <P rot={82} d={round(52, 27)} fill={fill} />
      {/* urat */}
      <g fill="none" stroke="#7f9860" strokeWidth={0.6} opacity={0.5}>
        {[-95, -82, -69, 69, 82, 95].map((r) => (
          <path key={r} d="M0 -4 C3 -20 2 -34 0 -46" transform={`rotate(${r})`} />
        ))}
      </g>
      {/* bibir & tugu: putih kekuningan bersemu pink */}
      <path
        d="M-9 2 C-12 12 -6 22 0 22 C6 22 12 12 9 2 C6 -2 -6 -2 -9 2Z"
        fill="#fff"
        stroke="#fdfbf8"
        strokeWidth={2}
      />
      <path d="M-7 4 C-9 12 -4 19 0 19 C4 19 9 12 7 4 C4 1 -4 1 -7 4Z" fill="#f2dfe2" />
      <path d="M-4 6 C-4 12 4 12 4 6" fill="#e8c46a" opacity={0.8} />
      <ellipse cx={0} cy={-3} rx={4} ry={6} fill="#fbf7ef" />
    </g>
  );
}

/** Setangkai gladiol pink: kuntum berenda mengecil ke atas, tinggi ±110. */
export function Gladiolus(p: FlowerProps) {
  const florets = [
    { x: 0, y: 0, s: 1 },
    { x: -8, y: -24, s: 0.85 },
    { x: 4, y: -44, s: 0.72 },
    { x: -4, y: -62, s: 0.58 },
    { x: 2, y: -78, s: 0.45 },
  ];
  return (
    <g transform={at(p)}>
      <path d="M2 18 C0 -10 -2 -60 4 -104" fill="none" stroke="#9fb27c" strokeWidth={2.4} />
      {[-90, -98, -104].map((y, i) => (
        <path
          key={y}
          d={petal(10 - i * 2, 3)}
          transform={`translate(${3 + i} ${y}) rotate(${i % 2 ? 18 : -14})`}
          fill="#a9bd84"
          stroke="#fdfbf8"
          strokeWidth={1}
        />
      ))}
      {florets.map((fl, i) => (
        <g key={i} transform={`translate(${fl.x} ${fl.y}) scale(${fl.s})`}>
          {[-150, -100, -40, 10, 60].map((r) => (
            <P key={r} rot={r} d={round(20, 11)} fill={`url(#${p.id}-glad)`} edge={2.2} />
          ))}
          <circle r={4} fill="#fbeaf0" />
          <path d="M-2 -2 L-6 -10 M1 -2 L0 -11 M3 -1 L6 -9" stroke="#d27c99" strokeWidth={0.8} />
        </g>
      ))}
    </g>
  );
}

export type ColumnFlower = {
  kind: "lily" | "alst" | "orchid" | "glad";
  x: number;
  y: number;
  s?: number;
  rot?: number;
};

/**
 * Pola kolom bunga sepanjang tepi (koordinat kanvas, sisi kanan; x > 430
 * terpotong tepi layar). Satu pola (alstroemeria → anggrek → lili) berulang
 * tiap 230 px, diawali setangkai gladiol.
 */
export function columnFlowers(height: number, extraGlad: number[] = []): ColumnFlower[] {
  const startY = 0;
  const out: ColumnFlower[] = [{ kind: "glad", x: 352, y: startY + 100, s: 1.15, rot: -22 }];
  const unit: ColumnFlower[] = [
    { kind: "alst", x: 418, y: 36, s: 1.3, rot: 12 },
    { kind: "orchid", x: 404, y: 118, s: 1.3, rot: -8 },
    { kind: "lily", x: 414, y: 212, s: 1.4, rot: 8 },
  ];
  for (let base = startY; base < startY + height + 80; base += 230)
    for (const fl of unit) out.push({ ...fl, y: base + fl.y });
  // gladiol tambahan di atas bunga lain (mis. menjulur ke Save The Date)
  for (const y of extraGlad) out.push({ kind: "glad", x: 358, y, s: 1.15, rot: -30 });
  return out;
}

export function ColumnFlowerArt({ id, fl }: { id: string; fl: ColumnFlower }) {
  const props = { id, x: fl.x, y: fl.y, s: fl.s, rot: fl.rot };
  if (fl.kind === "lily") return <PinkLily {...props} />;
  if (fl.kind === "alst") return <Alstroemeria {...props} />;
  if (fl.kind === "orchid") return <GreenOrchid {...props} />;
  return <Gladiolus {...props} />;
}
