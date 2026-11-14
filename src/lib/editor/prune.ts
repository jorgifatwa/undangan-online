/**
 * Bersihkan nilai form sebelum divalidasi/disimpan:
 *  - string kosong / spasi → undefined
 *  - NaN (input angka kosong) → undefined
 *  - objek yang semua isinya kosong (mis. data ayah yang tidak diisi:
 *    { name: "", deceased: false }) → undefined
 *  - item array yang seluruhnya kosong dibuang
 *  - KECUALI subtree sakelar (photoDecor): `false` di sana disimpan apa adanya
 * Dengan begitu field opsional yang dibiarkan kosong tidak dianggap salah.
 */
/** Subtree tempat `false` BERMAKNA (sakelar yang dimatikan), bukan isian kosong. */
const FALSE_MEANINGFUL = new Set(["photoDecor"]);

export function prune(value: unknown, keepFalse = false): unknown {
  if (typeof value === "string") return value.trim() === "" ? undefined : value;
  if (typeof value === "number") return Number.isNaN(value) ? undefined : value;
  if (Array.isArray(value))
    return value.map((v) => prune(v, keepFalse)).filter((v) => v !== undefined);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    let meaningful = false;
    for (const [k, v] of Object.entries(value)) {
      const p = prune(v, keepFalse || FALSE_MEANINGFUL.has(k));
      if (p === undefined) continue;
      out[k] = p;
      // boolean false & array kosong saja tidak membuat objek "terisi" — kecuali
      // di subtree sakelar (photoDecor: { coverHat: { show: false } } harus tersimpan)
      if ((p !== false || keepFalse) && !(Array.isArray(p) && p.length === 0)) meaningful = true;
    }
    return meaningful ? out : Object.keys(out).length && isTopLevelish(out) ? out : undefined;
  }
  return value;
}

/** Objek tingkat atas yang hanya berisi array kosong tetap dipertahankan (mis. { strip: [] }). */
function isTopLevelish(o: Record<string, unknown>) {
  return Object.values(o).every((v) => Array.isArray(v));
}
