import { business } from "@/config/business";
import { formatRupiah } from "@/lib/format";
import { MAX_AUDIO_SECONDS, MAX_PHOTO_BYTES } from "@/lib/media/limits";
import { LIMITS, PAID_ACTIVE } from "@/lib/pricing";
import { ADDONS } from "@/lib/pricing/addons";
import { THEME_MANIFESTS } from "@/themes/registry";

/**
 * Isi teks website publik yang bergantung pada fakta produk. Harga dari
 * manifest tema, batas dari lib/pricing — halaman tidak pernah menjanjikan
 * sesuatu yang berbeda dari aplikasi. Kuota MB TIDAK ditampilkan (pengaman
 * server saja); yang ditampilkan: jumlah foto galeri & lagu.
 */

/** Yang termasuk di SETIAP tema (satu harga, semua fitur inti). */
export const INCLUDED: string[] = [
  "Tema lengkap dengan animasi & pilihan warna",
  `Galeri hingga ${LIMITS.galleryPhotos} foto (cover & foto mempelai tidak dihitung)`,
  "Musik dari koleksi bawaan atau unggah lagu sendiri (bisa diganti kapan saja)",
  "RSVP & rekap kehadiran tamu",
  "Ucapan & doa yang tampil langsung",
  "Amplop digital & alamat kirim hadiah",
  "Link personal untuk setiap tamu",
  "Kirim lewat WhatsApp & pratinjau link bergambar",
  "Peta lokasi & simpan ke kalender",
  "Kutipan siap pakai (Al-Qur'an, Alkitab, umum)",
  PAID_ACTIVE.short,
];

/** Belum tersedia: fitur yang direncanakan + add-on yang belum dijual. */
export const COMING_SOON: string[] = [
  "Impor tamu dari Excel",
  "QR check-in di lokasi",
  "Mode privat dengan kata sandi",
  ...ADDONS.filter((a) => a.price === null).map((a) => `${a.label} (add-on)`),
];

/** Kalimat cara bayar (tergantung ada/tidaknya nomor WhatsApp). */
export const PAYMENT_TEXT = business.whatsapp
  ? "Bayar online saat memesan (QRIS, transfer bank, e-wallet). Membeli di marketplace? Kami kirim link khusus lewat WhatsApp."
  : "Bayar online saat memesan (QRIS, transfer bank, e-wallet).";

export const REFUND_TEXT =
  "Dana dikembalikan penuh bila diminta dalam 3 hari sejak pembayaran dan undangan belum pernah diterbitkan. Setelah undangan diterbitkan, dana tidak dapat dikembalikan, kecuali undangan tidak dapat diakses karena kesalahan layanan kami.";

export const THEME_CHANGE_TEXT =
  "Sebelum memesan, semua tema bebas dicoba. Setelah membayar, Anda masih boleh pindah ke tema lain dengan harga yang sama selama undangan belum dikonfirmasi tayang — isi undangan tetap utuh. Setelah tayang, tema terkunci.";

const photoMb = Math.round(MAX_PHOTO_BYTES / 1024 / 1024);
const priceList = THEME_MANIFESTS.map((m) => `${m.name} ${formatRupiah(m.price)}`).join(", ");

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Berapa harganya?",
    a: `Harga per tema, sekali bayar untuk satu undangan, tanpa langganan: ${priceList}. Satu harga sudah termasuk semua fitur — galeri, musik, RSVP, ucapan, amplop digital, link personal tamu, dan berbagi lewat WhatsApp.`,
  },
  {
    q: "Berapa lama undangan aktif?",
    a: `Setelah tema dibeli dan undangan diterbitkan: ${PAID_ACTIVE.long.charAt(0).toLowerCase()}${PAID_ACTIVE.long.slice(1)}`,
  },
  { q: "Bagaimana cara bayar?", a: PAYMENT_TEXT },
  { q: "Apakah tema bisa diganti?", a: THEME_CHANGE_TEXT },
  {
    q: "Berapa foto yang bisa diunggah?",
    a: `Galeri berisi hingga ${LIMITS.galleryPhotos} foto per undangan; foto cover, foto mempelai, dan foto penutup tidak dihitung. Ukuran tiap foto maksimal ${photoMb} MB; foto otomatis dikecilkan tanpa mengurangi kualitas tampilan, dan foto iPhone (HEIC) didukung.`,
  },
  {
    q: "Bisakah memakai musik sendiri?",
    a: `Bisa. Pilih dari koleksi bawaan, atau unggah satu lagu sendiri per undangan (maksimal ${MAX_AUDIO_SECONDS / 60} menit, dikompres otomatis). Lagu bisa diganti kapan saja — lagu lama otomatis dihapus. Pastikan Anda berhak memakai musik yang diunggah.`,
  },
  {
    q: "Bagaimana data tamu saya dijaga?",
    a: "Halaman undangan tidak diindeks mesin pencari. Alamat IP tamu tidak disimpan mentah (hanya sidik acak harian untuk mencegah spam), dan Anda bisa menyembunyikan atau menghapus ucapan kapan saja dari dashboard Anda. Data hanya dipakai untuk menjalankan undangan Anda.",
  },
  {
    q: "Apakah bisa dicoba gratis?",
    a: "Bisa. Semua tema bisa dicoba gratis dengan data contoh, bahkan dengan nama Anda sendiri — tanpa daftar akun. Saat memesan, isi undangan langkah demi langkah sambil melihat pratinjaunya (tersimpan di browser Anda), lalu bayar sekali. Setelah lunas, kami kirim link khusus untuk mengunggah foto dan menayangkan undangan.",
  },
  {
    q: "Bisakah keluarga melihat dulu sebelum ditayangkan?",
    a: "Bisa. Pratinjau tampil langsung di samping form selama Anda mengisi, dan undangan baru bisa dibuka tamu setelah Anda sendiri mengonfirmasi & menayangkannya. Setelah tayang, isi undangan masih bisa diubah selama masa aktif.",
  },
  { q: "Bisakah dana dikembalikan?", a: REFUND_TEXT },
];
