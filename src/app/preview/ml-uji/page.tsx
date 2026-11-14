import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MlUji } from "./MlUji";

export const metadata: Metadata = { title: "Uji ML", robots: { index: false } };

/** Alat uji ML editor (deteksi wajah & hapus latar) — HANYA development / e2e. */
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <MlUji />;
}
