"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/lib/site";

import { checkSlugAction, confirmClaimAction } from "../actions";

/** Versi klien slugify (sama aturannya dengan lib/invitations/slug.ts). */
function toSlug(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " dan ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

type Check =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok"; slug: string }
  | { kind: "bad"; message: string };

/**
 * Langkah terakhir link khusus: pilih alamat (domain/{nama}) + cek
 * ketersediaan → modal konfirmasi → undangan tayang & tema terkunci.
 */
export function ClaimConfirm({
  invitationId,
  expiresAt,
  flushSave,
}: {
  invitationId: string;
  expiresAt: string;
  flushSave: () => Promise<boolean>;
}) {
  const router = useRouter();
  const form = useFormContext();
  const suggested = useMemo(() => {
    const v = form.getValues() as {
      bride?: { nickname?: string; fullName?: string };
      groom?: { nickname?: string; fullName?: string };
      celebrant?: { nickname?: string; name?: string };
    };
    const raw = v.bride
      ? `${v.bride.nickname || v.bride.fullName || ""} ${v.groom?.nickname || v.groom?.fullName || ""}`
      : v.celebrant?.nickname || v.celebrant?.name || "";
    const s = toSlug(raw);
    return s.startsWith("mempelai") ? "" : s;
  }, [form]);
  const [slug, setSlug] = useState(suggested);
  const [check, setCheck] = useState<Check>({ kind: "idle" });
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const s = slug.trim().toLowerCase();
    if (!s) {
      setCheck({ kind: "idle" });
      return;
    }
    setCheck({ kind: "checking" });
    const n = ++seq.current;
    const t = window.setTimeout(async () => {
      const r = await checkSlugAction(invitationId, s).catch(() => null);
      if (n !== seq.current) return;
      if (!r || !r.ok) setCheck({ kind: "bad", message: r?.error ?? "Gagal memeriksa alamat." });
      else if (r.available) setCheck({ kind: "ok", slug: r.slug });
      else setCheck({ kind: "bad", message: r.message ?? "Alamat tidak tersedia." });
    }, 450);
    return () => window.clearTimeout(t);
  }, [slug, invitationId]);

  const host = siteConfig.appUrl.replace(/^https?:\/\//, "");
  const deadline = new Date(expiresAt).toLocaleDateString("id-ID", { dateStyle: "long" });

  const confirm = async () => {
    if (check.kind !== "ok") return;
    setBusy(true);
    setError(null);
    const saved = await flushSave();
    if (!saved) {
      setBusy(false);
      setError("Masih ada isian yang belum tersimpan/valid. Periksa langkah sebelumnya.");
      return;
    }
    const r = await confirmClaimAction(invitationId, check.slug).catch(() => null);
    if (!r || !r.ok) {
      setBusy(false);
      setError(r?.error ?? "Gagal mengonfirmasi. Coba lagi.");
      return;
    }
    router.refresh();
  };

  return (
    <section className="space-y-6">
      <p className="text-muted-foreground text-sm leading-relaxed">
        Semua isian sudah tersimpan. Periksa pratinjau, lalu pilih alamat undangan. Link ini berlaku
        sampai {deadline}; bila belum dikonfirmasi sampai tanggal itu, data dihapus otomatis.
      </p>
      <div className="grid gap-2">
        <Label htmlFor="claim-slug">Alamat undangan</Label>
        <div className="border-input focus-within:ring-ring/40 flex items-center overflow-hidden rounded-lg border bg-transparent text-sm focus-within:ring-[3px]">
          <span className="text-muted-foreground bg-muted/60 border-r px-3 py-2">{host}/</span>
          <input
            id="claim-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            placeholder="nama-kalian"
            maxLength={40}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 outline-none"
            autoComplete="off"
          />
        </div>
        <p
          role="status"
          className={
            check.kind === "ok"
              ? "text-xs text-emerald-700"
              : check.kind === "bad"
                ? "text-destructive text-xs"
                : "text-muted-foreground text-xs"
          }
        >
          {check.kind === "idle" && "Huruf kecil, angka & tanda hubung, 3–40 karakter."}
          {check.kind === "checking" && "Memeriksa…"}
          {check.kind === "ok" && `✓ ${host}/${check.slug} tersedia`}
          {check.kind === "bad" && check.message}
        </p>
      </div>
      <Button
        type="button"
        size="lg"
        className="h-11 w-full"
        disabled={check.kind !== "ok"}
        onClick={() => setModal(true)}
      >
        Konfirmasi undangan
      </Button>

      <Dialog open={modal} onOpenChange={(o) => !busy && setModal(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-normal">
              Tayangkan undangan?
            </DialogTitle>
            <DialogDescription>Periksa sekali lagi sebelum melanjutkan.</DialogDescription>
          </DialogHeader>
          <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm">
            <li>
              Undangan langsung bisa dibuka di{" "}
              <strong className="text-foreground">
                {host}/{check.kind === "ok" ? check.slug : ""}
              </strong>
              .
            </li>
            <li>
              <strong className="text-foreground">Tema terkunci</strong> — tidak bisa diganti lagi.
            </li>
            <li>Isi undangan masih bisa diubah selama masa aktif.</li>
            <li>Admin akan mengirim data login untuk mengelola tamu & ucapan.</li>
          </ul>
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setModal(false)}>
              Periksa lagi
            </Button>
            <Button disabled={busy} onClick={() => void confirm()}>
              {busy ? "Menayangkan…" : "Ya, tayangkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
