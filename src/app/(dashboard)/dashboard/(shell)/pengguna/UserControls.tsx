"use client";

import { Ellipsis, KeyRound, UserMinus, UserPlus } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { IssuedDialog, type IssuedMessage } from "../link-khusus/IssuedDialog";
import { addAdminAction, resetPasswordAction, revokeAdminAction } from "./actions";

/** Form tambah admin → data login ditampilkan sekali. */
export function AddAdminForm({ emailEnabled }: { emailEnabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [issued, setIssued] = useState<IssuedMessage | null>(null);
  return (
    <>
      <form
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = Object.fromEntries(new FormData(form));
          start(async () => {
            const r = await addAdminAction(fd);
            if (!r.ok) return void toast.error(r.error);
            form.reset();
            setIssued({
              title: "Admin baru siap",
              kind: "login",
              message: r.message,
              phone: null,
              email: r.email,
            });
            router.refresh();
          });
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="admin-name">Nama</Label>
          <Input id="admin-name" name="name" required minLength={2} maxLength={80} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="admin-email">Email</Label>
          <Input id="admin-email" name="email" type="email" required />
        </div>
        <Button type="submit" disabled={pending}>
          <UserPlus /> {pending ? "Menambah…" : "Tambah admin"}
        </Button>
      </form>
      <IssuedDialog issued={issued} emailEnabled={emailEnabled} onClose={() => setIssued(null)} />
    </>
  );
}

/** Menu aksi per pengguna: atur ulang kata sandi, cabut admin. */
export function UserActions({
  userId,
  name,
  role,
  hasEmail,
  canRevoke,
  emailEnabled,
}: {
  userId: string;
  name: string;
  role: "ADMIN" | "CUSTOMER";
  hasEmail: boolean;
  canRevoke: boolean;
  emailEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [issued, setIssued] = useState<IssuedMessage | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  if (!hasEmail && !canRevoke) return null;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Aksi ${name}`} disabled={pending}>
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {hasEmail && (
            <DropdownMenuItem
              onSelect={() =>
                start(async () => {
                  const r = await resetPasswordAction(userId);
                  if (!r.ok) return void toast.error(r.error);
                  setIssued({
                    title: "Kata sandi baru",
                    kind: "login",
                    message: r.message,
                    phone: null,
                    email: r.email,
                  });
                })
              }
            >
              <KeyRound /> Atur ulang kata sandi
            </DropdownMenuItem>
          )}
          {role === "ADMIN" && canRevoke && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmRevoke(true)}>
                <UserMinus /> Cabut akses admin
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cabut akses admin {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun ini tidak bisa lagi masuk ke panel admin. Kata sandinya dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                start(async () => {
                  const r = await revokeAdminAction(userId);
                  if (!r.ok) return void toast.error(r.error);
                  toast.success("Akses admin dicabut");
                  router.refresh();
                })
              }
            >
              Cabut akses
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <IssuedDialog issued={issued} emailEnabled={emailEnabled} onClose={() => setIssued(null)} />
    </>
  );
}
