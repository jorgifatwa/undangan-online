"use client";

import { useFormContext, useWatch } from "react-hook-form";

import {
  QUOTE_GROUP_LABELS,
  QUOTE_PRESETS,
  getQuotePreset,
  matchPreset,
  quoteGroupsFor,
} from "@/lib/quotes";
import { cn } from "@/lib/utils";

import { FieldShell, TextField, inputClass } from "./fields";

/**
 * Ayat / kutipan: pilih dari kutipan siap pakai (src/lib/quotes.ts — teks dari
 * sumber resmi) atau tulis sendiri. Memilih preset mengisi teks Arab,
 * terjemahan, dan sumber; mengubah teksnya menjadikan kutipan "tulis sendiri".
 */
export function QuoteForm({ eventType }: { eventType: "WEDDING" | "BIRTHDAY" }) {
  const { control, setValue } = useFormContext();
  const quote = useWatch({ control, name: "quote" }) as
    { arabic?: string; translation?: string; source?: string } | undefined;
  const preset = matchPreset(quote);
  const greeting = useWatch({ control, name: "greeting.style" }) as string | undefined;
  const nonIslamicWithBasmalah =
    eventType === "WEDDING" && greeting === "islami" && preset && preset.group !== "islami";
  const empty = !quote?.translation && !quote?.arabic;
  const current = preset ? preset.id : empty ? "" : "custom";

  const apply = (id: string) => {
    const opts = { shouldDirty: true, shouldValidate: true } as const;
    if (id === "custom") return;
    const p = id ? getQuotePreset(id) : undefined;
    setValue("quote.arabic", p?.arabic ?? "", opts);
    setValue("quote.translation", p?.translation ?? "", opts);
    setValue("quote.source", p?.source ?? "", opts);
  };

  return (
    <div className="space-y-3">
      <FieldShell
        name="quote.preset"
        label="Pilih kutipan"
        hint="Teks Al-Qur'an: Terjemahan Kemenag RI · Alkitab: Terjemahan Baru LAI."
      >
        <select
          id="f-quote-preset"
          value={current}
          onChange={(e) => apply(e.target.value)}
          className={cn(inputClass, "h-9")}
        >
          <option value="">Tanpa kutipan</option>
          {quoteGroupsFor(eventType).map((g) => (
            <optgroup key={g} label={QUOTE_GROUP_LABELS[g]}>
              {QUOTE_PRESETS.filter((q) => q.group === g).map((q) => (
                <option key={q.id} value={q.id}>
                  {q.label}
                </option>
              ))}
            </optgroup>
          ))}
          <option value="custom">Tulis sendiri…</option>
        </select>
      </FieldShell>
      {nonIslamicWithBasmalah && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Gaya salam masih <strong>Islami</strong>, jadi basmalah & salam tetap tampil. Ubah ke
          &ldquo;Umum&rdquo; di bagian Salam &amp; pembuka bila tidak diinginkan.
        </p>
      )}
      <TextField
        name="quote.arabic"
        label="Teks Arab"
        hint="Opsional — hanya untuk ayat Al-Qur'an / doa berbahasa Arab."
        rows={3}
        dir="rtl"
        maxLength={2000}
      />
      <TextField name="quote.translation" label="Teks / terjemahan" rows={5} maxLength={1500} />
      <TextField name="quote.source" label="Sumber" placeholder="QS. Ar-Rum: 21" maxLength={120} />
    </div>
  );
}
