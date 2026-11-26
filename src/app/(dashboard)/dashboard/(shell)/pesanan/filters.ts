import type { Prisma } from "@prisma/client";

/** Filter daftar pesanan website (dipakai halaman & ekspor CSV). */
export const STATUS_FILTERS = [
  { key: "semua", label: "Semua" },
  { key: "PAID", label: "Lunas" },
  { key: "PENDING", label: "Menunggu" },
  { key: "FAILED", label: "Gagal" },
  { key: "EXPIRED", label: "Kedaluwarsa" },
] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number]["key"];

export function orderWhere(
  status: StatusFilter,
  q: string,
  themeId = "",
): Prisma.WebOrderWhereInput {
  return {
    ...(status !== "semua" ? { status } : {}),
    ...(themeId ? { themeId } : {}),
    ...(q
      ? {
          OR: [
            { buyerName: { contains: q, mode: "insensitive" } },
            { buyerEmail: { contains: q, mode: "insensitive" } },
            { midtransOrderId: { contains: q.toUpperCase() } },
            { buyerPhone: { contains: q.replace(/\D/g, "") || "—" } },
          ],
        }
      : {}),
  };
}

/** Label & warna status pesanan. */
export const STATUS_STYLE = {
  PENDING: { label: "Menunggu bayar", className: "bg-amber-100 text-amber-900" },
  PAID: { label: "Lunas", className: "bg-emerald-100 text-emerald-900" },
  FAILED: { label: "Gagal", className: "bg-destructive/10 text-destructive" },
  EXPIRED: { label: "Kedaluwarsa", className: "bg-muted text-muted-foreground" },
} as const;
