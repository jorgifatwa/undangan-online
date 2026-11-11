import { z } from "zod";

import { baseInvitationShape, optionalText, parentSchema, photoSchema } from "./common";

export const wishlistItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  url: z.url().optional(),
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
    father: parentSchema.optional(),
    mother: parentSchema.optional(),
  }),
  /** Tema pesta, mis. "Unicorn & Pelangi". Dress code ada di field dressCode. */
  partyTheme: optionalText(80),
  wishlist: z.array(wishlistItemSchema).max(20).default([]),
  closingPhoto: photoSchema.optional(),
});

export type BirthdayData = z.infer<typeof birthdayDataSchema>;
export type BirthdayInput = z.input<typeof birthdayDataSchema>;
