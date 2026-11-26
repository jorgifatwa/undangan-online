"use client";

import { useCallback, useEffect, useState } from "react";

import { Editor, type EditorProps } from "@/app/(dashboard)/dashboard/undangan/[id]/edit/Editor";

import { sendVisit } from "@/components/analytics/VisitBeacon";

import { CheckoutStep } from "./CheckoutStep";
import { readOrderDraft, writeOrderDraft, type OrderDraft } from "./order-storage";

/**
 * Form pemesanan website = editor bertahap (mode local). Isian disimpan di
 * localStorage (per jenis acara) setiap berubah & pindah langkah; tidak ada
 * yang dikirim ke server sampai pemesan menekan "Pesan & bayar".
 */
export function OrderEditor({
  props,
  paymentReady,
  simulation,
}: {
  props: EditorProps;
  paymentReady: boolean;
  simulation: boolean;
}) {
  const [draft, setDraft] = useState<OrderDraft | null | undefined>(undefined);
  useEffect(() => {
    setDraft(readOrderDraft(props.eventType));
    sendVisit("pesan_mulai");
  }, [props.eventType]);

  const persist = useCallback(
    async (p: { data: unknown; themeId: string; colorVariant: string | null }) => {
      const savedAt = Date.now();
      const prev = readOrderDraft(props.eventType);
      writeOrderDraft(props.eventType, {
        v: 1,
        themeId: p.themeId,
        variantId: p.colorVariant,
        data: p.data as Record<string, unknown>,
        step: prev?.step ?? 0,
        savedAt,
      });
      return { ok: true as const, updatedAt: new Date(savedAt).toISOString() };
    },
    [props.eventType],
  );

  if (draft === undefined)
    return (
      <div className="text-muted-foreground grid h-dvh place-items-center text-sm">Memuat…</div>
    );

  // Draf tersimpan di browser → lanjutkan (tema dari draf, kecuali tema dipilih
  // dari halaman coba tema berbeda: tema pilihan terbaru yang dipakai).
  const sameTheme = !draft || draft.themeId === props.themeId;
  const start: EditorProps = draft
    ? {
        ...props,
        data: draft.data,
        themeId: props.themeId,
        variantId: sameTheme ? draft.variantId : props.variantId,
        updatedAt: new Date(draft.savedAt).toISOString(),
      }
    : props;

  return (
    <Editor
      {...start}
      mode="local"
      backHref={`/preview/${props.themeId}`}
      previewBase={`/pesan/${props.themeId}/pratinjau${props.eventType === "BIRTHDAY" ? "?acara=ultah" : ""}`}
      persist={persist}
      uploadsDisabled="Foto & musik sendiri diunggah setelah pembayaran, lewat link khusus yang kami kirim ke email Anda."
      steps={{
        initial: draft?.step ?? 0,
        onStep: (n) => {
          const d = readOrderDraft(props.eventType);
          if (d) writeOrderDraft(props.eventType, { ...d, step: n });
        },
      }}
      finalStepTitle="Pesan & bayar"
      finalStep={({ flushSave }) => (
        <CheckoutStep
          eventType={props.eventType}
          defaultThemeId={props.themeId}
          themes={props.themes}
          flushSave={flushSave}
          paymentReady={paymentReady}
          simulation={simulation}
        />
      )}
    />
  );
}
