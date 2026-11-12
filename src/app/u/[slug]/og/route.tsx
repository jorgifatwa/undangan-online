import { ImageResponse } from "next/og";
import sharp from "sharp";

import { getPublicInvitation } from "@/lib/invitations/public";
import { shareInfo } from "@/lib/invitations/share";
import { coverPhotoDataUri } from "@/lib/og/photo";
import { genericOg, invitationOg, OG_SIZE } from "@/lib/og/render";
import { parseInvitationData } from "@/schemas";
import { getManifest } from "@/themes/registry";

/**
 * Gambar pratinjau link undangan (og:image). URL di metadata membawa ?v={versi}
 * (waktu ubah terakhir) → setiap perubahan menghasilkan URL baru, sehingga
 * cache CDN aman dan WhatsApp mengambil gambar terbaru untuk link yang baru
 * dibagikan. Undangan kedaluwarsa → gambar umum tanpa data pribadi.
 *
 * Satori menghasilkan PNG ±240 KB (gradien sulit dikompres) — mendekati batas
 * ±300 KB yang aman untuk pratinjau WhatsApp — jadi diubah ke JPEG (target < 150 KB,
 * termasuk versi dengan foto cover).
 */
export const runtime = "nodejs";

const HEADERS = {
  "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const inv = await getPublicInvitation(slug);
  if (!inv) return new Response("Tidak ditemukan", { status: 404, headers: HEADERS });

  const parsed = parseInvitationData(inv.eventType, inv.data);
  const manifest = getManifest(inv.themeId);
  const ok = inv.active && parsed.ok && manifest;
  const cover =
    ok && parsed.ok
      ? parsed.value.eventType === "WEDDING"
        ? parsed.value.data.photos.cover
        : parsed.value.data.celebrant.photo
      : undefined;
  const { node, fonts } =
    ok && parsed.ok && manifest
      ? await invitationOg(
          shareInfo(parsed.value),
          {
            id: manifest.id,
            background: manifest.thumbnail.background,
            foreground: manifest.thumbnail.foreground,
          },
          await coverPhotoDataUri(cover),
        )
      : await genericOg();
  const png = Buffer.from(await new ImageResponse(node, { ...OG_SIZE, fonts }).arrayBuffer());
  const jpg = await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpg), {
    headers: { ...HEADERS, "Content-Type": "image/jpeg", "Content-Length": String(jpg.length) },
  });
}
