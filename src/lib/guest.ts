/**
 * Bersihkan nama tamu dari parameter ?to= (link personal WhatsApp).
 * Maksimal 80 karakter, dipotong di batas kata; karakter kontrol dibuang.
 */
export function sanitizeGuestName(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const clean = value
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return null;
  if (clean.length <= 80) return clean;
  return `${clean.slice(0, 80).replace(/\s+\S*$/, "")}…`;
}
