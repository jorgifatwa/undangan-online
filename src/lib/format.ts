/**
 * Utilitas format khas Indonesia: tanggal, jam, zona waktu, rupiah.
 * Memakai Intl (bawaan runtime) sehingga konsisten di server & client.
 */

export const TIMEZONES = {
  WIB: "Asia/Jakarta",
  WITA: "Asia/Makassar",
  WIT: "Asia/Jayapura",
} as const;

export type IndonesianTimezone = keyof typeof TIMEZONES;

type DateInput = Date | string | number;

const toDate = (d: DateInput): Date => (d instanceof Date ? d : new Date(d));

/** "Sabtu, 20 Desember 2026" */
export function formatTanggal(date: DateInput, tz: IndonesianTimezone = "WIB"): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIMEZONES[tz],
  }).format(toDate(date));
}

/** "20 Desember 2026" */
export function formatTanggalPendek(date: DateInput, tz: IndonesianTimezone = "WIB"): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIMEZONES[tz],
  }).format(toDate(date));
}

/** "08.00 WIB" (format jam Indonesia memakai titik) */
export function formatJam(date: DateInput, tz: IndonesianTimezone = "WIB"): string {
  const jam = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIMEZONES[tz],
  }).format(toDate(date));
  return `${jam} ${tz}`;
}

/** "Rp69.000" */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\s/g, "");
}
