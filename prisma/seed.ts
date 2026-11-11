/**
 * Seed data awal. Jalankan: pnpm db:seed
 * URL musik masih placeholder — ganti dengan file di R2 setelah tahap upload.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const tracks = [
  { title: "Instrumental Romantis 1", category: "romantis", sortOrder: 1 },
  { title: "Instrumental Romantis 2", category: "romantis", sortOrder: 2 },
  { title: "Nasyid Pernikahan", category: "islami", sortOrder: 3 },
  { title: "Piano Lembut", category: "instrumental", sortOrder: 4 },
  { title: "Selamat Ulang Tahun (Ceria)", category: "anak", sortOrder: 5 },
];

async function main() {
  // Idempotent: hanya isi jika tabel masih kosong.
  if ((await db.musicTrack.count()) > 0) {
    console.log("MusicTrack sudah berisi, seed dilewati.");
    return;
  }
  await db.musicTrack.createMany({
    data: tracks.map((t, i) => ({ ...t, url: `https://example.com/music/track-${i + 1}.mp3` })),
  });
  console.log(`Seed ${tracks.length} MusicTrack selesai.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
