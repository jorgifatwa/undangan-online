import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { sanitizeGuestName } from "@/lib/guest";
import { buildInitialData } from "@/lib/invitations/initial-data";
import { getQuotePreset } from "@/lib/quotes";
import type { AnyInvitationData } from "@/schemas/sections";
import { dummyFor, DUMMY_WISHES } from "@/themes/_shared/dummy";
import { THEME_COMPONENTS } from "@/themes/components.generated";
import { getManifest } from "@/themes/registry";

import { PreviewFocus } from "./PreviewFocus";
import { PreviewToolbar } from "./PreviewToolbar";

/** ?quote=<id>: ganti kutipan data contoh dengan kutipan siap pakai. */
function withQuote(inv: AnyInvitationData, id: string | undefined): AnyInvitationData {
  const q = id ? getQuotePreset(id) : undefined;
  if (!q) return inv;
  return {
    ...inv,
    data: {
      ...inv.data,
      quote: { arabic: q.arabic, translation: q.translation, source: q.source },
    },
  } as AnyInvitationData;
}

/** ?minimal=1: data persis seperti hasil wizard (nama, tanggal, kota — tanpa foto). */
function minimalData(
  eventType: "WEDDING" | "BIRTHDAY",
  salam: string | undefined,
): AnyInvitationData {
  const date = new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 10);
  return eventType === "WEDDING"
    ? buildInitialData({
        eventType,
        brideName: "Sekar Ayu Larasati",
        brideNickname: "Sekar",
        groomName: "Raka Aditya Pradipta",
        groomNickname: "Raka",
        date,
        timezone: "WIB",
        city: "Bandung",
        greeting: salam === "umum" ? "umum" : "islami",
        quoteId: salam === "umum" ? undefined : "ar-rum-21",
        themeId: "",
      })
    : buildInitialData({
        eventType,
        name: "Kirana Putri Maharani",
        nickname: "Kirana",
        age: 7,
        date,
        timezone: "WIB",
        city: "Jakarta",
        themeId: "",
      });
}

/** Data contoh tanpa love story, dress code & live streaming (tidak ada di desain referensi). */
function referenceLike(inv: AnyInvitationData): AnyInvitationData {
  if (inv.eventType !== "WEDDING") return inv;
  return {
    ...inv,
    data: { ...inv.data, loveStory: [], dressCode: undefined, liveStream: undefined },
  };
}

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
 *        &bare=1 (tanpa toolbar: thumbnail & /preview/banding) &focus=<sectionId>
 *        &minimal=1 [&salam=umum] (data minim seperti hasil wizard)
 *        &quote=<id kutipan siap pakai> (uji tampilan & font kutipan)
 *        &ref=1 (tanpa section yang tidak ada di desain referensi → urutan sama dengan desain)
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
        invitation={withQuote(
          one("minimal") === "1"
            ? minimalData(eventType, one("salam"))
            : one("ref") === "1"
              ? referenceLike(dummyFor(eventType, manifest.defaultMusic))
              : dummyFor(eventType, manifest.defaultMusic),
          one("quote"),
        )}
        variantId={variantId}
        features={null}
        watermark={false}
        guestName={sanitizeGuestName(sp.to)}
        forceLite={one("lite") === "1"}
        startOpened={one("open") === "1"}
        wishes={DUMMY_WISHES[eventType]}
        preview
      />
      {one("focus") && <PreviewFocus section={one("focus")!} />}
      {one("bare") !== "1" && (
        <PreviewToolbar
          themeName={manifest.name}
          variants={manifest.variants.map((v) => ({
            id: v.id,
            name: v.name,
            swatch: [...v.swatch],
          }))}
          eventTypes={[...manifest.eventTypes]}
          current={{
            variantId: variantId!,
            eventType,
            guest: sanitizeGuestName(sp.to) ?? "",
            lite: one("lite") === "1",
          }}
        />
      )}
    </>
  );
}
