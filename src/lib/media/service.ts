import "server-only";

import type { Media, PackageTier, Prisma } from "@prisma/client";

import { MEDIA_RETENTION_DAYS } from "@/lib/invitations/retention";

import { db } from "@/lib/db";
import { getFeatures } from "@/lib/packages";
import { storage } from "@/lib/storage";

import { transcodeToAac } from "./audio";
import { stripMediaUrls } from "./strip";
import { detectFile } from "./detect";
import { MediaError, processPhoto } from "./image";
import {
  MAX_AUDIO_BYTES,
  MAX_PENDING_UPLOADS,
  MAX_PHOTO_BYTES,
  PHOTO_MAX_SIDE,
  PHOTO_SLOTS,
  mb,
  type PhotoSlot,
} from "./limits";

/**
 * Layanan upload foto & musik. SATU tempat untuk semua aturan:
 * pemilik undangan, fitur & kuota paket, jumlah foto galeri, tipe file dari
 * magic bytes, batas dimensi, file mentah → final, penghapusan.
 *
 * Alur: requestUpload → browser PUT file mentah → finalizePhoto (sinkron)
 *        atau markAudioUploaded → processAudio (route terpisah, asinkron).
 */

/** Galat yang ditampilkan ke user; `code` dipakai UI untuk menawarkan upgrade. */
export class UploadError extends Error {
  constructor(
    message: string,
    public readonly code:
      "QUOTA" | "GALLERY_LIMIT" | "FEATURE" | "INVALID" | "NOT_FOUND" = "INVALID",
  ) {
    super(message);
  }
}

const rawKey = (userId: string, mediaId: string) => `raw/${userId}/${mediaId}`;
const finalKey = (invitationId: string, mediaId: string, ext: string) =>
  `m/${invitationId}/${mediaId}.${ext}`;

/**
 * Pemakaian penyimpanan satu UNDANGAN (byte): file final + upload yang sedang
 * berjalan (ukuran yang diumumkan). Kuota mengikuti paket undangan itu.
 */
export async function storageUsage(invitationId: string, pkg: PackageTier) {
  const agg = await db.media.aggregate({
    where: { invitationId, status: { not: "FAILED" } },
    _sum: { bytes: true },
  });
  return { used: agg._sum.bytes ?? 0, quota: getFeatures(pkg).storageQuotaMb * 1024 * 1024 };
}

async function ownedInvitation(userId: string, invitationId: string) {
  const inv = await db.invitation.findFirst({ where: { id: invitationId, userId } });
  if (!inv) throw new UploadError("Undangan tidak ditemukan.", "NOT_FOUND");
  return inv;
}

async function ownedMedia(userId: string, mediaId: string) {
  const m = await db.media.findFirst({ where: { id: mediaId, userId } });
  if (!m) throw new UploadError("File tidak ditemukan.", "NOT_FOUND");
  return m;
}

export interface UploadRequest {
  kind: "PHOTO" | "AUDIO";
  slot: string;
  contentType: string;
  size: number;
  /** Musik sendiri: user mencentang pernyataan hak penggunaan lagu. */
  rightsAccepted?: boolean;
}

