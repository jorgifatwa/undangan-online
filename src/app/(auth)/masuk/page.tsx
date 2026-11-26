import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import { Logo } from "@/components/brand/Logo";
import { GoogleIcon } from "@/components/layout/google-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { business } from "@/config/business";
import { NOT_ADMIN_ERROR, canUseDashboard, isAdminEmail } from "@/lib/admin-access";
import { safeCallback } from "@/lib/auth/callback";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/site";

import { bouquetHanging, velvetBg } from "../../(marketing)/_landing/art";
import { CustomerLoginForm } from "./CustomerLoginForm";

export const metadata: Metadata = { title: "Masuk" };

/** Pesan error Auth.js (?error=...) dalam Bahasa Indonesia. */
const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: "Email ini sudah terdaftar dengan metode login lain.",
  AccessDenied: "Akses ditolak. Silakan coba lagi.",
  Configuration: "Terjadi masalah konfigurasi server. Hubungi admin.",
  CredentialsSignin: "Email atau kata sandi salah.",
  [NOT_ADMIN_ERROR]:
    'Halaman ini khusus admin & pembeli yang sudah punya akun. Untuk memesan undangan, pilih tema lalu tekan "Pesan tema ini".',
};

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const redirectTo = safeCallback(callbackUrl);

  const session = await auth();
  // Pembeli → dashboard akunnya.
  if (session?.user?.role === "CUSTOMER") redirect("/akun");
  // Sesi lama milik email non-admin: jangan dialihkan ke dashboard (akan
  // kembali ke sini terus) — tampilkan pesan & tombol keluar.
  let blocked = !!session?.user && !canUseDashboard(session.user.email, session.user.role);
  // Admin dari database yang aksesnya sudah dicabut (role di JWT masih ADMIN).
  if (session?.user && !blocked && !business.selfService && !isAdminEmail(session.user.email)) {
    const u = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    blocked = u?.role !== "ADMIN";
  }
  if (session?.user && !blocked) redirect(redirectTo);

  const errorKey = blocked ? NOT_ADMIN_ERROR : error;
  const errorMessage = errorKey
    ? (ERROR_MESSAGES[errorKey] ?? "Gagal masuk. Silakan coba lagi.")
    : null;
  const adminOnly = !business.selfService;

  const steps = [
    { n: 1, t: "Pilih tema & bayar" },
    { n: 2, t: "Isi lewat link khusus" },
    { n: 3, t: "Kelola tamu & ucapan" },
  ];

  return (
    <main className="bg-sand paper flex min-h-dvh items-center justify-center p-3 sm:p-6">
      <div className="bg-card grid w-full max-w-5xl overflow-hidden rounded-[32px] border p-2 shadow-[0_40px_100px_-50px_rgb(80_40_20/0.5)] md:grid-cols-[1.1fr_1fr]">
        {/* Panel kiri: beludru + langkah */}
        <section className="photo-panel text-primary-foreground relative hidden min-h-[620px] flex-col overflow-hidden rounded-[26px] p-8 md:flex lg:p-10">
          <Image src={velvetBg} alt="" fill priority sizes="560px" className="object-cover" />
          <Image
            src={bouquetHanging}
            alt=""
            width={260}
            className="pointer-events-none absolute -top-6 -right-8 z-[1] w-52 opacity-90 drop-shadow-2xl"
          />
          <Link href="/" className="relative z-[2] w-fit" aria-label={siteConfig.name}>
            <Logo variant="emas" className="h-8" />
          </Link>
          <div className="relative z-[2] mt-auto">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm backdrop-blur">
              <Sparkles className="text-gold size-4" /> Undangan digital yang terasa personal
            </span>
            <h2 className="font-heading mt-5 text-5xl leading-[1.05] tracking-tight">
              Kelola undanganmu
            </h2>
            <p className="mt-3 max-w-sm text-white/75">
              Ubah isi undangan, kirim ke tamu lewat WhatsApp, dan pantau RSVP & ucapan.
            </p>
            <ol className="mt-8 grid grid-cols-3 gap-3">
              {steps.map((st) => (
                <li
                  key={st.n}
                  className={
                    st.n === 3
                      ? "bg-background text-foreground flex min-h-28 flex-col justify-between rounded-2xl p-4 shadow-lg"
                      : "flex min-h-28 flex-col justify-between rounded-2xl bg-white/10 p-4 text-white/75 backdrop-blur"
                  }
                >
                  <span
                    className={
                      st.n === 3
                        ? "bg-primary text-primary-foreground grid size-7 place-items-center rounded-full text-xs"
                        : "grid size-7 place-items-center rounded-full border border-white/40 text-xs"
                    }
                  >
                    {st.n}
                  </span>
                  <span className="text-sm leading-snug">{st.t}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Panel kanan: form */}
        <section className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-14">
          <Link href="/" className="mx-auto mb-8 md:hidden" aria-label={siteConfig.name}>
            <Logo className="h-8" />
          </Link>
          <div className="mx-auto w-full max-w-sm">
            <h1 className="font-heading text-center text-4xl tracking-tight">
              {adminOnly ? "Masuk" : "Selamat datang"}
            </h1>
            <p className="text-muted-foreground mt-2 text-center text-sm">
              {adminOnly
                ? "Gunakan email & kata sandi yang dikirim admin."
                : "Masuk untuk membuat dan mengelola undanganmu."}
            </p>

            {errorMessage && (
              <Alert variant="destructive" className="mt-6">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
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
                <Button type="submit" variant="outline" size="lg" className="h-11 w-full">
                  Keluar dari akun ini
                </Button>
              </form>
            ) : (
              <>
                <CustomerLoginForm />
                <p className="text-muted-foreground mt-4 text-center text-sm">
                  Belum punya undangan?{" "}
                  <Link href="/tema" className="text-primary font-medium hover:underline">
                    Pilih tema
                  </Link>
                </p>
                <div className="text-muted-foreground my-6 flex items-center gap-3 text-xs">
                  <span className="bg-border h-px flex-1" />
                  atau, untuk admin
                  <span className="bg-border h-px flex-1" />
                </div>
                {/* Form POST biasa ke route handler (bukan server action) — lihat masuk/google/route.ts */}
                <form method="post" action="/masuk/google">
                  <input type="hidden" name="callbackUrl" value={redirectTo} />
                  <Button
                    type="submit"
                    variant="outline"
                    size="lg"
                    className="h-12 w-full gap-3 rounded-xl text-[15px]"
                  >
                    <GoogleIcon className="size-5" />
                    Masuk dengan Google
                  </Button>
                </form>
              </>
            )}

            <p className="text-muted-foreground mt-8 text-center text-xs leading-relaxed">
              Dengan masuk, kamu menyetujui{" "}
              <Link href="/syarat" className="text-primary hover:underline">
                Syarat & Ketentuan
              </Link>{" "}
              serta{" "}
              <Link href="/privasi" className="text-primary hover:underline">
                Kebijakan Privasi
              </Link>{" "}
              kami.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
