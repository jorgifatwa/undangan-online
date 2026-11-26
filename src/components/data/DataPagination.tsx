import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { PAGE_SIZE, pageList } from "./list-params";

/**
 * Pagination tabel server (shadcn Pagination) — tautan mempertahankan
 * parameter pencarian & filter.
 */
export function DataPagination({
  basePath,
  params,
  page,
  total,
  pageSize = PAGE_SIZE,
  unit = "data",
}: {
  basePath: string;
  params: Record<string, string | string[] | undefined>;
  page: number;
  total: number;
  pageSize?: number;
  unit?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      const val = Array.isArray(v) ? v[0] : v;
      if (val && k !== "page") sp.set(k, val);
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-muted-foreground text-xs tabular-nums">
        {total === 0 ? `0 ${unit}` : `${from}–${to} dari ${total} ${unit}`}
      </p>
      {pages > 1 && (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text="Sebelumnya"
                href={href(Math.max(1, page - 1))}
                aria-disabled={page <= 1}
                className={page <= 1 ? "pointer-events-none opacity-40" : ""}
              />
            </PaginationItem>
            {pageList(page, pages).map((p, i) =>
              p === "…" ? (
                <PaginationItem key={`e${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink href={href(p)} isActive={p === page}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                text="Berikutnya"
                href={href(Math.min(pages, page + 1))}
                aria-disabled={page >= pages}
                className={page >= pages ? "pointer-events-none opacity-40" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
