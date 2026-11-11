/**
 * Helper geometri untuk ornamen SVG prosedural (renda, bingkai, bunga).
 * Semua deterministik (seed tetap) supaya render server & client identik.
 */

/** PRNG kecil dan cepat (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Pt = [number, number];

export const r2 = (n: number) => Math.round(n * 100) / 100;

/** Titik pada elips (sudut radian, 0 = kanan, searah jarum jam di layar). */
export function onEllipse(cx: number, cy: number, rx: number, ry: number, a: number): Pt {
  return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
}

/** Normal (arah keluar) elips di sudut a. */
export function ellipseNormal(rx: number, ry: number, a: number): Pt {
  const nx = Math.cos(a) / rx;
  const ny = Math.sin(a) / ry;
  const l = Math.hypot(nx, ny);
  return [nx / l, ny / l];
}

/** Kurva halus melewati titik-titik (Catmull-Rom → Bezier kubik). */
export function smoothPath(pts: Pt[], closed = false, tension = 0.5): string {
  if (pts.length < 2) return "";
  const p = closed
    ? [pts[pts.length - 1], ...pts, pts[0], pts[1]]
    : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${r2(p[1][0])} ${r2(p[1][1])}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [x0, y0] = p[i - 1];
    const [x1, y1] = p[i];
    const [x2, y2] = p[i + 1];
    const [x3, y3] = p[i + 2];
    const k = tension / 3;
    d += ` C${r2(x1 + (x2 - x0) * k)} ${r2(y1 + (y2 - y0) * k)} ${r2(x2 - (x3 - x1) * k)} ${r2(y2 - (y3 - y1) * k)} ${r2(x2)} ${r2(y2)}`;
  }
  return closed ? `${d} Z` : d;
}

/** Path superelips (|x/a|^n + |y/b|^n = 1), opsional bergelombang di tepinya. */
export function superellipse(
  cx: number,
  cy: number,
  a: number,
  b: number,
  n: number,
  opts: { waves?: number; amp?: number; steps?: number } = {},
): string {
  const { waves = 0, amp = 0, steps = 240 } = opts;
  const pts: Pt[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const k = 1 + (waves ? amp * Math.cos(t * waves) : 0);
    const x = cx + a * k * Math.sign(c) * Math.abs(c) ** (2 / n);
    const y = cy + b * k * Math.sign(s) * Math.abs(s) ** (2 / n);
    pts.push([x, y]);
  }
  return `M${pts.map(([x, y]) => `${r2(x)} ${r2(y)}`).join(" L")} Z`;
}

/** Path busur sederhana untuk kelopak berbentuk tetes (ujung di (0,-len)). */
export function petalPath(len: number, width: number, tipSharp = 0.2): string {
  const w = width / 2;
  return `M0 0 C${r2(-w)} ${r2(-len * 0.25)} ${r2(-w * (1 - tipSharp))} ${r2(-len * 0.85)} 0 ${r2(-len)} C${r2(w * (1 - tipSharp))} ${r2(-len * 0.85)} ${r2(w)} ${r2(-len * 0.25)} 0 0 Z`;
}
