import Link from "next/link";

import { business, waLink } from "@/config/business";

/**
 * Pemberitahuan undangan DITANGGUHKAN (oleh admin) untuk pemilik — dashboard &
 * editor. Tamu tidak melihat ini: bagi mereka undangan dianggap tidak ada (404).
 */
export function SuspendedNotice({
  reason,
  slug,
  compact = false,
}: {
  reason: string | null;
  slug: string;
  compact?: boolean;
}) {
  const wa = waLink(`Halo, saya ingin mengajukan banding penangguhan undangan "${slug}".`);
  return (
    <div
      role="alert"
      data-testid="suspended-notice"
      className={
        compact
          ? "mt-2 rounded-lg bg-red-50 px-2.5 py-2 text-xs text-red-950"
          : "rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-950"
      }
    >
      <p className="font-semibold">Undangan ini ditangguhkan</p>
      <p className="mt-1">
        Undangan tidak bisa dibuka tamu dan tidak bisa diterbitkan ulang.
        {reason ? (
          <>
            {" "}
            Alasan: <span data-testid="suspend-reason">{reason}</span>
          </>
        ) : null}
      </p>
      <p className="mt-1">
        Merasa ini keliru? Ajukan banding lewat{" "}
        {wa ? (
          <a className="font-semibold underline" href={wa} target="_blank" rel="noopener">
            WhatsApp
          </a>
        ) : business.email ? (
          <a className="font-semibold underline" href={`mailto:${business.email}`}>
            {business.email}
          </a>
        ) : (
          <Link className="font-semibold underline" href="/syarat#kontak">
            kontak di halaman Syarat & Ketentuan
          </Link>
        )}{" "}
        dengan menyebutkan alamat undangan <strong>/{slug}</strong>.
      </p>
    </div>
  );
}
