import type { Metadata } from "next";

import { LegalContact, LegalPage, type LegalSection } from "@/components/marketing/LegalPage";
import { business } from "@/config/business";
import { PAID_ACTIVE } from "@/lib/pricing";

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
          <strong>Data pemesan</strong> — nama, alamat email, dan (bila diisi) nomor WhatsApp yang
          Anda berikan saat memesan di website atau kepada admin saat membeli di marketplace. Bila
          akun pembeli dibuat: email dan kata sandi (disimpan sebagai hash, tidak dapat dibaca siapa
          pun). Admin kami masuk dengan akun Google atau email & kata sandi.
        </p>
        <p>
          <strong>Isi undangan</strong> yang Anda masukkan — misalnya nama mempelai atau yang
          berulang tahun, nama orang tua, tanggal dan lokasi acara, foto, musik, kutipan, serta
          (bila diisi) nomor rekening, QRIS, alamat kirim hadiah, dan nomor kontak.
        </p>
        <p>
          <strong>Isian sebelum pembayaran</strong> disimpan di browser Anda (penyimpanan lokal),
          bukan di server kami. Saat Anda menekan &ldquo;Pesan & bayar&rdquo;, isian dikirim dan
          disimpan bersama pesanan; bila tidak dibayar, pesanan beserta isiannya dihapus otomatis.
        </p>
        <p>
          <strong>Data pembayaran</strong> — nomor pesanan, nominal, metode, dan status pembayaran
          dari Midtrans. Data kartu atau rekening pembayaran tidak kami terima.
        </p>
        <p>
          <strong>Daftar tamu</strong> yang Anda masukkan di dashboard — nama, nomor WhatsApp
          (opsional), grup, dan status terkirim — hanya untuk membuat link personal dan membuka
          WhatsApp di perangkat Anda.
        </p>
        <p>
          <strong>Data tamu</strong> yang dikirim tamu lewat undangan — nama, konfirmasi kehadiran
          dan jumlah orang, serta ucapan.
        </p>
        <p>
          <strong>Statistik pengunjung website</strong> — hanya jumlah per hari untuk beberapa
          peristiwa (membuka beranda, membuka galeri tema, mencoba tema, mulai mengisi pesanan,
          menuju pembayaran). Tanpa cookie pelacak, tanpa alamat IP, dan tanpa data yang bisa
          mengenali Anda; tidak memakai layanan analitik pihak ketiga.
        </p>
        <p>
          <strong>Data teknis untuk keamanan</strong> — sidik acak dari alamat IP yang berganti
          setiap hari (IP asli tidak disimpan) dan cookie penanda perangkat acak, keduanya untuk
          mencegah spam pada RSVP & ucapan; serta log server standar dari penyedia hosting.
        </p>
        <p>
          <strong>Link khusus</strong> — hanya sidik (hash) link yang disimpan, bukan link aslinya,
          beserta batas waktu dan waktu terakhir dibuka.
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
        <li>
          Memproses pembayaran, lalu mengirim link khusus dan data login lewat email atau WhatsApp.
        </li>
        <li>Menanggapi pertanyaan dan permintaan Anda.</li>
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
          <li>Google — layanan masuk (login) admin.</li>
          <li>Midtrans — pemrosesan pembayaran online.</li>
          <li>Penyedia email (SMTP) — pengiriman link khusus & data login.</li>
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
          Pesanan website yang tidak dibayar: dihapus otomatis beserta isian formnya setelah 2 hari.
        </li>
        <li>
          Link khusus yang lewat batas waktu dan belum dikonfirmasi: undangan beserta foto, musik,
          dan isinya dihapus otomatis.
        </li>
        <li>
          Undangan yang sudah tayang: {PAID_ACTIVE.long.charAt(0).toLowerCase()}
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
          Sebagian besar data undangan dapat Anda ubah sendiri dari dashboard akun selama masa
          aktif. Untuk hak lainnya, hubungi kami melalui kontak di bawah. Tamu yang ingin ucapannya
          dihapus dapat menghubungi pemilik undangan atau kami.
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
