/**
 * Bingkai oval timbul (emboss) di kartu linen: cincin manik + dua lekuk
 * tepi, hanya sorot terang (kiri atas) & bayangan (kanan bawah) di atas warna
 * kertas — seperti kertas yang ditekan cetakan. viewBox 266 × 314; lubang
 * foto = elips pusat (133,157) rx 104 ry 128.
 */
export const OVAL = { w: 266, h: 314, cx: 133, cy: 157, rx: 104, ry: 128 };

const r2 = (v: number) => Math.round(v * 100) / 100;
const BEADS = Array.from({ length: 58 }, (_, i) => {
  const a = (i / 58) * Math.PI * 2;
  return [r2(133 + Math.cos(a) * 124), r2(157 + Math.sin(a) * 149)];
});

function Ring({ rx, ry, w }: { rx: number; ry: number; w: number }) {
  return (
    <>
      <ellipse
        cx={133.9}
        cy={158}
        rx={rx}
        ry={ry}
        fill="none"
        stroke="rgb(90 80 70 / 0.22)"
        strokeWidth={w}
      />
      <ellipse
        cx={132.2}
        cy={156.1}
        rx={rx}
        ry={ry}
        fill="none"
        stroke="rgb(255 255 255 / 0.85)"
        strokeWidth={w}
      />
    </>
  );
}

export function EmbossOval({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox={`0 0 ${OVAL.w} ${OVAL.h}`} style={style} aria-hidden>
      {/* lekuk luar & dalam */}
      <Ring rx={131} ry={155} w={1.6} />
      <Ring rx={116} ry={140} w={1.4} />
      <Ring rx={108} ry={132} w={2.2} />
      {/* manik timbul */}
      {BEADS.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x + 0.7} cy={y + 0.8} r={2.6} fill="rgb(90 80 70 / 0.18)" />
          <circle cx={x - 0.5} cy={y - 0.5} r={2.4} fill="rgb(255 255 255 / 0.9)" />
          <circle cx={x} cy={y} r={2} fill="var(--inv-paper)" />
        </g>
      ))}
    </svg>
  );
}
