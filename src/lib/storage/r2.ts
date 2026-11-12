import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { StorageDriver, StoredObject } from "./types";

/**
 * Driver "r2" (PRODUCTION): Cloudflare R2 lewat API S3. Browser mengunggah
 * file mentah langsung ke R2 dengan presigned PUT (tidak melewati server →
 * aman dari batas ukuran body serverless). Ukuran file dicek ulang saat
 * finalize (HEAD), karena presigned PUT tidak bisa membatasi ukuran.
 */
function config() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } =
    process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL)
    throw new Error("Konfigurasi R2 belum lengkap (lihat .env.example)");
  return {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET,
    R2_PUBLIC_URL: R2_PUBLIC_URL.replace(/\/$/, ""),
  };
}

let client: S3Client | null = null;
function s3() {
  const c = config();
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${c.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: c.R2_ACCESS_KEY_ID, secretAccessKey: c.R2_SECRET_ACCESS_KEY },
  });
  return { client, bucket: c.R2_BUCKET, publicBase: c.R2_PUBLIC_URL };
}

export const r2Driver: StorageDriver = {
  name: "r2",
  async createUploadTarget(key, contentType) {
    const { client, bucket } = s3();
    const url = await getSignedUrl(
      client,
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
      {
        expiresIn: 15 * 60,
      },
    );
    return { url, method: "PUT", headers: { "Content-Type": contentType } };
  },
  async put(key, body, contentType) {
    const { client, bucket } = s3();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  },
  async get(key) {
    const { client, bucket } = s3();
    try {
      const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      return Buffer.from(await res.Body!.transformToByteArray());
    } catch {
      return null;
    }
  },
  async size(key) {
    const { client, bucket } = s3();
    try {
      return (
        (await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))).ContentLength ??
        null
      );
    } catch {
      return null;
    }
  },
  async delete(key) {
    const { client, bucket } = s3();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },
  publicUrl(key) {
    return `${s3().publicBase}/${key}`;
  },
  keyFromUrl(url) {
    const base = `${s3().publicBase}/`;
    return url.startsWith(base) ? url.slice(base.length) : null;
  },
  async list(prefix) {
    const { client, bucket } = s3();
    const out: StoredObject[] = [];
    let token: string | undefined;
    do {
      const res = await client.send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }),
      );
      for (const o of res.Contents ?? [])
        if (o.Key)
          out.push({ key: o.Key, size: o.Size ?? 0, lastModified: o.LastModified ?? new Date(0) });
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);
    return out;
  },
};
