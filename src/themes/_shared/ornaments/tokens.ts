/**
 * Warna ornamen = token --inv-* tema, dengan nilai cadangan (palet Tirai
 * Beludru "Zamrud") supaya ornamen tetap tampil benar di luar tema.
 * Mengganti varian warna tema = mengganti nilai token → ornamen ikut berubah.
 */
const v = (name: string, fallback: string) => `var(--inv-${name}, ${fallback})`;

export const T = {
  // Logam
  gold: v("gold", "#c9a24d"),
  goldLight: v("gold-light", "#f0dc9a"),
  goldDark: v("gold-dark", "#7d5e1e"),
  // Kertas, renda, amplop
  paper: v("paper", "#f2e9d8"),
  paperShade: v("paper-shade", "#d8c9ac"),
  paperDark: v("paper-dark", "#b9a684"),
  lace: v("lace", "#f7f1e4"),
  laceShade: v("lace-shade", "#d9ccb2"),
  ink: v("ink", "#2d110e"),
  // Beludru marun (lapisan amplop, rumbai)
  velvet: v("velvet", "#5c0f1c"),
  velvetDark: v("velvet-dark", "#2e050c"),
  velvetLight: v("velvet-light", "#8f2638"),
  // Tirai & suede
  drape: v("drape", "#123524"),
  drapeDark: v("drape-dark", "#05130c"),
  drapeLight: v("drape-light", "#2f6347"),
  suede: v("suede", "#40603c"),
  suedeDark: v("suede-dark", "#263b23"),
  // Segel lilin
  seal: v("seal", "#861426"),
  sealLight: v("seal-light", "#c23a4c"),
  sealDark: v("seal-dark", "#4a0711"),
  // Bunga kering & dedaunan
  flower1: v("flower-1", "#e07a5f"), // salem
  flower2: v("flower-2", "#c45c7c"), // pink tua
  flower3: v("flower-3", "#e3b23c"), // mustard
  flower4: v("flower-4", "#a64d6b"), // plum
  flower5: v("flower-5", "#f2b6a0"), // peach
  foliage: v("foliage", "#7b8a3e"),
  foliageDark: v("foliage-dark", "#45511f"),
  foliageLight: v("foliage-light", "#a7b569"),
  // Bunga segar Renda Rimba
  lilyPink: v("lily-pink", "#e85d8f"),
  lilyPinkDark: v("lily-pink-dark", "#a8285a"),
  callaWhite: v("calla-white", "#f6f3ea"),
  // Kayu & kulit
  wood: v("wood", "#5a3a22"),
  woodDark: v("wood-dark", "#2f1d10"),
  leather: v("leather", "#5b3415"),
  leatherDark: v("leather-dark", "#2e1808"),
  // Kota (ilustrasi gedung)
  building: v("building", "#a9bba7"),
  buildingDark: v("building-dark", "#6f8570"),
  buildingLine: v("building-line", "#33402f"),
  // Lain-lain
  pearl: v("pearl", "#f4efe6"),
  petal: v("petal", "#f9d3dc"),
  petalVein: v("petal-vein", "#e7a3b3"),
  white: v("ornament-white", "#fbf8f2"),
} as const;
