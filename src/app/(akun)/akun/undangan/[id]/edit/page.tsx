import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Editor } from "@/app/(dashboard)/dashboard/undangan/[id]/edit/Editor";
import { loadEditorProps } from "@/app/(dashboard)/dashboard/undangan/[id]/edit/editor-props";
import { CenterCard } from "@/components/site/CenterCard";
import { Button } from "@/components/ui/button";
import { requireCustomer } from "@/lib/auth-guard";
import { claimPhase } from "@/lib/claims/guard";
import { db } from "@/lib/db";
import { invitationUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Ubah undangan", robots: { index: false } };

/** Editor pembeli setelah tayang: ubah data selama masa aktif; tema terkunci. */
export default async function CustomerEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCustomer();
  const inv = await db.invitation.findFirst({
    where: { id: String(id).slice(0, 40), userId: user.id },
    include: { claim: true },
  });
  if (!inv) notFound();
  const phase = claimPhase(inv.claim, inv);
  const props = phase === "live" ? await loadEditorProps(inv) : null;
  if (!props)
    return (
      <CenterCard title="Undangan tidak bisa diubah">
        <p>
          {phase === "open"
            ? "Undangan belum dikonfirmasi — lanjutkan pengisian lewat link khusus dari admin."
            : "Masa ubah data sudah berakhir. Hubungi admin bila perlu perubahan."}
        </p>
        <Button asChild variant="outline">
          <Link href={`/akun/undangan/${inv.id}`}>Kembali</Link>
        </Button>
      </CenterCard>
    );
  // tema terkunci: hanya tema yang sedang dipakai (warna tetap bisa diganti)
  props.themes = props.themes.filter((t) => t.id === inv.themeId);
  return (
    <Editor
      {...props}
      mode="customer"
      backHref={`/akun/undangan/${inv.id}`}
      previewBase={`/akun/undangan/${inv.id}/pratinjau`}
      liveUrl={invitationUrl(inv.slug)}
    />
  );
}
