import type { Metadata } from "next";

import { THEME_MANIFESTS } from "@/themes/registry";

import { Wizard } from "./Wizard";

export const metadata: Metadata = { title: "Buat Undangan" };

/** Wizard 3 langkah: jenis acara → data dasar → pilih tema. Login dicek di layout /dashboard. */
export default function NewInvitationPage() {
  return <Wizard themes={[...THEME_MANIFESTS]} />;
}
