"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";

/** Login akun pembeli (email + kata sandi dari admin). Sukses → /akun (redirect dilempar). */
export async function customerLoginAction(
  _prev: { error: string | null },
  form: FormData,
): Promise<{ error: string | null }> {
  try {
    await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirectTo: "/akun",
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Email atau kata sandi salah." };
    throw e; // redirect sukses
  }
  return { error: null };
}
