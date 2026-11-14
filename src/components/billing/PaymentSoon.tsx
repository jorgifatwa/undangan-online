import { business, waLink } from "@/config/business";

/**
 * Pembayaran online belum tersedia (Midtrans: Tahap 5). Satu tempat untuk
 * kalimatnya; tautan WhatsApp hanya bila nomornya sudah diisi.
 */
export function PaymentSoon({ what }: { what: string }) {
  const wa = waLink(`Halo ${business.name}, saya ingin ${what}.`);
  return (
    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950" role="status">
      Pembayaran online segera hadir.
      {wa && (
        <>
          {" "}
          Sementara itu,{" "}
          <a href={wa} target="_blank" rel="noopener" className="font-semibold underline">
            hubungi kami lewat WhatsApp
          </a>
          .
        </>
      )}
    </p>
  );
}
