import { getManifest } from "../../src/themes/registry";

/**
 * Kolom Invitation untuk undangan uji yang SUDAH membeli temanya
 * (pengganti `package: "BASIC" | "PREMIUM" | "EXCLUSIVE"` di model lama).
 */
export function purchased(themeId: string, at = new Date()) {
  return {
    purchasedAt: at,
    themeCredit: getManifest(themeId)?.price ?? 0,
    ownedThemeIds: [themeId],
  };
}

/** Undangan uji: "paid" = sudah membeli tema, "draft" = belum membeli (draf gratis). */
export type Plan = "draft" | "paid";
export const planFields = (plan: Plan, themeId: string) =>
  plan === "paid" ? purchased(themeId) : {};
