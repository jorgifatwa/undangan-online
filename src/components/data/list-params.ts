/**
 * Parameter daftar (search + filter + halaman) dari searchParams. Dipakai semua
 * tabel setelah login — aturan: setiap tabel punya pencarian, filter, pagination.
 */
export const PAGE_SIZE = 20;

export function listParams(
  sp: Record<string, string | string[] | undefined>,
  pageSize = PAGE_SIZE,
) {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
  };
  const page = Math.max(1, Math.min(10_000, Number.parseInt(one("page"), 10) || 1));
  return { q: one("q").slice(0, 80), page, skip: (page - 1) * pageSize, take: pageSize, one };
}

/** Nomor halaman yang ditampilkan: 1 … 4 5 [6] 7 8 … 20 */
export function pageList(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) out.push("…");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < pages - 1) out.push("…");
  out.push(pages);
  return out;
}
