import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/PageHeader";
import { requireAdmin } from "@/lib/auth-guard";
import { getSettings } from "@/lib/settings";

import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Pengaturan" };

/** Pengaturan global super admin. */
export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSettings();
  return (
    <>
      <PageHeader title="Pengaturan" description="Berlaku global untuk semua pembeli." />
      <SettingsForm initial={settings} />
    </>
  );
}