export async function requestUpload(userId: string, invitationId: string, req: UploadRequest) {
  const inv = await ownedInvitation(userId, invitationId);
  const features = getFeatures(inv.package);
  const size = Math.floor(Number(req.size));
  if (!Number.isFinite(size) || size <= 0) throw new UploadError("Ukuran file tidak valid.");
  // Content-Type hanya untuk tanda tangan upload; tipe asli dicek dari isi file saat finalize.
  const contentType = /^[\w.+-]+\/[\w.+-]+$/.test(req.contentType)
    ? req.contentType
    : "application/octet-stream";

  if (req.kind === "PHOTO") {
    if (!(PHOTO_SLOTS as readonly string[]).includes(req.slot))
      throw new UploadError("Slot foto tidak dikenal.");
    if (size > MAX_PHOTO_BYTES)
      throw new UploadError(`Foto maksimal ${mb(MAX_PHOTO_BYTES)} per file.`);
    if (req.slot === "gallery" && features.galleryLimit !== null) {
      const count = await db.media.count({
        where: { invitationId, slot: "gallery", kind: "PHOTO", status: { not: "FAILED" } },
      });
      if (count >= features.galleryLimit)
        throw new UploadError(
          `Paket ${inv.package === "FREE" ? "Gratis" : inv.package} maksimal ${features.galleryLimit} foto galeri.`,
          "GALLERY_LIMIT",
        );
    }
  } else {
    if (req.slot !== "music") throw new UploadError("Slot musik tidak dikenal.");
    if (!features.customMusic)
      throw new UploadError("Unggah musik sendiri tersedia mulai paket Basic.", "FEATURE");
    if (!req.rightsAccepted)
      throw new UploadError("Centang pernyataan hak penggunaan lagu terlebih dahulu.");
    if (size > MAX_AUDIO_BYTES)
      throw new UploadError(`Musik maksimal ${mb(MAX_AUDIO_BYTES)} sebelum dikompres.`);
  }

  const pending = await db.media.count({
    where: { userId, status: { in: ["UPLOADING", "PROCESSING"] } },
  });
  if (pending >= MAX_PENDING_UPLOADS)
    throw new UploadError("Terlalu banyak unggahan yang sedang berjalan. Tunggu sebentar.");

  const { used, quota } = await storageUsage(invitationId, inv.package);
  if (used + size > quota)
    throw new UploadError(
      `Kuota penyimpanan undangan ini penuh (${mb(used)} dari ${mb(quota)}). Hapus foto yang tidak dipakai atau tingkatkan paket.`,
      "QUOTA",
    );

  const media = await db.media.create({
    data: {
      userId,
      invitationId,
      kind: req.kind,
      // potongan ulang disimpan sebagai foto galeri biasa (yang lama dihapus editor)
      slot: req.slot === "gallery-crop" ? "gallery" : req.slot,
      status: "UPLOADING",
      bytes: size, // ukuran yang diumumkan, menahan kuota sampai file final jadi
      rightsAcceptedAt: req.kind === "AUDIO" ? new Date() : null,
    },
  });
  const key = rawKey(userId, media.id);
  await db.media.update({ where: { id: media.id }, data: { rawKey: key } });
  const target = await storage().createUploadTarget(
    key,
    contentType,
    req.kind === "PHOTO" ? MAX_PHOTO_BYTES : MAX_AUDIO_BYTES,
  );
  return { mediaId: media.id, target };
}

async function fail(m: Media, message: string) {
  if (m.rawKey)
    await storage()
      .delete(m.rawKey)
      .catch(() => undefined);
  await db.media.update({
    where: { id: m.id },
    data: { status: "FAILED", error: message, rawKey: null, bytes: 0 },
  });
}

/** Ambil file mentah + cek ukuran nyata & tipe dari magic bytes. */
async function readRaw(m: Media, maxBytes: number) {
  if (!m.rawKey) throw new UploadError("File belum diunggah.");
  const actual = await storage().size(m.rawKey);
  if (actual === null) throw new UploadError("File belum selesai diunggah.");
  if (actual > maxBytes) {
    await fail(m, "Ukuran melebihi batas.");
    throw new UploadError(`File melebihi batas ${mb(maxBytes)}.`);
  }
  const buf = await storage().get(m.rawKey);
  if (!buf) throw new UploadError("File belum selesai diunggah.");
  return { buf, detected: detectFile(buf.subarray(0, 64)) };
}

