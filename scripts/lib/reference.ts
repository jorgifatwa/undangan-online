/**
 * Konfigurasi referensi desain (undangan asli pemilik) untuk:
 *   - scripts/ref-shots.ts   → screenshot per section (halaman /preview/banding)
 *   - scripts/ref-assets.ts  → daftar & posisi aset (/preview/aset-referensi, ASSET-AUDIT.md)
 *   - scripts/assets-sync.ts → menyalin aset berstatus free/milik ke tema
 *
 * Folder referensi berada DI LUAR repo; semua hasil olahan disimpan di
 * .reference/ dan public/_ref/ yang masuk .gitignore.
 */
import path from "node:path";

export interface ReferenceSite {
  /** Slug tema hasil adaptasi. */
  theme: "tirai-beludru" | "renda-rimba";
  label: string;
  /** Folder proyek referensi (bisa diubah lewat env). */
  dir: string;
  liveUrl: string;
  /** Halaman cover (tanpa membuka) dan halaman isi undangan. */
  coverPath: string;
  detailsPath: string;
}

export const REFERENCES: ReferenceSite[] = [
  {
    theme: "tirai-beludru",
    label: "Tirai Beludru (ref. Jorgi)",
    dir: process.env.REF_JORGI_DIR ?? path.resolve(process.cwd(), "../undangan-jorgi-estetik"),
    liveUrl: process.env.REF_JORGI_URL ?? "https://nadia-jorgi-wedding.vercel.app",
    coverPath: "/",
    detailsPath: "/details",
  },
  {
    theme: "renda-rimba",
    label: "Renda Rimba (ref. Subagja)",
    dir: process.env.REF_SUBAGJA_DIR ?? path.resolve(process.cwd(), "../undangan-subagja"),
    liveUrl: process.env.REF_SUBAGJA_URL ?? "https://annisa-rizki-wedding.vercel.app",
    coverPath: "/",
    detailsPath: "/details",
  },
];

export const OUT_DIR = path.join(process.cwd(), ".reference");
export const PUBLIC_REF_DIR = path.join(process.cwd(), "public/_ref");
export const AUDIT_FILE = path.join(process.cwd(), "src/themes/ASSET-AUDIT.md");

/** Folder yang dipindai (relatif ke folder referensi). Font & audio tidak termasuk. */
export const SCAN_DIRS = ["public", "src/app"];
export const IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg|ico)$/i;
export const LOTTIE_EXT = /\.json$/i;
export const SKIP_PATH = /(\/fonts\/|_unused-assets|node_modules)/;

/**
 * Peran aset → slot ornamen di tema + komponen SVG penggantinya.
 * Kunci = nama file (tanpa ekstensi); id media Canva sama di kedua referensi
 * meski formatnya beda (mis. db0864fe… .webp vs .png).
 * slot null = tidak dijadikan ornamen tema (foto pribadi, ikon situs, dll.).
 */
export interface SlotInfo {
  slot: string | null;
  /** Komponen SVG yang dipakai bila aset tidak boleh dipakai. */
  svg: string;
  role: string;
}

