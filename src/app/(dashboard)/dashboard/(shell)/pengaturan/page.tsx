import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth-guard";
import { getSettings } from "@/lib/settings";

import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Pengaturan" };

/** Pengaturan global super admin. */
export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSettings();
  return (
    <section>
      <Link href="/dashboard" className="text-muted-foreground text-sm hover:underline">
        ← Dashboard
      </Link>
      <h1 className="font-heading mt-1 text-3xl">Pengaturan</h1>
      <p className="text-muted-foreground mt-1 text-sm">Berlaku global untuk semua pembeli.</p>
      <SettingsForm initial={settings} />
    </section>
  );
}
