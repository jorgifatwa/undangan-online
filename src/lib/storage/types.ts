/** Kontrak driver penyimpanan (local / R2). Key memakai "/" sebagai pemisah. */
export interface UploadTarget {
  /** URL tujuan PUT file mentah dari browser. */
  url: string;
  method: "PUT";
  /** Header yang WAJIB dikirim browser (mis. Content-Type yang ikut ditandatangani). */
  headers: Record<string, string>;
}

export interface StoredObject {
  key: string;
  size: number;
  lastModified: Date;
}

export interface StorageDriver {
  readonly name: "local" | "r2";
  /** Target upload langsung dari browser untuk file mentah. */
  createUploadTarget(key: string, contentType: string, maxBytes: number): Promise<UploadTarget>;
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  size(key: string): Promise<number | null>;
  delete(key: string): Promise<void>;
  /** URL publik file final (dipakai di data undangan). */
  publicUrl(key: string): string;
  /** key dari URL publik milik driver ini (null bila bukan). */
  keyFromUrl(url: string): string | null;
  /** Daftar objek dengan prefix (untuk pembersihan file mentah). */
  list(prefix: string): Promise<StoredObject[]>;
}
