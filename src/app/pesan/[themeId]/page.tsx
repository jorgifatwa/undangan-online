import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { EditorProps } from "@/app/(dashboard)/dashboard/undangan/[id]/edit/Editor";
import { placeholderData } from "@/lib/claims/service";
import { db } from "@/lib/db";
import { midtransConfigured } from "@/lib/midtrans";
import { PREVIEW_ENTITLEMENTS } from "@/lib/pricing";
import { simulationAllowed } from "@/lib/web-orders/service";
import { getManifest, THEME_MANIFESTS } from "@/themes/registry";

import { OrderEditor } from "./OrderEditor";

export const metadata: Metadata = {
  title: "Pesan undangan",
  robots: { index: false, follow: false },
};

/**
 * PEMESANAN WEBSITE: form bertahap + pratinjau, isian HANYA disimpan di browser
 * (localStorage) sampai pembayaran lunas. Langkah terakhir: data pemesan → bayar.
 */
export default async function PesanPage({
  params,
  searchParams,
}: {
  params: Promise<{ themeId: string }>;
  searchParams: Promise<{ acara?: string; variant?: string }>;
}) {
  const { themeId } = await params;
  const { acara, variant } = await searchParams;
  const manifest = getManifest(themeId);
  if (!manifest) notFound();
  const eventType =
    acara === "ultah" && manifest.eventTypes.includes("BIRTHDAY")
      ? "BIRTHDAY"
      : manifest.eventTypes.includes("WEDDING")
        ? "WEDDING"
        : "BIRTHDAY";
  const library = await db.musicTrack.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, title: true, artist: true, url: true, category: true },
  });
  const initial = placeholderData(eventType, manifest.id, "Nama Anak");
  const props: EditorProps = {
    id: `pesan-${eventType.toLowerCase()}`,
    slug: "",
    status: "DRAFT",
    suspended: null,
    publishedAt: null,
    previewLinkExpiresAt: null,
    eventType,
    purchase: { purchased: false, themeCredit: 0, ownedThemeIds: [] },
    entitlements: PREVIEW_ENTITLEMENTS,
    themeId: manifest.id,
    variantId:
      manifest.variants.find((v) => v.id === variant)?.id ?? manifest.variants[0]?.id ?? null,
    updatedAt: new Date(0).toISOString(),
    data: initial.data as unknown as Record<string, unknown>,
    title: "Pesan undangan",
    shareTemplate: null,
    themes: THEME_MANIFESTS.filter((m) => m.eventTypes.includes(eventType)),
    library,
    uploadedAudio: [],
  };
  return (
    <OrderEditor
      props={props}
      paymentReady={midtransConfigured() || simulationAllowed()}
      simulation={simulationAllowed()}
    />
  );
}
