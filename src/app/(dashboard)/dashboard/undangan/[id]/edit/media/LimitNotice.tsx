/**
 * Pesan batas (galeri penuh, lagu maksimal, ruang penyimpanan penuh). Hanya
 * menjelaskan & menyarankan menghapus yang tidak dipakai — tanpa tawaran upgrade.
 */
export function LimitNotice({ message, hint }: { message: string; hint?: string }) {
  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
      role="alert"
    >
      <p>{message}</p>
      {hint && <p className="mt-1 text-xs">{hint}</p>}
    </div>
  );
}
