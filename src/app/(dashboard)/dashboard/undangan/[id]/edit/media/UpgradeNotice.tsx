import Link from "next/link";

/** Pesan batas paket + tawaran upgrade (bukan sekadar menolak). */
export function UpgradeNotice({ message, compact }: { message: string; compact?: boolean }) {
  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
      role="alert"
    >
      <p>{message}</p>
      {!compact && (
        <p className="mt-1 text-xs">
          Paket berbayar membuka galeri tanpa batas, kuota penyimpanan lebih besar, dan unggah musik
          sendiri.
        </p>
      )}
      <Link
        href="/harga"
        target="_blank"
        className="mt-2 inline-block font-semibold text-amber-900 underline"
      >
        Lihat paket & tingkatkan →
      </Link>
    </div>
  );
}
