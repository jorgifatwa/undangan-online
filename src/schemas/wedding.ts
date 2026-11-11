import { z } from "zod";

import { baseInvitationShape, optionalText, parentSchema, photoSchema } from "./common";

export const personSchema = z.object({
  /** Wajib. */
  fullName: z.string().trim().min(1, "Nama wajib diisi").max(120),
  /** Nama panggilan, dipakai di cover & penutup ("Nadia & Jorgi"). */
  nickname: optionalText(40),
  /** Gelar di belakang nama, mis. "S.T." atau "dr." di depan → isi titlePrefix. */
  title: optionalText(40),
  titlePrefix: optionalText(20),
  /** "Putri pertama", "Putra kedua". */
  childOrder: optionalText(60),
  father: parentSchema.optional(),
  mother: parentSchema.optional(),
  photo: photoSchema.optional(),
  /** Username tanpa @. */
  instagram: optionalText(40),
});
export type Person = z.infer<typeof personSchema>;

export const loveStoryItemSchema = z.object({
  /** Bebas: "2019", "Maret 2022". */
  date: optionalText(40),
  title: z.string().trim().min(1).max(80),
  text: optionalText(800),
  photo: photoSchema.optional(),
});

export const weddingDataSchema = z.object({
  ...baseInvitationShape,
  bride: personSchema,
  groom: personSchema,
  /** Siapa yang ditulis lebih dulu. Umumnya wanita dulu. */
  order: z.enum(["bride-first", "groom-first"]).default("bride-first"),
  loveStory: z.array(loveStoryItemSchema).max(12).default([]),
  photos: z
    .object({
      cover: photoSchema.optional(),
      /** Photo strip (3 foto) di kartu mempelai. */
      strip: z.array(photoSchema).max(4).default([]),
      /** Foto polaroid / penutup. */
      closing: photoSchema.optional(),
    })
    .default({ strip: [] }),
  /** Penutup: "Kami yang berbahagia" + nama keluarga. */
  signature: z
    .object({
      text: optionalText(80),
      families: z.array(z.string().trim().min(1).max(160)).max(4).default([]),
    })
    .optional(),
});

export type WeddingData = z.infer<typeof weddingDataSchema>;
export type WeddingInput = z.input<typeof weddingDataSchema>;
