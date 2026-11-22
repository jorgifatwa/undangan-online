"use client";

import { useInvitation } from "../../_shared/runtime/context";
import { FloralColumn, smoke } from "../art/FloralColumn";
import { F, Section, txt, u } from "../canvas";

/**
 * Salam pembuka (awal blok sage, kanvas 430 × 215): bismillah pink,
 * "Assalamu'alaikum Wr. Wb" miring, kalimat undangan. Kolom bunga kanan
 * bersambung ke section mempelai (blok sage SAGE_BLOCK px).
 */
export const SALAM_H = 215;
/** Tinggi blok sage: salam + mempelai wanita + "&". */
export const SAGE_BLOCK = 803;

const FALLBACK =
  "Dengan segala kerendahan hati, kami mengundang Bapak/Ibu/Saudara/i untuk berkenan hadir dan menjadi bagian dari hari istimewa kami.";

export function LiliSalam() {
  const { inv } = useInvitation();
  const islami = inv.data.greeting?.style === "islami";
  return (
    <Section
      id="salam"
      minHeight={SALAM_H}
      bg={{
        background: `${smoke([{ x: 20, y: 70, w: 40, h: 40, a: 0.12 }])}, var(--inv-sage)`,
      }}
    >
      <FloralColumn from={0} height={SALAM_H} />
      <div
        style={{
          position: "relative",
          width: u(330),
          marginLeft: u(8),
          minHeight: u(SALAM_H),
          padding: `${u(islami ? 60 : 84)} 0 ${u(14)}`,
        }}
      >
        {islami && (
          <>
            <p
              data-a="blur"
              dir="rtl"
              lang="ar"
              style={{
                ...txt(F.arabic, 29, 1.25, { color: "var(--inv-pink-text)" }),
                ["--d" as string]: "0.15s",
              }}
            >
              بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
            </p>
            <p
              data-a
              style={{
                ...txt(F.serif, 21, 1.3, { italic: true, color: "var(--inv-pink-text)" }),
                marginTop: u(8),
                ["--d" as string]: "0.55s",
              }}
            >
              Assalamu&rsquo;alaikum Wr. Wb
            </p>
          </>
        )}
        <p
          data-a
          style={{
            ...txt(F.serif, 13.6, u(20), { color: "var(--inv-cream)" }),
            marginTop: u(8),
            ["--d" as string]: "0.8s",
          }}
        >
          {inv.data.greeting?.openingText ?? FALLBACK}
        </p>
      </div>
    </Section>
  );
}
