import { getManifest, THEME_MANIFESTS } from "@/themes/registry";

import { getAddon } from "./addons";

/**
 * MODEL HARGA: per TEMA, sekali bayar PER UNDANGAN (bukan per akun).
 *  - Harga tema dibaca dari manifest tema (satu-satunya sumber).
 *  - Satu harga = SEMUA fitur inti. Kapasitas/fitur berbiaya → add-on.
 *  - Masa uji: semua tema bisa dipakai 3 hari sejak terbit pertama + watermark.
 *  - Ganti tema setelah membeli: ke tema yang sudah dimiliki / harga ≤ kredit
 *    gratis (tanpa pengembalian dana); lebih mahal → bayar selisih.
 * Semua pengecekan server WAJIB memakai helper di sini (bukan hanya UI).
 */

export const TRIAL_DAYS = 3;

/** Masa aktif setelah tema dibeli — satu-satunya sumber kalimat untuk website. */
export const PAID_ACTIVE = {
  months: 12,
  short: "Aktif 12 bulan setelah acara",
  long: "Aktif minimal 12 bulan setelah tanggal acara, dan tetap dapat diakses setelahnya selama layanan berjalan.",
} as const;

/** Batas yang DITAMPILKAN ke pengguna (sama untuk masa uji & sudah dibeli). */
export const LIMITS = {
  /** Foto galeri per undangan (cover, profil, strip, penutup tidak dihitung). */
  galleryPhotos: 12,
  /** Lagu yang diunggah sendiri per undangan (koleksi bawaan tidak dihitung). */
  customMusicTracks: 3,
} as const;

/**
 * Kuota penyimpanan per undangan — pengaman anti-penyalahgunaan di server saja,
 * TIDAK ditampilkan sebagai fitur. Pengguna normal tidak akan mencapainya.
 */
export const STORAGE_QUOTA_MB = { trial: 50, paid: 100 } as const;

/** Bentuk minimal undangan yang dibutuhkan helper harga. */
export interface PurchaseState {
  themeId: string;
  purchasedAt: Date | string | null;
  themeCredit: number;
  ownedThemeIds: readonly string[];
}

export interface AddonHolding {
  addonId: string;
  quantity: number;
}

export function themePrice(themeId: string): number | null {
  return getManifest(themeId)?.price ?? null;
}

export function isPurchased(inv: Pick<PurchaseState, "purchasedAt">): boolean {
  return !!inv.purchasedAt;
}

/** Tema boleh dipakai (aktif penuh) tanpa bayar lagi? */
export function ownsTheme(inv: PurchaseState, themeId: string): boolean {
  if (!isPurchased(inv)) return false;
  if (inv.ownedThemeIds.includes(themeId)) return true;
  const price = themePrice(themeId);
  return price !== null && price <= inv.themeCredit;
}

export interface Entitlements {
  /** true = masa uji (belum membeli tema). */
  trial: boolean;
  watermark: boolean;
  /** Tema yang sedang dipakai sudah dibayar (aktif penuh). */
  themePaid: boolean;
  rsvp: boolean;
  wishes: boolean;
  maps: boolean;
  /**
   * Amplop digital (rekening/QRIS) TAMPIL di halaman publik hanya setelah
   * tema dibeli (anti-penipuan); isiannya tetap bisa diisi & dipratinjau.
   */
  digitalEnvelope: boolean;
  customMusic: boolean;
  galleryLimit: number;
  customMusicTracks: number;
  /** Pengaman server, tidak ditampilkan. */
  storageQuotaMb: number;
}

/** Hak pakai undangan ini (dipakai server: halaman publik, upload, editor). */
export function getEntitlements(
  inv: PurchaseState,
  addons: readonly AddonHolding[] = [],
): Entitlements {
  const trial = !isPurchased(inv);
  const extraGallery = addons.reduce(
    (n, a) => n + (getAddon(a.addonId)?.effect?.galleryPhotos ?? 0) * a.quantity,
    0,
  );
  return {
    trial,
    watermark: trial,
    themePaid: ownsTheme(inv, inv.themeId),
    rsvp: true,
    wishes: true,
    maps: true,
    digitalEnvelope: !trial,
    customMusic: true,
    galleryLimit: LIMITS.galleryPhotos + extraGallery,
    customMusicTracks: LIMITS.customMusicTracks,
    storageQuotaMb: trial ? STORAGE_QUOTA_MB.trial : STORAGE_QUOTA_MB.paid,
  };
}

