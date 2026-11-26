"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";

/** Login akun pembeli (email + kata sandi dari admin). Sukses → /akun (redirect dilempar). */
export async function customerLoginAction(
  _prev: { error: string | null; email: string },
  form: FormData,
): Promise<{ error: string | null; email: string }> {
  const email = String(form.get("email") ?? "").slice(0, 200);
  try {
    await signIn("credentials", {
      email,
      password: String(form.get("password") ?? ""),
      // /masuk mengarahkan sesuai role: pembeli → /akun, admin → /dashboard
      redirectTo: "/masuk",
    });
  } catch (e) {
    // email dikembalikan agar form (yang direset React setelah action) tetap terisi
    if (e instanceof AuthError) return { error: "Email atau kata sandi salah.", email };
    throw e; // redirect sukses
  }
  return { error: null, email };
}
