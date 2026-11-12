/**
 * Bersihkan file upload yang tertinggal (lihat cleanupMedia di
 * src/lib/media/service.ts). Manual: pnpm media:cleanup
 * Terjadwal: GET /api/cron/media-cleanup dengan Authorization: Bearer $CRON_SECRET.
 */
import { cleanupMedia } from "../src/lib/media/service";

cleanupMedia()
  .then((r) => {
    console.log("Pembersihan media:", r);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
