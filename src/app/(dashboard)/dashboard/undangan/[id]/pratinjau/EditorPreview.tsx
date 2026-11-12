"use client";

import { useEffect, useState } from "react";

import { parseMessage, toPreviewSchema, type FromPreview } from "@/lib/editor/protocol";
import type { PackageFeatures } from "@/lib/packages";
import { parseInvitationData, type AnyInvitationData } from "@/schemas";
import { THEME_COMPONENTS } from "@/themes/components.generated";
import { getManifest } from "@/themes/registry";

/**
 * Pratinjau di dalam editor (iframe). Merender komponen tema yang SAMA dengan
 * halaman publik, lalu menerima pembaruan dari editor lewat postMessage:
 *  - hanya dari origin yang sama DAN dari window.parent (bukan frame lain)
 *  - bentuk pesan divalidasi Zod; data undangan divalidasi schema jenis acaranya
 *  - tema yang tidak dikenal / tidak mendukung jenis acara diabaikan
 * Tidak ada reload: state tema (mis. posisi scroll) tetap.
 */
export function EditorPreview({
  initial,
  eventType,
  features,
  watermark,
}: {
  initial: { themeId: string; variantId: string | null; invitation: AnyInvitationData };
  eventType: "WEDDING" | "BIRTHDAY";
  features: PackageFeatures;
  watermark: boolean;
}) {
  const [themeId, setThemeId] = useState(initial.themeId);
  const [variantId, setVariantId] = useState(initial.variantId);
  const [invitation, setInvitation] = useState(initial.invitation);
  const [coverKey, setCoverKey] = useState(0);
  const [showCover, setShowCover] = useState(false);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const msg = parseMessage(toPreviewSchema, event, window.parent);
      if (!msg) return;
      if (msg.type === "update") {
        const manifest = getManifest(msg.themeId);
        if (!manifest || !manifest.eventTypes.includes(eventType) || !THEME_COMPONENTS[msg.themeId])
          return;
        const parsed = parseInvitationData(eventType, msg.data);
        if (!parsed.ok) return;
        setThemeId(msg.themeId);
        setVariantId(msg.variantId);
        setInvitation(parsed.value);
      } else if (msg.type === "focus") {
        const el = document.getElementById(`inv-${msg.section}`);
        if (el)
          window.scrollTo({
            top: el.getBoundingClientRect().top + window.scrollY,
            behavior: "smooth",
          });
      } else if (msg.type === "cover") {
        setShowCover(msg.show);
        setCoverKey((k) => k + 1);
      }
    };
    window.addEventListener("message", onMessage);
    if (window.parent !== window) {
      const ready: FromPreview = { ns: "undangku", type: "ready" };
      window.parent.postMessage(ready, window.location.origin);
    }
    return () => window.removeEventListener("message", onMessage);
  }, [eventType]);

  const Theme = THEME_COMPONENTS[themeId];
  if (!Theme) return null;
  return (
    <Theme
      // ganti tema / tampilkan cover → pasang ulang; pembaruan data tidak memasang ulang
      key={`${themeId}-${coverKey}`}
      invitation={invitation}
      variantId={variantId ?? undefined}
      features={features}
      watermark={watermark}
      guestName={null}
      startOpened={!showCover}
      wishes={[]}
      preview
    />
  );
}
