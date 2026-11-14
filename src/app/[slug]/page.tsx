import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { auth } from "@/auth";

import { db } from "@/lib/db";
import { sanitizeGuestName } from "@/lib/guest";
import { guestbookStats } from "@/lib/guestbook/service";
import { getPublicInvitation } from "@/lib/invitations/public";
import { metaDescription, metaTitle, shareInfo } from "@/lib/invitations/share";
import { getFeatures } from "@/lib/packages";
import { invitationUrl, siteConfig } from "@/lib/site";
import { parseInvitationData } from "@/schemas";
import { THEME_COMPONENTS } from "@/themes/components.generated";
import { getManifest } from "@/themes/registry";

import { Expired } from "./Expired";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string | string[]; lite?: string }>;
};

/** Berisi data pribadi → jangan diindeks mesin pencari (juga header X-Robots-Tag di middleware). */
const ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false },
};

/**
 * Pratinjau link (WhatsApp dll.): judul, deskripsi, gambar /og. Undangan
 * kedaluwarsa → metadata umum tanpa nama/tanggal.
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const inv = await getPublicInvitation(slug);
  const parsed = inv?.active ? parseInvitationData(inv.eventType, inv.data) : null;
  if (!inv || !parsed?.ok)
    return { title: { absolute: `Undangan · ${siteConfig.name}` }, robots: ROBOTS };

  const info = shareInfo(parsed.value);
  const guest = sanitizeGuestName((await searchParams).to);
  const title = metaTitle(info);
  const description = metaDescription(info, guest);
  const url = invitationUrl(slug);
  const image = {
    url: `${url}/og?v=${inv.updatedAt.getTime().toString(36)}`,
    width: 1200,
    height: 630,
    alt: title,
    type: "image/jpeg",
  };
  return {
    title: { absolute: title },
    description,
    robots: ROBOTS,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: siteConfig.name,
      url,
      title,
      description,
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

/** Selalu dirender dari database: perubahan setelah terbit langsung tampil. */
export const dynamic = "force-dynamic";

/**
 * Halaman undangan publik: domain/{slug} (tautan lama /u/{slug} → 301 ke sini).
 * Rute website statis (harga, tema, …) selalu didahulukan Next.js; slug
 * dicadangkan & format tidak valid langsung 404 tanpa query database.
 * Draf → 404. Masa aktif habis → halaman "tidak aktif" tanpa data pribadi.
 * Pembatasan fitur paket diterapkan DI SERVER lewat `features`.
 */
export default async function InvitationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { to, lite } = await searchParams;

  const invitation = await getPublicInvitation(slug);
  if (!invitation) notFound();
  if (!invitation.active) {
    const session = await auth();
    return <Expired owner={session?.user?.id === invitation.userId} invitationId={invitation.id} />;
  }

  const manifest = getManifest(invitation.themeId);
  const Theme = THEME_COMPONENTS[invitation.themeId];
  const parsed = parseInvitationData(invitation.eventType, invitation.data);
  if (!manifest || !Theme || !parsed.ok) notFound();

  const features = getFeatures(invitation.package);
  const [wishes, stats] = await Promise.all([
    features.wishes
      ? db.wish.findMany({
          where: { invitationId: invitation.id, isHidden: false },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, name: true, message: true, attendance: true, createdAt: true },
        })
      : [],
    guestbookStats(invitation.id),
  ]);

  return (
    <Theme
      invitation={parsed.value}
      variantId={invitation.colorVariant ?? undefined}
      features={features}
      watermark={features.watermark}
      guestName={sanitizeGuestName(to)}
      forceLite={lite === "1"}
      wishes={wishes.map((w) => ({
        ...w,
        attendance: w.attendance ?? undefined,
        createdAt: w.createdAt.toISOString(),
      }))}
      guestbook={{ slug, stats }}
    />
  );
}
