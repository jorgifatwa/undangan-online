/**
 * Pengganti foto yang belum diunggah: monogram inisial di atas gradasi warna
 * tema, mengisi wadahnya (absolute inset-0). Dipakai tema di bingkai foto
 * (cover, potret mempelai, polaroid) agar undangan dengan data minim tetap
 * tampak disengaja — bukan kotak kosong.
 */
export function MonogramFill({
  text,
  background,
  color,
  fontFamily,
  scale = 1,
  ring,
}: {
  /** Mis. "S&R" atau "S". */
  text: string;
  background: string;
  color: string;
  fontFamily: string;
  /** Pengali ukuran huruf terhadap wadah. */
  scale?: number;
  /** Warna garis lingkar tipis (opsional). */
  ring?: string;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background,
        containerType: "size",
      }}
    >
      {ring && (
        <span
          style={{
            position: "absolute",
            inset: "9%",
            borderRadius: "50%",
            border: `1px solid ${ring}`,
            opacity: 0.55,
          }}
        />
      )}
      <span
        style={{
          fontFamily,
          color,
          fontSize: `min(${34 * scale}cqw, ${26 * scale}cqh)`,
          lineHeight: 1,
          whiteSpace: "nowrap",
          letterSpacing: "0.02em",
          textShadow: "0 2px 12px rgb(0 0 0 / .25)",
        }}
      >
        {text}
      </span>
    </div>
  );
}

/** "Sekar" + "Raka" → "S&R"; satu nama → "S". */
export function initials(...names: (string | undefined)[]): string {
  return names
    .filter(Boolean)
    .map((n) => n!.trim().charAt(0).toUpperCase())
    .join("&");
}
