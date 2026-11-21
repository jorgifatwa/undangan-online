"use client";

import Image from "next/image";

import { eventDateLabel } from "@/lib/datetime";
import { safeHref } from "@/lib/links";
import type { InvitationEvent } from "@/schemas/common";

import { useInvitation } from "../../_shared/runtime/context";
import { smoke } from "../art/FloralColumn";
import eventBottom from "../art/event-bottom.webp";
import eventTop from "../art/event-top.webp";
import { TornCard } from "../art/TornCard";
import { F, Section, txt, u } from "../canvas";

/**
 * Acara (kanvas 430, latar sage berkabut): kartu kertas sobek bergantian
 * kiri/kanan (Akad Nikah kiri, Resepsi kanan) berisi judul tebal miring,
 * baris tanggal/jam/tempat berikon, dan tombol gelap "Lihat Lokasi". Bunga
 * foto milik pemilik: rangkaian kiri atas & buket kanan bawah (di belakang kartu).
 */

/** "08.00 WIB s.d Selesai" / "08.00 s.d 10.00 WIB" seperti desain. */
/** Skala gambar bunga (diekspor selebar layar 482 px) ke kanvas 430. */
const K = 430 / 482;

function timeLabel(e: InvitationEvent): string | null {
  if (!e.startTime) return null;
  const s = e.startTime.replace(":", ".");
  if (e.untilFinished || !e.endTime) return `${s} ${e.timezone} s.d Selesai`;
  return `${s} s.d ${e.endTime.replace(":", ".")} ${e.timezone}`;
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3}>
      <rect x={2.5} y={4} width={19} height={17.5} rx={2.5} />
      <path d="M2.5 9h19M7 2.5v3M17 2.5v3" />
      {[0, 1, 2, 3].map((c) =>
        [0, 1, 2].map((r) => (
          <rect
            key={`${c}${r}`}
            x={5.2 + c * 3.7}
            y={11.2 + r * 3.2}
            width={2.2}
            height={1.9}
            rx={0.4}
            fill="currentColor"
            stroke="none"
            opacity={0.75}
          />
        )),
      )}
    </svg>
  );
}
function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3}>
      <circle cx={12} cy={12} r={9.8} />
      <circle cx={12} cy={12} r={8} opacity={0.5} />
      <path d="M12 6.5V12l3.6 2.4" strokeLinecap="round" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3}>
      <path d="M12 21s-6.5-6.4-6.5-11.2A6.5 6.5 0 0 1 18.5 9.8C18.5 14.6 12 21 12 21Z" />
      <circle cx={12} cy={9.8} r={2.6} />
      <path d="M8.5 21.5h7" strokeLinecap="round" />
    </svg>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: u(10), marginTop: u(11) }}>
      <span style={{ flex: "none", width: u(21), height: u(21), color: "var(--inv-ink)" }}>
        {icon}
      </span>
      <p
        style={{
          ...txt(F.serif, 13, 1.4, { color: "var(--inv-ink)", align: "left" }),
          fontVariantNumeric: "oldstyle-nums",
          paddingTop: u(1),
        }}
      >
        {children}
      </p>
    </div>
  );
}

function EventCard({ e, i }: { e: InvitationEvent; i: number }) {
  const right = i % 2 === 1;
  const time = timeLabel(e);
  const place = [e.venueName, e.address ?? e.city].filter(Boolean).join(", ");
  const map = safeHref(e.mapsUrl, "maps");
  return (
    <div
      data-a={right ? "right" : "left"}
      style={{
        position: "relative",
        marginLeft: u(right ? 91 : 26),
        width: u(314),
        marginTop: u(i === 0 ? 0 : 40),
        ["--d" as string]: "0.15s",
      }}
    >
      <TornCard seed={right ? 1 : 0}>
        <div
          style={{ minHeight: u(247), padding: `${u(22)} ${u(30)} ${u(30)} ${u(right ? 68 : 76)}` }}
        >
          <h3
            style={{
              ...txt(F.serif, 31, 1.2, { italic: true, weight: 700, color: "var(--inv-ink)" }),
              marginLeft: u(right ? 0 : -10),
            }}
          >
            {e.name}
          </h3>
          <Row icon={<IconCalendar />}>{eventDateLabel(e)}</Row>
          {time && <Row icon={<IconClock />}>{time}</Row>}
          {place && <Row icon={<IconPin />}>{place}</Row>}
          {map && (
            <div style={{ marginTop: u(16), paddingLeft: u(right ? 28 : 20) }}>
              <a
                href={map}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: `${u(3)} ${u(9)}`,
                  borderRadius: 999,
                  background: "#2b2c22",
                  ...txt(F.serif, 12.5, 1.3, { weight: 600, color: "#f4efe3" }),
                  textDecoration: "none",
                  pointerEvents: "auto",
                }}
              >
                Lihat Lokasi
              </a>
            </div>
          )}
        </div>
      </TornCard>
    </div>
  );
}

export function LiliEvent() {
  const { inv } = useInvitation();
  const events = inv.data.events;
  return (
    <Section
      id="acara"
      bg={{
        background: `${smoke([
          { x: 30, y: 46, w: 50, h: 14, a: 0.22 },
          { x: 80, y: 95, w: 45, h: 16, a: 0.2 },
          { x: 10, y: 18, w: 30, h: 12, a: 0.12 },
        ])}, var(--inv-sage)`,
      }}
      overflow="hidden"
    >
      {/* bunga milik pemilik (diekspor selebar layar 482 px → skala 430/482),
          di belakang kartu: rangkaian kiri atas & buket kanan bawah */}
      <div
        aria-hidden
        data-a="fade"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: u(363 * K),
          height: u(255 * K),
          pointerEvents: "none",
        }}
      >
        <Image src={eventTop} alt="" fill sizes="(max-width: 440px) 76vw, 330px" />
      </div>
      <div
        aria-hidden
        data-a="fade"
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: u(256 * K),
          height: u(590 * K),
          pointerEvents: "none",
          ["--d" as string]: "0.3s",
        }}
      >
        <Image src={eventBottom} alt="" fill sizes="(max-width: 440px) 54vw, 240px" />
      </div>
      <div style={{ position: "relative", padding: `${u(104)} 0 ${u(110)}` }}>
        {events.map((e, i) => (
          <EventCard key={e.id} e={e} i={i} />
        ))}
      </div>
    </Section>
  );
}
