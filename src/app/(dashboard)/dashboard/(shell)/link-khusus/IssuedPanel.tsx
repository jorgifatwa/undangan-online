"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { waLink } from "@/lib/invitations/share";

import { emailCustomerAction } from "./actions";

/**
 * Tampilkan pesan untuk pembeli SEKALI (link khusus / data login): salin,
 * buka WhatsApp, atau kirim email (bila SMTP diisi).
 */
export function IssuedPanel({
  title,
  kind,
  message,
  phone,
  email,
  emailEnabled,
  onClose,
}: {
  title: string;
  kind: "link" | "login";
  message: string;
  phone: string | null;
  email: string | null;
  emailEnabled: boolean;
  onClose: () => void;
}) {
  const [to, setTo] = useState(email ?? "");
  const [pending, start] = useTransition();
  return (
    <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-950">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        <button type="button" className="text-xs underline" onClick={onClose}>
          Tutup
        </button>
      </div>
      <p className="mt-1 text-xs">
        Hanya ditampilkan sekali. Kirim sekarang ke pembeli (jangan dibagikan ke orang lain).
      </p>
      <textarea
        readOnly
        value={message}
        rows={8}
        className="mt-2 w-full rounded-lg border bg-white p-2 font-mono text-xs"
        onFocus={(e) => e.currentTarget.select()}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(message);
              toast.success("Pesan disalin");
            } catch {
              window.prompt("Salin pesan:", message);
            }
          }}
        >
          Salin pesan
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={waLink(message, phone)} target="_blank" rel="noreferrer">
            Kirim via WhatsApp{phone ? "" : " (pilih kontak)"}
          </a>
        </Button>
        {emailEnabled && (
          <form
            className="flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const r = await emailCustomerAction(to, kind, message);
                if (r.ok) toast.success(`Email terkirim ke ${to}`);
                else toast.error(r.error);
              });
            }}
          >
            <Input
              type="email"
              required
              placeholder="email pembeli"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-7 w-52 bg-white text-xs"
            />
            <Button size="sm" variant="outline" type="submit" disabled={pending}>
              {pending ? "Mengirim…" : "Kirim email"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
