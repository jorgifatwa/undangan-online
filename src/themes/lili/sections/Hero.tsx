"use client";

import { eventStart, firstEvent } from "@/lib/datetime";

import { couple, shortName } from "../../_shared/format";
import { useCountdown } from "../../_shared/hooks";
import { useInvitation } from "../../_shared/runtime/context";
import { BrushBox } from "../art/BrushBox";
import { HeroFrame } from "../art/HeroFrame";
import { paperBg } from "../art/textures";
import { box, F, Section, txt, u, useFit } from "../canvas";

/**
 * Hero + hitung mundur (section `hitungMundur`, kanvas 430 × 763): kertas
 * krem, tulisan tangan "The Wedding", bingkai oval barok berisi foto sampul,
 * lili cat air + mutiara, kupu-kupu, nama skrip, tagline, lalu angka hitung
 * mundur di atas sapuan pink. Setelah hari H, angka diganti ucapan.
 */
// komposisi bingkai + lili + kupu-kupu (lebar seperti desain)
const FRAME = { l: 75, t: 81 };
const FRAME_W = 278;
const CELLS = [
  { x: 119, label: "Hari" },
  { x: 197, label: "Jam" },
  { x: 263, label: "Menit" },
  { x: 329, label: "Detik" },
] as const;
const pad = (n: number) => String(n).padStart(2, "0");

export function LiliHero() {
  const { inv } = useInvitation();
  const d = inv.eventType === "WEDDING" ? inv.data : null;
  const event = firstEvent(inv.data.events);
  const cd = useCountdown(eventStart(event));
  const [a, b] = d ? couple(d) : [null, null];
  const names = `${a ? shortName(a) : ""}|${b ? shortName(b) : ""}`;
  const namesRef = useFit<HTMLHeadingElement>(names);
  const photo = d?.photos.cover;
  const values = [cd.days, cd.hours, cd.minutes, cd.seconds];
  const passed = cd.ready && cd.done;

  return (
    <Section id="hitungMundur" height={763} bg={paperBg()} overflow="hidden">
      {/* noda cat air abu lembut di kertas */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 22% 9% at 14% 26%, rgb(120 116 100 / 0.15), transparent 70%), radial-gradient(ellipse 14% 12% at 96% 66%, rgb(120 116 100 / 0.16), transparent 70%), radial-gradient(ellipse 30% 14% at 78% 80%, rgb(120 116 100 / 0.09), transparent 70%), radial-gradient(ellipse 18% 8% at 20% 58%, rgb(120 116 100 / 0.08), transparent 70%)",
        }}
      />

      <p
        data-a="write"
        style={{
          ...box(0, 12, 430),
          ...txt(F.hand, 37, 1.3, { color: "var(--inv-ink)", ls: 1.2 }),
          ["--d" as string]: "0.15s",
        }}
      >
        The Wedding
      </p>

      {/* foto + bingkai */}
      <div data-a="zoom" style={{ ...box(0, 0, 430, 763), ["--d" as string]: "0.6s" }}>
        <HeroFrame l={FRAME.l} t={FRAME.t} w={FRAME_W} photo={photo} alt="Foto pasangan" priority />
      </div>

      {/* nama */}
      <h2
        ref={namesRef}
        data-a
        style={{
          ...box(20, 505, 390),
          whiteSpace: "nowrap",
          textAlign: "center",
          fontFamily: F.script,
          fontWeight: 400,
          fontSize: `calc(${u(46)} * var(--fit, 1))`,
          lineHeight: 1.45,
          color: "var(--inv-ink)",
          ["--d" as string]: "0.95s",
        }}
      >
        {a ? shortName(a) : ""} <span style={{ fontFamily: F.amp, fontSize: "0.92em" }}>&amp;</span>{" "}
        {b ? shortName(b) : ""}
      </h2>
      <p
        data-a
        style={{
          ...box(15, 581, 400),
          ...txt(F.serif, 12.8, 1.35, { color: "var(--inv-ink)" }),
          ["--d" as string]: "1.1s",
        }}
      >
        Your presence will make our special day even more meaningful
      </p>

      {/* hitung mundur */}
      <div data-a style={{ ...box(0, 0, 430, 763), ["--d" as string]: "1.25s" }}>
        <BrushBox style={{ ...box(55, 612, 335, 47) }} />
        {passed ? (
          <p
            style={{
              ...box(55, 612, 335, 47),
              ...txt(F.serif, 17, 1, { italic: true, color: "var(--inv-ink)" }),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Hari bahagia telah tiba
          </p>
        ) : (
          <div role="timer" aria-label="Hitung mundur menuju hari bahagia">
            {/* satu baris "543:23:20:01" seperti desain (angka gaya lama Playfair) */}
            <p
              style={{
                ...box(30, 610, 370, 47),
                ...txt(F.serif, 40, u(47), { color: "var(--inv-ink)", ls: 6.2 }),
                textIndent: u(6.2), // imbangi spasi setelah huruf terakhir
                fontVariantNumeric: "oldstyle-nums tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {cd.ready
                ? // tiap digit punya key = posisi + nilai → hanya digit yang
                  // berubah dipasang ulang & menjalankan animasi li-tick
                  [...`${cd.days}:${values.slice(1).map(pad).join(":")}`].map((ch, i) =>
                    ch === ":" ? (
                      <span key={`c${i}`}>:</span>
                    ) : (
                      <span key={`${i}-${ch}`} className="li-digit">
                        {ch}
                      </span>
                    ),
                  )
                : "–"}
            </p>
            {CELLS.map((c) => (
              <p
                key={c.label}
                style={{
                  ...box(c.x - 40, 666, 80),
                  ...txt(F.serif, 16, 1.3, { color: "var(--inv-ink)" }),
                }}
              >
                {c.label}
              </p>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
