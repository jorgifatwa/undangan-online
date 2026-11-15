import type { AnyInvitationData } from "@/schemas/sections";

/**
 * Pratinjau PEMILIK (editor & "Pratinjau penuh"): setiap slot foto yang masih
 * kosong diisi gambar penanda "Belum ada foto", dan cerita ulang tahun / love
 * story yang kosong diisi teks penanda, agar bentuk tiap bagian terlihat
 * sebelum diisi. Data asli tidak diubah (hanya untuk render),
 * dan TIDAK pernah dipakai di halaman tamu maupun link pratinjau keluarga.
 */
export const EMPTY_PHOTO_URL = "/placeholders/foto-kosong.svg";
const ph = (alt: string) => ({ url: EMPTY_PHOTO_URL, alt, width: 600, height: 800 });
/** Slot berjumlah tetap (strip 3 foto): yang kosong diisi penanda sampai n. */
function padTo<T>(arr: (T | undefined)[] | undefined, make: () => T, n = 3): T[] {
  const got = (arr ?? []).filter((x): x is T => !!x);
  return [...got, ...Array.from({ length: Math.max(0, n - got.length) }, make)];
}

export function isEmptyPhoto(url: string | undefined) {
  return url === EMPTY_PHOTO_URL;
}

export function withPhotoPlaceholders(inv: AnyInvitationData): AnyInvitationData {
  if (inv.eventType === "WEDDING") {
    const d = inv.data;
    return {
      ...inv,
      data: {
        ...d,
        photos: {
          ...d.photos,
          cover: d.photos.cover ?? ph("Foto sampul"),
          strip: padTo(d.photos.strip, () => ph("Photo strip")),
          closing: d.photos.closing ?? ph("Foto penutup"),
        },
        bride: { ...d.bride, photo: d.bride.photo ?? ph("Foto mempelai") },
        groom: { ...d.groom, photo: d.groom.photo ?? ph("Foto mempelai") },
        gallery: d.gallery.length ? d.gallery : Array.from({ length: 4 }, () => ph("Foto galeri")),
        loveStory: d.loveStory.length
          ? d.loveStory
          : [
              {
                date: "Tahun",
                title: "Judul momen",
                text: "Isi kisah kalian di grup “Love story” — contoh penanda, tamu tidak melihatnya.",
              },
            ],
      },
    };
  }
  const d = inv.data;
  return {
    ...inv,
    data: {
      ...d,
      celebrant: {
        ...d.celebrant,
        photo: d.celebrant.photo ?? ph("Foto yang berulang tahun"),
        // foto cover & pembuka (tema yang memakainya, mis. Pita Krayon)
        childPhoto: d.celebrant.childPhoto ?? ph("Foto cover & pembuka"),
      },
      closingPhoto: d.closingPhoto ?? ph("Foto penutup"),
      musicPhoto: d.musicPhoto ?? ph("Foto pemutar musik"),
      stripPhotos: padTo(d.stripPhotos, () => ph("Strip foto")),
      gallery: d.gallery.length ? d.gallery : Array.from({ length: 4 }, () => ph("Foto galeri")),
      story: d.story?.text.trim()
        ? d.story
        : {
            title: d.story?.title,
            text: "Tulis cerita ulang tahunmu di grup “Cerita ulang tahun”. Pisahkan paragraf dengan baris kosong.\n\nIni hanya penanda di pratinjau — tamu tidak melihatnya sampai cerita diisi.",
          },
    },
  };
}
