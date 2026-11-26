"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRupiah } from "@/lib/format";

import { createClaimAction, type IssuedLink } from "./actions";
import { IssuedPanel } from "./IssuedPanel";

const MARKETPLACES = ["Shopee", "Tokopedia", "TikTok Shop", "Lazada", "Lainnya"];

/** Form admin: buat link khusus untuk pembeli yang sudah membayar. */
export function ClaimCreateForm({
  themes,
  emailEnabled,
}: {
  themes: { id: string; name: string; price: number }[];
  emailEnabled: boolean;
}) {
  const [issued, setIssued] = useState<IssuedLink | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="bg-card rounded-2xl border p-4">
      <h2 className="font-heading text-xl">Buat link baru</h2>
      <form
        className="mt-3 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = Object.fromEntries(new FormData(form));
          start(async () => {
            const r = await createClaimAction(fd);
            if (!r.ok) {
              toast.error(r.error);
              return;
            }
            setIssued(r.link);
            form.reset();
            toast.success("Link khusus dibuat");
          });
        }}
      >
        <div className="grid gap-1">
          <Label htmlFor="themeId">Tema yang dibeli</Label>
          <select
            id="themeId"
            name="themeId"
            required
            className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm"
          >
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {formatRupiah(t.price)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="customerName">Nama pembeli</Label>
          <Input id="customerName" name="customerName" required minLength={2} maxLength={80} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="customerPhone">No. WhatsApp (opsional)</Label>
          <Input id="customerPhone" name="customerPhone" inputMode="tel" placeholder="08…" />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="customerEmail">Email (opsional)</Label>
          <Input id="customerEmail" name="customerEmail" type="email" />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="marketplace">Marketplace</Label>
          <select
            id="marketplace"
            name="marketplace"
            className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm"
          >
            {MARKETPLACES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="marketplaceOrder">No. pesanan (opsional)</Label>
          <Input id="marketplaceOrder" name="marketplaceOrder" maxLength={80} />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Membuat…" : "Buat link khusus"}
          </Button>
        </div>
      </form>
      {issued && (
        <IssuedPanel
          title="Link khusus siap dikirim"
          kind="link"
          message={issued.message}
          phone={issued.phone}
          email={issued.email}
          emailEnabled={emailEnabled}
          onClose={() => setIssued(null)}
        />
      )}
    </div>
  );
}
