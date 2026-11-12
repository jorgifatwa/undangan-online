import "server-only";

import { localDriver } from "./local";
import { r2Driver } from "./r2";
import type { StorageDriver } from "./types";

export type { StorageDriver, UploadTarget } from "./types";

/** Driver aktif dari STORAGE_DRIVER (.env): "local" (default) atau "r2". */
export function storage(): StorageDriver {
  return process.env.STORAGE_DRIVER === "r2" ? r2Driver : localDriver;
}

/**
 * Route lokal (/media, /api/upload/local) hanya hidup bila driver "local" DAN
 * bukan production. Di production semua request ke route itu → 404.
 */
export function localRoutesEnabled(): boolean {
  return process.env.STORAGE_DRIVER !== "r2" && process.env.NODE_ENV !== "production";
}
