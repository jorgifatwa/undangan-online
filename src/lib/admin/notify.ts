import "server-only";

import { getAttention } from "@/lib/admin/attention";
import { getBusinessMetrics, wibDate, wibStart, type Period } from "@/lib/admin/metrics";
import { adminEmails } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { emailConfigured, sendEmail } from "@/lib/email";
import { formatRupiah } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { getManifest } from "@/themes/registry";

/**
 * NOTIFIKASI EMAIL ADMIN: pesanan website lunas & ringkasan harian.
 * Penerima = ADMIN_EMAILS + akun ber-role ADMIN yang punya email.
 */
export async function adminRecipients(): Promise<string[]> {
  const dbAdmins = await db.user.findMany({
    where: { role: "ADMIN", email: { not: null } },
    select: { email: true },
  });
  return [...new Set([...adminEmails(), ...dbAdmins.map((a) => a.email!.toLowerCase())])].filter(
    (e) => !e.endsWith("@test.local"),
  );
}

async function sendToAdmins(subject: string, text: string) {
  if (!emailConfigured()) return { ok: false as const, error: "SMTP belum diisi" };
  const to = await adminRecipients();
  if (to.length === 0) return { ok: false as const, error: "Tidak ada email admin" };
  return sendEmail({ to: to.join(", "), subject, text });
}

/** Email ke admin setiap pesanan website lunas (dipanggil setelah link khusus dibuat). */
export async function notifyPaidOrder(o: {
  midtransOrderId: string;
  amount: number;
  themeId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  paymentType: string | null;
}) {
  const theme = getManifest(o.themeId)?.name ?? o.themeId;
  return sendToAdmins(
    `Pesanan lunas ${formatRupiah(o.amount)} — ${o.buyerName}`,
    [
      `Pesanan website baru sudah LUNAS.`,
      "",
      `No. pesanan : ${o.midtransOrderId}`,
      `Nominal     : ${formatRupiah(o.amount)}${o.paymentType ? ` (${o.paymentType})` : ""}`,
      `Tema        : ${theme}`,
      `Pemesan     : ${o.buyerName} · ${o.buyerEmail}${o.buyerPhone ? ` · +${o.buyerPhone}` : ""}`,
      "",
      "Link khusus sudah dikirim otomatis ke email pemesan.",
      `${siteConfig.appUrl}/dashboard/pesanan`,
    ].join("\n"),
  );
}

/** Ringkasan kemarin (WIB) + daftar perlu tindakan. */
export async function sendDailyReport(now = new Date()) {
  const todayYmd = wibDate(now);
  const to = wibStart(todayYmd);
  const from = new Date(to.getTime() - 86400_000);
  const ymd = wibDate(from);
  const period: Period = { from, to, fromYmd: ymd, toYmd: ymd, days: 1, preset: "custom" };
  const [m, a] = await Promise.all([getBusinessMetrics(period), getAttention(now)]);
  const lines = [
    `Ringkasan ${siteConfig.name} — ${ymd} (WIB)`,
    "",
    `Pendapatan : ${formatRupiah(m.revenue.total)}`,
    `  · Website     ${formatRupiah(m.revenue.website)} (${m.orders.website} pesanan)`,
    `  · Marketplace ${formatRupiah(m.revenue.marketplace)} (${m.orders.marketplace} pesanan)`,
    `Undangan tayang : ${m.live}`,
    "",
    "Corong kemarin:",
    ...m.funnel.map((f) => `  · ${f.label}: ${f.value}`),
    "",
    `Perlu tindakan (${a.total}):`,
    a.total === 0 ? "  · Semua beres." : "",
    a.expiring.length ? `  · ${a.expiring.length} link khusus hampir kedaluwarsa` : "",
    a.liveNoAccount.length
      ? `  · ${a.liveNoAccount.length} undangan tayang tanpa akun pembeli`
      : "",
    a.activeEnding.length ? `  · ${a.activeEnding.length} masa aktif hampir habis` : "",
    a.emailFailed.length ? `  · ${a.emailFailed.length} pesanan lunas, email belum terkirim` : "",
    a.unfulfilled.length ? `  · ${a.unfulfilled.length} pesanan lunas, link belum dibuat` : "",
    a.stuckPayment.length ? `  · ${a.stuckPayment.length} pembayaran tertahan` : "",
    "",
    `${siteConfig.appUrl}/dashboard`,
  ].filter((l, i, arr) => l !== "" || arr[i - 1] !== "");
  return sendToAdmins(
    `Ringkasan ${ymd}: ${formatRupiah(m.revenue.total)} · ${m.orders.total} pesanan`,
    lines.join("\n"),
  );
}
