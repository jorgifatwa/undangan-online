/**
 * Tekstur Lili sebagai SVG data URI (feTurbulence + pencahayaan). Browser
 * merasternya SEKALI menjadi ubin latar, jadi tidak ada biaya per frame.
 * Ubin memakai stitchTiles="stitch" agar sambungannya tidak terlihat.
 * Dipakai dengan `background-blend-mode: soft-light` di atas warna token,
 * sehingga varian warna tetap bekerja.
 */
const svg = (s: string) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

/** Kertas cat air krem: benjolan kasar bercahaya dari kiri atas. */
const PAPER_GRAIN = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260"><filter id="f" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="4" seed="7" stitchTiles="stitch" result="n"/><feDiffuseLighting in="n" surfaceScale="1.6" diffuseConstant="1" lighting-color="#fff"><feDistantLight azimuth="225" elevation="52"/></feDiffuseLighting><feComponentTransfer><feFuncR type="linear" slope="0.8" intercept="-0.13"/><feFuncG type="linear" slope="0.8" intercept="-0.13"/><feFuncB type="linear" slope="0.8" intercept="-0.13"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#f)"/></svg>`,
);

/** Noda lembut berskala besar (cat air / kertas tidak rata). */
const MOTTLE = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640"><filter id="f" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="3" seed="3" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0.9 0 0 0 -0.15"/></filter><rect width="100%" height="100%" filter="url(#f)"/></svg>`,
);

/** Serat halus kertas amplop (sage). */
const ENVELOPE_GRAIN = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="f" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.38" numOctaves="3" seed="11" stitchTiles="stitch" result="n"/><feDiffuseLighting in="n" surfaceScale="0.8" diffuseConstant="1" lighting-color="#fff"><feDistantLight azimuth="235" elevation="60"/></feDiffuseLighting><feComponentTransfer><feFuncR type="linear" slope="0.7" intercept="-0.1"/><feFuncG type="linear" slope="0.7" intercept="-0.1"/><feFuncB type="linear" slope="0.7" intercept="-0.1"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#f)"/></svg>`,
);

/** Latar kertas krem bertekstur (hero, mempelai pria, Save The Date, penutup). */
export const paperBg = (color = "var(--inv-paper)"): React.CSSProperties => ({
  backgroundColor: color,
  backgroundImage: `${PAPER_GRAIN}, ${MOTTLE}`,
  backgroundSize: "260px 260px, 640px 640px",
  backgroundBlendMode: "soft-light, soft-light",
});

/** Latar kertas amplop sage (cover). */
export const envelopeBg = (color = "var(--inv-sage)"): React.CSSProperties => ({
  backgroundColor: color,
  backgroundImage: `${ENVELOPE_GRAIN}, ${MOTTLE}`,
  backgroundSize: "220px 220px, 640px 640px",
  backgroundBlendMode: "soft-light, soft-light",
});