export async function finalizePhoto(userId: string, mediaId: string) {
  const m = await ownedMedia(userId, mediaId);
  if (m.kind !== "PHOTO" || m.status !== "UPLOADING" || !m.invitationId)
    throw new UploadError("Status file tidak valid.");
  const { buf, detected } = await readRaw(m, MAX_PHOTO_BYTES);
  if (detected?.kind === "heic") {
    await fail(m, "HEIC");
    throw new UploadError(
      "Foto HEIC belum bisa diproses server. Ubah ke JPG atau unggah ulang dari browser terbaru.",
    );
  }
  if (detected?.kind !== "image") {
    await fail(m, "Bukan foto");
    throw new UploadError("File ini bukan foto JPG, PNG, WebP, atau AVIF.");
  }
  try {
    const out = await processPhoto(buf, PHOTO_MAX_SIDE[m.slot as PhotoSlot] ?? 1600);
    const key = finalKey(m.invitationId, m.id, "webp");
    await storage().put(key, out.data, "image/webp");
    await storage()
      .delete(m.rawKey!)
      .catch(() => undefined);
    await db.media.update({
      where: { id: m.id },
      data: {
        status: "READY",
        key,
        rawKey: null,
        mime: detected.mime,
        bytes: out.data.length,
        width: out.width,
        height: out.height,
      },
    });
    return { mediaId: m.id, url: storage().publicUrl(key), width: out.width, height: out.height };
  } catch (e) {
    const msg = e instanceof MediaError ? e.message : "Foto gagal diproses.";
    await fail(m, msg);
    throw new UploadError(msg);
  }
}

/** Musik: cek file mentah lalu tandai PROCESSING; kompresi dikerjakan processAudio (route terpisah). */
export async function markAudioUploaded(userId: string, mediaId: string) {
  const m = await ownedMedia(userId, mediaId);
  if (m.kind !== "AUDIO" || m.status !== "UPLOADING")
    throw new UploadError("Status file tidak valid.");
  const { detected } = await readRaw(m, MAX_AUDIO_BYTES);
  if (detected?.kind !== "audio") {
    await fail(m, "Bukan file musik");
    throw new UploadError("File ini bukan musik (MP3, M4A/AAC, WAV, OGG, atau FLAC).");
  }
  await db.media.update({
    where: { id: m.id },
    data: { status: "PROCESSING", mime: detected.mime },
  });
  return { mediaId: m.id };
}

/**
 * Kompres musik ke AAC 96 kbps. Diambil dengan kunci atomik
 * (processingStartedAt) sehingga panggilan ganda tidak memproses dua kali.
 */
export async function processAudio(userId: string, mediaId: string) {
  const claimed = await db.media.updateMany({
    where: { id: mediaId, userId, kind: "AUDIO", status: "PROCESSING", processingStartedAt: null },
    data: { processingStartedAt: new Date() },
  });
  const m = await ownedMedia(userId, mediaId);
  if (claimed.count === 0) return m; // sudah/ sedang diproses
  try {
    const buf = m.rawKey ? await storage().get(m.rawKey) : null;
    if (!buf) throw new Error("File mentah tidak ditemukan");
    const out = await transcodeToAac(buf);
    const key = finalKey(m.invitationId ?? "lepas", m.id, "m4a");
    await storage().put(key, out.data, "audio/mp4");
    await storage()
      .delete(m.rawKey!)
      .catch(() => undefined);
    return await db.media.update({
      where: { id: m.id },
      data: {
        status: "READY",
        key,
        rawKey: null,
        bytes: out.data.length,
        durationSec: out.durationSec,
      },
    });
  } catch {
    await fail(m, "Musik gagal diproses. Pastikan file tidak rusak, lalu coba lagi.");
    return ownedMedia(userId, mediaId);
  }
}

export function mediaView(m: Media) {
  return {
    id: m.id,
    status: m.status,
    error: m.error,
    url: m.key ? storage().publicUrl(m.key) : null,
    durationSec: m.durationSec,
  };
}

/** Hapus file milik user di undangan ini berdasarkan URL publiknya. */
export async function deleteByUrls(userId: string, invitationId: string, urls: string[]) {
  const keys = urls.map((u) => storage().keyFromUrl(u)).filter((k): k is string => !!k);
  if (keys.length === 0) return 0;
  const rows = await db.media.findMany({ where: { userId, invitationId, key: { in: keys } } });
  for (const r of rows) {
    if (r.key)
      await storage()
        .delete(r.key)
        .catch(() => undefined);
    if (r.rawKey)
      await storage()
        .delete(r.rawKey)
        .catch(() => undefined);
  }
  await db.media.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
  return rows.length;
}

