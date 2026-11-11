import type { EventType, PackageTier } from "@prisma/client";

/**
 * Definisi paket: SUMBER KEBENARAN untuk harga & batasan fitur.
 * Semua pengecekan fitur di server action / route handler WAJIB memakai
 * helper di file ini (jangan hanya menyembunyikan tombol di UI).
 */

export interface PackageFeatures {
  /** Masa aktif dalam hari sejak publish; null = permanen. */
  activeDays: number | null;
  watermark: boolean;
  /** Tingkat tema yang boleh dipakai (dicocokkan dengan manifest.minPackage). */
  maxThemeTier: PackageTier;
  /** Batas foto galeri; null = tanpa batas. */
  galleryLimit: number | null;
  maps: boolean;
  rsvp: boolean;
  wishes: boolean;
  personalGuestNames: boolean;
  guestImportExcel: boolean;
  bulkWhatsapp: boolean;
  digitalEnvelope: boolean;
  qrCheckIn: boolean;
  privateMode: boolean;
  interactiveThemes: boolean;
  prioritySupport: boolean;
}

export interface PackageDefinition {
  tier: PackageTier;
  label: string;
  /** Harga per jenis acara (rupiah). Tidak ada entri = paket tidak dijual untuk jenis itu. */
  prices: Partial<Record<EventType, number>>;
  features: PackageFeatures;
}

/** Urutan tingkat paket, dipakai untuk perbandingan "minimal paket X". */
export const PACKAGE_ORDER: readonly PackageTier[] = ["FREE", "BASIC", "PREMIUM", "EXCLUSIVE"];

const BASE_FREE: PackageFeatures = {
  activeDays: 3,
  watermark: true,
  maxThemeTier: "FREE",
  galleryLimit: 6,
  maps: true,
  rsvp: true,
  wishes: true,
  personalGuestNames: false,
  guestImportExcel: false,
  bulkWhatsapp: false,
  digitalEnvelope: false,
  qrCheckIn: false,
  privateMode: false,
  interactiveThemes: false,
  prioritySupport: false,
};

const BASIC: PackageFeatures = {
  ...BASE_FREE,
  activeDays: null,
  watermark: false,
  maxThemeTier: "BASIC",
  galleryLimit: null,
};

const PREMIUM: PackageFeatures = {
  ...BASIC,
  maxThemeTier: "PREMIUM",
  personalGuestNames: true,
  guestImportExcel: true,
  bulkWhatsapp: true,
  digitalEnvelope: true,
  qrCheckIn: true,
  privateMode: true,
};

const EXCLUSIVE: PackageFeatures = {
  ...PREMIUM,
  maxThemeTier: "EXCLUSIVE",
  interactiveThemes: true,
  prioritySupport: true,
};

export const PACKAGES: Record<PackageTier, PackageDefinition> = {
  FREE: { tier: "FREE", label: "Gratis", prices: { WEDDING: 0, BIRTHDAY: 0 }, features: BASE_FREE },
  BASIC: {
    tier: "BASIC",
    label: "Basic",
    prices: { WEDDING: 69_000, BIRTHDAY: 39_000 },
    features: BASIC,
  },
  PREMIUM: {
    tier: "PREMIUM",
    label: "Premium",
    prices: { WEDDING: 129_000, BIRTHDAY: 69_000 },
    features: PREMIUM,
  },
  EXCLUSIVE: {
    tier: "EXCLUSIVE",
    label: "Exclusive",
    // TODO: harga Exclusive untuk ulang tahun belum ditentukan → belum dijual.
    prices: { WEDDING: 249_000 },
    features: EXCLUSIVE,
  },
};

/** true jika `tier` >= `minimum`. */
export function isTierAtLeast(tier: PackageTier, minimum: PackageTier): boolean {
  return PACKAGE_ORDER.indexOf(tier) >= PACKAGE_ORDER.indexOf(minimum);
}

export function getFeatures(tier: PackageTier): PackageFeatures {
  return PACKAGES[tier].features;
}

/** Harga paket untuk jenis acara; null jika tidak dijual. */
export function getPrice(tier: PackageTier, eventType: EventType): number | null {
  return PACKAGES[tier].prices[eventType] ?? null;
}

type BooleanFeature = {
  [K in keyof PackageFeatures]: PackageFeatures[K] extends boolean ? K : never;
}[keyof PackageFeatures];

export class FeatureNotAllowedError extends Error {
  constructor(
    public readonly feature: BooleanFeature,
    public readonly tier: PackageTier,
  ) {
    super(`Fitur "${feature}" tidak tersedia di paket ${PACKAGES[tier].label}.`);
    this.name = "FeatureNotAllowedError";
  }
}

/** Guard sisi server: lempar error jika paket tidak punya fitur tersebut. */
export function assertFeature(tier: PackageTier, feature: BooleanFeature): void {
  if (!getFeatures(tier)[feature]) throw new FeatureNotAllowedError(feature, tier);
}
