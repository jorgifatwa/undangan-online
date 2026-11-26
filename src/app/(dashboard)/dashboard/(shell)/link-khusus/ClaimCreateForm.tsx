"use client";

import { Link2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRupiah } from "@/lib/format";

import { createClaimAction } from "./actions";
import { IssuedDialog, type IssuedMessage } from "./IssuedDialog";

const MARKETPLACES = ["Shopee", "Tokopedia", "TikTok Shop", "Lazada", "Lainnya"];

/** Form admin: buat link khusus untuk pembeli yang sudah membayar. */
export function ClaimCreateForm({
  themes,
  emailEnabled,
}: {
  themes: { id: string; name: string; price: number }[];
  emailEnabled: boolean;
}) {
  const [issued, setIssued] = useState<IssuedMessage | null>(null);
  const [pending, start] = useTransition();
  const [themeId, setThemeId] = useState(themes[0]?.id ?? "");
  const [marketplace, setMarketplace] = useState(MARKETPLACES[0]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Buat link baru</CardTitle>
        <CardDescription>
          Isi setelah pembayaran di marketplace dikonfirmasi. Pembeli mengisi undangannya sendiri
          lewat link ini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = { ...Object.fromEntries(new FormData(form)), themeId, marketplace };
            start(async () => {
              const r = await createClaimAction(fd);
              if (!r.ok) {
                toast.error(r.error);
                return;
              }
              setIssued({ title: "Link khusus siap dikirim", kind: "link", ...r.link });
              form.reset();
              toast.success("Link khusus dibuat");
            });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="themeId">Tema yang dibeli</Label>
            <Select value={themeId} onValueChange={setThemeId}>
              <SelectTrigger id="themeId" className="w-full" data-testid="theme-select">
                <SelectValue placeholder="Pilih tema" />
              </SelectTrigger>
              <SelectContent>
                {themes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} — {formatRupiah(t.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customerName">Nama pembeli</Label>
            <Input id="customerName" name="customerName" required minLength={2} maxLength={80} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customerPhone">No. WhatsApp (opsional)</Label>
            <Input id="customerPhone" name="customerPhone" inputMode="tel" placeholder="08…" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customerEmail">Email (opsional)</Label>
            <Input id="customerEmail" name="customerEmail" type="email" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="marketplace">Marketplace</Label>
            <Select value={marketplace} onValueChange={setMarketplace}>
              <SelectTrigger id="marketplace" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MARKETPLACES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="marketplaceOrder">No. pesanan (opsional)</Label>
            <Input id="marketplaceOrder" name="marketplaceOrder" maxLength={80} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="receivedAmount">Nominal diterima (opsional)</Label>
            <Input
              id="receivedAmount"
              name="receivedAmount"
              inputMode="numeric"
              placeholder={`Kosong = harga tema (${formatRupiah(themes.find((t) => t.id === themeId)?.price ?? 0)})`}
            />
            <p className="text-muted-foreground text-xs">
              Setelah dipotong biaya marketplace — dipakai di laporan pendapatan.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="lg" disabled={pending}>
              <Link2 /> {pending ? "Membuat…" : "Buat link khusus"}
            </Button>
          </div>
        </form>
      </CardContent>
      <IssuedDialog issued={issued} emailEnabled={emailEnabled} onClose={() => setIssued(null)} />
    </Card>
  );
}
