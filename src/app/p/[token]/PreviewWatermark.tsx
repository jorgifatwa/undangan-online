/**
 * Tanda PRATINJAU di atas seluruh halaman (server component, tanpa JS):
 * pita atas + teks diagonal berulang. z-index maksimum & pointer-events none →
 * tetap terlihat di atas cover/animasi tema tapi tidak menghalangi interaksi.
 * Gaya inline (bukan kelas) agar CSS tema tidak bisa menimpanya.
 */
const TEXT = "PRATINJAU — belum diterbitkan";

const tile = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240">` +
    `<text x="180" y="120" text-anchor="middle" dominant-baseline="middle" ` +
    `transform="rotate(-28 180 120)" font-family="system-ui,sans-serif" font-size="22" ` +
    `font-weight="700" letter-spacing="2" fill="rgba(190,20,20,0.20)" ` +
    `stroke="rgba(255,255,255,0.35)" stroke-width="0.6">${TEXT}</text></svg>`,
);

export function PreviewWatermark() {
  return (
    <div
      data-preview-watermark=""
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        pointerEvents: "none",
        display: "block",
        visibility: "visible",
        opacity: 1,
        backgroundImage: `url("data:image/svg+xml,${tile}")`,
        backgroundRepeat: "repeat",
      }}
    >
      <div
        role="note"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "6px 12px",
          background: "rgba(150,16,16,0.92)",
          color: "#fff",
          font: "600 13px/1.3 system-ui, sans-serif",
          letterSpacing: "0.04em",
          textAlign: "center",
        }}
      >
        {TEXT} · RSVP, ucapan & amplop tidak aktif
      </div>
    </div>
  );
}
