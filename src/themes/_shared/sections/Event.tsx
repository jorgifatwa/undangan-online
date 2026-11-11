"use client";

import { googleCalendarUrl, icsContent, isAppleDevice } from "@/lib/calendar";
import { eventDateLabel, eventStart, eventTimeLabel, firstEvent } from "@/lib/datetime";
import type { InvitationEvent } from "@/schemas/common";

import { useCountdown } from "../hooks";
import { Reveal } from "../motion/Reveal";
import { useInvitation } from "../runtime/context";
import { SectionShell } from "../runtime/SectionShell";
import { useInvitationTitle } from "./Cover";
import { Icon, SectionTitle } from "./ui";

const SECTION_PAD = "px-7 py-20";

/** Tombol "Simpan ke Kalender": .ics untuk Apple, Google Calendar untuk lainnya. */
export function useSaveToCalendar() {
  const { inv } = useInvitation();
  const { title } = useInvitationTitle();
  const label = inv.eventType === "WEDDING" ? `Pernikahan ${title}` : `Ulang Tahun ${title}`;

  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isAppleDevice()) return; // biarkan link Google Calendar terbuka
    e.preventDefault();
    const blob = new Blob([icsContent(label, inv.data.events, window.location.href)], {
      type: "text/calendar",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "undangan.ics";
    a.click();
    URL.revokeObjectURL(url);
  };
}

export function CalendarButton({ className }: { className?: string }) {
  const { inv } = useInvitation();
  const { title } = useInvitationTitle();
  const label = inv.eventType === "WEDDING" ? `Pernikahan ${title}` : `Ulang Tahun ${title}`;
  const onClick = useSaveToCalendar();
  return (
    <a
      href={googleCalendarUrl(label, firstEvent(inv.data.events))}
      target="_blank"
      rel="noopener"
      onClick={onClick}
      className={className ?? "inv-btn inv-btn-outline"}
    >
      <Icon name="calendar" /> Simpan ke Kalender
    </a>
  );
}

function EventCard({ event, index }: { event: InvitationEvent; index: number }) {
  const time = eventTimeLabel(event);
  return (
    <Reveal variant={index % 2 ? "right" : "left"} className="inv-card px-6 py-8 text-center">
      <h3
        className="text-3xl"
        style={{
          fontFamily: "var(--inv-font-script)",
          color: "var(--inv-title, var(--inv-primary))",
        }}
      >
        {event.name}
      </h3>
      <p className="mt-4 font-semibold">{eventDateLabel(event)}</p>
      {time && <p className="mt-1 text-sm opacity-80">{time}</p>}
      {(event.venueName || event.address) && (
        <div className="mx-auto my-5 h-px w-16" style={{ background: "var(--inv-accent)" }} />
      )}
      {event.venueName && (
        <p className="font-semibold tracking-wide uppercase">{event.venueName}</p>
      )}
      {event.address && (
        <p className="mt-1 text-sm leading-relaxed whitespace-pre-line opacity-80">
          {event.address}
        </p>
      )}
      {event.mapsUrl && (
        <a href={event.mapsUrl} target="_blank" rel="noopener" className="inv-btn mt-5">
          <Icon name="map" /> Petunjuk Lokasi
        </a>
      )}
    </Reveal>
  );
}

export function DefaultAcara() {
  const { inv } = useInvitation();
  return (
    <SectionShell id="acara" className={SECTION_PAD}>
      <SectionTitle kicker="Save the Date" title="Waktu & Tempat" />
      <div className="flex flex-col gap-6">
        {inv.data.events.map((e, i) => (
          <EventCard key={e.id} event={e} index={i} />
        ))}
      </div>
    </SectionShell>
  );
}

