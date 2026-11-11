import type { InvitationEvent } from "@/schemas/common";

import { formatTanggal, TIMEZONES, type IndonesianTimezone } from "./format";

/**
 * Data acara menyimpan tanggal & jam LOKAL + label zona (WIB/WITA/WIT), sesuai
 * cara orang Indonesia menulis undangan. Fungsi di sini mengubahnya menjadi
 * waktu absolut untuk countdown dan kalender.
 */

const OFFSET_HOURS: Record<IndonesianTimezone, number> = { WIB: 7, WITA: 8, WIT: 9 };

/** "2026-12-20" + "08:00" + "WIB" → Date (UTC instant). */
export function toInstant(date: string, time: string | undefined, tz: IndonesianTimezone): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time ?? "00:00").split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh - OFFSET_HOURS[tz], mm));
}

export function eventStart(e: InvitationEvent): Date {
  return toInstant(e.date, e.startTime, e.timezone);
}

/** Selesai acara; jika tidak diisi dianggap 2 jam setelah mulai. */
export function eventEnd(e: InvitationEvent): Date {
  if (e.endTime) return toInstant(e.date, e.endTime, e.timezone);
  return new Date(eventStart(e).getTime() + 2 * 60 * 60 * 1000);
}

/** Acara paling awal (target hitung mundur). */
export function firstEvent(events: InvitationEvent[]): InvitationEvent {
  return [...events].sort((a, b) => eventStart(a).getTime() - eventStart(b).getTime())[0];
}

/** "Sabtu, 20 Desember 2026" — tanggal lokal acara, tidak bergeser oleh zona browser. */
export function eventDateLabel(e: InvitationEvent): string {
  return formatTanggal(toInstant(e.date, "12:00", e.timezone), e.timezone);
}

/** "08.00 – 10.00 WIB", "11.00 WIB – selesai", atau null jika jam tidak diisi. */
export function eventTimeLabel(e: InvitationEvent): string | null {
  if (!e.startTime) return null;
  const start = e.startTime.replace(":", ".");
  if (e.untilFinished) return `${start} ${e.timezone} – selesai`;
  if (e.endTime) return `${start} – ${e.endTime.replace(":", ".")} ${e.timezone}`;
  return `${start} ${e.timezone}`;
}

/** Bagian tanggal terpisah untuk desain blok tanggal ("DESEMBER" / "05" / "2026"). */
export function dateParts(date: string, tz: IndonesianTimezone = "WIB") {
  const d = toInstant(date, "12:00", tz);
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("id-ID", { ...o, timeZone: TIMEZONES[tz] }).format(d);
  return {
    weekday: fmt({ weekday: "long" }),
    day: fmt({ day: "2-digit" }),
    month: fmt({ month: "long" }),
    monthNumber: fmt({ month: "2-digit" }),
    year: fmt({ year: "numeric" }),
  };
}
