"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppSettings } from "@/lib/settings";

import { saveSettingsAction } from "./actions";

export function SettingsForm({ initial }: { initial: AppSettings }) {
  const [pending, start] = useTransition();
  return (
    <form
      className="bg-card mt-6 grid max-w-lg gap-5 rounded-2xl border p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.currentTarget));
        start(async () => {
          const r = await saveSettingsAction(fd);
          if (r.ok) toast.success("Pengaturan disimpan");
          else toast.error(r.error);
        });
      }}
    >
      <div className="grid gap-1">
        <Label htmlFor="claimLinkDays">Batas waktu link khusus (hari)</Label>
        <Input
          id="claimLinkDays"
          name="claimLinkDays"
          type="number"
          min={1}
          max={365}
          required
          defaultValue={initial.claimLinkDays}
        />
        <p className="text-muted-foreground text-xs">
          Berlaku untuk link yang dibuat setelah ini. Lewat batas & belum dikonfirmasi pembeli →
          undangan draf beserta datanya dihapus otomatis.
        </p>
      </div>
      <div className="grid gap-1">
        <Label htmlFor="invitationActiveDays">Masa aktif undangan setelah tayang (hari)</Label>
        <Input
          id="invitationActiveDays"
          name="invitationActiveDays"
          type="number"
          min={1}
          max={3650}
          required
          defaultValue={initial.invitationActiveDays}
        />
        <p className="text-muted-foreground text-xs">
          Selama masa aktif, pembeli bebas mengubah data undangannya. Berlaku untuk undangan yang
          dikonfirmasi setelah ini.
        </p>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
