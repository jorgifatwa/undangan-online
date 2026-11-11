import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { GoogleIcon } from "@/components/layout/google-icon";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = { title: "Masuk" };

/** Pesan error Auth.js (?error=...) dalam Bahasa Indonesia. */
const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: "Email ini sudah terdaftar dengan metode login lain.",
  AccessDenied: "Akses ditolak. Silakan coba lagi.",
  Configuration: "Terjadi masalah konfigurasi server. Hubungi admin.",
  CredentialsSignin: "Email atau kata sandi salah.",
};

/**
 * Hanya izinkan redirect ke origin aplikasi sendiri (cegah open redirect).
 * Middleware Auth.js mengirim callbackUrl absolut, jadi URL absolut
 * dengan origin yang sama juga diterima lalu diubah menjadi path.
 */
function safeCallback(url: string | undefined): string {
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

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const redirectTo = safeCallback(callbackUrl);

  const session = await auth();
  if (session?.user) redirect(redirectTo);

  async function loginGoogle() {
    "use server";
    await signIn("google", { redirectTo });
  }

  const errorMessage = error ? (ERROR_MESSAGES[error] ?? "Gagal masuk. Silakan coba lagi.") : null;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="bg-card w-full max-w-sm rounded-2xl border p-8 shadow-sm">
        <Link
          href="/"
          className="text-muted-foreground block text-center text-xs tracking-[0.2em] uppercase"
        >
          {siteConfig.name}
        </Link>
        <h1 className="font-heading mt-6 text-center text-3xl">Selamat datang</h1>
        <p className="text-muted-foreground mt-2 text-center text-sm">
          Masuk untuk membuat dan mengelola undanganmu.
        </p>

        {errorMessage && (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive mt-6 rounded-lg px-3 py-2 text-center text-sm"
          >
            {errorMessage}
          </p>
        )}

        <form action={loginGoogle} className="mt-8">
          <Button type="submit" variant="outline" size="lg" className="w-full gap-3">
            <GoogleIcon className="size-5" />
            Masuk dengan Google
          </Button>
        </form>

        <p className="text-muted-foreground mt-8 text-center text-xs leading-relaxed">
          Dengan masuk, kamu menyetujui Syarat & Ketentuan serta Kebijakan Privasi kami.
        </p>
      </div>
    </main>
  );
}
