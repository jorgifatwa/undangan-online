import type { PackageTier } from "@prisma/client";
import type { ComponentType, ReactNode } from "react";

import type { PackageFeatures } from "@/lib/packages";
import type { SupportedEventType } from "@/schemas";
import type { AnyInvitationData, SectionId } from "@/schemas/sections";

import type { ThemeAssets } from "./_shared/assets";
import type { WishItem } from "./_shared/runtime/context";

export type ThemeCategory = "elegan" | "modern" | "islami" | "adat" | "anak" | "ceria" | "klasik";

export const CATEGORY_LABELS: Record<ThemeCategory, string> = {
  elegan: "Elegan",
  modern: "Modern",
  islami: "Islami",
  adat: "Adat",
  anak: "Anak",
  ceria: "Ceria",
  klasik: "Klasik",
};

/**
 * Token warna tema. Semua memakai prefix --inv- agar tidak bentrok dengan
 * palet website (--primary, --background, dst.). Ornamen & section HANYA
 * membaca token ini, sehingga mengganti varian = mengganti nilai token.
 */
export type ThemeTokens = Record<`--inv-${string}`, string>;

export interface ColorVariant {
  id: string;
  name: string;
  /** 3 warna untuk bulatan contoh di pemilih varian. */
  swatch: readonly [string, string, string];
  tokens: ThemeTokens;
}

export interface ThemeManifest {
  id: string;
  name: string;
  description: string;
  category: ThemeCategory;
  eventTypes: readonly SupportedEventType[];
  /**
   * Paket minimum agar undangan dengan tema ini bisa AKTIF PERMANEN.
   * Semua tema tetap bisa dicoba di paket FREE (3 hari + watermark).
   */
  minPackage: PackageTier;
  /** 2–4 varian; yang pertama adalah default. */
  variants: readonly ColorVariant[];
  /** Section yang didukung tema; section lain tidak pernah dirender. */
  sections: readonly SectionId[];
  /** Thumbnail galeri tema: path gambar, atau gradien CSS sementara. */
  thumbnail: { image?: string; background: string; foreground: string };
  /** Musik bawaan tema bila user belum memilih lagu. */
  defaultMusic?: { url: string; title: string; artist: string };
}

/** Props yang diterima komponen tema (dari halaman undangan / preview). */
export interface ThemeProps {
  invitation: AnyInvitationData;
  variantId?: string;
  /** Fitur paket untuk membatasi section; null = preview (tanpa batasan). */
  features: PackageFeatures | null;
  watermark: boolean;
  /** Nama tamu dari ?to= (sudah dibersihkan di server). */
  guestName: string | null;
  /** Paksa mode ringan (?lite=1). */
  forceLite?: boolean;
  /** Mode preview: tidak menyimpan RSVP/ucapan, toolbar di luar tema. */
  preview?: boolean;
  /** Mulai dari keadaan sudah dibuka (lewati cover). */
  startOpened?: boolean;
  /** Ucapan yang sudah ada (dari DB, atau dummy saat preview). */
  wishes?: WishItem[];
}

export interface CoverProps {
  onOpen: () => void;
}

/** Bagian yang disediakan sebuah tema ke ThemeRoot. */
export interface ThemeDefinition {
  manifest: ThemeManifest;
  /** className dari next/font (variabel font tema). */
  fontClassName: string;
  /** Override section; yang tidak ada memakai section default _shared. */
  sections?: Partial<Record<Exclude<SectionId, "cover">, ComponentType>>;
  Cover?: ComponentType<CoverProps>;
  /** Kontrol musik khusus (mis. piringan hitam); default: tombol melayang. */
  MusicControl?: ComponentType;
  /** Lapisan efek di atas undangan (kelopak, konfeti, dll.). */
  Ambient?: ComponentType<{ opened: boolean }>;
  /** Latar dekoratif desktop di sisi kolom 440px. */
  Backdrop?: ComponentType;
  /** Aset asli per slot (hasil `pnpm assets:sync`); slot tanpa aset → versi SVG. */
  assets?: ThemeAssets;
  /** Elemen pembungkus tambahan (mis. style global tema). */
  children?: ReactNode;
}
