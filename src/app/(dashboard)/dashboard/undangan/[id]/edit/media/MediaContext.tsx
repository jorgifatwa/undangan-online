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
  galleryLimit: number;
  /** Lagu unggahan sendiri maksimal per undangan. */
  musicLimit: number;
  releaseUrl: (url: string) => void;
  saveSoon: () => void;
  /**
   * Diisi = unggah foto/musik belum bisa (mis. form pemesanan website yang
   * hanya disimpan di browser); field menampilkan pesan ini.
   */
  uploadsDisabled?: string;
}

/** Catatan pengganti tombol unggah saat `uploadsDisabled`. */
export function UploadsDisabledNote({ message }: { message: string }) {
  return (
    <p className="text-muted-foreground rounded-md bg-neutral-100 px-2.5 py-1.5 text-xs">
      {message}
    </p>
  );
}

export const MediaContext = createContext<MediaCtx | null>(null);

export function useMedia(): MediaCtx {
  const c = useContext(MediaContext);
  if (!c) throw new Error("useMedia di luar editor");
  return c;
}
