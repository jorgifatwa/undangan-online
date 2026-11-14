"use client";

import { useState } from "react";

/**
 * Uji ML di browser (dipakai e2e): ?foto=<url>&aksi=wajah|latar|ringan.
 * Hasil ditulis ke window.__ml agar bisa dibaca puppeteer.
 */
export function MlUji() {
  const [log, setLog] = useState<string[]>([]);
  const [img, setImg] = useState<string | null>(null);
  const run = async () => {
    const sp = new URLSearchParams(location.search);
    const foto = sp.get("foto") ?? "/placeholders/photos/birthday-celebrant.webp";
    const aksi = sp.get("aksi") ?? "wajah";
    const ml = await import("@/lib/ml/client");
    const t0 = performance.now();
    const w = window as unknown as { __ml?: unknown };
    try {
      if (aksi === "wajah") {
        const face = await ml.detectFace(foto);
        w.__ml = { ok: true, face, ms: Math.round(performance.now() - t0) };
      } else {
        const r = await ml.removeBackground(foto, {
          lite: aksi === "ringan",
          onProgress: (p) => setLog((l) => [...l.slice(-3), `unduh ${Math.round(p * 100)}%`]),
        });
        setImg(URL.createObjectURL(r.blob));
        w.__ml = {
          ok: true,
          mode: r.mode,
          fellBack: r.fellBack,
          ms: r.ms,
          total: Math.round(performance.now() - t0),
          bytes: r.blob.size,
          type: r.blob.type,
        };
      }
    } catch (e) {
      w.__ml = { ok: false, error: String(e) };
    }
    setLog((l) => [...l, JSON.stringify(w.__ml)]);
  };
  return (
    <main style={{ padding: 16, fontFamily: "system-ui" }}>
      <button id="jalan" onClick={run} style={{ padding: 8, border: "1px solid" }}>
        Jalankan
      </button>
      <pre id="log">{log.join("\n")}</pre>
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          id="hasil"
          src={img}
          alt=""
          style={{
            maxWidth: 360,
            background: "repeating-conic-gradient(#ddd 0 25%, #fff 0 50%) 0 0/20px 20px",
          }}
        />
      )}
    </main>
  );
}
