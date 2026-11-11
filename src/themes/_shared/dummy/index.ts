import type { WishItem } from "../runtime/context";
import { birthdayDataSchema, type BirthdayInput } from "@/schemas/birthday";
import type { AnyInvitationData } from "@/schemas/sections";
import { weddingDataSchema, type WeddingInput } from "@/schemas/wedding";

/**
 * Data contoh untuk halaman preview tema. Semua nama FIKTIF; foto dari
 * public/placeholders (lihat CREDITS.md). Tanggal dibuat relatif terhadap
 * hari ini supaya hitung mundur selalu berjalan.
 */

const P = "/placeholders/photos";

function futureDate(daysAhead: number): string {
  const d = new Date(Date.now() + daysAhead * 86400000);
  return d.toISOString().slice(0, 10);
}

const weddingInput: WeddingInput = {
  bride: {
    fullName: "Sekar Ayu Larasati",
    nickname: "Sekar",
    title: "S.Ds.",
    childOrder: "Putri pertama",
    father: { name: "Hendra Wiratama" },
    mother: { name: "Ratna Kusumawati" },
    photo: { url: `${P}/wedding-bride.webp`, alt: "Mempelai wanita", focusY: 30 },
    instagram: "sekar.ayu",
  },
  groom: {
    fullName: "Raka Aditya Pradipta",
    nickname: "Raka",
    title: "S.T.",
    childOrder: "Putra kedua",
    father: { name: "Bambang Sutrisno", deceased: true },
    mother: { name: "Sri Wahyuni" },
    photo: { url: `${P}/wedding-groom.webp`, alt: "Mempelai pria", focusY: 25 },
    instagram: "raka.pradipta",
  },
  order: "bride-first",
  events: [
    {
      id: "akad",
      name: "Akad Nikah",
      date: futureDate(40),
      startTime: "08:00",
      endTime: "10:00",
      timezone: "WIB",
      venueName: "Masjid Raya Al-Ikhlas",
      address: "Jl. Merdeka No. 12, Kel. Sukajadi,\nKota Bandung, Jawa Barat 40162",
      mapsUrl: "https://maps.google.com/?q=Masjid+Raya+Bandung",
    },
    {
      id: "resepsi",
      name: "Resepsi",
      date: futureDate(40),
      startTime: "11:00",
      untilFinished: true,
      timezone: "WIB",
      venueName: "Gedung Serbaguna Lantai 3",
      address: "Jl. Asia Afrika No. 81, Braga,\nKota Bandung, Jawa Barat 40111",
      mapsUrl: "https://maps.google.com/?q=Gedung+Merdeka+Bandung",
    },
  ],
  greeting: { style: "islami" },
  quote: {
    arabic:
      "وَمِنْ اٰيٰتِهٖٓ اَنْ خَلَقَ لَكُمْ مِّنْ اَنْفُسِكُمْ اَزْوَاجًا لِّتَسْكُنُوْٓا اِلَيْهَا وَجَعَلَ بَيْنَكُمْ مَّوَدَّةً وَّرَحْمَةً ۗ اِنَّ فِيْ ذٰلِكَ لَاٰيٰتٍ لِّقَوْمٍ يَّتَفَكَّرُوْنَ",
    translation:
      "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.",
    source: "QS. Ar-Rum: 21",
  },
  loveStory: [
    {
      date: "2019",
      title: "Pertama Bertemu",
      text: "Kami bertemu di sebuah acara kampus dan mulai berteman sejak saat itu.",
    },
    {
      date: "2023",
      title: "Lamaran",
      text: "Dengan restu kedua keluarga, Raka melamar Sekar di hari yang sederhana namun hangat.",
    },
    {
      date: "2026",
      title: "Hari Bahagia",
      text: "Kami memutuskan untuk melangkah bersama ke jenjang pernikahan.",
    },
  ],
  gallery: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
    url: `${P}/wedding-g${n}.webp`,
    alt: `Galeri ${n}`,
  })),
  photos: {
    cover: { url: `${P}/wedding-cover.webp`, alt: "Foto pasangan", focusY: 35 },
    strip: [1, 2, 3].map((n) => ({ url: `${P}/wedding-strip${n}.webp` })),
    closing: { url: `${P}/wedding-closing.webp`, alt: "Foto penutup" },
  },
  gift: {
    accounts: [
      { bank: "BCA", number: "1234567890", holder: "Sekar Ayu Larasati" },
      { bank: "Mandiri", number: "9876543210123", holder: "Raka Aditya Pradipta" },
    ],
    physical: {
      recipient: "Sekar Ayu Larasati",
      address: "Jl. Cempaka No. 7, Kel. Lebakgede,\nKota Bandung, Jawa Barat 40132",
    },
    confirmContacts: [
      { name: "Sekar", phone: "081200000001" },
      { name: "Raka", phone: "081200000002" },
    ],
  },
  dressCode: {
    text: "Mohon mengenakan busana formal dengan nuansa warna berikut.",
    colors: ["#1f3b2c", "#6b1d2a", "#e9dcc6"],
  },
  signature: {
    text: "Kami yang berbahagia",
    families: [
      "Keluarga Bapak Hendra Wiratama & Ibu Ratna Kusumawati",
      "Keluarga Bapak Alm. Bambang Sutrisno & Ibu Sri Wahyuni",
    ],
  },
};

