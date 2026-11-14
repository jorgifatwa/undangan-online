import { siteConfig } from "@/lib/site";

/**
 * Hanya izinkan redirect ke origin aplikasi sendiri (cegah open redirect).
 * Middleware Auth.js mengirim callbackUrl absolut, jadi URL absolut
 * dengan origin yang sama juga diterima lalu diubah menjadi path.
 */
export function safeCallback(url: string | null | undefined): string {
  const fallback = "/dashboard";
  if (!url) return fallback;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const parsed = new URL(url);
    const appOrigin = new URL(siteConfig.appUrl).origin;
    return parsed.origin === appOrigin ? `${parsed.pathname}${parsed.search}` : fallback;
  } catch {
    return fallback;
  }
}
