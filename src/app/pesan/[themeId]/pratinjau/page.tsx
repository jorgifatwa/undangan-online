import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EditorPreview } from "@/app/(dashboard)/dashboard/undangan/[id]/pratinjau/EditorPreview";
import { placeholderData } from "@/lib/claims/service";
import { PREVIEW_ENTITLEMENTS } from "@/lib/pricing";
import { getManifest } from "@/themes/registry";

export const metadata: Metadata = { title: "Pratinjau", robots: { index: false, follow: false } };

/**
 * Pratinjau di iframe form pemesanan website. Tidak membaca data apa pun dari
 * server: isian datang dari halaman induk lewat postMessage (origin sama).
 */
export default async function PesanPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ themeId: string }>;
  searchParams: Promise<{ acara?: string }>;
}) {
  const { themeId } = await params;
  const { acara } = await searchParams;
  const manifest = getManifest(themeId);
  if (!manifest) notFound();
  const eventType =
    acara === "ultah" && manifest.eventTypes.includes("BIRTHDAY")
      ? "BIRTHDAY"
      : manifest.eventTypes.includes("WEDDING")
        ? "WEDDING"
        : "BIRTHDAY";
  const initial = placeholderData(eventType, manifest.id, "Nama Anak");
  return (
    <EditorPreview
      initial={{
        themeId: manifest.id,
        variantId: manifest.variants[0]?.id ?? null,
        invitation: initial,
      }}
      eventType={eventType}
      features={PREVIEW_ENTITLEMENTS}
    />
  );
}
