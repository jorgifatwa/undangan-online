/**
 * Cek pasca-deploy staging/production (docs/DEPLOY.md). Jalankan DARI
 * INDONESIA (laptop/jaringan Anda) agar TTFB mewakili tamu sungguhan.
 *
 *   CRON_SECRET=... pnpm deploy:check https://undangku-staging.vercel.app --slug=nama-undangan
 *
 *  - region fungsi (sin1) dari header x-vercel-id & /api/health
 *  - latensi database & R2 dari DALAM fungsi (menandakan region berdekatan)
 *  - TTFB halaman undangan: pertama (dingin) + median/p75 10× (target < 600 ms)
 *  - noindex, gambar pratinjau, cron & file rahasia tidak terbuka
 */
const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http"))?.replace(/\/+$/, "");
const slug = args.find((a) => a.startsWith("--slug="))?.split("=")[1];
const runs = Number(args.find((a) => a.startsWith("--runs="))?.split("=")[1] ?? 10);
const secret = process.env.CRON_SECRET;
if (!base) {
  console.error(
    "Pakai: CRON_SECRET=... pnpm deploy:check https://app-anda.vercel.app --slug=slug-undangan",
  );
  process.exit(2);
}

let failed = 0;
let warned = 0;
const ok = (good: boolean, label: string, warnOnly = false) => {
  console.log(`${good ? "  ✓" : warnOnly ? "  !" : "  ✗"} ${label}`);
  if (!good) {
    if (warnOnly) warned++;
    else failed++;
  }
};

/** Waktu sampai header respons diterima (≈ TTFB, termasuk DNS/TLS bila koneksi baru). */
async function ttfb(url: string, init?: RequestInit) {
  const t = performance.now();
  const res = await fetch(url, { redirect: "manual", ...init });
  const ms = performance.now() - t;
  const body = Buffer.from(await res.arrayBuffer());
  return { res, ms: Math.round(ms), body };
}
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const p75 = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length * 0.75)];
/** x-vercel-id: "sin1::sin1::abcd-…" → [PoP CDN, region fungsi] */
const vercelRegions = (h: Headers) => (h.get("x-vercel-id") ?? "").split("::").slice(0, -1);

async function main() {
  console.log(`Cek pasca-deploy: ${base}\n`);

  console.log("Region");
  const health = await ttfb(`${base}/api/health`, {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
  const regions = vercelRegions(health.res.headers);
  ok(health.res.status === 200, `/api/health ${health.res.status}`);
  ok(
    regions.at(-1) === "sin1",
    `region fungsi: ${regions.at(-1) ?? "?"} (harus sin1; PoP CDN terdekat Anda: ${regions[0] ?? "?"})`,
  );
  if (!secret) {
    console.log("  – CRON_SECRET tidak diisi: latensi database/R2 dilewati");
  } else {
    const h = JSON.parse(health.body.toString()) as {
      functionRegion?: string;
      database?: { firstQueryMs: number; medianQueryMs: number };
      storage?: { driver: string; headMs: number };
    };
    if (!h.database) ok(false, "CRON_SECRET ditolak /api/health (nilai berbeda dengan di Vercel?)");
    else {
      ok(
        h.database.medianQueryMs < 15,
        `database: query ${h.database.medianQueryMs} ms (median; < 15 ms = Neon satu region dengan fungsi)` +
          `, query pertama ${h.database.firstQueryMs} ms`,
      );
      ok(h.storage?.driver === "r2", `penyimpanan: ${h.storage?.driver}`);
      ok(
        (h.storage?.headMs ?? 999) < 150,
        `R2: ${h.storage?.headMs} ms per permintaan dari fungsi (< 150 ms = dekat)`,
        true,
      );
    }
  }

  console.log("\nKeamanan dasar");
  const env = await ttfb(`${base}/.env`);
  ok(env.res.status === 404, `/.env tidak bisa diunduh (${env.res.status})`);
  const cron = await ttfb(`${base}/api/cron/media-cleanup`);
  ok(cron.res.status === 401, `cron tanpa rahasia ditolak (${cron.res.status})`);
  const home = await ttfb(`${base}/`);
  ok(home.res.status === 200, `beranda ${home.res.status} (${home.ms} ms)`);

  if (!slug) {
    console.log("\n– --slug tidak diisi: TTFB halaman undangan dilewati");
  } else {
    console.log(`\nHalaman undangan /${slug} (${runs}×)`);
    const url = `${base}/${slug}?to=Uji%20Deploy`;
    const first = await ttfb(url);
    ok(first.res.status === 200, `status ${first.res.status}`);
    const times: number[] = [];
    for (let i = 0; i < runs; i++) times.push((await ttfb(url)).ms);
    console.log(
      `  TTFB pertama ${first.ms} ms (termasuk DNS+TLS, bisa juga Neon bangun dari tidur) · ` +
        `median ${median(times)} ms · p75 ${p75(times)} ms · min ${Math.min(...times)} ms`,
    );
    ok(median(times) < 600, `TTFB median < 600 ms`);
    ok(/noindex/.test(first.res.headers.get("x-robots-tag") ?? ""), "header X-Robots-Tag noindex");
    const html = first.body.toString();
    const og = html
      .match(/<meta property="og:image" content="([^"]+)"/)?.[1]
      ?.replace(/&amp;/g, "&");
    ok(!!og, `og:image ${og ?? "tidak ada"}`);
    const img = og
      ? await ttfb(og).catch(
          (e: Error) => (
            ok(false, `gambar pratinjau gagal diambil: ${e.cause ?? e.message}`),
            null
          ),
        )
      : null;
    if (img) {
      ok(
        img.res.status === 200 && img.res.headers.get("content-type") === "image/jpeg",
        `gambar pratinjau ${img.res.status} ${img.res.headers.get("content-type")} ` +
          `${Math.round(img.body.length / 1024)} KB (${img.ms} ms)`,
      );
      ok(img.body.length < 150 * 1024, "gambar pratinjau < 150 KB");
    }
    ok(
      /udk_dev=[a-f0-9]{32}.*Secure/i.test(first.res.headers.get("set-cookie") ?? ""),
      "cookie perangkat tamu dibuat dengan atribut Secure (HTTPS)",
    );
  }

  console.log(
    failed
      ? `\n✗ ${failed} pemeriksaan gagal${warned ? `, ${warned} peringatan` : ""}`
      : `\n✓ Semua pemeriksaan wajib lolos${warned ? ` (${warned} peringatan)` : ""}`,
  );
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
