import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Period } from "@/lib/admin/metrics";

/** Pilih periode: 7/30/90 hari atau rentang tanggal (form GET, tanpa JS). */
export function PeriodPicker({ period, base }: { period: Period; base: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="bg-muted flex rounded-lg p-[3px]">
        {(["7", "30", "90"] as const).map((p) => (
          <Button
            key={p}
            asChild
            size="sm"
            variant="ghost"
            className={period.preset === p ? "bg-background shadow-sm" : "text-muted-foreground"}
          >
            <Link href={`${base}?p=${p}`} scroll={false}>
              {p} hari
            </Link>
          </Button>
        ))}
      </div>
      <form action={base} className="flex items-center gap-1.5">
        <Input
          type="date"
          name="from"
          defaultValue={period.fromYmd}
          className="h-8 w-36"
          aria-label="Dari tanggal"
        />
        <span className="text-muted-foreground text-xs">–</span>
        <Input
          type="date"
          name="to"
          defaultValue={period.toYmd}
          className="h-8 w-36"
          aria-label="Sampai tanggal"
        />
        <Button
          type="submit"
          size="sm"
          variant={period.preset === "custom" ? "default" : "outline"}
        >
          Terapkan
        </Button>
      </form>
    </div>
  );
}
