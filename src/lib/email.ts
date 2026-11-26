import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { siteConfig } from "@/lib/site";

/**
 * Kirim email lewat SMTP (link khusus, data login pembeli, dll.).
 * Kredensial diisi pemilik di env:
 *   SMTP_HOST, SMTP_PORT (465 = SSL, 587 = STARTTLS), SMTP_USER, SMTP_PASS,
 *   SMTP_FROM (mis. "Undangan Online <halo@domain.id>").
 * Belum diisi → `emailConfigured()` false; pemanggil menampilkan opsi
 * WhatsApp saja (tidak melempar).
 */
export function emailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter: Transporter | null = null;
function getTransporter(): Transporter {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT ?? 465);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

export interface EmailMessage {
  to: string;
  subject: string;
  /** Teks biasa (selalu dikirim; dipakai klien email tanpa HTML). */
  text: string;
  html?: string;
}

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  if (!emailConfigured()) return { ok: false, error: "Email belum dikonfigurasi (SMTP)." };
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM ?? `${siteConfig.name} <${process.env.SMTP_USER}>`,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    });
    return { ok: true };
  } catch (e) {
    console.error("[email] gagal mengirim", e instanceof Error ? e.message : e);
    return { ok: false, error: "Email gagal dikirim. Coba lagi atau kirim lewat WhatsApp." };
  }
}
