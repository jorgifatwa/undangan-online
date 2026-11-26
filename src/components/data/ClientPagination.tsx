"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { pageList } from "./list-params";

/** Pagination untuk daftar yang sudah dimuat di klien (shadcn Pagination). */
export function ClientPagination({
  page,
  total,
  pageSize,
  onPage,
  unit = "data",
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  unit?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const go = (p: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    onPage(Math.min(pages, Math.max(1, p)));
  };
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
      <p className="text-muted-foreground text-xs tabular-nums">
        {total === 0 ? `0 ${unit}` : `${from}–${to} dari ${total} ${unit}`}
      </p>
      {pages > 1 && (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text="Sebelumnya"
                href="#"
                onClick={go(page - 1)}
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
                  <PaginationLink href="#" onClick={go(p)} isActive={p === page}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                text="Berikutnya"
                href="#"
                onClick={go(page + 1)}
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
