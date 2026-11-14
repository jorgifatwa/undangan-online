import type { Metadata } from "next";
import Link from "next/link";

import { LegalContact, LegalPage, type LegalSection } from "@/components/marketing/LegalPage";
import { business } from "@/config/business";
import { MEDIA_RETENTION_DAYS } from "@/lib/invitations/retention";
import { PAYMENT_TEXT, REFUND_TEXT } from "@/lib/marketing/content";
import { PACKAGES, PAID_ACTIVE } from "@/lib/packages";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: `Syarat & Ketentuan penggunaan ${business.name}: akun, paket & masa aktif, pembayaran, pengembalian dana, dan tanggung jawab atas konten.`,
  alternates: { canonical: "/syarat" },
};

const trial = PACKAGES.FREE.features.activeDays;

const SECTIONS: LegalSection[] = [
  {
    id: "layanan",
    title: "Tentang layanan",
    body: (
      <p>
        {business.name} adalah layanan untuk membuat, mengelola, dan membagikan undangan digital
        (pernikahan dan ulang tahun) beserta fitur pendukungnya seperti RSVP dan ucapan tamu. Dengan
        membuat akun atau memakai layanan, Anda menyetujui Syarat & Ketentuan ini serta{" "}
        <Link href="/privasi" className="underline">
          Kebijakan Privasi
        </Link>
        .
      </p>
    ),
  },
  {
    id: "akun",
    title: "Akun",
    body: (
      <ul>
        <li>Akun dibuat dengan masuk menggunakan akun Google Anda.</li>
        <li>
          Anda bertanggung jawab atas semua aktivitas di akun Anda dan wajib menjaga akses ke akun
          Google tersebut.
        </li>
        <li>
          Anda harus cakap secara hukum untuk membuat perjanjian, atau didampingi orang tua/wali.
        </li>
      </ul>
    ),
  },
  {
    id: "paket",
    title: "Paket, masa uji & masa aktif",
    body: (
      <ul>
        <li>Paket berlaku per undangan, sesuai harga yang tertera di halaman Harga.</li>
        <li>
          <strong>Paket Gratis</strong> aktif {trial} hari sejak undangan pertama kali diterbitkan,
          dengan watermark. Membatalkan terbit tidak menghentikan atau mengulang hitungan masa uji.
          Setelah masa uji berakhir, undangan tidak dapat dibuka tamu sampai paket ditingkatkan, dan
          foto serta musiknya dihapus otomatis {MEDIA_RETENTION_DAYS} hari kemudian.
        </li>
        <li>
          <strong>Paket berbayar:</strong> {PAID_ACTIVE.long.charAt(0).toLowerCase()}
          {PAID_ACTIVE.long.slice(1)}
        </li>
        <li>
          Beberapa tema dan fitur membutuhkan paket tertentu. Fitur berlabel &ldquo;Segera
          hadir&rdquo; belum tersedia dan tidak termasuk dalam pembelian sampai dirilis.
        </li>
      </ul>
    ),
  },
  {
    id: "pembayaran",
    title: "Pembayaran",
    body: (
      <ul>
        <li>{PAYMENT_TEXT}</li>
        <li>Harga dalam Rupiah. Perubahan harga tidak berlaku bagi paket yang sudah dibayar.</li>
      </ul>
    ),
  },
  {
    id: "pengembalian-dana",
    title: "Pengembalian dana",
    body: (
      <>
        <p>{REFUND_TEXT}</p>
        <p>
          Permintaan diajukan melalui kontak di bawah dengan menyebutkan email akun dan alamat
          undangan. Dana dikembalikan melalui metode pembayaran semula.
        </p>
      </>
    ),
  },
  {
    id: "konten",
    title: "Konten Anda: foto, musik & teks",
    body: (
      <>
        <p>
          Anda tetap pemilik konten yang Anda unggah. Anda memberi kami izin terbatas untuk
          menyimpan, memproses (mis. mengecilkan foto, mengompres musik), dan menampilkannya{" "}
          <em>hanya</em> untuk menjalankan undangan Anda.
        </p>
        <p>Dengan mengunggah konten, Anda menyatakan dan bertanggung jawab bahwa:</p>
        <ul>
          <li>
            Anda memiliki hak atau izin untuk memakai <strong>foto</strong> tersebut, dan orang yang
            tampil di dalamnya (termasuk anak, dengan izin orang tua/wali) setuju fotonya
            dipublikasikan di undangan.
          </li>
          <li>
            Anda berhak memakai <strong>musik</strong> yang diunggah (milik sendiri, berlisensi,
            atau bebas hak cipta). Tanggung jawab atas pelanggaran hak cipta musik dan foto yang
            diunggah sepenuhnya ada pada pengguna.
          </li>
          <li>
            Konten tidak melanggar hukum, tidak mengandung SARA, pornografi, ujaran kebencian,
            penipuan, atau data pribadi orang lain tanpa izin.
          </li>
        </ul>
        <p>
          Kami dapat menyembunyikan atau menghapus konten, atau menonaktifkan undangan, yang
          melanggar ketentuan ini atau yang kami terima keluhan sah atasnya (termasuk klaim hak
          cipta).
        </p>
      </>
    ),
  },
  {
    id: "tamu",
    title: "Data tamu",
    body: (
      <p>
        Nama, konfirmasi kehadiran, dan ucapan dikirim tamu melalui undangan Anda. Anda hanya
        memakai data tersebut untuk keperluan acara. Pengelolaan data oleh kami dijelaskan di{" "}
        <Link href="/privasi" className="underline">
          Kebijakan Privasi
        </Link>
        .
      </p>
    ),
  },
  {
    id: "ketersediaan",
    title: "Ketersediaan layanan",
    body: (
      <p>
        Kami berupaya agar undangan dapat diakses setiap saat, namun layanan dapat terganggu
        sementara karena pemeliharaan atau gangguan pihak ketiga (penyedia server, jaringan). Bila
        undangan tidak dapat diakses karena kesalahan layanan kami, berlaku ketentuan pengembalian
        dana di atas.
      </p>
    ),
  },
  {
    id: "tanggung-jawab",
    title: "Batasan tanggung jawab",
    body: (
      <p>
        Sejauh diizinkan hukum, tanggung jawab kami atas kerugian yang timbul dari penggunaan
        layanan dibatasi paling banyak sebesar jumlah yang Anda bayarkan untuk undangan yang
        bersangkutan. Kami tidak bertanggung jawab atas isi undangan yang dibuat pengguna.
      </p>
    ),
  },
  {
    id: "perubahan",
    title: "Perubahan syarat & hukum yang berlaku",
    body: (
      <p>
        Kami dapat memperbarui Syarat & Ketentuan ini; perubahan penting akan diberitahukan melalui
        website atau email. Syarat ini tunduk pada hukum Republik Indonesia.
      </p>
    ),
  },
  { id: "kontak", title: "Kontak", body: <LegalContact /> },
];

export default function SyaratPage() {
  return (
    <LegalPage
      title="Syarat & Ketentuan"
      updated="14 November 2026"
      intro={
        <p>
          Syarat ini mengatur penggunaan {business.name}. Mohon dibaca sebelum membuat dan
          membagikan undangan.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
