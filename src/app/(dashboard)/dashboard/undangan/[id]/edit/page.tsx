import type { Metadata } from "next";

import { requireOwnedInvitation } from "@/lib/invitations/access";

import { Editor } from "./Editor";
import { loadEditorProps } from "./editor-props";

export const metadata: Metadata = { title: "Edit Undangan", robots: { index: false } };

/** Editor undangan (pemilik saja). Semua penyimpanan dicek ulang di server action. */
export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { invitation } = await requireOwnedInvitation(id);
  const props = await loadEditorProps(invitation);
  if (!props) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-heading text-2xl">Data undangan tidak bisa dibaca</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Hubungi bantuan dengan menyertakan id {invitation.id}.
        </p>
      </main>
    );
  }
  return <Editor {...props} />;
}
