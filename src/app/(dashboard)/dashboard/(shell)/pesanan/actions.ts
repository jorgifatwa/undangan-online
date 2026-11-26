"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { adminRefreshOrder, orderClaimUrl, resendOrderEmail } from "@/lib/web-orders/service";

/** Aksi admin atas pesanan website (dicatat di AdminAudit). */
type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function audit(actor: string, action: string, detail: object) {
  await db.adminAudit.create({ data: { actor, action, detail } });
}

export async function refreshOrderAction(id: string): Promise<R<{ status: string }>> {
  const admin = await requireAdmin();
  const o = await adminRefreshOrder(String(id));
  if (!o) return { ok: false, error: "Pesanan tidak ditemukan." };
  await audit(admin.email ?? admin.id, "order.refresh", {
    order: o.midtransOrderId,
    status: o.status,
  });
  revalidatePath("/dashboard", "layout");
  return { ok: true, status: o.status };
}

export async function resendOrderEmailAction(id: string): Promise<R> {
  const admin = await requireAdmin();
  const r = await resendOrderEmail(String(id));
  if (r.ok) {
    await audit(admin.email ?? admin.id, "order.resendEmail", { orderId: id });
    revalidatePath("/dashboard", "layout");
  }
  return r;
}

/** Ambil link khusus pesanan (untuk disalin admin & dikirim lewat WhatsApp). */
export async function orderLinkAction(id: string): Promise<R<{ url: string }>> {
  const admin = await requireAdmin();
  const o = await db.webOrder.findUnique({ where: { id: String(id) } });
  const url = o ? orderClaimUrl(o) : null;
  if (!url) return { ok: false, error: "Link khusus belum ada." };
  await audit(admin.email ?? admin.id, "order.viewLink", { order: o!.midtransOrderId });
  return { ok: true, url };
}
