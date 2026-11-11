/**
 * Ornamen khusus Confetti Party (SVG orisinal). Warna dari token --inv-*.
 */

export function Balloon({
  color,
  className,
  style,
}: {
  color: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 60 140" className={className} style={style} aria-hidden>
      {/* tali */}
      <path
        d="M30 78 C 24 92, 36 104, 28 118 S 32 134, 30 140"
        fill="none"
        stroke="currentColor"
        strokeOpacity=".45"
        strokeWidth="1.2"
      />
      {/* badan balon */}
      <path
        d="M30 2 C 12 2, 2 18, 2 34 C 2 54, 20 70, 28 74 L 30 76 L 32 74 C 40 70, 58 54, 58 34 C 58 18, 48 2, 30 2 Z"
        fill={color}
      />
      {/* ikatan */}
      <path d="M26 78 L 30 74 L 34 78 Z" fill={color} />
      {/* kilau */}
      <ellipse
        cx="19"
        cy="22"
        rx="5"
        ry="9"
        fill="#fff"
        opacity=".45"
        transform="rotate(-20 19 22)"
      />
    </svg>
  );
}

/** Untaian bendera segitiga (bunting) selebar kontainer. */
export function Bunting({ className, colors }: { className?: string; colors: string[] }) {
  const flags = 9;
  return (
    <svg viewBox="0 0 440 70" preserveAspectRatio="none" className={className} aria-hidden>
      <path
        d="M0 6 Q 220 46 440 6"
        fill="none"
        stroke="currentColor"
        strokeOpacity=".5"
        strokeWidth="1.5"
      />
      {Array.from({ length: flags }, (_, i) => {
        const t = (i + 0.5) / flags;
        const x = t * 440;
        // posisi y pada kurva kuadratik
        const y = (1 - t) * (1 - t) * 6 + 2 * (1 - t) * t * 46 + t * t * 6;
        return (
          <path
            key={i}
            d={`M${x - 16} ${y - 3} L${x + 16} ${y - 3} L${x} ${y + 26} Z`}
            fill={colors[i % colors.length]}
          />
        );
      })}
    </svg>
  );
}

/** Bintang kecil berkilau. */
export function Twinkle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden>
      <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="currentColor" />
    </svg>
  );
}
