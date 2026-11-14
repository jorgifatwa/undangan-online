/**
 * Posisi topi pesta (persen relatif foto) dari kepala hasil deteksi wajah:
 * x/y = puncak kepala, w = lebar wajah, r = kemiringan kepala. Dipakai tema
 * (halaman tamu, hanya membaca data) DAN editor (tombol atur topi).
 */
export function hatFromFace(f: { x: number; y: number; w: number; r: number }) {
  const rad = (f.r * Math.PI) / 180;
  // sedikit ke kanan & miring ceria seperti desain; ikut kemiringan kepala
  return {
    x: f.x + Math.cos(rad) * f.w * 0.12,
    y: f.y + f.w * 0.06,
    w: f.w * 0.92,
    r: f.r + 14,
  };
}
