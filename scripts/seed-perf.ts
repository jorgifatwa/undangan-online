/**
 * Undangan TERBIT berisi data contoh untuk uji performa halaman publik
 * (/u/perf-{tema}). Development/staging saja: pnpm seed:perf
 */
import { PrismaClient, type Prisma } from "@prisma/client";

import { dummyFor } from "../src/themes/_shared/dummy";
import { THEME_MANIFESTS } from "../src/themes/registry.generated";

const db = new PrismaClient();

async function main() {
  const owner = await db.user.upsert({
    where: { email: "perf@test.local" },
    update: {},
    create: { email: "perf@test.local", name: "Uji Performa" },
  });
  for (const m of THEME_MANIFESTS) {
    const eventType = m.eventTypes[0];
    const inv = dummyFor(eventType, m.defaultMusic);
    const slug = `perf-${m.id}`;
    await db.invitation.upsert({
      where: { slug },
      update: {
        data: inv.data as unknown as Prisma.InputJsonValue,
        themeId: m.id,
        status: "PUBLISHED",
      },
      create: {
        userId: owner.id,
        slug,
        eventType,
        themeId: m.id,
        package: "EXCLUSIVE", // tanpa watermark & masa aktif — ukur tema murni
        status: "PUBLISHED",
        publishedAt: new Date(),
        data: inv.data as unknown as Prisma.InputJsonValue,
      },
    });
    console.log(`  /u/${slug}`);
  }
  await db.$disconnect();
}
main();
