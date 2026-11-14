/** Pesan editor ↔ Web Worker ML (src/lib/ml/ml.worker.ts). */
export type MlRequest =
  | { id: number; type: "face"; bitmap: ImageBitmap }
  | { id: number; type: "cutout"; bitmap: ImageBitmap; mode: "modnet" | "lite" };

/** Kepala terbesar (persen relatif foto): puncak kepala, lebar wajah, kemiringan. */
export interface FaceResult {
  x: number;
  y: number;
  w: number;
  r: number;
  faces: number;
}

export interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type MlResponse =
  | { id: number; type: "face"; face: FaceResult | null }
  | { id: number; type: "progress"; progress: number }
  | { id: number; type: "fallback"; reason: string }
  | {
      id: number;
      type: "cutout";
      blob: Blob;
      /** potongan subjek (persen relatif foto asal) */
      crop: CropBox;
      mode: "modnet" | "lite";
      ms: number;
    }
  | { id: number; type: "error"; error: string };
