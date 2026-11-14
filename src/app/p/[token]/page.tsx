import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { sanitizeGuestName } from "@/lib/guest";
import { resolvePreviewToken } from "@/lib/invitations/preview-link";
import { SHARE_PREVIEW_ENTITLEMENTS } from "@/lib/pricing";
import { siteConfig } from "@/lib/site";
import { parseInvitationData } from "@/schemas";
import type { AnyInvitationData } from "@/schemas/sections";
import { THEME_COMPONENTS } from "@/themes/components.generated";
import { getManifest } from "@/themes/registry";

import { PreviewWatermark } from "./PreviewWatermark";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ to?: string | string[] }>;
};

/** Selalu data draf terbaru; tidak pernah di-cache. */
export const dynamic = "force-dynamic";

/** Metadata umum TANPA nama/tanggal: link bisa diteruskan ke mana saja. */
export const metadata: Metadata = {
  title: { absolute: `Pratinjau undangan · ${siteConfig.name}` },
  description: "Pratinjau undangan yang belum diterbitkan.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  referrer: "no-referrer",
  openGraph: {
    title: `Pratinjau undangan · ${siteConfig.name}`,
    description: "Pratinjau undangan yang belum diterbitkan.",
    siteName: siteConfig.name,
    locale: "id_ID",
    type: "website",
  },
};

/**
 * LINK PRATINJAU RAHASIA (lib/invitations/preview-link.ts): tanpa login,
 * bertanda PRATINJAU permanen, RSVP/ucapan/amplop dinonaktifkan di server
 * (SHARE_PREVIEW_ENTITLEMENTS + tanpa guestbook → tidak ada yang terkirim).
 * Token salah / kedaluwarsa / dicabut / undangan ditangguhkan → 404.
 */
export default async function PreviewLinkPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { to } = await searchParams;
  const inv = await resolvePreviewToken(token);
  if (!inv) notFound();
  const manifest = getManifest(inv.themeId);
  const Theme = THEME_COMPONENTS[inv.themeId];
  const parsed = parseInvitationData(inv.eventType, inv.data);
  if (!manifest || !Theme || !parsed.ok) notFound();

  // Data amplop/hadiah (rekening, QRIS, alamat) & wishlist TIDAK dikirim ke
  // browser sama sekali — menyembunyikan section saja tidak cukup karena data
  // undangan ikut terserialisasi ke komponen client.
  const invitation = {
    ...parsed.value,
    data: {
      ...parsed.value.data,
      gift: undefined,
      ...(parsed.value.eventType === "BIRTHDAY" ? { wishlist: [] } : {}),
    },
  } as AnyInvitationData;

  return (
    <>
      <Theme
        invitation={invitation}
        variantId={inv.colorVariant ?? undefined}
        features={SHARE_PREVIEW_ENTITLEMENTS}
        guestName={sanitizeGuestName(to)}
        preview
      />
      <PreviewWatermark />
    </>
  );
}
