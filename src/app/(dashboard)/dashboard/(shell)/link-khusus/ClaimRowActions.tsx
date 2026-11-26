"use client";

import { CalendarPlus, Ellipsis, KeyRound, Link2, Timer, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  extendActiveAction,
  extendClaimAction,
  issueLoginAction,
  revokeClaimAction,
  rotateClaimAction,
} from "./actions";
import { IssuedDialog, type IssuedMessage } from "./IssuedDialog";

type Confirm = "rotate" | "revoke" | null;

/** Menu aksi per link khusus (sesuai status). */
export function ClaimRowActions({
  claimId,
  customerName,
  status,
  expired,
  defaultEmail,
  hasLogin,
  emailEnabled,
}: {
  claimId: string;
  customerName: string;
  status: "OPEN" | "CONFIRMED" | "REVOKED";
  expired: boolean;
  defaultEmail: string;
  hasLogin: boolean;
  emailEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [issued, setIssued] = useState<IssuedMessage | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState(defaultEmail);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(done);
        router.refresh();
      } else toast.error(r.error ?? "Gagal");
    });

  if (status === "REVOKED") return null;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Aksi ${customerName}`}
            disabled={pending}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {status === "OPEN" && (
            <>
              <DropdownMenuItem onSelect={() => setConfirm("rotate")}>
                <Link2 /> Buat link baru
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => run(() => extendClaimAction(claimId, 7), "Diperpanjang 7 hari")}
              >
                <CalendarPlus /> Perpanjang 7 hari
              </DropdownMenuItem>
              {!expired && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("revoke")}>
                    <XCircle /> Cabut link
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
          {status === "CONFIRMED" && (
            <>
              <DropdownMenuItem onSelect={() => setLoginOpen(true)}>
                <KeyRound /> {hasLogin ? "Atur ulang kata sandi" : "Buat akun pembeli"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  run(() => extendActiveAction(claimId, 30), "Masa aktif diperpanjang 30 hari")
                }
              >
                <Timer /> Masa aktif +30 hari
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "revoke" ? "Cabut link ini?" : "Buat link baru?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "revoke"
                ? `${customerName} tidak bisa mengisi lagi. Data dihapus otomatis saat batas waktu lewat.`
                : "Link lama langsung tidak bisa dipakai. Kirim link baru ke pembeli."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant={confirm === "revoke" ? "destructive" : "default"}
              onClick={() => {
                const which = confirm;
                setConfirm(null);
                if (which === "revoke") run(() => revokeClaimAction(claimId), "Link dicabut");
                else
                  start(async () => {
                    const r = await rotateClaimAction(claimId);
                    if (!r.ok) return void toast.error(r.error);
                    setIssued({ title: "Link baru siap dikirim", kind: "link", ...r.link });
                  });
              }}
            >
              {confirm === "revoke" ? "Cabut" : "Buat link baru"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{hasLogin ? "Atur ulang kata sandi" : "Buat akun pembeli"}</DialogTitle>
            <DialogDescription>
              Kata sandi acak dibuat untuk {customerName}. Pesan berisi data login tampil setelah
              ini.
            </DialogDescription>
          </DialogHeader>
          <form
            id={`login-${claimId}`}
            className="grid gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const r = await issueLoginAction(claimId, loginEmail);
                if (!r.ok) return void toast.error(r.error);
                setLoginOpen(false);
                setIssued({
                  title: "Data login siap dikirim",
                  kind: "login",
                  message: r.login.message,
                  phone: r.login.phone,
                  email: r.login.email,
                });
                router.refresh();
              });
            }}
          >
            <Label htmlFor={`login-email-${claimId}`}>Email login pembeli</Label>
            <Input
              id={`login-email-${claimId}`}
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
          </form>
          <DialogFooter>
            <Button type="submit" form={`login-${claimId}`} disabled={pending}>
              {pending ? "Memproses…" : "Buat kata sandi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <IssuedDialog issued={issued} emailEnabled={emailEnabled} onClose={() => setIssued(null)} />
    </>
  );
}
