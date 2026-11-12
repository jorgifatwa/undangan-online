#!/bin/sh
# Build di Vercel (dipanggil otomatis karena ada script "vercel-build").
#  1. migrasi database lewat koneksi LANGSUNG (DATABASE_URL_UNPOOLED, tanpa
#     "-pooler") — migrasi Prisma butuh advisory lock yang tidak didukung pooler
#  2. seed data dasar (koleksi musik bawaan; idempoten)
#  3. build Next.js (pnpm run build → prebuild themes:sync ikut jalan)
# Lihat docs/DEPLOY.md.
set -e
if [ -n "$DATABASE_URL_UNPOOLED" ]; then
  MIGRATE_URL="$DATABASE_URL_UNPOOLED"
else
  MIGRATE_URL="$DATABASE_URL"
fi
DATABASE_URL="$MIGRATE_URL" pnpm exec prisma migrate deploy
DATABASE_URL="$MIGRATE_URL" pnpm exec prisma db seed
pnpm run build
