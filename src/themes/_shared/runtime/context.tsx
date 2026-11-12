"use client";

import { createContext, useContext } from "react";

import type { AnyInvitationData } from "@/schemas/sections";

import type { ColorVariant, ThemeManifest } from "../../types";

export interface WishItem {
  /** Id dari database (halaman publik); kosong untuk data contoh/preview. */
  id?: string;
  name: string;
  message: string;
  /** ISO string */
  createdAt: string;
  attendance?: "HADIR" | "TIDAK_HADIR" | "RAGU";
}

export interface InvitationContextValue {
  inv: AnyInvitationData;
  manifest: ThemeManifest;
  variant: ColorVariant;
  guestName: string | null;
  preview: boolean;
  /** Mode ringan aktif (perangkat lemah, Save-Data, atau ?lite=1). */
  lite: boolean;
  /** Cover sudah dibuka. */
  opened: boolean;
  /** Ucapan awal (dari DB atau data dummy preview). */
  wishes: WishItem[];
  showToast: (message: string) => void;
}

export const InvitationContext = createContext<InvitationContextValue | null>(null);

export function useInvitation(): InvitationContextValue {
  const ctx = useContext(InvitationContext);
  if (!ctx) throw new Error("useInvitation harus dipakai di dalam ThemeRoot");
  return ctx;
}

/**
 * true bila cover sudah dibuka. Di luar ThemeRoot (mis. /preview/ornamen)
 * dianggap selalu terbuka.
 */
export function useOpened(): boolean {
  return useContext(InvitationContext)?.opened ?? true;
}

/** Shortcut untuk komponen efek yang hanya butuh status mode ringan. */
export function useLite(): boolean {
  return useContext(InvitationContext)?.lite ?? false;
}
