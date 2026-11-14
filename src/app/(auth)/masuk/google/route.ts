import { signIn } from "@/auth";
import { safeCallback } from "@/lib/auth/callback";

/**
 * Mulai login Google dari form HTML biasa (POST), BUKAN server action.
 *
 * Server action memakai ID yang berubah setiap build/deploy: halaman /masuk
 * yang sudah terbuka sebelum server di-restart atau di-deploy ulang akan
 * mengirim ID lama → "Server action not found" → di browser muncul
 * "An unexpected response was received from the server". Route handler ini
 * alamatnya tetap, jadi tombol tetap berfungsi di tab lama.
 */
export async function POST(req: Request) {
  // Hanya dari halaman kita sendiri (form lintas situs ditolak).
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host"))
    return new Response("Asal permintaan tidak diizinkan.", { status: 403 });

  const form = await req.formData().catch(() => null);
  const redirectTo = safeCallback(form?.get("callbackUrl")?.toString());
  // redirect: false → dapat URL Google; kirim 303 agar browser lanjut dengan GET.
  const url = await signIn("google", { redirectTo, redirect: false });
  return new Response(null, { status: 303, headers: { Location: String(url) } });
}
