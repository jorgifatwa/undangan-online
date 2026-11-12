"use client";

import { eventTimeLabel, toInstant } from "@/lib/datetime";
import type { InvitationEvent } from "@/schemas/common";

import { Heart } from "../../_shared/ornaments";
import { useInvitation } from "../../_shared/runtime/context";
import { LeatherTexture } from "../../_shared/textures";
import { Art, F, Fleuron, Section, box, txt, u } from "../canvas";

/**
 * Kartu acara (desain: 354 × 336 mulai y 944 di section mempelai; di sini
 * section sendiri yang menyambung tepat di bawahnya): nama bulan, strip
 * minggu Senin–Minggu dengan hati berdetak di hari H, waktu tiap acara,
 * lokasi, dan tombol "Petunjuk Lokasi".
 */
const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** Tanggal kalender (tanpa zona) dari "YYYY-MM-DD". */
function ymd(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function week(event: InvitationEvent) {
  const main = ymd(event.date);
  const active = (main.getUTCDay() + 6) % 7;
  return HARI.map((h, i) => {
    const d = new Date(main);
    d.setUTCDate(main.getUTCDate() - active + i);
    return { h, n: d.getUTCDate(), on: i === active };
  });
}

/** Kartu bertekstur marun (dipakai juga oleh section live streaming). */
export function MaroonCard({
  style,
  children,
  a = "zoom",
}: {
  style?: React.CSSProperties;
  children: React.ReactNode;
  a?: string;
}) {
  return (
    <div
      data-a={a}
      style={{
        boxSizing: "border-box",
        borderRadius: u(10),
        overflow: "hidden",
        background: "var(--inv-card)",
        boxShadow: `0 ${u(14)} ${u(34)} rgb(0 0 0 / .45)`,
        isolation: "isolate",
        ...style,
      }}
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1 }}>
        <Art
          slot="card-texture"
          fit="cover"
          w={354}
          filter="var(--inv-filter-card)"
          fallback={<LeatherTexture slot={false} />}
        />
      </div>
      {children}
    </div>
  );
}

export function MapButton({
  href,
  label = "Petunjuk Lokasi",
  icon = "map",
}: {
  href: string;
  label?: string;
  icon?: "map" | "play";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: u(8),
        marginTop: u(14),
        padding: `${u(9)} ${u(22)}`,
        borderRadius: 99,
        border: `${u(1.5)} solid var(--inv-gold-dark)`,
        background: "var(--inv-cream)",
        textDecoration: "none",
        boxShadow: `0 ${u(4)} ${u(12)} rgb(0 0 0 / .3)`,
        ...txt(F.body, 13, 1, { weight: 500, ls: 0.5, color: "var(--inv-card)" }),
      }}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        style={{ width: u(16), height: u(16), color: "var(--inv-gold-dark)" }}
      >
        {icon === "map" ? (
          <path
            fill="currentColor"
            d="m20.5 3-.16.03L15 5.1 9 3 3.36 4.9a.5.5 0 0 0-.36.48V20.5a.5.5 0 0 0 .5.5l.16-.03L9 18.9l6 2.1 5.64-1.9a.5.5 0 0 0 .36-.48V3.5a.5.5 0 0 0-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"
          />
        ) : (
          <path
            fill="currentColor"
            d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-2 14.5v-9l6 4.5-6 4.5Z"
          />
        )}
      </svg>
      {label}
    </a>
  );
}

export function RendaEvent() {
  const { inv } = useInvitation();
  const events = inv.data.events;
  const main = events[0];
  const days = week(main);
  const sameDay = events.every((e) => e.date === main.date);
  const places = [...new Set(events.map((e) => e.venueName ?? e.city).filter(Boolean))] as string[];
  const map = events.find((e) => e.mapsUrl)?.mapsUrl;
  const month = BULAN[ymd(main.date).getUTCMonth()];
  const gold = "var(--inv-gold)";
  const line = "color-mix(in srgb, var(--inv-gold) 50%, transparent)";

  return (
    <Section
      id="acara"
      minHeight={426}
      z={1}
      threshold={0.2}
      style={{ paddingTop: u(44), paddingBottom: u(46) }}
    >
      <MaroonCard
        style={{
          position: "relative",
          margin: `0 ${u(38)}`,
          minHeight: u(336),
          padding: `${u(14)} ${u(18)} ${u(18)}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <h2 style={txt(F.casual, 50, 1.15)}>{month}</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            width: "100%",
            marginTop: u(6),
          }}
        >
          {days.map((d) => (
            <div
              key={d.h}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: `${u(6)} 0 ${u(5)}`,
                isolation: "isolate",
              }}
            >
              {d.on && (
                <div
                  className="rr-heart"
                  aria-hidden
                  style={{
                    ...box(0, 0, 62, 58),
                    left: "50%",
                    top: "50%",
                    margin: `${u(-29)} 0 0 ${u(-31)}`,
                    zIndex: -1,
                  }}
                >
                  <Art
                    slot="heart"
                    w={62}
                    fallback={<Heart slot={false} className="h-full w-full" />}
                  />
                </div>
              )}
              <span
                style={{
                  ...txt(F.body, 10.5, 1.2, {
                    italic: true,
                    color: d.on ? "#fff" : "var(--inv-cream)",
                  }),
                  opacity: 0.9,
                }}
              >
                {d.h}
              </span>
              <b
                style={{
                  ...txt(F.serif, 21, 1.15, {
                    weight: 500,
                    color: d.on ? "#fff" : "var(--inv-cream)",
                  }),
                  fontVariantNumeric: "lining-nums",
                }}
              >
                {d.n}
              </b>
              {d.on && <span className="sr-only">(hari acara)</span>}
            </div>
          ))}
        </div>

        <Fleuron color={gold} line={line} />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "stretch",
            width: "100%",
            rowGap: u(12),
          }}
        >
          {events.map((e, i) => (
            <div
              key={e.id}
              style={{ display: "flex", flex: events.length === 1 ? "1 1 100%" : "1 1 45%" }}
            >
              {i % 2 === 1 && <span aria-hidden style={{ width: 1, background: line }} />}
              <div style={{ flex: 1, padding: `0 ${u(4)}` }}>
                <h3 style={txt(F.serif, 15, 1.2, { weight: 600, ls: 3.3, color: gold })}>
                  {e.name.toUpperCase()}
                </h3>
                {!sameDay && (
                  <p
                    style={{
                      ...txt(F.body, 11, 1.3, { italic: true }),
                      marginTop: u(4),
                      opacity: 0.9,
                    }}
                  >
                    {new Intl.DateTimeFormat("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      timeZone: "UTC",
                    }).format(toInstant(e.date, "12:00", "WIB"))}
                  </p>
                )}
                <p style={{ ...txt(F.body, 13.5, 1.3), marginTop: u(5) }}>
                  {eventTimeLabel(e) ?? "Waktu menyusul"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {places.length > 0 && <Fleuron color={gold} line={line} />}
        {places.map((pl) => (
          <p
            key={pl}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: u(6),
              ...txt(F.body, 14.5, 1.3),
              marginTop: u(2),
            }}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              style={{ width: u(15), height: u(15), color: gold, flex: "none" }}
            >
              <path
                fill="currentColor"
                d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
              />
            </svg>
            {pl}
          </p>
        ))}
        {map && <MapButton href={map} />}
      </MaroonCard>
    </Section>
  );
}
