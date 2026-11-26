import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/** Catat waktu & hasil terakhir sebuah cron (ditampilkan di halaman Sistem). */
export async function markCronRun(name: string, result: unknown) {
  const value = { at: new Date().toISOString(), result } as Prisma.InputJsonValue;
  await db.appSetting
    .upsert({
      where: { key: `cron:${name}` },
      create: { key: `cron:${name}`, value },
      update: { value },
    })
    .catch(() => undefined);
}

export async function cronRuns() {
  const rows = await db.appSetting.findMany({ where: { key: { startsWith: "cron:" } } });
  return Object.fromEntries(
    rows.map((r) => [r.key.slice(5), r.value as { at: string; result: unknown }]),
  );
}
