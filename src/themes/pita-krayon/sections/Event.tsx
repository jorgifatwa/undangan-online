"use client";

import { eventDateLabel, eventTimeLabel, firstEvent } from "@/lib/datetime";
import { safeHref } from "@/lib/links";
import type { InvitationEvent } from "@/schemas/common";

import { useInvitation } from "../../_shared/runtime/context";
import { box, Orn, Section, txt, Typewriter, u, useDecor } from "../canvas";
import { DiscoBall, ScribbleCircle, Sparkle } from "../ornaments";

/**
 * Save the date: disco ball + "SAVE THE DATE!" (diketik) + strip kalender
 * miring (hari sebelum · HARI-H dilingkari coretan · hari sesudah), lalu
 * detail tiap acara + tombol lokasi (Google Maps, domain tepercaya saja).
 */
function dayParts(e: InvitationEvent) {
  // tanggal acara (YYYY-MM-DD) dihitung di UTC agar tidak bergeser zona waktu
  const [y, m, d] = e.date.split("-").map(Number);
  const at = (off: number) => new Date(Date.UTC(y, m - 1, d + off));
  return [-1, 0, 1].map((off) => {
    const dt = at(off);
    return { dow: dt.getUTCDay(), day: dt.getUTCDate() };
  });
}

function Calendar({ event }: { event: InvitationEvent }) {
  const { t } = useDecor();
  const days = dayParts(event);
  const col = (i: number): React.CSSProperties => ({
    position: "absolute",
    left: `${(i * 100) / 3}%`,
    width: `${100 / 3}%`,
    top: 0,
    bottom: 0,
  });
  return (
    <div style={{ position: "relative", height: u(210), marginTop: u(8) }}>
      <div
        data-a="tilt"
        style={{
          ...box(-12, 18, 454, 172),
          transform: "rotate(-3.2deg)",
          borderTop: `${u(3)} solid var(--inv-deep)`,
          borderBottom: `${u(3)} solid var(--inv-deep)`,
          ["--d" as string]: "0.2s",
        }}
      >
        {/* garis bawah nama hari */}
        <div style={{ ...box(0, 40, 454, 0), borderTop: `${u(3)} solid var(--inv-deep)` }} />
        {days.map((d, i) => (
          <div key={i} style={col(i)}>
            {i > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  borderLeft: `${u(3)} solid var(--inv-deep)`,
                  transform: `rotate(${i === 1 ? 2 : -1.5}deg)`,
                }}
              />
            )}
            <p
              style={{
                ...txt(21, 1, { color: "var(--inv-deep)", weight: 700, ls: 1 }),
                marginTop: u(10),
              }}
            >
              {t.days[d.dow]}
            </p>
            <p
              data-a="drop"
              style={{
                ...txt(i === 1 ? 86 : 80, 1, { color: "var(--inv-deep)", weight: 700 }),
                marginTop: u(i === 1 ? 18 : 22),
                ["--d" as string]: `${0.45 + i * 0.22}s`,
              }}
            >
              {d.day}
            </p>
          </div>
        ))}
        {/* lingkaran hari-H + label */}
        <Orn
          slot="scribble-circle"
          l={176}
          t={50}
          w={102}
          ratio={0.976}
          tint={false}
          a="draw"
          d={1.1}
          fallback={<ScribbleCircle />}
        />
        <p
          data-a="pop"
          style={{
            ...box(232, 128, 110),
            ...txt(17, 1, { color: "var(--inv-deep)", weight: 700, align: "left" }),
            transform: "rotate(-14deg)",
            ["--d" as string]: "1.35s",
          }}
        >
          {t.dday}
        </p>
      </div>
    </div>
  );
}

function EventBlock({ e, i }: { e: InvitationEvent; i: number }) {
  const time = eventTimeLabel(e);
  const address = (e.address ?? e.city ?? "").split("\n").filter(Boolean);
  const maps = safeHref(e.mapsUrl, "maps");
  return (
    <div data-a="up" style={{ marginTop: u(i ? 44 : 34), ["--d" as string]: `${0.2 + i * 0.1}s` }}>
      <h3
        style={{
          ...txt(27, 1.15, { color: "var(--inv-red)", weight: 700, ls: 3 }),
          padding: `0 ${u(30)}`,
        }}
      >
        {e.name}
      </h3>
      <p style={{ ...txt(17, 1.35), marginTop: u(16) }}>{eventDateLabel(e)}</p>
      {time && <p style={txt(17, 1.35)}>{time}</p>}
      {e.venueName && (
        <p
          style={{
            ...txt(17, 1.35, { weight: 700, upper: true, ls: 1 }),
            marginTop: u(16),
            padding: `0 ${u(36)}`,
          }}
        >
          {e.venueName}
        </p>
      )}
      {address.map((l, k) => (
        <p key={k} style={{ ...txt(16.5, 1.35), padding: `0 ${u(40)}` }}>
          {l}
        </p>
      ))}
      {maps && (
        <a
          href={maps}
          target="_blank"
          rel="noopener"
          className="pk-btn"
          style={{
            marginTop: u(22),
            height: u(40),
            padding: `0 ${u(30)}`,
            fontSize: u(18),
            letterSpacing: u(1.5),
          }}
        >
          Lihat Lokasi
        </a>
      )}
    </div>
  );
}

export function SaveTheDate() {
  const { inv } = useInvitation();
  const { t } = useDecor();
  const events = inv.data.events;
  const first = firstEvent(events);
  return (
    <Section id="acara" style={{ paddingBottom: u(48), textAlign: "center" }}>
      <div style={{ position: "relative", height: u(200) }}>
        <Orn
          slot="disco-ball"
          l={24}
          t={-4}
          w={150}
          ratio={1.272}
          tint={false}
          a="drop"
          d={0.1}
          fallback={<DiscoBall />}
        />
        <h2
          style={{
            ...box(186, 8, 238),
            ...txt(66, 0.98, { color: "var(--inv-red)", weight: 700, ls: 2 }),
            transform: "rotate(-6deg)",
          }}
        >
          {t.saveDate.map((w, i) => (
            <span key={i} style={{ display: "block", whiteSpace: "nowrap" }}>
              <Typewriter
                text={w}
                delay={0.25 + t.saveDate.slice(0, i).join("").length * 0.06}
                step={0.06}
              />
            </span>
          ))}
        </h2>
        <Orn
          slot="sparkle-b"
          l={160}
          t={30}
          w={14}
          ratio={1.03}
          tint={false}
          a="fade"
          d={0.6}
          fallback={<Sparkle />}
        />
      </div>
      <Calendar event={first} />
      {events.map((e, i) => (
        <EventBlock key={e.id} e={e} i={i} />
      ))}
    </Section>
  );
}
