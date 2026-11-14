import type { Metadata } from "next";

import { LegalContact, LegalPage, type LegalSection } from "@/components/marketing/LegalPage";
import { business } from "@/config/business";
import { MEDIA_RETENTION_DAYS } from "@/lib/invitations/retention";
import { PAID_ACTIVE } from "@/lib/packages";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: `Kebijakan Privasi ${business.name}: data yang disimpan, untuk apa, berapa lama, dan hak Anda sesuai UU Pelindungan Data Pribadi.`,
  alternates: { canonical: "/privasi" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "pengendali",
    title: "Siapa kami",
    body: (
      <p>
        {business.name} adalah pengendali data pribadi atas data akun dan undangan yang diproses
        melalui layanan ini, sebagaimana dimaksud Undang-Undang Nomor 27 Tahun 2022 tentang
        Pelindungan Data Pribadi (UU PDP). Kontak kami ada di bagian terakhir halaman ini.
      </p>
    ),
  },
  {
    id: "data",
    title: "Data yang kami simpan",
    body: (
      <>
        <p>
          <strong>Data akun</strong> — nama, alamat email, foto profil, dan ID akun dari Google saat
          Anda masuk.
        </p>
        <p>
          <strong>Isi undangan</strong> yang Anda masukkan — misalnya nama mempelai atau yang
          berulang tahun, nama orang tua, tanggal dan lokasi acara, foto, musik, kutipan, serta
          (bila diisi) nomor rekening, QRIS, alamat kirim hadiah, dan nomor kontak.
        </p>
        <p>
          <strong>Data tamu</strong> yang dikirim tamu lewat undangan — nama, konfirmasi kehadiran
          dan jumlah orang, serta ucapan.
        </p>
        <p>
          <strong>Data teknis untuk keamanan</strong> — sidik acak dari alamat IP yang berganti
          setiap hari (IP asli tidak disimpan) dan cookie penanda perangkat acak, keduanya untuk
          mencegah spam pada RSVP & ucapan; serta log server standar dari penyedia hosting.
        </p>
        <p>
          <strong>Yang TIDAK kami simpan:</strong> nomor WhatsApp tamu yang Anda ketik di dialog
          &ldquo;Bagikan&rdquo; (hanya dipakai untuk membuka WhatsApp di perangkat Anda).
        </p>
      </>
    ),
  },
  {
    id: "tujuan",
    title: "Untuk apa data dipakai",
    body: (
      <ul>
        <li>Menjalankan layanan: membuat, menampilkan, dan membagikan undangan Anda.</li>
        <li>Menampilkan rekap RSVP dan ucapan kepada pemilik undangan.</li>
        <li>Keamanan dan pencegahan penyalahgunaan (spam, akses tidak sah).</li>
        <li>Menanggapi pertanyaan dan permintaan Anda, serta pembayaran (saat tersedia).</li>
        <li>Memenuhi kewajiban hukum.</li>
      </ul>
    ),
  },
  {
    id: "dasar",
    title: "Dasar pemrosesan",
    body: (
      <p>
        Kami memproses data berdasarkan persetujuan Anda dan untuk melaksanakan perjanjian layanan
        dengan Anda, sesuai UU PDP. Data <strong>tidak dijual</strong> dan{" "}
        <strong>tidak dipakai untuk iklan</strong>. Halaman undangan diberi tanda agar tidak
        diindeks mesin pencari.
      </p>
    ),
  },
  {
    id: "pihak-ketiga",
    title: "Penyedia layanan yang memproses data",
    body: (
      <>
        <p>Kami memakai penyedia berikut, hanya untuk menjalankan layanan:</p>
        <ul>
          <li>Penyedia hosting/server aplikasi.</li>
          <li>Neon — database (region Singapura).</li>
          <li>Cloudflare R2 — penyimpanan foto & musik (kawasan Asia-Pasifik).</li>
          <li>Google — layanan masuk (login).</li>
          <li>Penyedia pembayaran (Midtrans) — saat pembayaran online tersedia.</li>
        </ul>
        <p>
          Sebagian data disimpan di luar Indonesia (Singapura/Asia-Pasifik). Kami memilih penyedia
          dengan standar pelindungan data yang memadai sebagaimana disyaratkan UU PDP.
        </p>
      </>
    ),
  },
  {
    id: "lama",
    title: "Berapa lama data disimpan",
    body: (
      <ul>
        <li>Data akun: selama akun aktif, atau sampai Anda meminta penghapusan.</li>
        <li>
          Undangan paket Gratis: foto dan musik dihapus otomatis {MEDIA_RETENTION_DAYS} hari setelah
          masa uji berakhir.
        </li>
        <li>
          Undangan paket berbayar: {PAID_ACTIVE.long.charAt(0).toLowerCase()}
          {PAID_ACTIVE.long.slice(1)} Hubungi kami bila ingin undangan dihapus lebih cepat.
        </li>
        <li>
          Data tamu (RSVP & ucapan): mengikuti undangannya; pemilik dapat menghapusnya kapan saja.
        </li>
        <li>File unggahan yang tidak selesai: dibersihkan otomatis setiap hari.</li>
      </ul>
    ),
  },
  {
    id: "cookie",
    title: "Cookie",
    body: (
      <ul>
        <li>Cookie sesi login (untuk pemilik akun), berlaku hingga 30 hari.</li>
        <li>
          Cookie penanda perangkat acak di halaman undangan untuk membatasi spam, tanpa data
          pribadi, berlaku hingga 400 hari.
        </li>
        <li>Kami tidak memakai cookie iklan atau pelacak pihak ketiga.</li>
      </ul>
    ),
  },
  {
    id: "anak",
    title: "Data anak",
    body: (
      <p>
        Undangan ulang tahun anak dapat memuat nama dan foto anak. Undangan tersebut harus dibuat
        oleh orang tua atau wali, yang dengan membuatnya memberikan persetujuan atas pemrosesan data
        anak untuk keperluan undangan.
      </p>
    ),
  },
  {
    id: "hak",
    title: "Hak Anda",
    body: (
      <>
        <p>Sesuai UU PDP, Anda berhak antara lain untuk:</p>
        <ul>
          <li>mendapat informasi tentang pemrosesan data Anda;</li>
          <li>mengakses dan memperoleh salinan data Anda;</li>
          <li>memperbaiki data yang tidak akurat;</li>
          <li>meminta penghapusan data dan akun;</li>
          <li>menarik kembali persetujuan;</li>
          <li>mengajukan keberatan atas pemrosesan tertentu.</li>
        </ul>
        <p>
          Sebagian besar data undangan dapat Anda ubah atau hapus sendiri dari editor. Untuk hak
          lainnya, hubungi kami melalui kontak di bawah. Tamu yang ingin ucapannya dihapus dapat
          menghubungi pemilik undangan atau kami.
        </p>
      </>
    ),
  },
  {
    id: "keamanan",
    title: "Keamanan & insiden",
    body: (
      <p>
        Data dikirim melalui koneksi terenkripsi (HTTPS) dan akses ke data dibatasi. Bila terjadi
        kegagalan pelindungan data pribadi, kami akan memberitahukan kepada Anda dan otoritas
        terkait sesuai ketentuan UU PDP.
      </p>
    ),
  },
  {
    id: "perubahan",
    title: "Perubahan kebijakan",
    body: (
      <p>
        Kebijakan ini dapat diperbarui; tanggal pembaruan tercantum di atas. Perubahan penting akan
        diberitahukan melalui website atau email.
      </p>
    ),
  },
  { id: "kontak", title: "Kontak", body: <LegalContact /> },
];

export default function PrivasiPage() {
  return (
    <LegalPage
      title="Kebijakan Privasi"
      updated="14 November 2026"
      intro={
        <p>
          Kami hanya menyimpan data yang dibutuhkan untuk menjalankan undangan Anda, dan
          menjelaskannya di sini dengan bahasa yang sederhana.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