/**
 * Pembersihan (cron / manual: pnpm media:cleanup):
 *  - upload yang tidak pernah di-finalize > 24 jam → file mentah & baris dihapus
 *  - proses musik macet > 1 jam → FAILED, file mentah dihapus
 *  - baris FAILED > 24 jam → dihapus
 *  - file final milik undangan yang sudah dihapus → dihapus
 *  - file di raw/ tanpa baris Media > 24 jam → dihapus
 *  - RETENSI: undangan FREE yang kedaluwarsa > 30 hari → semua foto & musiknya
 *    dihapus, URL-nya dikosongkan dari data undangan (teks tetap utuh)
 */
export async function cleanupMedia(now = new Date()) {
  const day = new Date(now.getTime() - 24 * 3600_000);
  const hour = new Date(now.getTime() - 3600_000);
  const s = storage();
  const report = {
    staleUploads: 0,
    stuckProcessing: 0,
    failedRows: 0,
    orphanFinals: 0,
    orphanRaw: 0,
    retentionPurged: 0,
  };

  const stale = await db.media.findMany({ where: { status: "UPLOADING", createdAt: { lt: day } } });
  for (const m of stale) if (m.rawKey) await s.delete(m.rawKey).catch(() => undefined);
  report.staleUploads = (
    await db.media.deleteMany({ where: { id: { in: stale.map((m) => m.id) } } })
  ).count;

  const stuck = await db.media.findMany({
    where: {
      status: "PROCESSING",
      OR: [
        { processingStartedAt: { lt: hour } },
        { processingStartedAt: null, updatedAt: { lt: hour } },
      ],
    },
  });
  for (const m of stuck) await fail(m, "Pemrosesan terlalu lama. Silakan unggah ulang.");
  report.stuckProcessing = stuck.length;

  report.failedRows = (
    await db.media.deleteMany({ where: { status: "FAILED", updatedAt: { lt: day } } })
  ).count;

  const orphans = await db.media.findMany({ where: { invitationId: null, status: "READY" } });
  for (const m of orphans) if (m.key) await s.delete(m.key).catch(() => undefined);
  report.orphanFinals = (
    await db.media.deleteMany({ where: { id: { in: orphans.map((m) => m.id) } } })
  ).count;

  const known = new Set(
    (await db.media.findMany({ where: { rawKey: { not: null } }, select: { rawKey: true } })).map(
      (m) => m.rawKey,
    ),
  );
  for (const o of await s.list("raw/")) {
    if (!known.has(o.key) && o.lastModified < day) {
      await s.delete(o.key).catch(() => undefined);
      report.orphanRaw++;
    }
  }
  // Retensi media undangan FREE (lib/invitations/retention.ts)
  const due = await db.invitation.findMany({
    where: {
      package: "FREE",
      mediaPurgedAt: null,
      expiresAt: { lt: new Date(now.getTime() - MEDIA_RETENTION_DAYS * 86400_000) },
    },
    select: { id: true, data: true },
  });
  for (const inv of due) {
    const files = await db.media.findMany({ where: { invitationId: inv.id } });
    for (const m of files) {
      if (m.key) await s.delete(m.key).catch(() => undefined);
      if (m.rawKey) await s.delete(m.rawKey).catch(() => undefined);
    }
    await db.media.deleteMany({ where: { invitationId: inv.id } });
    await db.invitation.update({
      where: { id: inv.id },
      data: {
        data: stripMediaUrls(inv.data, (u) => s.keyFromUrl(u) !== null) as Prisma.InputJsonValue,
        mediaPurgedAt: now,
      },
    });
    report.retentionPurged++;
  }
  return report;
}
