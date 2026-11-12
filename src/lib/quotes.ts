/**
 * Kutipan siap pakai untuk section Ayat/Kutipan (editor & wizard).
 *
 * SUMBER (diambil apa adanya lewat API, tidak diketik ulang — 2026-11-12):
 *  - Al-Qur'an: teks Arab rasm Mushaf Standar Indonesia + Terjemahan Kemenag RI
 *    (edisi penyempurnaan 2019) via API publik equran.id v2
 *    (https://equran.id/api/v2/surat/{n}; data bersumber dari quran.kemenag.go.id).
 *    Dicek silang: terjemahan QS. Ar-Rum: 21 sama dengan quran.nu.or.id.
 *    Semua huruf Arab berada di blok U+0600–06FF (tercakup subset Amiri).
 *  - Alkitab: Terjemahan Baru (TB) © Lembaga Alkitab Indonesia 1974, via API
 *    alkitab.sabda.org (passage.php, versi TB). Tanda kutip penutup ucapan di
 *    akhir Matius 19:6 dibuang untuk tampilan undangan; Pengkhotbah dipakai 4:9 saja.
 *  - Umum & ucapan ulang tahun: tulisan sendiri (bebas dipakai), kecuali yang
 *    mencantumkan nama penulis (karya domain publik, terjemahan sendiri).
 * Sebelum peluncuran: cek ulang manual terhadap mushaf/Alkitab cetak (docs/TAHAP-2.md).
 */

export type QuoteGroup = "islami" | "kristen" | "umum" | "ulangTahun";

export interface QuotePreset {
  id: string;
  group: QuoteGroup;
  /** Label di dropdown. */
  label: string;
  arabic?: string;
  translation: string;
  source?: string;
}

export const QUOTE_GROUP_LABELS: Record<QuoteGroup, string> = {
  islami: "Islami (Al-Qur'an)",
  kristen: "Kristen/Katolik (Alkitab TB)",
  umum: "Umum",
  ulangTahun: "Ulang tahun",
};

