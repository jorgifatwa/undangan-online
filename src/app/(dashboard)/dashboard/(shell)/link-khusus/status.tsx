import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Status tampilan link khusus (dihitung dari status + batas waktu + masa aktif). */
export type ClaimStatusKey = "open" | "expired" | "revoked" | "live" | "ended";

export function claimStatusKey(
  c: {
    status: "OPEN" | "CONFIRMED" | "REVOKED";
    expiresAt: Date;
    invitation: { activeUntil: Date | null };
  },
  now = new Date(),
): ClaimStatusKey {
  if (c.status === "REVOKED") return "revoked";
  if (c.status === "CONFIRMED")
    return c.invitation.activeUntil && c.invitation.activeUntil > now ? "live" : "ended";
  return c.expiresAt <= now ? "expired" : "open";
}

const STYLE: Record<ClaimStatusKey, { label: string; className: string }> = {
  open: { label: "Menunggu diisi", className: "bg-amber-100 text-amber-900" },
  live: { label: "Tayang", className: "bg-emerald-100 text-emerald-900" },
  expired: { label: "Kedaluwarsa", className: "bg-muted text-muted-foreground" },
  ended: { label: "Masa aktif habis", className: "bg-muted text-muted-foreground" },
  revoked: { label: "Dicabut", className: "bg-destructive/10 text-destructive" },
};

export function ClaimStatusBadge({ status }: { status: ClaimStatusKey }) {
  const s = STYLE[status];
  return (
    <Badge variant="secondary" className={cn("shrink-0", s.className)}>
      {s.label}
    </Badge>
  );
}
