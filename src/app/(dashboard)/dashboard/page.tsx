import type { Metadata } from "next";

import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Dashboard" };

/** Dashboard sementara — daftar undangan & statistik dibuat di tahap dashboard. */
export default async function DashboardPage() {
  const user = await requireUser();
  const total = await db.invitation.count({ where: { userId: user.id } });

  return (
    <section>
      <h1 className="font-heading text-3xl">Halo, {user.name?.split(" ")[0] ?? "kamu"} 👋</h1>
      <p className="text-muted-foreground mt-2">
        Kamu punya {total} undangan. Fitur pembuatan undangan hadir di tahap berikutnya.
      </p>
    </section>
  );
}
