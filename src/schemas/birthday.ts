import { z } from "zod";

import { baseInvitationShape, optionalText, parentSchema, photoSchema, trustedUrl } from "./common";

export const wishlistItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  url: trustedUrl("wishlist").optional(),
  note: optionalText(200),
});

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
});

export type BirthdayData = z.infer<typeof birthdayDataSchema>;
export type BirthdayInput = z.input<typeof birthdayDataSchema>;
