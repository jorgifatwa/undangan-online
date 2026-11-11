"use client";

import Image from "next/image";

import { useCopy, whatsappLink } from "../hooks";
import { Reveal } from "../motion/Reveal";
import { useInvitation } from "../runtime/context";
import { SectionShell } from "../runtime/SectionShell";
import { Icon, SectionTitle } from "./ui";

/** Amplop digital: rekening, QRIS, kado fisik, kontak konfirmasi, wishlist ulang tahun. */
export function DefaultAmplop() {
  const { inv } = useInvitation();
  const copy = useCopy();
  const gift = inv.data.gift;
  const wishlist = inv.eventType === "BIRTHDAY" ? inv.data.wishlist : [];
  const intro =
    gift?.intro ??
    "Doa restu dan kehadiran Anda adalah hadiah terindah bagi kami. Namun, jika memberi adalah ungkapan tanda kasih, Anda dapat memberi melalui:";

  return (
    <SectionShell
      id="amplop"
      className="px-7 py-20 text-center"
      style={{ background: "var(--inv-bg-alt)" }}
    >
      <SectionTitle
        kicker="Tanda Kasih"
        title={inv.eventType === "WEDDING" ? "Wedding Gift" : "Kado"}
      />
      <Reveal
        variant="fade"
        as="p"
        className="mx-auto mb-8 max-w-sm text-sm leading-relaxed opacity-90"
      >
        {intro}
      </Reveal>

      <div className="flex flex-col gap-4">
        {gift?.accounts.map((a, i) => (
          <Reveal key={a.number + i} variant="flip" className="inv-card px-6 py-6">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase opacity-70">{a.bank}</p>
            <p className="mt-2 text-2xl font-bold tracking-wider tabular-nums">{a.number}</p>
            <p className="mt-1 text-sm opacity-80">a.n. {a.holder}</p>
            <button
              type="button"
              onClick={() => copy(a.number.replace(/\s/g, ""), "Nomor rekening disalin")}
              className="inv-btn mt-4 min-h-10 px-4 text-xs"
            >
              <Icon name="copy" /> Salin
            </button>
          </Reveal>
        ))}

        {gift?.qris && (
          <Reveal variant="zoom" className="inv-card px-6 py-6">
            <p className="mb-3 text-xs font-semibold tracking-[0.2em] uppercase opacity-70">QRIS</p>
            <div className="relative mx-auto aspect-square w-52 overflow-hidden rounded-lg bg-white">
              <Image
                src={gift.qris.url}
                alt="Kode QRIS"
                fill
                sizes="208px"
                className="object-contain"
              />
            </div>
          </Reveal>
        )}

        {gift?.physical && (
          <Reveal variant="rise" className="inv-card px-6 py-6">
            <p className="mb-2 flex items-center justify-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase opacity-70">
              <Icon name="gift" /> Kirim Kado
            </p>
            {gift.physical.recipient && <p className="font-semibold">{gift.physical.recipient}</p>}
            <p className="mt-1 text-sm leading-relaxed whitespace-pre-line opacity-85">
              {gift.physical.address}
            </p>
            {gift.physical.phone && (
              <p className="mt-1 text-sm opacity-85">{gift.physical.phone}</p>
            )}
            <button
              type="button"
              onClick={() => copy(gift.physical!.address, "Alamat disalin")}
              className="inv-btn inv-btn-outline mt-4 min-h-10 px-4 text-xs"
            >
              <Icon name="copy" /> Salin Alamat
            </button>
          </Reveal>
        )}

        {gift && gift.confirmContacts.length > 0 && (
          <Reveal variant="fade" className="text-sm">
            <p className="mb-3 opacity-85">Konfirmasi pengiriman hadiah:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {gift.confirmContacts.map((c) => (
                <a
                  key={c.phone}
                  href={whatsappLink(c.phone)}
                  target="_blank"
                  rel="noopener"
                  className="inv-btn inv-btn-outline min-h-10 px-4 text-xs"
                >
                  <Icon name="wa" /> {c.name}
                </a>
              ))}
            </div>
          </Reveal>
        )}

        {wishlist.length > 0 && (
          <Reveal variant="rise" className="inv-card px-6 py-6 text-left">
            <p className="mb-3 text-center text-xs font-semibold tracking-[0.2em] uppercase opacity-70">
              Wishlist
            </p>
            <ul className="flex flex-col gap-2.5">
              {wishlist.map((w) => (
                <li key={w.name} className="flex items-start gap-3 text-sm">
                  <span aria-hidden>🎁</span>
                  <span className="flex-1">
                    {w.url ? (
                      <a
                        href={w.url}
                        target="_blank"
                        rel="noopener"
                        className="font-semibold underline underline-offset-2"
                      >
                        {w.name}
                      </a>
                    ) : (
                      <span className="font-semibold">{w.name}</span>
                    )}
                    {w.note && <span className="block opacity-75">{w.note}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>
    </SectionShell>
  );
}
