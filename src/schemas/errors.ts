import { z } from "zod";
import { id } from "zod/locales";

/**
 * Pesan galat Zod berbahasa Indonesia yang ramah untuk form editor.
 * `customError` menangani kasus umum; sisanya memakai locale bawaan Zod "id".
 * Pesan yang ditulis langsung di schema (mis. "Format jam HH:mm") tetap menang.
 * Dipanggil sekali dari src/schemas/index.ts → berlaku di server & browser.
 */
let configured = false;

export function configureZodIndonesian() {
  if (configured) return;
  configured = true;
  z.config(id());
  z.config({
    customError: (iss) => {
      switch (iss.code) {
        case "invalid_type":
          if (iss.input === undefined || iss.input === null || iss.input === "")
            return "Wajib diisi";
          return undefined;
        case "too_small":
          if (iss.origin === "string")
            return Number(iss.minimum) <= 1 ? "Wajib diisi" : `Minimal ${iss.minimum} karakter`;
          if (iss.origin === "array")
            return Number(iss.minimum) <= 1
              ? "Tambahkan minimal satu"
              : `Minimal ${iss.minimum} item`;
          if (iss.origin === "number") return `Minimal ${iss.minimum}`;
          return undefined;
        case "too_big":
          if (iss.origin === "string") return `Maksimal ${iss.maximum} karakter`;
          if (iss.origin === "array") return `Maksimal ${iss.maximum} item`;
          if (iss.origin === "number") return `Maksimal ${iss.maximum}`;
          return undefined;
        case "invalid_format":
          if (iss.format === "url") return "Link tidak valid (awali dengan https://)";
          if (iss.format === "email") return "Alamat email tidak valid";
          return undefined;
        case "invalid_value":
          return "Pilihan tidak valid";
        default:
          return undefined;
      }
    },
  });
}