export const SLOT_MAP: Record<string, Record<string, SlotInfo>> = {
  "tirai-beludru": {
    "0683d2a13e7eb7e869898743f13f38be": {
      slot: "drape-bg",
      svg: "VelvetDrape + DamaskCarpet",
      role: "Latar tirai zamrud + karpet damask",
    },
    f36c62f2bb57c539b5c23e2684f29e0e: {
      slot: "velvet-bg",
      svg: "VelvetTexture",
      role: "Latar beludru marun",
    },
    "376c00ed1b80a48dc9e3293696c06776": {
      slot: "suede-bg",
      svg: "SuedeTexture",
      role: "Latar suede hijau",
    },
    "1e7bcbf0e72a46a3fc5a00d154822f44": {
      slot: "envelope-back",
      svg: "EnvelopeBody",
      role: "Badan amplop (belakang)",
    },
    fd53e8793519ee86df4fd95a8217d781: {
      slot: "envelope-lining",
      svg: "EnvelopeInside / EnvelopeFlap inside",
      role: "Lapisan beludru amplop",
    },
    "4eb403d7039697c0864925cfaaa203ee": {
      slot: "envelope-pocket",
      svg: "EnvelopePocket",
      role: "Kantong depan amplop",
    },
    "7b6f2605f13843668eef811673008950": {
      slot: "envelope-closed",
      svg: "EnvelopeClosed",
      role: "Amplop tertutup (cover)",
    },
    "85044a4ee6708cc8da02bc4bad5f12f9": {
      slot: "wax-seal",
      svg: "SealArt / WaxSealBreak",
      role: "Segel lilin",
    },
    ca52e90c3dc4ba78c450200739a6e3c8: {
      slot: "lace-doily",
      svg: "LaceDoily",
      role: "Kartu renda oval (ayat)",
    },
    db0864fe40bc6ca7bbc792b018d97de3: {
      slot: "bouquet-hanging",
      svg: "DriedBouquet hanging",
      role: "Buket bunga kering menggantung",
    },
    bc67bf3451ac6a976bc528960337844d: {
      slot: "bouquet-floor",
      svg: "DriedBouquet floor",
      role: "Buket bunga lantai",
    },
    e3bde292a4e6ad355db1ff202a901599: {
      slot: "bouquet-accent",
      svg: "DriedBouquet accent",
      role: "Buket kecil",
    },
    c908061d4359aa428f27db3c46c60274: { slot: "tassel", svg: "Tassel", role: "Rumbai marun" },
    f002c1dc18ae3027cd46edbe0ad35f38: {
      slot: "tassel-alt",
      svg: "Tassel tone=drape",
      role: "Rumbai hijau (penutup)",
    },
    "869fde431be61aa57e2281cbbdd7e1ac": {
      slot: "capsule-frame",
      svg: "CapsuleFrame",
      role: "Bingkai kapsul emas (foto mempelai)",
    },
    "01121590f317abfa83066572fb626dee": {
      slot: "calla-divider",
      svg: "CallaLily stems=1",
      role: "Pemisah calla lily",
    },
    "01734adcdeb9a49604ebce7dec006c9a": {
      slot: "ornate-card",
      svg: "VelvetTexture + ScallopFrame",
      role: "Kartu marun berornamen (penutup)",
    },
    butterfly_flapping: {
      slot: "butterfly",
      svg: "Butterfly",
      role: "Kupu-kupu putih mengepak (WebP animasi)",
    },
    sec4_gift_box: { slot: "gift-box", svg: "GiftBox", role: "Sketsa kotak kado" },
    sec2_bismillah: {
      slot: "basmalah",
      svg: "Basmalah (teks Amiri)",
      role: "Kaligrafi Basmalah (SVG asli bila milik/free, selain itu teks Amiri)",
    },
    tower: { slot: "city-tower", svg: "Tower", role: "Ilustrasi menara venue" },
    "skyline-left": { slot: "city-skyline-left", svg: "Skyline left", role: "Gedung kiri" },
    "skyline-right": { slot: "city-skyline-right", svg: "Skyline right", role: "Gedung kanan" },
    street: { slot: "city-street", svg: "Street", role: "Jalan" },
    "tree-left": { slot: "city-tree-left", svg: "StreetTree", role: "Pohon + lampu kiri" },
    "tree-right": {
      slot: "city-tree-right",
      svg: "StreetTree lamp=right",
      role: "Pohon + lampu kanan",
    },
    e6d79719ef82472eff99c3e182dd4321: {
      slot: "sparkle",
      svg: "Sparkles",
      role: "Lottie bintang berkilau",
    },
  },
  "renda-rimba": {
    ded4bbababdabc4d2c1f4096fe48b9e9: {
      slot: "leaf-bg",
      svg: "LeafPattern",
      role: "Latar daun hijau (cover)",
    },
    "224e3db56387c3b2fc6f9f742e2b027e": {
      slot: "drape-bg",
      svg: "VelvetDrape",
      role: "Tirai hijau + karpet",
    },
    "31b8b40fed10da81b267068917bd56ba": {
      slot: "oval-frame",
      svg: "OvalBaroqueFrame",
      role: "Bingkai oval emas barok",
    },
    "46017cbd6293305e69c70dd0a2e2a225": { slot: "vinyl", svg: "Vinyl", role: "Piringan hitam" },
    "6bdbbb03529f3e7d294c0ab232845faa": {
      slot: "pearls",
      svg: "PearlStrands",
      role: "Untaian mutiara menggantung",
    },
    "blob-e890afac": { slot: "pearl-curve", svg: "PearlStrands", role: "Untai mutiara melengkung" },
    "021c7d4f4f83e191f99f39b52e279810": { slot: "lily", svg: "Lily", role: "Lili pink" },
    cd433c5065e3b51a535f1d5f60d89b09: {
      slot: "calla-lily",
      svg: "CallaLily",
      role: "Buket calla lily putih",
    },
    d447a34c0d6c0bbc285b0528ebd8d52f: {
      slot: "anthurium",
      svg: "Anthurium",
      role: "Anthurium pink",
    },
    "696933280fff5a395be069f8a6eb7697": {
      slot: "flowers-burgundy",
      svg: "Anthurium + CallaLily (belum ada padanan khusus)",
      role: "Bunga calla/anthurium marun",
    },
    db0864fe40bc6ca7bbc792b018d97de3: {
      slot: "bouquet-hanging",
      svg: "DriedBouquet hanging",
      role: "Buket bunga kering (sama dengan Tirai Beludru)",
    },
    df6a476e3100a3687f7317b0a7add0d5: {
      slot: "bouquet-hanging-2",
      svg: "DriedBouquet hanging seed=7",
      role: "Buket jingga-hijau menggantung",
    },
    "0f66dbd942b7ffc69d31859d3cfab5fe": {
      slot: "carved-corner",
      svg: "CarvedCorner",
      role: "Ukiran kayu sudut (galeri)",
    },
    ef905905cd3d5b3b46ebd1cebd113abe: {
      slot: "lace-card",
      svg: "LaceBorder",
      role: "Kartu renda persegi (mempelai/RSVP)",
    },
    "blob-1206374b": {
      slot: "gift-box",
      svg: "GiftBox",
      role: "Sketsa kotak kado",
    },
    f125f9f97be7490bf3b8c5abd8444bb6: {
      slot: "stamp-card",
      svg: "StampCard",
      role: "Kertas tepi perangko (penutup)",
    },
    d73e76347fb6c5fa5e5d18905dfda4b4: {
      slot: "wax-seal-gold",
      svg: "SealArt tone=gold emblem=butterfly",
      role: "Segel lilin emas kupu-kupu",
    },
    "6a2fd4d294fde9674f91d38da6748ad2": {
      slot: "butterfly",
      svg: "Butterfly",
      role: "Kupu-kupu (GIF animasi)",
    },
    "1a20ba1fca46b89adda334b249164aff": {
      slot: "heart",
      svg: "Heart",
      role: "Hati merah berpendar",
    },
    db37831cadaf2774a072d00978d4bf9a: {
      slot: "card-texture",
      svg: "LeatherTexture / VelvetTexture",
      role: "Tekstur kartu acara",
    },
    a0191da0e41966b9c0b27f63a25eb916: {
      slot: "sparkle-star",
      svg: "Sparkles",
      role: "Kilau bintang",
    },
    "blob-3e1a3262": {
      slot: null,
      svg: "— (ikon tombol, cukup teks/ikon SVG)",
      role: "Ikon buku tombol Buka Undangan",
    },
    "437440eb32d2a85f1c7d462179d92128": {
      slot: null,
      svg: "—",
      role: "Pratinjau template Canva (bukan ornamen)",
    },
    sparkle: {
      slot: "sparkle",
      svg: "Sparkles",
      role: "Lottie bintang berkilau (sama dengan Tirai Beludru)",
    },
  },
};

/** Klasifikasi file yang tidak ada di SLOT_MAP. */
export function classify(relPath: string): string {
  if (/src\/app\/(icon|apple-icon|favicon)/.test(relPath)) return "Ikon situs (bukan ornamen)";
  if (/opengraph-image/.test(relPath)) return "Gambar pratinjau link (bukan ornamen)";
  if (/(gallery|catin-|\/img\/|strip-|cover\.jpg)/.test(relPath))
    return "Foto pribadi pasangan (tidak dipakai di tema)";
  if (/assets\/template\/[0-9a-f]{32}\.jpg$/.test(relPath))
    return "Kemungkinan foto demo template / tekstur";
  return "Belum dipetakan";
}

/** Label section Tirai Beludru (id section di referensi Jorgi). */
export const JORGI_SECTION_LABELS: Record<string, string> = {
  cover: "Cover amplop",
  "section-intro": "Kartu ayat + pemutar musik",
  "section-couple": "Mempelai",
  "section-event": "Acara + hitung mundur",
  "section-gift": "Wedding Gift",
  "section-wishes": "Ucapan & Doa",
  "section-gallery": "Galeri",
  "section-closing": "Penutup",
};

export const baseName = (p: string) => path.basename(p).replace(/\.[^.]+$/, "");
