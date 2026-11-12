import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireOwnedInvitation } from "@/lib/invitations/access";
import { summarize } from "@/lib/invitations/summary";
import { getManifest } from "@/themes/registry";

export const metadata: Metadata = { title: "Edit Undangan" };

/** Sementara (Tahap 3a): ringkasan + tautan. Editor lengkap dibangun di 3b. */
export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { invitation } = await requireOwnedInvitation(id);
  const s = summarize(invitation.eventType, invitation.data);
  const manifest = getManifest(invitation.themeId);

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">Undangan dibuat ✓</p>
      <h1 className="font-heading mt-2 text-3xl">{s.title}</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {s.dateLabel} · tema {manifest?.name} · alamat <code>/u/{invitation.slug}</code>
      </p>
      <p className="mt-6 text-sm">
        Editor lengkap (form, foto, musik, urutan section) hadir di tahap 3b.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Button asChild>
          <Link href={`/dashboard/undangan/${invitation.id}/pratinjau`} target="_blank">
            Pratinjau
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Ke dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
