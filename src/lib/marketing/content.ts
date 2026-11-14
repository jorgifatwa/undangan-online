import { business } from "@/config/business";
import { formatRupiah } from "@/lib/format";
import { MEDIA_RETENTION_DAYS } from "@/lib/invitations/retention";
import { MAX_AUDIO_SECONDS, MAX_PHOTO_BYTES } from "@/lib/media/limits";
import { LIMITS, PAID_ACTIVE, TRIAL_DAYS } from "@/lib/pricing";
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
  `Musik dari koleksi bawaan atau unggah hingga ${LIMITS.customMusicTracks} lagu sendiri`,
  "RSVP & rekap kehadiran tamu",
  "Ucapan & doa yang tampil langsung",
  "Amplop digital & alamat kirim hadiah",
  "Link personal untuk setiap tamu",
  "Kirim lewat WhatsApp & pratinjau link bergambar",
  "Peta lokasi & simpan ke kalender",
  "Kutipan siap pakai (Al-Qur'an, Alkitab, umum)",
  "Tanpa watermark",
  PAID_ACTIVE.short,
];

/** Belum tersedia: fitur yang direncanakan + add-on yang belum dijual. */
export const COMING_SOON: string[] = [
  "Daftar tamu",
  "Impor tamu dari Excel",
  "QR check-in di lokasi",
  "Mode privat dengan kata sandi",
  ...ADDONS.filter((a) => a.price === null).map((a) => `${a.label} (add-on)`),
];

/** Kalimat cara bayar (tergantung ada/tidaknya nomor WhatsApp). */
export const PAYMENT_TEXT = business.whatsapp
  ? "Pembayaran online (QRIS, transfer bank, e-wallet) segera hadir. Sementara itu, hubungi kami lewat WhatsApp untuk membeli tema."
  : "Pembayaran online (QRIS, transfer bank, e-wallet) segera hadir. Sementara itu, semua tema bisa dicoba gratis.";

export const REFUND_TEXT =
  "Dana dikembalikan penuh bila diminta dalam 3 hari sejak pembayaran dan undangan belum pernah diterbitkan. Setelah undangan diterbitkan, dana tidak dapat dikembalikan, kecuali undangan tidak dapat diakses karena kesalahan layanan kami.";

export const THEME_CHANGE_TEXT =
  "Selama masa uji, semua tema bebas dicoba. Setelah membeli, pindah ke tema dengan harga sama atau lebih murah gratis (tanpa pengembalian dana), sedangkan pindah ke tema lebih mahal cukup membayar selisih harganya. Isi undangan tetap utuh.";

const photoMb = Math.round(MAX_PHOTO_BYTES / 1024 / 1024);
const priceList = THEME_MANIFESTS.map((m) => `${m.name} ${formatRupiah(m.price)}`).join(", ");

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Berapa harganya?",
    a: `Harga per tema, sekali bayar untuk satu undangan, tanpa langganan: ${priceList}. Satu harga sudah termasuk semua fitur — galeri, musik, RSVP, ucapan, amplop digital, link personal tamu, dan berbagi lewat WhatsApp.`,
  },
  {
    q: "Berapa lama undangan aktif?",
    a: `Masa uji gratis aktif ${TRIAL_DAYS} hari sejak pertama kali diterbitkan, dengan watermark (membatalkan terbit tidak menghentikan hitungan). Setelah tema dibeli: ${PAID_ACTIVE.long.charAt(0).toLowerCase()}${PAID_ACTIVE.long.slice(1)}`,
  },
  { q: "Bagaimana cara bayar?", a: PAYMENT_TEXT },
  { q: "Apakah tema bisa diganti?", a: THEME_CHANGE_TEXT },
  {
    q: "Berapa foto yang bisa diunggah?",
    a: `Galeri berisi hingga ${LIMITS.galleryPhotos} foto per undangan; foto cover, foto mempelai, dan foto penutup tidak dihitung. Ukuran tiap foto maksimal ${photoMb} MB; foto otomatis dikecilkan tanpa mengurangi kualitas tampilan, dan foto iPhone (HEIC) didukung.`,
  },
  {
    q: "Bisakah memakai musik sendiri?",
    a: `Bisa. Pilih dari koleksi bawaan, atau unggah hingga ${LIMITS.customMusicTracks} lagu sendiri per undangan (maksimal ${MAX_AUDIO_SECONDS / 60} menit per lagu, dikompres otomatis). Pastikan Anda berhak memakai musik yang diunggah.`,
  },
  {
    q: "Bagaimana data tamu saya dijaga?",
    a: "Halaman undangan tidak diindeks mesin pencari. Alamat IP tamu tidak disimpan mentah (hanya sidik acak harian untuk mencegah spam), dan Anda bisa menyembunyikan atau menghapus ucapan kapan saja dari editor. Data hanya dipakai untuk menjalankan undangan Anda.",
  },
  {
    q: "Apa yang terjadi setelah masa uji berakhir?",
    a: `Undangan tidak bisa dibuka tamu sampai tema dibeli; tamu hanya melihat halaman "tidak aktif" tanpa data pribadi. Foto dan musik undangan yang belum dibeli dihapus otomatis ${MEDIA_RETENTION_DAYS} hari setelah masa uji berakhir.`,
  },
  { q: "Bisakah dana dikembalikan?", a: REFUND_TEXT },
];
