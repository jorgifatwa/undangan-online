/**
 * Peristiwa yang dihitung penghitung pengunjung (aman untuk klien).
 * Urutan = urutan corong konversi.
 */
export const VISIT_KEYS = {
  landing: "Membuka beranda",
  tema: "Membuka galeri tema",
  preview: "Mencoba tema",
  pesan_mulai: "Mulai mengisi pesanan",
  pesan_bayar: "Menuju pembayaran",
} as const;
export type VisitKey = keyof typeof VISIT_KEYS;
export const isVisitKey = (k: unknown): k is VisitKey =>
  typeof k === "string" && Object.hasOwn(VISIT_KEYS, k);
