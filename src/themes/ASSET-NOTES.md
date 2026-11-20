# Catatan Aset Tema

Setiap ornamen punya versi **SVG/CSS orisinal** di kode. File asli dari folder
referensi (`undangan-jorgi-estetik`, `undangan-subagja`) hanya dipakai bila
statusnya `free`/`milik` di `ASSET-AUDIT.md` (lihat README §7); font & musik
referensi tidak pernah disalin. Pratinjau semua ornamen: `/preview/ornamen`
(hanya development).

## Kandidat diganti ilustrasi buatan tangan

Bagian di bawah ini sudah layak tampil, tetapi akan lebih kaya bila diganti
ilustrasi vektor buatan ilustrator. Saat mengganti: pertahankan nama komponen &
props, gunakan warna dari token `T` (`ornaments/tokens.ts`) agar varian warna
tetap bekerja, dan pecah per bagian bila dianimasikan.

| Komponen                                        | File                            | Dipakai di            | Catatan                                                                                                                                            |
| ----------------------------------------------- | ------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DriedBouquet` (hanging / floor / accent)       | `_shared/ornaments/Flowers.tsx` | Tirai Beludru         | Prosedural (mawar, ranunculus, craspedia, bulu astilbe, untai amaranthus). Paling jauh dari kesan "foto bunga kering" referensi — prioritas utama. |
| `CallaLily`, `Anthurium`, `Lily`                | `_shared/ornaments/Flowers.tsx` | Renda Rimba           | Bentuk sudah jelas; bisa diberi gradasi & detail urat lebih halus.                                                                                 |
| `PearlStrands`                                  | `_shared/ornaments/Objects.tsx` | Renda Rimba           | Manik prosedural + gradien; ilustrasi bisa menambah pantulan cahaya.                                                                               |
| `Tower`, `Skyline`, `StreetTree`, `Street`      | `_shared/ornaments/City.tsx`    | Tirai Beludru (acara) | Gedung generik bergaya sketsa. Ilustrasi venue khusus TIDAK dijadikan field (keputusan Tahap 2).                                                   |
| `OvalBaroqueFrame`                              | `_shared/ornaments/Frames.tsx`  | Renda Rimba (cover)   | Ukiran gulungan prosedural; ilustrasi ukiran tangan akan lebih "berat".                                                                            |
| `CarvedCorner`                                  | `_shared/ornaments/Objects.tsx` | Renda Rimba (galeri)  | Filigri simetris sederhana.                                                                                                                        |
| `VelvetDrape`, `SuedeTexture`, `LeatherTexture` | `_shared/textures/index.tsx`    | Kedua tema            | Tekstur CSS + noise. Bisa diganti tekstur foto WebP berlisensi bebas bila mode ringan tetap memakai versi CSS.                                     |

### Lili

Seluruh ornamen Lili digambar ulang sebagai SVG orisinal dari screenshot
desain (keputusan pemilik: tanpa file aset referensi), jadi tidak ada baris di
`ASSET-AUDIT.md` dan tema boleh langsung ke production.

| Komponen                | File                    | Catatan                                                                                  |
| ----------------------- | ----------------------- | ---------------------------------------------------------------------------------------- |
| `LaceBand`              | `lili/art/LaceBand.tsx` | Renda guipure prosedural (melengkung, jaring, medalion). Foto renda asli lebih padat.    |
| `RoseSeal`              | `lili/art/RoseSeal.tsx` | Segel lilin + emboss mawar (bayangan/sorot berlapis, tanpa filter SVG).                  |
| `paperBg`, `envelopeBg` | `lili/art/textures.ts`  | feTurbulence + pencahayaan sebagai data URI (diraster sekali), soft-light di atas token. |

## Font (semua OFL dari Google Fonts)

| Font asli referensi      | Padanan yang dipakai                 |
| ------------------------ | ------------------------------------ |
| Sloop Script             | Pinyon Script (cadangan Great Vibes) |
| SaveTheDate              | Italianno                            |
| Cormorant (ekspor Canva) | Cormorant Garamond                   |
| VerseSerif               | Noto Serif                           |
| Lemon Tuesday            | Caveat Brush                         |
| Amoresa                  | Allura                               |
| Nickainley               | Yellowtail                           |
| FC Palette               | Caveat                               |
| Adlery Swash             | Playball                             |
| Afrah                    | Parisienne                           |
| Nourd                    | Jost                                 |
| 29LT Zarid Serif (Arab)  | Amiri (teks, bukan gambar)           |

## Foto & musik placeholder

Lihat `public/placeholders/CREDITS.md` (Unsplash License & Pixabay Content License).
