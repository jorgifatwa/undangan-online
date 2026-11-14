"use client";

import { useEffect, useState } from "react";

import { parseMessage, toPreviewSchema, type FromPreview } from "@/lib/editor/protocol";
import type { AnyInvitationData } from "@/schemas";
import { THEME_COMPONENTS } from "@/themes/components.generated";

/**
 * Demo interaktif landing page (iframe /preview/{tema}?demo=1). Merender
 * komponen tema ASLI dengan data contoh, lalu hanya menerima NAMA dari
 * halaman induk (origin sama, sumber window.parent, bentuk divalidasi Zod).
 * Nama kosong → nama contoh tetap.
 */
const clean = (v: string) =>
  v
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);

function withNames(inv: AnyInvitationData, primary: string, secondary: string): AnyInvitationData {
  const a = clean(primary);
  const b = clean(secondary);
  if (inv.eventType === "BIRTHDAY") {
    if (!a) return inv;
    const celebrant = { ...inv.data.celebrant, name: a, nickname: a };
    return { ...inv, data: { ...inv.data, celebrant } };
  }
  // nama pertama = mempelai yang tampil lebih dulu (urutan data contoh)
  const firstKey = inv.data.order === "groom-first" ? "groom" : "bride";
  const secondKey = firstKey === "bride" ? "groom" : "bride";
  const data = { ...inv.data };
  if (a) data[firstKey] = { ...data[firstKey], fullName: a, nickname: a };
  if (b) data[secondKey] = { ...data[secondKey], fullName: b, nickname: b };
  return { ...inv, data };
}

export function DemoPreview({
  themeId,
  variantId,
  invitation,
}: {
  themeId: string;
  variantId: string;
  invitation: AnyInvitationData;
}) {
  const [names, setNames] = useState({ primary: "", secondary: "" });

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const msg = parseMessage(toPreviewSchema, event, window.parent);
      if (msg?.type === "names") setNames({ primary: msg.primary, secondary: msg.secondary });
    };
    window.addEventListener("message", onMessage);
    if (window.parent !== window) {
      const ready: FromPreview = { ns: "undangku", type: "ready" };
      window.parent.postMessage(ready, window.location.origin);
    }
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const Theme = THEME_COMPONENTS[themeId];
  if (!Theme) return null;
  return (
    <Theme
      invitation={withNames(invitation, names.primary, names.secondary)}
      variantId={variantId}
      features={null}
      watermark={false}
      guestName="Tamu Undangan"
      wishes={[]}
      preview
    />
  );
}
