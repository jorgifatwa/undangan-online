"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  extendActiveAction,
  extendClaimAction,
  issueLoginAction,
  revokeClaimAction,
  rotateClaimAction,
} from "./actions";
import { IssuedPanel } from "./IssuedPanel";

type Panel = {
  title: string;
  kind: "link" | "login";
  message: string;
  phone: string | null;
  email: string | null;
};

/** Tombol per link khusus (sesuai status). */
export function ClaimRowActions({
  claimId,
  status,
  expired,
  defaultEmail,
  hasLogin,
  emailEnabled,
}: {
  claimId: string;
  status: "OPEN" | "CONFIRMED" | "REVOKED";
  expired: boolean;
  defaultEmail: string;
  hasLogin: boolean;
  emailEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [loginEmail, setLoginEmail] = useState(defaultEmail);
  const [showLogin, setShowLogin] = useState(false);

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
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {status === "OPEN" && (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  if (!confirm("Buat link baru? Link lama langsung tidak bisa dipakai.")) return;
                  const r = await rotateClaimAction(claimId);
                  if (!r.ok) return void toast.error(r.error);
                  setPanel({ title: "Link baru siap dikirim", kind: "link", ...r.link });
                })
              }
            >
              Link baru
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => run(() => extendClaimAction(claimId, 7), "Diperpanjang 7 hari")}
            >
              +7 hari
            </Button>
            {!expired && (
              <Button
                size="sm"
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  confirm("Cabut link ini? Pembeli tidak bisa mengisi lagi.") &&
                  run(() => revokeClaimAction(claimId), "Link dicabut")
                }
              >
                Cabut
              </Button>
            )}
          </>
        )}
        {status === "CONFIRMED" && (
          <>
            <Button size="sm" disabled={pending} onClick={() => setShowLogin((v) => !v)}>
              {hasLogin ? "Atur ulang kata sandi" : "Buat akun pembeli"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                run(() => extendActiveAction(claimId, 30), "Masa aktif diperpanjang 30 hari")
              }
            >
              Masa aktif +30 hari
            </Button>
          </>
        )}
      </div>
      {showLogin && status === "CONFIRMED" && (
        <form
          className="mt-2 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await issueLoginAction(claimId, loginEmail);
              if (!r.ok) return void toast.error(r.error);
              setShowLogin(false);
              setPanel({
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
          <Input
            type="email"
            required
            placeholder="email login pembeli"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className="h-7 w-60 text-xs"
          />
          <Button size="sm" type="submit" disabled={pending}>
            {pending ? "Memproses…" : "Buat kata sandi"}
          </Button>
        </form>
      )}
      {panel && (
        <IssuedPanel {...panel} emailEnabled={emailEnabled} onClose={() => setPanel(null)} />
      )}
    </div>
  );
}
