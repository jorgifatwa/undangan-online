import type { InvitationEvent } from "@/schemas/common";

import { eventEnd, eventStart } from "./datetime";

/** 20261220T010000Z */
const stamp = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

function location(e: InvitationEvent): string {
  return [e.venueName, e.address].filter(Boolean).join(", ");
}

export function googleCalendarUrl(title: string, e: InvitationEvent, details?: string): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${stamp(eventStart(e))}/${stamp(eventEnd(e))}`,
    location: location(e),
    details: details ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const escapeIcs = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

/** Isi file .ics untuk satu atau lebih acara (iPhone/Mac membukanya di app Kalender). */
export function icsContent(title: string, events: InvitationEvent[], url?: string): string {
  const now = stamp(new Date());
  const vevents = events.map((e) =>
    [
      "BEGIN:VEVENT",
      `UID:${e.id}-${stamp(eventStart(e))}@undangan`,
      `DTSTAMP:${now}`,
      `DTSTART:${stamp(eventStart(e))}`,
      `DTEND:${stamp(eventEnd(e))}`,
      `SUMMARY:${escapeIcs(`${e.name} — ${title}`)}`,
      location(e) ? `LOCATION:${escapeIcs(location(e))}` : "",
      url ? `URL:${url}` : "",
      "END:VEVENT",
    ]
      .filter(Boolean)
      .join("\r\n"),
  );
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Undangan//ID",
    ...vevents,
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Perangkat Apple → unduh .ics; lainnya → Google Calendar. */
export function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
}