/** Hak pakai untuk pratinjau tema dengan data contoh (semua terbuka). */
export const PREVIEW_ENTITLEMENTS: Entitlements = {
  trial: false,
  watermark: false,
  themePaid: true,
  rsvp: true,
  wishes: true,
  maps: true,
  digitalEnvelope: true,
  customMusic: true,
  galleryLimit: LIMITS.galleryPhotos,
  customMusicTracks: LIMITS.customMusicTracks,
  storageQuotaMb: STORAGE_QUOTA_MB.paid,
};

/**
 * Biaya memakai tema `targetThemeId` untuk undangan ini:
 *  - "trial"   : belum membeli → bebas ganti; biaya beli = harga tema
 *  - "owned"   : sudah dimiliki / harga ≤ kredit → gratis
 *  - "upgrade" : lebih mahal dari kredit → bayar selisih
 */
export type ThemeQuote =
  | { kind: "trial"; price: number }
  | { kind: "owned"; price: number }
  | { kind: "upgrade"; price: number; amount: number };

export function quoteTheme(inv: PurchaseState, targetThemeId: string): ThemeQuote | null {
  const price = themePrice(targetThemeId);
  if (price === null) return null;
  if (!isPurchased(inv)) return { kind: "trial", price };
  if (ownsTheme(inv, targetThemeId)) return { kind: "owned", price };
  return { kind: "upgrade", price, amount: price - inv.themeCredit };
}

/** Item pesanan (siap Midtrans): beli tema / selisih upgrade / add-on. */
export interface OrderLine {
  kind: "THEME" | "THEME_UPGRADE" | "ADDON";
  refId: string;
  label: string;
  unitPrice: number;
  qty: number;
  amount: number;
}

export class PricingError extends Error {}

/**
 * Susun item pesanan untuk undangan ini. `themeId` = tema yang ingin dipakai
 * (default tema saat ini). Lempar PricingError bila tidak ada yang perlu dibayar
 * atau item belum dijual.
 */
export function buildOrderLines(
  inv: PurchaseState,
  opts: { themeId?: string; addons?: { addonId: string; qty: number }[] } = {},
): OrderLine[] {
  const lines: OrderLine[] = [];
  const themeId = opts.themeId ?? inv.themeId;
  const manifest = getManifest(themeId);
  if (!manifest) throw new PricingError("Tema tidak ditemukan.");
  const q = quoteTheme(inv, themeId)!;
  if (q.kind === "trial")
    lines.push({
      kind: "THEME",
      refId: themeId,
      label: `Tema ${manifest.name}`,
      unitPrice: q.price,
      qty: 1,
      amount: q.price,
    });
  else if (q.kind === "upgrade")
    lines.push({
      kind: "THEME_UPGRADE",
      refId: themeId,
      label: `Ganti ke tema ${manifest.name} (selisih harga)`,
      unitPrice: q.amount,
      qty: 1,
      amount: q.amount,
    });
  for (const a of opts.addons ?? []) {
    const def = getAddon(a.addonId);
    if (!def) throw new PricingError("Add-on tidak ditemukan.");
    if (def.price === null) throw new PricingError(`${def.label} belum tersedia.`);
    const qty = Math.max(1, Math.floor(a.qty));
    lines.push({
      kind: "ADDON",
      refId: def.id,
      label: def.label,
      unitPrice: def.price,
      qty,
      amount: def.price * qty,
    });
  }
  if (!lines.length) throw new PricingError("Tidak ada yang perlu dibayar.");
  return lines;
}

/** Status baru undangan setelah pesanan dengan item ini LUNAS. */
export function applyOrderLines(
  inv: PurchaseState,
  lines: readonly Pick<OrderLine, "kind" | "refId" | "amount" | "qty">[],
  now = new Date(),
) {
  let themeId = inv.themeId;
  let credit = inv.themeCredit;
  const owned = new Set(inv.ownedThemeIds);
  const addons: AddonHolding[] = [];
  for (const l of lines) {
    if (l.kind === "THEME" || l.kind === "THEME_UPGRADE") {
      credit += l.amount;
      owned.add(l.refId);
      themeId = l.refId;
    } else addons.push({ addonId: l.refId, quantity: l.qty });
  }
  return {
    themeId,
    purchasedAt: inv.purchasedAt ? new Date(inv.purchasedAt) : now,
    themeCredit: credit,
    ownedThemeIds: [...owned],
    /** Tema dibeli → tidak lagi kedaluwarsa (PAID_ACTIVE). */
    expiresAt: null as Date | null,
    addons,
  };
}

/** Tema termurah & termahal (untuk teks "mulai Rp…"). */
export function priceRange() {
  const prices = THEME_MANIFESTS.map((m) => m.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
