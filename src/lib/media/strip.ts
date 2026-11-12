/**
 * Kosongkan rujukan file upload dari data undangan (setelah file dihapus
 * oleh retensi): objek foto {url} → dibuang, item galeri dibuang, lagu
 * unggahan dibuang dari daftar musik. Teks & data lain tidak disentuh.
 */
export function stripMediaUrls(data: unknown, isOurs: (url: string) => boolean): unknown {
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) {
      return v.map(walk).filter((x) => x !== undefined);
    }
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (typeof o.url === "string" && isOurs(o.url)) return undefined;
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(o)) {
        const w = walk(x);
        if (w !== undefined) out[k] = w;
      }
      return out;
    }
    return v;
  };
  return walk(data);
}
