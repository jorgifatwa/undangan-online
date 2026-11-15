import { z } from "zod";

import { baseInvitationShape, optionalText, parentSchema, photoSchema, trustedUrl } from "./common";

export const wishlistItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  url: trustedUrl("wishlist").optional(),
  note: optionalText(200),
});

/**
 * Topi pesta per section. Posisi (x/y/w/r) hanya diisi bila DIGESER MANUAL di
 * editor — persen RELATIF FOTO: x/y = titik bawah-tengah topi, w = lebar topi
 * (% lebar foto), r = kemiringan. Tanpa posisi manual: dari deteksi wajah
 * (photoDecor.face), atau pojok kanan atas bingkai bila wajah tak terdeteksi.
 * `for` = URL foto saat posisi dibuat — foto diganti → posisi tidak berlaku.
 */
export const hatSchema = z.object({
  show: z.boolean().default(true),
  x: z.number().min(-60).max(160).optional(),
  y: z.number().min(-60).max(160).optional(),
  w: z.number().min(2).max(150).optional(),
  r: z.number().min(-180).max(180).optional(),
  for: z.string().max(600).optional(),
  /** asal posisi: deteksi wajah otomatis atau digeser manual */
  src: z.enum(["auto", "manual"]).optional(),
});
export type HatPos = z.infer<typeof hatSchema>;

export const birthdayDataSchema = z.object({
  ...baseInvitationShape,
  celebrant: z.object({
    /** Wajib. */
    name: z.string().trim().min(1, "Nama wajib diisi").max(120),
    nickname: optionalText(40),
    /** Usia ke- (mis. 7 → "Ulang Tahun ke-7"). */
    age: z.number().int().min(0).max(150).optional(),
    photo: photoSchema.optional(),
    /** Foto masa kecil untuk cover/pembuka (tema yang mendukung); PNG tanpa latar → efek stiker. */
    childPhoto: photoSchema.optional(),
    father: parentSchema.optional(),
    mother: parentSchema.optional(),
  }),
  /** Tema pesta, mis. "Unicorn & Pelangi". Dress code ada di field dressCode. */
  partyTheme: optionalText(80),
  wishlist: z.array(wishlistItemSchema).max(20).default([]),
  closingPhoto: photoSchema.optional(),
  /**
   * Strip foto khusus tema (mis. Pita Krayon di bagian hitung mundur "See you
   * on"), TERPISAH dari galeri — maks. 3. Tema lain tidak membacanya.
   */
  stripPhotos: z.array(photoSchema).max(3).default([]),
  /** Cerita ulang tahun (section "cerita"); teks polos, tidak pernah dijadikan link. */
  story: z
    .object({
      title: optionalText(60),
      text: z.string().trim().max(3000, "Cerita maksimal 3000 karakter").default(""),
    })
    .optional(),
  /**
   * Bahasa teks dekoratif tema (mis. "SAVE THE DATE!" ↔ "CATAT TANGGALNYA!").
   * Hanya dibaca tema yang mendukung (manifest.editorFields "decorLanguage").
   */
  decorLang: z.enum(["en", "id"]).optional(),
  /**
   * Pengaturan foto tema yang mendukungnya (manifest.editorFields "photoDecor"):
   * hitam-putih (bawaan menyala), ilustrasi kue di depan foto pembuka, dan
   * topi pesta per section (cover & pembuka).
   */
  photoDecor: z
    .object({
      bw: z.boolean().default(true),
      cake: z.boolean().default(true),
      coverHat: hatSchema.default({ show: true }),
      heroHat: hatSchema.default({ show: true }),
      /**
       * Kepala terbesar hasil deteksi wajah di editor (persen relatif foto):
       * x/y = puncak kepala, w = lebar wajah, r = kemiringan kepala.
       * Dipakai untuk topi bawaan & membingkai foto biasa agar wajah terlihat.
       */
      face: z
        .object({
          x: z.number().min(-20).max(120),
          y: z.number().min(-20).max(120),
          w: z.number().min(1).max(100),
          r: z.number().min(-90).max(90),
          for: z.string().max(600),
        })
        .optional(),
      /** URL foto yang sudah dicek deteksi wajah (agar tidak diulang bila tidak ada wajah) */
      faceChecked: z.string().max(600).optional(),
    })
    .default({ bw: true, cake: true, coverHat: { show: true }, heroHat: { show: true } }),
});

export type BirthdayData = z.infer<typeof birthdayDataSchema>;
export type BirthdayInput = z.input<typeof birthdayDataSchema>;
