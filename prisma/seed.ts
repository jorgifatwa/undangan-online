/**
 * Seed data awal. Jalankan: pnpm db:seed (idempoten).
 *
 * Koleksi musik bawaan = 3 musik placeholder tema (public/placeholders/music,
 * AAC 96 kbps hasil `pnpm music:optimize`, kredit di CREDITS.md).
 * PLACEHOLDER: wajib diganti perpustakaan musik berlisensi komersial sebelum
 * peluncuran publik (docs/TAHAP-2.md). Baris lama berisi URL contoh
 * (example.com) dinonaktifkan.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const tracks = [
  {
    title: "Romantic Wedding Acoustic Guitar",
    artist: "Tunetank",
    url: "/placeholders/music/renda-rimba.m4a",
    category: "romantis",
    sortOrder: 1,
  },
  {
    title: "Wedding Music",
    artist: "ikoliks",
    url: "/placeholders/music/tirai-beludru.m4a",
    category: "romantis",
    sortOrder: 2,
  },
  {
    title: "Kids School - Happy Birthday Music",
    artist: "SigmaMusicArt",
    url: "/placeholders/music/confetti-party.m4a",
    category: "anak",
    sortOrder: 3,
  },
];

async function main() {
  const off = await db.musicTrack.updateMany({
    where: { url: { startsWith: "https://example.com/" } },
    data: { isActive: false },
  });
  for (const t of tracks) {
    const existing = await db.musicTrack.findFirst({ where: { url: t.url } });
    if (existing)
      await db.musicTrack.update({ where: { id: existing.id }, data: { ...t, isActive: true } });
    else await db.musicTrack.create({ data: t });
  }
  console.log(`MusicTrack: ${tracks.length} aktif, ${off.count} contoh lama dinonaktifkan.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
