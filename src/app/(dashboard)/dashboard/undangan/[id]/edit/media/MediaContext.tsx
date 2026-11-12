"use client";

import { createContext, useContext } from "react";

/**
 * Jembatan field foto/musik ↔ editor:
 *  - releaseUrl: file lama (diganti/dihapus) DIHAPUS dari penyimpanan setelah
 *    data tanpa file itu tersimpan (bukan sebelumnya → halaman publik tidak rusak)
 *  - saveSoon: simpan segera (tanpa menunggu jeda 2 dtk) setelah upload/hapus
 */
export interface MediaCtx {
  invitationId: string;
  galleryLimit: number | null;
  customMusic: boolean;
  packageLabel: string;
  releaseUrl: (url: string) => void;
  saveSoon: () => void;
}

export const MediaContext = createContext<MediaCtx | null>(null);

export function useMedia(): MediaCtx {
  const c = useContext(MediaContext);
  if (!c) throw new Error("useMedia di luar editor");
  return c;
}
