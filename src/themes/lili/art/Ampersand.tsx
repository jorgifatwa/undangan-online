/**
 * "&" kaligrafi monoline dengan ayunan panjang (digambar ulang dari desain):
 * ayunan kiri melengkung ke atas, badan "&" bergaya "Et", ekor panjang ke
 * kanan. Garis tipis bertekanan (dua lapis lebar berbeda). viewBox 220 × 130.
 */
const PATH =
  "M16 40 C4 28 14 10 40 12 C68 14 96 26 114 34 C124 38 130 32 126 25 C122 18 110 19 106 27 C100 38 110 46 118 48 C96 48 76 60 76 80 C76 100 92 112 110 110 C130 108 146 94 156 78 C162 68 172 66 178 72 C184 80 176 88 166 88 C186 90 206 80 214 64";

export function Ampersand({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 220 130"
      preserveAspectRatio="none"
      className={className}
      style={style}
      aria-hidden
    >
      <path
        pathLength={1}
        d={PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* tebal-tipis: lapis kedua hanya di lengkung badan */}
      <path
        pathLength={1}
        d="M118 48 C96 48 76 60 76 80 C76 100 92 112 110 110"
        fill="none"
        stroke="currentColor"
        strokeWidth={5.2}
        strokeLinecap="round"
      />
    </svg>
  );
}
