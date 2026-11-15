import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import { GoogleIcon } from "@/components/layout/google-icon";
import { Button } from "@/components/ui/button";
import { business } from "@/config/business";
import { NOT_ADMIN_ERROR, canUseDashboard } from "@/lib/admin-access";
import { safeCallback } from "@/lib/auth/callback";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = { title: "Masuk" };

/** Pesan error Auth.js (?error=...) dalam Bahasa Indonesia. */
const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: "Email ini sudah terdaftar dengan metode login lain.",
  AccessDenied: "Akses ditolak. Silakan coba lagi.",
  Configuration: "Terjadi masalah konfigurasi server. Hubungi admin.",
  CredentialsSignin: "Email atau kata sandi salah.",
  [NOT_ADMIN_ERROR]:
    "Halaman ini khusus admin. Untuk memesan undangan, silakan pilih tema lalu isi form pemesanan — admin kami yang akan membuatkannya.",
};

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const redirectTo = safeCallback(callbackUrl);

  const session = await auth();
  // Sesi lama milik email non-admin: jangan dialihkan ke dashboard (akan
  // kembali ke sini terus) — tampilkan pesan & tombol keluar.
  const blocked = !!session?.user && !canUseDashboard(session.user.email);
  if (session?.user && !blocked) redirect(redirectTo);

  const errorKey = blocked ? NOT_ADMIN_ERROR : error;
  const errorMessage = errorKey
    ? (ERROR_MESSAGES[errorKey] ?? "Gagal masuk. Silakan coba lagi.")
    : null;
  const adminOnly = !business.selfService;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="bg-card w-full max-w-sm rounded-2xl border p-8 shadow-sm">
        <Link
          href="/"
          className="text-muted-foreground block text-center text-xs tracking-[0.2em] uppercase"
        >
          {siteConfig.name}
        </Link>
        <h1 className="font-heading mt-6 text-center text-3xl">
          {adminOnly ? "Masuk admin" : "Selamat datang"}
        </h1>
        <p className="text-muted-foreground mt-2 text-center text-sm">
          {adminOnly
            ? "Khusus admin untuk membuat dan mengelola undangan pesanan."
            : "Masuk untuk membuat dan mengelola undanganmu."}
        </p>

        {errorMessage && (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive mt-6 rounded-lg px-3 py-2 text-center text-sm"
          >
            {errorMessage}
          </p>
        )}

        {errorKey === NOT_ADMIN_ERROR && (
          <Link
            href="/tema"
            className="text-primary mt-3 block text-center text-sm font-medium underline-offset-4 hover:underline"
          >
            Lihat tema & pesan undangan
          </Link>
        )}

        {blocked ? (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/masuk" });
            }}
            className="mt-8"
          >
            <Button type="submit" variant="outline" size="lg" className="w-full">
              Keluar dari akun ini
            </Button>
          </form>
        ) : (
          /* Form POST biasa ke route handler (bukan server action) — lihat masuk/google/route.ts */
          <form method="post" action="/masuk/google" className="mt-8">
            <input type="hidden" name="callbackUrl" value={redirectTo} />
            <Button type="submit" variant="outline" size="lg" className="w-full gap-3">
              <GoogleIcon className="size-5" />
              Masuk dengan Google
            </Button>
          </form>
        )}

        <p className="text-muted-foreground mt-8 text-center text-xs leading-relaxed">
          Dengan masuk, kamu menyetujui Syarat & Ketentuan serta Kebijakan Privasi kami.
        </p>
      </div>
    </main>
  );
}
