"use client";

import { Copy, Mail, MessageCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { waLink } from "@/lib/invitations/share";

import { emailCustomerAction } from "./actions";

export interface IssuedMessage {
  title: string;
  kind: "link" | "login";
  message: string;
  phone: string | null;
  email: string | null;
}

/**
 * Pesan untuk pembeli (link khusus / data login) — ditampilkan SEKALI:
 * salin, buka WhatsApp, atau kirim email (bila SMTP diisi).
 */
export function IssuedDialog({
  issued,
  emailEnabled,
  onClose,
}: {
  issued: IssuedMessage | null;
  emailEnabled: boolean;
  onClose: () => void;
}) {
  const [to, setTo] = useState("");
  const [pending, start] = useTransition();
  return (
    <Dialog
      open={!!issued}
      onOpenChange={(o) => {
        if (!o) onClose();
        else setTo(issued?.email ?? "");
      }}
    >
      {issued && (
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{issued.title}</DialogTitle>
            <DialogDescription>
              Hanya ditampilkan sekali. Kirim sekarang ke pembeli dan jangan bagikan ke orang lain.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            readOnly
            value={issued.message}
            rows={9}
            className="font-mono text-xs"
            onFocus={(e) => e.currentTarget.select()}
          />
          {emailEnabled ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                start(async () => {
                  const r = await emailCustomerAction(
                    to || issued.email || "",
                    issued.kind,
                    issued.message,
                  );
                  if (r.ok) toast.success("Email terkirim");
                  else toast.error(r.error);
                });
              }}
            >
              <Input
                type="email"
                required
                placeholder="email pembeli"
                value={to || issued.email || ""}
                onChange={(e) => setTo(e.target.value)}
              />
              <Button type="submit" variant="outline" disabled={pending}>
                <Mail /> {pending ? "Mengirim…" : "Kirim email"}
              </Button>
            </form>
          ) : (
            <Alert>
              <AlertDescription>
                Kirim lewat email aktif setelah SMTP diisi di env (lihat .env.example).
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(issued.message);
                  toast.success("Pesan disalin");
                } catch {
                  window.prompt("Salin pesan:", issued.message);
                }
              }}
            >
              <Copy /> Salin pesan
            </Button>
            <Button asChild className="bg-[#1f9d55] text-white hover:bg-[#1f9d55]/90">
              <a href={waLink(issued.message, issued.phone)} target="_blank" rel="noreferrer">
                <MessageCircle /> Kirim via WhatsApp
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
