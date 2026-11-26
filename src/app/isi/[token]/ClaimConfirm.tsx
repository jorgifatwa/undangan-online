"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

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
    <section className="bg-card space-y-4 rounded-2xl border p-4">
      <div>
        <h2 className="font-medium">Konfirmasi & tayangkan</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Semua isian sudah tersimpan. Periksa pratinjau, lalu pilih alamat undangan. Link ini
          berlaku sampai {deadline}; bila belum dikonfirmasi sampai tanggal itu, data dihapus
          otomatis.
        </p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="claim-slug" className="text-sm font-medium">
          Alamat undangan
        </label>
        <div className="flex items-center overflow-hidden rounded-lg border bg-white text-sm">
          <span className="text-muted-foreground border-r bg-neutral-50 px-2 py-2">{host}/</span>
          <input
            id="claim-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            placeholder="nama-kalian"
            maxLength={40}
            className="min-w-0 flex-1 px-2 py-2 outline-none"
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
      <button
        type="button"
        disabled={check.kind !== "ok"}
        onClick={() => setModal(true)}
        className="bg-primary text-primary-foreground w-full rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        Konfirmasi undangan
      </button>

      {modal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="claim-confirm-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
        >
          <div className="bg-background w-full max-w-md rounded-2xl p-5 shadow-xl">
            <h3 id="claim-confirm-title" className="font-heading text-xl">
              Tayangkan undangan?
            </h3>
            <ul className="text-muted-foreground mt-3 list-disc space-y-1 pl-5 text-sm">
              <li>
                Undangan langsung bisa dibuka di{" "}
                <strong className="text-foreground">
                  {host}/{check.kind === "ok" ? check.slug : ""}
                </strong>
                .
              </li>
              <li>
                <strong className="text-foreground">Tema terkunci</strong> — tidak bisa diganti
                lagi.
              </li>
              <li>Isi undangan masih bisa diubah selama masa aktif.</li>
              <li>Admin akan mengirim data login untuk mengelola tamu & ucapan.</li>
            </ul>
            {error && (
              <p role="alert" className="text-destructive mt-3 text-sm">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setModal(false)}
                className="hover:bg-muted rounded-md border px-3 py-2 text-sm"
              >
                Periksa lagi
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirm()}
                className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                {busy ? "Menayangkan…" : "Ya, tayangkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
