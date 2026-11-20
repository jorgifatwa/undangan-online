/**
 * Kotak sapuan kuas pink (latar angka hitung mundur): persegi bersudut bulat
 * dengan tepi kasar seperti cat poster + serat sapuan horizontal. Jitter
 * deterministik (tanpa Math.random) agar SSR = klien.
 */
function jitter(i: number, amp: number) {
  const v = Math.sin(i * 12.9898) * 43758.5453;
  return (v - Math.floor(v) - 0.5) * 2 * amp;
}

function roughRect(w: number, h: number, r: number, amp: number) {
  const pts: string[] = [];
  let k = 0;
  const push = (x: number, y: number) => {
    pts.push(`${(x + jitter(k++, amp)).toFixed(1)} ${(y + jitter(k++, amp)).toFixed(1)}`);
  };
  const step = 7;
  for (let x = r; x <= w - r; x += step) push(x, 0);
  for (let a = -90; a <= 0; a += 30)
    push(w - r + Math.cos((a * Math.PI) / 180) * r, r + Math.sin((a * Math.PI) / 180) * r);
  for (let y = r; y <= h - r; y += step) push(w, y);
  for (let a = 0; a <= 90; a += 30)
    push(w - r + Math.cos((a * Math.PI) / 180) * r, h - r + Math.sin((a * Math.PI) / 180) * r);
  for (let x = w - r; x >= r; x -= step) push(x, h);
  for (let a = 90; a <= 180; a += 30)
    push(r + Math.cos((a * Math.PI) / 180) * r, h - r + Math.sin((a * Math.PI) / 180) * r);
  for (let y = h - r; y >= r; y -= step) push(0, y);
  for (let a = 180; a <= 270; a += 30)
    push(r + Math.cos((a * Math.PI) / 180) * r, r + Math.sin((a * Math.PI) / 180) * r);
  return `M${pts.join(" L")}Z`;
}

const W = 335;
const H = 47;
const BODY = roughRect(W, H, 7, 0.9);

export function BrushBox({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className}
      style={style}
      aria-hidden
    >
      <path d={BODY} fill="var(--inv-pink, #f8c1d6)" />
      {/* serat sapuan */}
      {Array.from({ length: 9 }, (_, i) => (
        <path
          key={i}
          d={`M${(6 + jitter(i + 50, 5)).toFixed(1)} ${(5 + i * 4.6).toFixed(1)} H${(W - 8 + jitter(i + 80, 6)).toFixed(1)}`}
          stroke={i % 2 ? "#fff" : "#e6a2bb"}
          strokeWidth={0.8}
          opacity={i % 2 ? 0.16 : 0.18}
        />
      ))}
    </svg>
  );
}
