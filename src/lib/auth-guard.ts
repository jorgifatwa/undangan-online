import "server-only";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

/**
 * Pastikan request berasal dari user yang login.
 * Pakai di setiap server component / server action / route handler yang
 * butuh user — middleware saja tidak cukup (server action bisa dipanggil langsung).
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/masuk");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
