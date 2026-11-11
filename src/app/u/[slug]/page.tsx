import { notFound } from "next/navigation";

import { db } from "@/lib/db";

/**
 * Halaman undangan publik (fallback /u/{slug}; subdomain akan di-rewrite ke sini).
 * Tahap 1: placeholder. Render tema via theme registry dibuat di tahap tema.
 */
export default async function InvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const invitation = await db.invitation.findUnique({
    where: { slug },
    select: { slug: true, status: true, themeId: true },
  });

  if (!invitation || invitation.status !== "PUBLISHED") notFound();

  return (
    <main className="flex min-h-dvh items-center justify-center p-6 text-center">
      <p className="text-muted-foreground">
        Undangan <strong>{invitation.slug}</strong> (tema {invitation.themeId}) akan tampil di sini.
      </p>
    </main>
  );
}
