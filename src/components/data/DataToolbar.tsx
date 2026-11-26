"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface ToolbarFilter {
  /** Nama parameter URL. */
  key: string;
  label: string;
  /** Label opsi "semua" (nilai kosong). */
  allLabel: string;
  options: { value: string; label: string }[];
}

/**
 * Pencarian + filter tabel (shadcn Input & Select) yang menyimpan nilainya di
 * URL (?q=&<filter>=); halaman kembali ke 1 setiap kali berubah.
 */
export function DataToolbar({
  searchPlaceholder,
  filters = [],
  children,
  className,
}: {
  searchPlaceholder: string;
  filters?: ToolbarFilter[];
  children?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const first = useRef(true);

  const push = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    const qs = next.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  // cari otomatis 350 ms setelah berhenti mengetik
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      if ((params.get("q") ?? "") !== q.trim()) push({ q: q.trim() });
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const active = !!params.get("q") || filters.some((f) => params.get(f.key));
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} aria-busy={pending}>
      <div className="relative min-w-52 flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="pl-8"
        />
      </div>
      {filters.map((f) => (
        <Select
          key={f.key}
          value={params.get(f.key) || "__all"}
          onValueChange={(v) => push({ [f.key]: v === "__all" ? "" : v })}
        >
          <SelectTrigger className="w-44" aria-label={f.label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">{f.allLabel}</SelectItem>
            {f.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {active && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            push({ q: "", ...Object.fromEntries(filters.map((f) => [f.key, ""])) });
          }}
        >
          <X /> Reset
        </Button>
      )}
      {children}
    </div>
  );
}
