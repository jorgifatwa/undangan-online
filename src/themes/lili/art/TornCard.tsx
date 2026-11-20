/**
 * Kartu kertas cat air bertepi sobek (kartu acara, digambar ulang dari
 * desain). Bentuk sobek = mask SVG data URI yang diregangkan ke ukuran kartu,
 * jadi tinggi kartu boleh mengikuti isi (alamat panjang). Tekstur kertas dari
 * `paperBg`. Jitter deterministik (SSR = klien).
 */
import { paperBg } from "./textures";

function jitter(i: number, amp: number) {
  const v = Math.sin(i * 7.31 + 1.7) * 43758.5453;
  return (v - Math.floor(v) - 0.5) * 2 * amp;
}

function tornPath(w: number, h: number, amp: number, step: number, seed: number) {
  // titik keliling: gelombang panjang (kertas tidak lurus) + serat pendek,
  // disambung kurva kuadratik lewat titik tengah agar tepinya lembut
  const pts: [number, number][] = [];
  let k = seed;
  const m = amp * 2 + 2;
  const p = (x: number, y: number, nx: number, ny: number) => {
    const wave = Math.sin((x + y) * 0.045 + seed) * amp * 0.9;
    const fib = jitter(k++, amp);
    pts.push([x + nx * (wave + fib), y + ny * (wave + fib)]);
  };
  for (let x = m; x < w - m; x += step) p(x, m, 0, -1);
  for (let y = m; y < h - m; y += step) p(w - m, y, 1, 0);
  for (let x = w - m; x > m; x -= step) p(x, h - m, 0, 1);
  for (let y = h - m; y > m; y -= step) p(m, y, -1, 0);
  const f = (v: number) => v.toFixed(1);
  const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const n = pts.length;
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M${f(m0[0])} ${f(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const q = mid(pts[i], pts[(i + 1) % n]);
    d += ` Q${f(pts[i][0])} ${f(pts[i][1])} ${f(q[0])} ${f(q[1])}`;
  }
  return d + "Z";
}

const maskUrl = (seed: number) => {
  const d = tornPath(320, 250, 2.2, 5, seed);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 250" preserveAspectRatio="none"><path d="${d}" fill="#fff"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};
const MASKS = [maskUrl(3), maskUrl(41)];

export function TornCard({
  seed = 0,
  style,
  children,
}: {
  seed?: 0 | 1;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    // bayangan di pembungkus (mask memotong bayangan bila dipasang di elemen yang sama)
    <div style={{ filter: "drop-shadow(0 2px 3px rgb(30 34 20 / 0.28))", ...style }}>
      <div
        style={{
          ...paperBg("#efece6"),
          WebkitMaskImage: MASKS[seed],
          maskImage: MASKS[seed],
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          boxShadow: "inset 0 0 0 3px rgb(255 255 255 / 0.55)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
