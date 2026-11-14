import Link from "next/link";

import { siteConfig } from "@/lib/site";

/**
 * Undangan kedaluwarsa (masa uji Gratis habis). TIDAK menampilkan data
 * pribadi undangan. Pemilik yang sedang login mendapat tombol upgrade.
 */
export function Expired({ owner, invitationId }: { owner: boolean; invitationId: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f6f1ea] px-6 py-16 font-sans text-[#2b2420]">
      <div className="max-w-sm text-center">
        <p className="text-4xl" aria-hidden>
          ✉️
        </p>
        <h1 className="mt-4 font-serif text-2xl">Undangan sudah tidak aktif</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6f625a]">
          Terima kasih sudah berkunjung. Undangan ini sudah tidak bisa dibuka. Bila Anda tamu,
          silakan hubungi pengirim undangan.
        </p>
        {owner && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-950">
            <p className="font-semibold">Ini undangan Anda</p>
            <p className="mt-1">
              Masa uji paket Gratis (3 hari sejak terbit pertama) sudah berakhir. Tingkatkan paket
              agar tamu bisa membuka undangan ini lagi — semua isi tetap tersimpan.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/harga" className="rounded-md bg-[#8a4b3b] px-3 py-1.5 text-white">
                Lihat paket & tingkatkan
              </Link>
              <Link
                href={`/dashboard/undangan/${invitationId}/edit`}
                className="rounded-md border border-amber-300 px-3 py-1.5"
              >
                Buka editor
              </Link>
            </div>
          </div>
        )}
        <Link
          href="/"
          className="mt-10 inline-block text-xs tracking-[0.2em] text-[#6f625a] uppercase"
        >
          {siteConfig.name}
        </Link>
      </div>
    </main>
  );
}
