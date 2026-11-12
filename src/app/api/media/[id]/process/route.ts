import { auth } from "@/auth";
import { mediaView, processAudio } from "@/lib/media/service";

/**
 * Kompresi musik ASINKRON: dipanggil browser setelah upload selesai, berjalan
 * terpisah dari request lain dengan waktu cukup panjang. Aman dipanggil ulang
 * (kunci processingStartedAt). Editor memantau status lewat polling.
 */
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Harus masuk" }, { status: 401 });
  const { id } = await params;
  try {
    const m = await processAudio(session.user.id, id);
    return Response.json(mediaView(m));
  } catch {
    return Response.json({ error: "File tidak ditemukan" }, { status: 404 });
  }
}
