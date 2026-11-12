import { eventDateLabel, firstEvent } from "@/lib/datetime";
import type { AnyInvitationData } from "@/schemas";
import { coupleNames } from "@/themes/_shared/format";

/**
 * Bahan berbagi undangan: judul/deskripsi pratinjau link (OG) dan pesan
 * WhatsApp dari template yang bisa diubah pemilik. Aman dipakai di client.
 */
export interface ShareInfo {
  eventType: "WEDDING" | "BIRTHDAY";
  /** "Kirana & Galih" / "Aira" */
  names: string;
  /** "Undangan Pernikahan" / "Undangan Ulang Tahun ke-6" */
  heading: string;
  /** "Sabtu, 12 Desember 2026" */
  dateLabel: string;
  city?: string;
  greeting: "islami" | "umum";
}

export function shareInfo(inv: AnyInvitationData): ShareInfo {
  const ev = firstEvent(inv.data.events);
  const city = ev.city ?? inv.data.events.find((e) => e.city)?.city;
  const greeting = inv.data.greeting?.style ?? "umum";
  if (inv.eventType === "WEDDING")
    return {
      eventType: "WEDDING",
      names: coupleNames(inv.data),
      heading: "Undangan Pernikahan",
      dateLabel: eventDateLabel(ev),
      city,
      greeting,
    };
  const c = inv.data.celebrant;
  return {
    eventType: "BIRTHDAY",
    names: c.nickname ?? c.name,
    heading: c.age ? `Undangan Ulang Tahun ke-${c.age}` : "Undangan Ulang Tahun",
    dateLabel: eventDateLabel(ev),
    city,
    greeting,
  };
}

/** "Undangan Pernikahan Kirana & Galih" */
export const metaTitle = (i: ShareInfo) => `${i.heading} ${i.names}`;

export function metaDescription(i: ShareInfo, guestName?: string | null) {
  const when = [i.dateLabel, i.city].filter(Boolean).join(" · ");
  const to = guestName ? `Kepada ${guestName}. ` : "";
  return `${to}${when}. Buka untuk detail acara, lokasi & konfirmasi kehadiran.`;
}

// ------------------------------ Pesan WhatsApp ------------------------------

export const MAX_TEMPLATE = 2000;
/** Sapaan pengganti {nama_tamu} bila nama tamu dikosongkan. */
export const DEFAULT_GUEST = "Bapak/Ibu/Saudara/i";

export const PLACEHOLDERS = [
  { key: "{nama_tamu}", label: "Nama tamu" },
  { key: "{link}", label: "Link undangan" },
  { key: "{nama_acara}", label: "Nama mempelai / yang berulang tahun" },
  { key: "{tanggal}", label: "Tanggal acara" },
] as const;

export function defaultTemplate(i: Pick<ShareInfo, "eventType" | "greeting">): string {
  if (i.eventType === "BIRTHDAY")
    return [
      "Halo {nama_tamu}! 🎉",
      "",
      "Dengan senang hati kami mengundang kamu ke pesta ulang tahun *{nama_acara}* pada {tanggal}.",
      "",
      "Detail acara & konfirmasi kehadiran:",
      "{link}",
      "",
      "Sampai jumpa di sana!",
    ].join("\n");
  const islami = i.greeting === "islami";
  return [
    islami ? "Assalamu'alaikum Warahmatullahi Wabarakatuh" : "Salam sejahtera,",
    "",
    "Kepada Yth.",
    "{nama_tamu}",
    "",
    "Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami:",
    "",
    "*{nama_acara}*",
    "{tanggal}",
    "",
    "Informasi lengkap acara dapat dilihat melalui tautan berikut:",
    "{link}",
    "",
    "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
    "",
    islami ? "Wassalamu'alaikum Warahmatullahi Wabarakatuh" : "Terima kasih.",
    "",
    "Kami yang berbahagia,",
    "{nama_acara}",
  ].join("\n");
}

export function renderShareMessage(
  template: string,
  v: { guestName?: string | null; link: string; info: ShareInfo },
): string {
  const values: Record<string, string> = {
    "{nama_tamu}": v.guestName?.trim() || DEFAULT_GUEST,
    "{link}": v.link,
    "{nama_acara}": v.info.names,
    "{tanggal}": v.info.dateLabel,
  };
  return template.replace(/\{(nama_tamu|link|nama_acara|tanggal)\}/g, (k) => values[k]);
}

/**
 * Nomor WA → format internasional tanpa "+" (08xx → 628xx). null bila kosong
 * atau tidak masuk akal.
 */
export function normalizeWaNumber(raw: string): string | null {
  let d = raw.replace(/[^\d+]/g, "");
  if (!d) return null;
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("0")) d = `62${d.slice(1)}`;
  else if (d.startsWith("8")) d = `62${d}`;
  return /^\d{8,15}$/.test(d) ? d : null;
}

/** Link wa.me: dengan nomor → langsung ke chat tamu; tanpa nomor → pilih kontak. */
export function waLink(message: string, phone?: string | null): string {
  return `https://wa.me/${phone ?? ""}?text=${encodeURIComponent(message)}`;
}