export function CountdownBoxes({ target, boxClassName }: { target: Date; boxClassName?: string }) {
  const c = useCountdown(target);
  const items = [
    { v: c.days, l: "Hari" },
    { v: c.hours, l: "Jam" },
    { v: c.minutes, l: "Menit" },
    { v: c.seconds, l: "Detik" },
  ];
  return (
    <div className="grid grid-cols-4 gap-2.5" aria-live="off">
      {items.map((it) => (
        <div key={it.l} className={boxClassName ?? "inv-card py-3 text-center"}>
          <div
            className="text-3xl font-bold tabular-nums"
            style={{ fontFamily: "var(--inv-font-display)" }}
          >
            {c.ready ? String(it.v).padStart(2, "0") : "--"}
          </div>
          <div className="mt-1 text-[10px] tracking-[0.2em] uppercase opacity-70">{it.l}</div>
        </div>
      ))}
    </div>
  );
}

export function DefaultHitungMundur() {
  const { inv } = useInvitation();
  const first = firstEvent(inv.data.events);
  const target = eventStart(first);
  const c = useCountdown(target);
  return (
    <SectionShell
      id="hitungMundur"
      className={`${SECTION_PAD} text-center`}
      style={{ background: "var(--inv-bg-alt)" }}
    >
      <SectionTitle
        kicker={eventDateLabel(first)}
        title={c.done ? "Hari Bahagia Telah Tiba" : "Menuju Hari Bahagia"}
      />
      {!c.done && (
        <Reveal variant="pop">
          <CountdownBoxes target={target} />
        </Reveal>
      )}
      <Reveal variant="fade" className="mt-8">
        <CalendarButton />
      </Reveal>
    </SectionShell>
  );
}

/** Peta: iframe Google Maps lazy. Di mode ringan diganti tombol saja (iframe berat). */
export function DefaultMaps() {
  const { inv, lite } = useInvitation();
  const e = inv.data.events.find((ev) => ev.address || ev.mapsUrl);
  if (!e) return null;
  const query = [e.venueName, e.address].filter(Boolean).join(", ");
  return (
    <SectionShell id="maps" className={`${SECTION_PAD} text-center`}>
      <SectionTitle kicker={e.venueName} title="Lokasi Acara" />
      {!lite && query && (
        <Reveal variant="zoom" className="inv-card overflow-hidden">
          <iframe
            title={`Peta ${e.venueName ?? "lokasi acara"}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-64 w-full border-0"
          />
        </Reveal>
      )}
      <a
        href={
          e.mapsUrl ??
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
        }
        target="_blank"
        rel="noopener"
        className="inv-btn mt-6"
      >
        <Icon name="map" /> Buka Google Maps
      </a>
    </SectionShell>
  );
}

export function DefaultDressCode() {
  const { inv } = useInvitation();
  const dc = inv.data.dressCode;
  if (!dc) return null;
  return (
    <SectionShell id="dressCode" className={`${SECTION_PAD} text-center`}>
      <SectionTitle kicker="Dress Code" title="Busana" />
      {dc.text && (
        <Reveal
          variant="rise"
          as="p"
          className="mx-auto max-w-xs text-sm leading-relaxed opacity-90"
        >
          {dc.text}
        </Reveal>
      )}
      {dc.colors.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {dc.colors.map((c, i) => (
            <Reveal
              key={c + i}
              variant="pop"
              delay={i * 0.08}
              className="size-12 rounded-full"
              style={{
                background: c,
                boxShadow: "0 0 0 3px var(--inv-surface), 0 0 0 4px var(--inv-border)",
              }}
            >
              <span className="sr-only">{c}</span>
            </Reveal>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

export function DefaultLiveStream() {
  const { inv } = useInvitation();
  const ls = inv.data.liveStream;
  if (!ls) return null;
  return (
    <SectionShell
      id="liveStream"
      className={`${SECTION_PAD} text-center`}
      style={{ background: "var(--inv-bg-alt)" }}
    >
      <SectionTitle kicker="Live Streaming" title="Saksikan Secara Daring" />
      {ls.note && <p className="mx-auto mb-6 max-w-xs text-sm opacity-85">{ls.note}</p>}
      <a href={ls.url} target="_blank" rel="noopener" className="inv-btn">
        <Icon name="play" /> Tonton di {ls.platform ?? "sini"}
      </a>
    </SectionShell>
  );
}