export const QUOTE_PRESETS: readonly QuotePreset[] = [
  {
    id: "ar-rum-21",
    group: "islami",
    label: "QS. Ar-Rum: 21",
    arabic:
      "وَمِنْ اٰيٰتِهٖٓ اَنْ خَلَقَ لَكُمْ مِّنْ اَنْفُسِكُمْ اَزْوَاجًا لِّتَسْكُنُوْٓا اِلَيْهَا وَجَعَلَ بَيْنَكُمْ مَّوَدَّةً وَّرَحْمَةً ۗاِنَّ فِيْ ذٰلِكَ لَاٰيٰتٍ لِّقَوْمٍ يَّتَفَكَّرُوْنَ",
    translation:
      "Di antara tanda-tanda (kebesaran)-Nya ialah bahwa Dia menciptakan pasangan-pasangan untukmu dari (jenis) dirimu sendiri agar kamu merasa tenteram kepadanya. Dia menjadikan di antaramu rasa cinta dan kasih sayang. Sesungguhnya pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.",
    source: "QS. Ar-Rum: 21",
  },
  {
    id: "adz-dzariyat-49",
    group: "islami",
    label: "QS. Adz-Dzariyat: 49",
    arabic: "وَمِنْ كُلِّ شَيْءٍ خَلَقْنَا زَوْجَيْنِ لَعَلَّكُمْ تَذَكَّرُوْنَ",
    translation:
      "Segala sesuatu Kami ciptakan berpasang-pasangan agar kamu mengingat (kebesaran Allah).",
    source: "QS. Adz-Dzariyat: 49",
  },
  {
    id: "yasin-36",
    group: "islami",
    label: "QS. Yasin: 36",
    arabic: "سُبْحٰنَ الَّذِيْ خَلَقَ الْاَزْوَاجَ كُلَّهَا مِمَّا تُنْۢبِتُ الْاَرْضُ وَمِنْ اَنْفُسِهِمْ وَمِمَّا لَا يَعْلَمُوْنَ",
    translation:
      "Maha Suci (Allah) yang telah menciptakan semuanya berpasang-pasangan, baik dari apa yang ditumbuhkan oleh bumi dan dari diri mereka sendiri maupun dari apa yang tidak mereka ketahui.",
    source: "QS. Yasin: 36",
  },
  {
    id: "an-nur-32",
    group: "islami",
    label: "QS. An-Nur: 32",
    arabic:
      "وَاَنْكِحُوا الْاَيَامٰى مِنْكُمْ وَالصّٰلِحِيْنَ مِنْ عِبَادِكُمْ وَاِمَاۤىِٕكُمْۗ اِنْ يَّكُوْنُوْا فُقَرَاۤءَ يُغْنِهِمُ اللّٰهُ مِنْ فَضْلِهٖۗ وَاللّٰهُ وَاسِعٌ عَلِيْمٌ",
    translation:
      "Nikahkanlah orang-orang yang masih membujang di antara kamu dan juga orang-orang yang layak (menikah) dari hamba-hamba sahayamu, baik laki-laki maupun perempuan. Jika mereka miskin, Allah akan memberi kemampuan kepada mereka dengan karunia-Nya. Allah Maha Luas (pemberian-Nya) lagi Maha Mengetahui.",
    source: "QS. An-Nur: 32",
  },
  {
    id: "kejadian-2-24",
    group: "kristen",
    label: "Kejadian 2:24",
    translation:
      "Sebab itu seorang laki-laki akan meninggalkan ayahnya dan ibunya dan bersatu dengan isterinya, sehingga keduanya menjadi satu daging.",
    source: "Kejadian 2:24",
  },
  {
    id: "matius-19-6",
    group: "kristen",
    label: "Matius 19:6",
    translation:
      "Demikianlah mereka bukan lagi dua, melainkan satu. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.",
    source: "Matius 19:6",
  },
  {
    id: "1-korintus-13-4-7",
    group: "kristen",
    label: "1 Korintus 13:4-7",
    translation:
      "Kasih itu sabar; kasih itu murah hati; ia tidak cemburu. Ia tidak memegahkan diri dan tidak sombong. Ia tidak melakukan yang tidak sopan dan tidak mencari keuntungan diri sendiri. Ia tidak pemarah dan tidak menyimpan kesalahan orang lain. Ia tidak bersukacita karena ketidakadilan, tetapi karena kebenaran. Ia menutupi segala sesuatu, percaya segala sesuatu, mengharapkan segala sesuatu, sabar menanggung segala sesuatu.",
    source: "1 Korintus 13:4-7",
  },
  {
    id: "pengkhotbah-4-9",
    group: "kristen",
    label: "Pengkhotbah 4:9",
    translation:
      "Berdua lebih baik dari pada seorang diri, karena mereka menerima upah yang baik dalam jerih payah mereka.",
    source: "Pengkhotbah 4:9",
  },
  {
    id: "bilangan-6-24-26",
    group: "ulangTahun",
    label: "Bilangan 6:24-26",
    translation:
      "TUHAN memberkati engkau dan melindungi engkau; TUHAN menyinari engkau dengan wajah-Nya dan memberi engkau kasih karunia; TUHAN menghadapkan wajah-Nya kepadamu dan memberi engkau damai sejahtera.",
    source: "Bilangan 6:24-26",
  },
  {
    id: "mazmur-90-12",
    group: "ulangTahun",
    label: "Mazmur 90:12",
    translation:
      "Ajarlah kami menghitung hari-hari kami sedemikian, hingga kami beroleh hati yang bijaksana.",
    source: "Mazmur 90:12",
  },
  {
    id: "umum-arah-yang-sama",
    group: "umum",
    label: "Memandang ke arah yang sama",
    translation:
      "Mencintai bukanlah saling menatap, melainkan bersama-sama memandang ke arah yang sama.",
    source: "Antoine de Saint-Exupéry",
  },
  {
    id: "umum-dua-hati",
    group: "umum",
    label: "Dua hati, satu tujuan",
    translation:
      "Dua hati, satu tujuan: berjalan bersama dalam suka dan duka, hari ini dan seterusnya.",
  },
  {
    id: "umum-setiap-hari",
    group: "umum",
    label: "Belajar mencintai setiap hari",
    translation:
      "Pernikahan bukan tentang menemukan orang yang sempurna, melainkan belajar mencintai dengan sepenuh hati, setiap hari.",
  },
  {
    id: "umum-rumah",
    group: "umum",
    label: "Rumah adalah kita",
    translation:
      "Rumah bukanlah tempat, melainkan seseorang. Dan kami telah menemukan rumah kami pada satu sama lain.",
  },
  {
    id: "ultah-tawa",
    group: "ulangTahun",
    label: "Tahun penuh tawa",
    translation:
      "Selamat ulang tahun! Semoga tahun ini dipenuhi tawa, kesehatan, dan hal-hal baik yang tak terduga.",
  },
  {
    id: "ultah-syukur",
    group: "ulangTahun",
    label: "Bertambah usia, bertambah syukur",
    translation:
      "Bertambah usia, bertambah syukur. Terima kasih telah menjadi bagian dari perjalanan kami.",
  },
  {
    id: "ultah-doa",
    group: "ulangTahun",
    label: "Doa panjang umur",
    translation:
      "Semoga panjang umur, sehat selalu, dilimpahi berkah, dan menjadi pribadi yang membawa kebahagiaan bagi sekitar.",
  },
  {
    id: "ultah-doa-islami",
    group: "ulangTahun",
    label: "Doa keberkahan usia",
    translation:
      "Semoga Allah memberkahi usiamu, melapangkan rezekimu, dan menjadikanmu pribadi yang saleh dan bermanfaat.",
  },
];

export function getQuotePreset(id: string): QuotePreset | undefined {
  return QUOTE_PRESETS.find((q) => q.id === id);
}

/** Kelompok yang ditawarkan per jenis acara (urutan = urutan di dropdown). */
export function quoteGroupsFor(eventType: "WEDDING" | "BIRTHDAY"): QuoteGroup[] {
  return eventType === "WEDDING" ? ["islami", "kristen", "umum"] : ["ulangTahun"];
}

/** Pilihan kutipan di wizard sesuai gaya salam (default pertama = terpilih). */
export function wizardQuoteGroups(
  eventType: "WEDDING" | "BIRTHDAY",
  greeting: "islami" | "umum",
): QuoteGroup[] {
  if (eventType === "BIRTHDAY") return ["ulangTahun"];
  return greeting === "islami" ? ["islami"] : ["kristen", "umum"];
}

/** Preset yang isinya sama persis dengan kutipan tersimpan (untuk menandai dropdown). */
export function matchPreset(
  q: { arabic?: string; translation?: string; source?: string } | undefined,
) {
  const norm = (v?: string) => (v ?? "").trim();
  if (!norm(q?.translation)) return undefined;
  return QUOTE_PRESETS.find(
    (p) => p.translation === norm(q!.translation) && norm(p.arabic) === norm(q!.arabic),
  );
}