const birthdayInput: BirthdayInput = {
  celebrant: {
    name: "Kirana Putri Maharani",
    nickname: "Kirana",
    age: 17,
    photo: { url: `${P}/birthday-celebrant.webp`, alt: "Kirana", focusY: 35 },
    father: { name: "Dimas Prakoso" },
    mother: { name: "Lestari Ayuningtyas" },
  },
  partyTheme: "Pink Party",
  events: [
    {
      id: "pesta",
      name: "Pesta Ulang Tahun",
      date: futureDate(21),
      startTime: "16:00",
      endTime: "19:00",
      timezone: "WIB",
      venueName: "Kafe Taman Ceria",
      address: "Jl. Kenanga No. 21, Kemang,\nJakarta Selatan 12730",
      mapsUrl: "https://maps.google.com/?q=Kemang+Jakarta",
    },
  ],
  greeting: { style: "umum" },
  gallery: [1, 2, 3, 4, 5].map((n) => ({ url: `${P}/birthday-g${n}.webp`, alt: `Galeri ${n}` })),
  dressCode: {
    text: "Pakai baju bernuansa pink atau ungu ya!",
    colors: ["#ff6fae", "#b57bff", "#ffd166"],
  },
  wishlist: [
    { name: "Buku sketsa & pensil warna", note: "Ukuran A4" },
    { name: "Tanaman hias kecil" },
    { name: "Boneka kucing", note: "Warna abu-abu" },
  ],
  gift: {
    accounts: [{ bank: "BCA", number: "5550001112", holder: "Lestari Ayuningtyas" }],
    confirmContacts: [],
  },
};

export const DUMMY_WEDDING: AnyInvitationData = {
  eventType: "WEDDING",
  data: weddingDataSchema.parse(weddingInput),
};

export const DUMMY_BIRTHDAY: AnyInvitationData = {
  eventType: "BIRTHDAY",
  data: birthdayDataSchema.parse(birthdayInput),
};

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();

export const DUMMY_WISHES: Record<"WEDDING" | "BIRTHDAY", WishItem[]> = {
  WEDDING: [
    {
      name: "Budi Santoso",
      message: "Selamat menempuh hidup baru, semoga sakinah mawaddah warahmah.",
      createdAt: hoursAgo(3),
      attendance: "HADIR",
    },
    {
      name: "Dewi Lestari",
      message:
        "Barakallahu lakuma wa baraka 'alaikuma wa jama'a bainakuma fii khair. Bahagia selalu!",
      createdAt: hoursAgo(20),
      attendance: "HADIR",
    },
    {
      name: "Andi & Keluarga",
      message: "Mohon maaf belum bisa hadir. Doa terbaik untuk kalian berdua.",
      createdAt: hoursAgo(50),
      attendance: "TIDAK_HADIR",
    },
  ],
  BIRTHDAY: [
    {
      name: "Tante Rina",
      message: "Selamat ulang tahun Kirana! Semoga makin pintar dan sehat selalu 🎉",
      createdAt: hoursAgo(5),
    },
    { name: "Nadya", message: "HBD bestie!! Sampai ketemu di pesta 💖", createdAt: hoursAgo(26) },
  ],
};

export function dummyFor(
  eventType: "WEDDING" | "BIRTHDAY",
  music?: { url: string; title: string; artist: string },
): AnyInvitationData {
  const base = eventType === "WEDDING" ? DUMMY_WEDDING : DUMMY_BIRTHDAY;
  if (!music) return base;
  return {
    ...base,
    data: { ...base.data, music: { tracks: [music], autoplay: true } },
  } as AnyInvitationData;
}
