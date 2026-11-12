import { listPublicWishes } from "@/lib/guestbook/service";

/** Ucapan publik untuk polling ringan (?after=ISO → hanya yang lebih baru). */
export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const after = new URL(req.url).searchParams.get("after");
  const date = after ? new Date(after) : undefined;
  const res = await listPublicWishes(
    slug,
    date && !Number.isNaN(date.getTime()) ? date : undefined,
  );
  if (!res) return Response.json({ error: "Tidak ditemukan" }, { status: 404 });
  return Response.json(res, {
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
