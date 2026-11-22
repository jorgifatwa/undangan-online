"use client";

import { eventStart, eventTimeLabel, firstEvent } from "@/lib/datetime";
import { safeHref } from "@/lib/links";

import { useCountdown } from "../../_shared/hooks";
import { useInvitation } from "../../_shared/runtime/context";
import { DateFrames, Envelope } from "../art/Ornaments";
import { EnterGroup, F, Section, txt, u } from "../canvas";

/**
 * Acara (hijau botol): nama hari + tanggal dalam tiga bingkai emas; amplop
 * marun per acara (kartu: nama acara, jam); "Location" per tempat + tombol
 * peta; hitung mundur dalam kotak kecil krem.
 */
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const pad = (n: number) => String(n).padStart(2, "0");

function Countdown() {
  const { inv } = useInvitation();
  const cd = useCountdown(eventStart(firstEvent(inv.data.events)));
  if (cd.ready && cd.done) return null;
  const cells = [
    [cd.days, "Days"],
    [cd.hours, "Hours"],
    [cd.minutes, "Minutes"],
    [cd.seconds, "Seconds"],
  ] as const;
  return (
    <div
      role="timer"
      aria-label="Hitung mundur"
      style={{ display: "flex", justifyContent: "center", gap: u(4), marginTop: u(34) }}
    >
      {cells.map(([v, l], i) => (
        <div
          key={l}
          style={{
            width: u(32),
            padding: `${u(4)} 0 ${u(3)}`,
            borderRadius: u(4),
            background: "#d9d4c9",
            borderTop: `${u(2)} dashed #7d8a7f`,
            boxShadow: "0 1px 2px rgb(0 0 0 / 0.3)",
          }}
        >
          <p
            style={{
              ...txt(F.sans, 11.5, 1.1, { color: "#4a4a44", weight: 700 }),
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {cd.ready ? (i === 0 ? v : pad(v)) : "–"}
          </p>
          <p style={txt(F.sans, 5, 1.3, { color: "#4a4a44" })}>{l}</p>
        </div>
      ))}
    </div>
  );
}

export function SuratMarunEvent() {
  const { inv } = useInvitation();
  const events = inv.data.events;
  const ev = firstEvent(events);
  const [y, m, d] = ev.date.split("-").map(Number);
  const weekday = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const places = events.filter(
    (e, i) =>
      (e.venueName || e.address) &&
      events.findIndex((x) => x.venueName === e.venueName && x.address === e.address) === i,
  );

  return (
    <Section id="acara" bg="var(--inv-bottle)" groups>
      <EnterGroup style={{ paddingTop: u(50), textAlign: "center" }}>
        <p data-a style={txt(F.serif, 17, 1.2, { color: "#ece6d6", weight: 400 })}>
          {weekday}
        </p>
        <div
          data-a
          style={{
            position: "relative",
            width: u(220),
            height: u(80),
            margin: `${u(16)} auto 0`,
            ["--d" as string]: "0.15s",
          }}
        >
          <DateFrames style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          {[pad(d), pad(m), String(y).slice(2)].map((t, i) => (
            <p
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: `${[13.2, 50, 86.8][i]}%`,
                transform: "translate(-50%, -50%)",
                ...txt(F.serif, 30, 1, { color: "#ece6d6" }),
              }}
            >
              {t}
            </p>
          ))}
        </div>
      </EnterGroup>

      {events.map((e, i) => (
        <EnterGroup key={e.id} threshold={0.3}>
          <div data-a style={{ width: u(300), margin: `${u(i ? 10 : 34)} auto 0` }}>
            <Envelope>
              <p style={txt(F.serif, 15, 1.15, { color: "#3c2a22", weight: 700 })}>{e.name}</p>
              {eventTimeLabel(e) && (
                <p style={{ ...txt(F.sans, 7.5, 1.3, { color: "#5a4a40" }), marginTop: u(3) }}>
                  {eventTimeLabel(e)}
                </p>
              )}
            </Envelope>
          </div>
        </EnterGroup>
      ))}

      <EnterGroup style={{ padding: `${u(40)} ${u(30)} ${u(56)}`, textAlign: "center" }}>
        <h2 data-a style={txt(F.serif, 31, 1.2, { color: "#ece6d6" })}>
          Location
        </h2>
        {places.map((e, i) => {
          const map = safeHref(e.mapsUrl, "maps");
          return (
            <div
              key={e.id}
              data-a
              style={{ marginTop: u(i ? 26 : 18), ["--d" as string]: `${0.1 + i * 0.1}s` }}
            >
              {e.venueName && (
                <p style={txt(F.serif, 15, 1.3, { italic: true, color: "#ece6d6" })}>
                  {e.venueName}
                </p>
              )}
              {(e.address ?? e.city) && (
                <p style={{ ...txt(F.sans, 10, 1.55, { color: "#ece6d6" }), marginTop: u(8) }}>
                  📍 {e.address ?? e.city}
                </p>
              )}
              {map && (
                <a
                  href={map}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: u(14),
                    padding: `${u(8)} ${u(14)}`,
                    background: "#efe9df",
                    ...txt(F.sans, 9.5, 1, { color: "#4a2a2a" }),
                    textDecoration: "none",
                    pointerEvents: "auto",
                  }}
                >
                  View Google Maps Here
                </a>
              )}
            </div>
          );
        })}
        <div data-a style={{ ["--d" as string]: "0.3s" }}>
          <Countdown />
        </div>
      </EnterGroup>
    </Section>
  );
}
