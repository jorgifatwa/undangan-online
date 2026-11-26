"use client";

import { CalendarClock, Hourglass } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppSettings } from "@/lib/settings";

import { saveSettingsAction } from "./actions";

export function SettingsForm({ initial }: { initial: AppSettings }) {
  const [pending, start] = useTransition();
  const fields = [
    {
      name: "claimLinkDays",
      icon: Hourglass,
      title: "Batas waktu link khusus",
      description:
        "Berlaku untuk link yang dibuat setelah ini. Lewat batas & belum dikonfirmasi pembeli → undangan draf beserta datanya dihapus otomatis.",
      min: 1,
      max: 365,
      value: initial.claimLinkDays,
    },
    {
      name: "invitationActiveDays",
      icon: CalendarClock,
      title: "Masa aktif undangan setelah tayang",
      description:
        "Selama masa aktif, pembeli bebas mengubah data undangannya. Berlaku untuk undangan yang dikonfirmasi setelah ini.",
      min: 1,
      max: 3650,
      value: initial.invitationActiveDays,
    },
  ];
  return (
    <form
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
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Link khusus & masa aktif</CardTitle>
          <CardDescription>Dalam hitungan hari.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {fields.map((f) => (
            <div key={f.name} className="flex gap-4">
              <span className="bg-accent text-accent-foreground grid size-10 shrink-0 place-items-center rounded-lg">
                <f.icon className="size-5" />
              </span>
              <div className="grid flex-1 gap-2">
                <Label htmlFor={f.name}>{f.title}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={f.name}
                    name={f.name}
                    type="number"
                    min={f.min}
                    max={f.max}
                    required
                    defaultValue={f.value}
                    className="w-32"
                  />
                  <span className="text-muted-foreground text-sm">hari</span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="border-t">
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan pengaturan"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
