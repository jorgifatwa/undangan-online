"use client";

import { Copy, Ellipsis, Mail, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { orderLinkAction, refreshOrderAction, resendOrderEmailAction } from "./actions";

/** Menu aksi satu pesanan website. */
export function OrderActions({
  id,
  status,
  hasClaim,
  emailEnabled,
}: {
  id: string;
  status: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  hasClaim: boolean;
  emailEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(done);
        router.refresh();
      } else toast.error(r.error ?? "Gagal");
    });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Aksi pesanan" disabled={pending}>
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {(status === "PENDING" || (status === "PAID" && !hasClaim)) && (
          <DropdownMenuItem onSelect={() => run(() => refreshOrderAction(id), "Status diperbarui")}>
            <RefreshCw /> {status === "PENDING" ? "Cek status Midtrans" : "Proses ulang pesanan"}
          </DropdownMenuItem>
        )}
        {status === "PAID" && hasClaim && (
          <>
            <DropdownMenuItem
              onSelect={() =>
                start(async () => {
                  const r = await orderLinkAction(id);
                  if (!r.ok) return void toast.error(r.error);
                  try {
                    await navigator.clipboard.writeText(r.url);
                    toast.success("Link khusus disalin");
                  } catch {
                    window.prompt("Salin link khusus:", r.url);
                  }
                })
              }
            >
              <Copy /> Salin link khusus
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!emailEnabled}
              onSelect={() => run(() => resendOrderEmailAction(id), "Email terkirim")}
            >
              <Mail /> Kirim ulang email{!emailEnabled && " (SMTP belum diisi)"}
            </DropdownMenuItem>
          </>
        )}
        {(status === "FAILED" || status === "EXPIRED") && (
          <DropdownMenuItem disabled>Tidak ada aksi</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
