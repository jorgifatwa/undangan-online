"use client";

import { eventStart, firstEvent, dateParts } from "@/lib/datetime";

import { useCountdown } from "../../_shared/hooks";
import { useInvitation } from "../../_shared/runtime/context";
import { useInvitationTitle } from "../../_shared/sections";
import { useSaveToCalendar } from "../../_shared/sections/Event";
import { googleCalendarUrl } from "@/lib/calendar";
import { LeafPattern } from "../../_shared/textures";
import { Art, F, Section, txt, u } from "../canvas";

/**
 * Save The Date (desain 430 × 300): pita hijau dengan latar daun yang
 * dicerahkan, tanggal, hitung mundur (detik berwarna emas), dan tombol
 * simpan ke kalender. Setelah hari H berganti ucapan.
 */
const LABELS = ["Days", "Hours", "Minutes", "Seconds"] as const;
const pad = (n: number) => String(n).padStart(2, "0");

export function RendaSaveDate() {
  const { inv } = useInvitation();
  const event = firstEvent(inv.data.events);
  const cd = useCountdown(eventStart(event));
  const { title } = useInvitationTitle();
  const onCalendar = useSaveToCalendar();
  const p = dateParts(event.date, event.timezone);
  const values = [cd.days, cd.hours, cd.minutes, cd.seconds];

  return (
    <Section id="hitungMundur" height={300} bg="var(--inv-band)" overflow="hidden" z={1}>
      <div aria-hidden style={{ position: "absolute", inset: 0, opacity: 0.9 }}>
        <Art
          slot="leaf-bg"
          fit="cover"
          w={430}
          position="center 30%"
          filter="var(--inv-filter-leaf) brightness(1.75) saturate(0.72) contrast(1.12)"
          fallback={<LeafPattern slot={false} />}
        />
      </div>
      <div style={{ position: "relative", paddingTop: u(52), textAlign: "center" }}>
        <p
          data-a="up"
          style={{ ...txt(F.serif, 28, 1.15, { weight: 500, ls: 1.4 }), ["--d" as string]: "0.1s" }}
        >
          SAVE <i>THE</i> DATE!
        </p>
        <p
          data-a="up"
          style={{
            ...txt(F.body, 13.5, 1.3, { italic: true, ls: 0.3 }),
            marginTop: u(6),
            ["--d" as string]: "0.25s",
          }}
        >
          {p.weekday}, {Number(p.day)} {p.month} {p.year}
        </p>

        {cd.ready && cd.done ? (
          <p
            data-a="up"
            style={{
              ...txt(F.script, 30, 1.2, { color: "var(--inv-gold)" }),
              margin: `${u(18)} 0 ${u(4)}`,
            }}
          >
            Hari bahagia telah tiba
          </p>
        ) : (
          <div
            data-a="up"
            role="timer"
            aria-label="Hitung mundur menuju hari bahagia"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              marginTop: u(16),
              ["--d" as string]: "0.4s",
            }}
          >
            {LABELS.map((label, i) => (
              <div key={label} style={{ display: "flex", alignItems: "flex-start" }}>
                {i > 0 && (
                  <span
                    aria-hidden
                    style={{ ...txt("Arial, Helvetica, sans-serif", 42, 52), padding: `0 ${u(2)}` }}
                  >
                    :
                  </span>
                )}
                <div style={{ width: u(i === 3 ? 82 : 76) }}>
                  <b
                    style={{
                      display: "block",
                      ...txt("Arial, Helvetica, sans-serif", 52, 1, {
                        color: i === 3 ? "var(--inv-gold)" : "var(--inv-cream)",
                      }),
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {pad(values[i])}
                  </b>
                  <small
                    style={{
                      display: "block",
                      marginTop: u(10),
                      ...txt("Arial, Helvetica, sans-serif", 9.5, 1, { ls: 0.5 }),
                    }}
                  >
                    {label.toUpperCase()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}

        {!(cd.ready && cd.done) && (
          <a
            data-a="up"
            href={googleCalendarUrl(`Pernikahan ${title}`, event)}
            target="_blank"
            rel="noopener"
            onClick={onCalendar}
            style={{
              ["--d" as string]: "0.55s",
              display: "inline-flex",
              alignItems: "center",
              gap: u(7),
              marginTop: u(18),
              padding: `${u(7)} ${u(18)}`,
              border: "1px solid rgb(246 239 228 / .75)",
              borderRadius: 99,
              background: "rgb(20 40 24 / .25)",
              textDecoration: "none",
              ...txt(F.body, 11.5, 1, { ls: 0.45 }),
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden style={{ width: u(13), height: u(13) }}>
              <path
                fill="currentColor"
                d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"
              />
            </svg>
            Simpan ke Kalender
          </a>
        )}
      </div>
    </Section>
  );
}
