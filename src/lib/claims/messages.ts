import { formatTanggal } from "@/lib/format";
import { siteConfig } from "@/lib/site";

/** URL link khusus (token mentah hanya ada di sini; jangan dicatat ke log). */
export const claimUrl = (token: string) => `${siteConfig.appUrl}/isi/${token}`;

/** URL halaman masuk akun pembeli. */
export const customerLoginUrl = () => `${siteConfig.appUrl}/masuk`;

/** Pesan WA/email berisi link khusus untuk pembeli. */
export function claimLinkMessage(v: {
  customerName: string;
  themeName: string;
  url: string;
  expiresAt: Date;
}) {
  return [
    `Halo Kak ${v.customerName}, terima kasih sudah memesan undangan tema *${v.themeName}* 🙏`,
    "",
    "Silakan isi data undangan lewat link khusus berikut (bisa dicicil, tersimpan otomatis tiap pindah langkah):",
    v.url,
    "",
    `Link berlaku sampai ${formatTanggal(v.expiresAt)}. Selama belum dikonfirmasi, Kakak boleh ganti ke tema lain dengan harga yang sama.`,
    "Mohon jangan bagikan link ini ke orang lain.",
    "",
    `— ${siteConfig.name}`,
  ].join("\n");
}

/** Pesan WA/email berisi data login akun pembeli. */
export function loginMessage(v: {
  customerName: string;
  email: string;
  password: string;
  invitationUrl: string;
}) {
  return [
    `Halo Kak ${v.customerName}, undangan Kakak sudah tayang di:`,
    v.invitationUrl,
    "",
    "Untuk mengubah data, melihat ucapan & RSVP, serta mengirim undangan ke tamu, silakan masuk ke:",
    customerLoginUrl(),
    `Email: ${v.email}`,
    `Kata sandi: ${v.password}`,
    "",
    "Simpan pesan ini baik-baik dan jangan bagikan kata sandi ke orang lain.",
    "",
    `— ${siteConfig.name}`,
  ].join("\n");
}
