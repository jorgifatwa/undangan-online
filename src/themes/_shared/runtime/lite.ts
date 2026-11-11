/**
 * Deteksi perangkat lemah → "mode ringan".
 * Banyak tamu membuka undangan dari Android murah lewat WhatsApp, jadi efek
 * berat (kelopak banyak, parallax, filter noise, blur) dikurangi di sana.
 */

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

export interface LiteReason {
  lite: boolean;
  reasons: string[];
}

export function detectLowEndDevice(): LiteReason {
  if (typeof navigator === "undefined") return { lite: false, reasons: [] };
  const nav = navigator as NavigatorWithHints;
  const reasons: string[] = [];

  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4) {
    reasons.push(`cpu=${nav.hardwareConcurrency}`);
  }
  // deviceMemory hanya ada di Chromium (dibulatkan: 0.25, 0.5, 1, 2, 4, 8).
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) {
    reasons.push(`ram=${nav.deviceMemory}GB`);
  }
  if (nav.connection?.saveData) reasons.push("save-data");

  return { lite: reasons.length > 0, reasons };
}
