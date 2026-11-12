import type { PackageFeatures } from "@/lib/packages";

import type { BirthdayData } from "./birthday";
import type { WeddingData } from "./wedding";

/**
 * Daftar section undangan. Urutan & visibilitas per undangan disimpan di
 * data.sections; tema menyatakan section mana yang didukungnya di manifest.
 */
export const SECTION_IDS = [
  "cover",
  "salam",
  "ayat",
  "profil",
  "loveStory",
  "acara",
  "hitungMundur",
  "maps",
  "dressCode",
  "liveStream",
  "galeri",
  "rsvp",
  "ucapan",
  "amplop",
  "penutup",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export const SECTION_LABELS: Record<SectionId, string> = {
  cover: "Cover",
  salam: "Pembuka / Salam",
  ayat: "Kutipan Ayat",
  profil: "Profil",
  loveStory: "Love Story",
  acara: "Detail Acara",
  hitungMundur: "Hitung Mundur",
  maps: "Peta Lokasi",
  dressCode: "Dress Code",
  liveStream: "Live Streaming",
  galeri: "Galeri",
  rsvp: "RSVP",
  ucapan: "Ucapan & Doa",
  amplop: "Amplop Digital & Hadiah",
  penutup: "Penutup",
};

export const DEFAULT_SECTION_ORDER: Record<"WEDDING" | "BIRTHDAY", SectionId[]> = {
  WEDDING: [
    "cover",
    "ayat",
    "salam",
    "profil",
    "loveStory",
    "acara",
    "hitungMundur",
    "maps",
    "dressCode",
    "liveStream",
    "amplop",
    "rsvp",
    "ucapan",
    "galeri",
    "penutup",
  ],
  BIRTHDAY: [
    "cover",
    "salam",
    "profil",
    "acara",
    "hitungMundur",
    "maps",
    "dressCode",
    "galeri",
    "rsvp",
    "ucapan",
    "amplop",
    "penutup",
  ],
};

export type AnyInvitationData =
  { eventType: "WEDDING"; data: WeddingData } | { eventType: "BIRTHDAY"; data: BirthdayData };

/**
 * true jika section tidak punya data untuk ditampilkan → disembunyikan otomatis.
 * Section interaktif (rsvp, ucapan) dan struktural (cover, salam, penutup,
 * profil, acara, hitungMundur) selalu punya isi minimal dari field wajib.
 */
export function isSectionEmpty(id: SectionId, inv: AnyInvitationData): boolean {
  const d = inv.data;
  switch (id) {
    case "ayat":
      return !d.quote?.arabic && !d.quote?.translation;
    case "loveStory":
      return inv.eventType !== "WEDDING" || inv.data.loveStory.length === 0;
    case "maps":
      return !d.events.some((e) => e.mapsUrl || e.address);
    case "dressCode":
      return !d.dressCode?.text && !(d.dressCode?.colors.length ?? 0);
    case "liveStream":
      return !d.liveStream?.url;
    case "galeri":
      return d.gallery.length === 0;
    case "amplop": {
      const g = d.gift;
      const hasGift = Boolean(g && (g.accounts.length || g.qris || g.physical));
      const hasWishlist = inv.eventType === "BIRTHDAY" && inv.data.wishlist.length > 0;
      return !hasGift && !hasWishlist;
    }
    default:
      return false;
  }
}

/**
 * Section yang membutuhkan fitur paket tertentu. Dicek di server saat
 * merender undangan asli (preview mengabaikan pembatasan paket).
 */
export const SECTION_FEATURE: Partial<Record<SectionId, keyof PackageFeatures>> = {
  maps: "maps",
  rsvp: "rsvp",
  ucapan: "wishes",
  amplop: "digitalEnvelope",
};

/**
 * Hitung urutan akhir section: urutan dari data (jika ada) → filter dukungan
 * tema → filter visibilitas user → filter paket → filter data kosong.
 * Section yang didukung tema tapi belum tercantum di data.sections ditambahkan
 * di posisi default-nya (agar section baru di tema tidak hilang).
 *
 * `locked` (manifest.lockedSections): section yang dikunci tema selalu tepat
 * setelah cover dengan urutan manifest, TIDAK bisa disembunyikan user dan
 * tidak disembunyikan walau datanya kosong (tema yang menangani data kosong),
 * mis. kartu ayat Tirai Beludru yang menjadi tujuan transisi amplop.
 */
export function resolveSections(
  inv: AnyInvitationData,
  supported: readonly SectionId[],
  features: PackageFeatures | null,
  locked: readonly SectionId[] = [],
): SectionId[] {
  const defaults = DEFAULT_SECTION_ORDER[inv.eventType];
  const configured = inv.data.sections.filter((s): s is { id: SectionId; visible: boolean } =>
    (SECTION_IDS as readonly string[]).includes(s.id),
  );

  let order: SectionId[];
  if (configured.length === 0) {
    order = [...defaults];
  } else {
    order = configured.map((s) => s.id);
    for (const id of defaults) if (!order.includes(id)) order.push(id);
  }

  // Section terkunci: dipindah tepat setelah cover sesuai urutan manifest.
  const lockedSet = new Set(locked);
  const rest = order.filter((id) => id !== "cover" && !lockedSet.has(id));
  order = [...(order.includes("cover") ? (["cover"] as SectionId[]) : []), ...locked.filter((id) => id !== "cover"), ...rest];

  const hidden = new Set(configured.filter((s) => !s.visible).map((s) => s.id));

  return order.filter((id) => {
    if (!supported.includes(id)) return false;
    const feature = SECTION_FEATURE[id];
    if (features && feature && !features[feature]) return false;
    if (lockedSet.has(id)) return true;
    if (hidden.has(id) && id !== "cover") return false;
    return !isSectionEmpty(id, inv);
  });
}

/** true jika section dikunci tema (editor tidak boleh memindah/menyembunyikannya). */
export function isSectionLocked(id: SectionId, locked: readonly SectionId[] = []): boolean {
  return id === "cover" || locked.includes(id);
}
