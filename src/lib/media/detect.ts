/**
 * Deteksi tipe file dari ISI (magic bytes), bukan dari nama file atau header
 * Content-Type yang bisa dipalsukan. Hanya format yang benar-benar diproses
 * server yang dikenali; selain itu null (ditolak).
 */
export type Detected =
  | { kind: "image"; mime: "image/jpeg" | "image/png" | "image/webp" | "image/avif" }
  | { kind: "heic"; mime: "image/heic" }
  | {
      kind: "audio";
      mime: "audio/mpeg" | "audio/mp4" | "audio/wav" | "audio/ogg" | "audio/flac" | "audio/aac";
    };

const ascii = (b: Uint8Array, start: number, len: number) =>
  String.fromCharCode(...b.subarray(start, start + len));

export function detectFile(bytes: Uint8Array): Detected | null {
  const b = bytes;
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { kind: "image", mime: "image/jpeg" };
  if (b[0] === 0x89 && ascii(b, 1, 3) === "PNG" && b[4] === 0x0d && b[5] === 0x0a)
    return { kind: "image", mime: "image/png" };
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP")
    return { kind: "image", mime: "image/webp" };
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WAVE")
    return { kind: "audio", mime: "audio/wav" };
  if (ascii(b, 4, 4) === "ftyp") {
    const brand = ascii(b, 8, 4);
    if (["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"].includes(brand))
      return { kind: "heic", mime: "image/heic" };
    if (["avif", "avis"].includes(brand)) return { kind: "image", mime: "image/avif" };
    if (["M4A ", "M4B ", "mp42", "mp41", "isom", "iso2", "dash", "3gp4", "3gp5"].includes(brand))
      return { kind: "audio", mime: "audio/mp4" };
    return null;
  }
  if (ascii(b, 0, 3) === "ID3") return { kind: "audio", mime: "audio/mpeg" };
  if (ascii(b, 0, 4) === "OggS") return { kind: "audio", mime: "audio/ogg" };
  if (ascii(b, 0, 4) === "fLaC") return { kind: "audio", mime: "audio/flac" };
  // MPEG audio frame sync (MP3 tanpa ID3) / ADTS AAC
  if (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) {
    const layer = (b[1] >> 1) & 0x03;
    return layer === 0
      ? { kind: "audio", mime: "audio/aac" }
      : { kind: "audio", mime: "audio/mpeg" };
  }
  return null;
}
