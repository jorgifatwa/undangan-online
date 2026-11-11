import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { sanitizeGuestName } from "@/lib/guest";
import { dummyFor, DUMMY_WISHES } from "@/themes/_shared/dummy";
import { THEME_COMPONENTS } from "@/themes/components.generated";
import { getManifest } from "@/themes/registry";

import { PreviewToolbar } from "./PreviewToolbar";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ themeId: string }>;
}): Promise<Metadata> {
  const { themeId } = await params;
  const m = getManifest(themeId);
  return { title: m ? `Preview ${m.name}` : "Tema tidak ditemukan", robots: { index: false } };
}

/**
 * Preview tema dengan data dummy.
 * Query: ?variant=<id> &acara=wedding|ultah &to=<nama tamu> &lite=1 &open=1 &k=<remount>
 */
export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ themeId: string }>;
  searchParams: SearchParams;
}) {
  const { themeId } = await params;
  const sp = await searchParams;
  const manifest = getManifest(themeId);
  const Theme = THEME_COMPONENTS[themeId];
  if (!manifest || !Theme) notFound();

  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]);
  const wanted =
    one("acara") === "ultah" ? "BIRTHDAY" : one("acara") === "wedding" ? "WEDDING" : null;
  const eventType =
    wanted && manifest.eventTypes.includes(wanted) ? wanted : manifest.eventTypes[0];
  const variantId = manifest.variants.some((v) => v.id === one("variant"))
    ? one("variant")
    : manifest.variants[0].id;

  return (
    <>
      <Theme
        key={`${eventType}-${one("k") ?? ""}`}
        invitation={dummyFor(eventType, manifest.defaultMusic)}
        variantId={variantId}
        features={null}
        watermark={false}
        guestName={sanitizeGuestName(sp.to)}
        forceLite={one("lite") === "1"}
        startOpened={one("open") === "1"}
        wishes={DUMMY_WISHES[eventType]}
        preview
      />
      <PreviewToolbar
        themeName={manifest.name}
        variants={manifest.variants.map((v) => ({ id: v.id, name: v.name, swatch: [...v.swatch] }))}
        eventTypes={[...manifest.eventTypes]}
        current={{
          variantId: variantId!,
          eventType,
          guest: sanitizeGuestName(sp.to) ?? "",
          lite: one("lite") === "1",
        }}
      />
    </>
  );
}
