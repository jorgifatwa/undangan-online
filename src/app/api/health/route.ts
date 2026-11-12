import { db } from "@/lib/db";
import { storage } from "@/lib/storage";

/**
 * Cek kesehatan & REGION setelah deploy (docs/DEPLOY.md → Cek pasca-deploy).
 *  - publik: { ok } saja
 *  - dengan Authorization: Bearer $CRON_SECRET: region fungsi + latensi
 *    database & penyimpanan dari dalam fungsi. Bila Vercel (sin1), Neon & R2
 *    berdekatan, query database ±1–5 ms; ratusan ms = beda benua.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function timed<T>(fn: () => Promise<T>) {
  const t = performance.now();
  await fn();
  return Math.round((performance.now() - t) * 10) / 10;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authorized = !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
  try {
    const first = await timed(() => db.$queryRaw`SELECT 1`);
    if (!authorized) return Response.json({ ok: true }, { headers });
    const runs: number[] = [];
    for (let i = 0; i < 5; i++) runs.push(await timed(() => db.$queryRaw`SELECT 1`));
    runs.sort((a, b) => a - b);
    const store = storage();
    const storageMs = await timed(() => store.size("health/does-not-exist"));
    return Response.json(
      {
        ok: true,
        functionRegion: process.env.VERCEL_REGION ?? "lokal",
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
        database: { firstQueryMs: first, medianQueryMs: runs[2] },
        storage: { driver: store.name, headMs: storageMs },
      },
      { headers },
    );
  } catch {
    return Response.json(
      { ok: false, error: "database tidak terjangkau" },
      { status: 503, headers },
    );
  }
}
