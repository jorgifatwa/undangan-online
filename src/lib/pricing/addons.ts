/**
 * ADD-ON: fitur dengan biaya nyata per pemakaian atau kapasitas tambahan,
 * dibeli terpisah PER UNDANGAN (OrderItem kind ADDON → InvitationAddon).
 * Harga null = belum dijual ("Segera hadir").
 */
export interface AddonDefinition {
  id: string;
  label: string;
  description: string;
  /** Rupiah per unit; null = belum dijual. */
  price: number | null;
  /** Satuan yang dibeli, mis. "12 foto", "100 pesan". */
  unit: string;
  /** Efek pada hak pakai per unit yang dibeli. */
  effect?: { galleryPhotos?: number };
}

export const ADDONS: readonly AddonDefinition[] = [
  {
    id: "extra-gallery",
    label: "Foto galeri tambahan",
    description: "Tambah kapasitas galeri foto undangan ini.",
    price: null,
    unit: "12 foto",
    effect: { galleryPhotos: 12 },
  },
  {
    id: "wa-bulk",
    label: "Kirim WhatsApp massal",
    description: "Kirim undangan ke banyak tamu sekaligus lewat WhatsApp resmi.",
    price: null,
    unit: "100 pesan",
  },
];

export function getAddon(id: string): AddonDefinition | undefined {
  return ADDONS.find((a) => a.id === id);
}
