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

Ornamen Lili digambar ulang sebagai SVG orisinal dari screenshot desain
(keputusan pemilik: tanpa file aset referensi), jadi tidak ada baris di
`ASSET-AUDIT.md`. Gambar berbasis foto pemilik (2026-11-21): pita renda cover
(`scripts/lili-lace.ts`) dan komposisi bingkai hero/penutup (`scripts/lili-hero-frame.ts`).

| Komponen                                               | File                            | Catatan                                                                                                                                                                                                                                                     |
| ------------------------------------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lace-band.webp`                                       | `lili/art/lace-band.webp`       | Foto renda milik pemilik (2026-11-21): latar hitam → alfa, diputar & dilengkungkan oleh `scripts/lili-lace.ts` (sumber di `.reference/lili/`, gitignored).                                                                                                  |
| `wax-seal.webp`                                        | `lili/art/wax-seal.webp`        | Foto cap lilin bunga lili milik pemilik (PNG transparan, 2026-11-21), dipotong ke isi, segel cover.                                                                                                                                                         |
| `paperBg`, `envelopeBg`                                | `lili/art/textures.ts`          | feTurbulence + pencahayaan sebagai data URI (diraster sekali), soft-light di atas token.                                                                                                                                                                    |
| `lace-strip.webp`                                      | `lili/art/lace-strip.webp`      | Foto renda lurus milik pemilik sebagai ubin tegak mulus (crossfade) di tepi kanan Ucapan, oleh `scripts/lili-lace-strip.ts`.                                                                                                                                |
| `hero-frame.webp`                                      | `lili/art/hero-frame.webp`      | Komposisi bingkai oval + alas pink + lili + mutiara + kupu-kupu milik pemilik (2026-11-21), PNG transparan; lubang foto diukur oleh `scripts/lili-hero-frame.ts` (hero & penutup).                                                                          |
| `BrushBox`                                             | `lili/art/BrushBox.tsx`         | Sapuan kuas pink latar hitung mundur.                                                                                                                                                                                                                       |
| `floral-column.webp`                                   | `lili/art/floral-column.webp`   | Ubin mulus (sambungan di tengah anggrek, crossfade) dari foto kolom bunga milik pemilik (PNG transparan, 2026-11-21) oleh `scripts/lili-floral-column.ts`, diulang tegak sebagai latar `FloralColumn` (salam, mempelai, Save The Date; kiri = dicerminkan). |
| `PinkLily`, `Alstroemeria`, `GreenOrchid`, `Gladiolus` | `lili/art/Flowers.tsx`          | Bunga SVG bertepi putih untuk hiasan acara, ucapan, love story, penutup.                                                                                                                                                                                    |
| `event-top.webp`, `event-bottom.webp`                  | `lili/art/event-*.webp`         | Bunga section Acara dari komposisi PNG transparan milik pemilik (2026-11-21): rangkaian kiri atas & buket kanan bawah, skala layar 482 → 430.                                                                                                               |
| `lace-frame.webp`                                      | `lili/art/lace-frame.webp`      | Bingkai renda foto mempelai milik pemilik (2026-11-21): pola kotak-kotak tercetak dibuang & lubang foto diukur oleh `scripts/lili-lace-frame.ts`.                                                                                                           |
| `TornCard`                                             | `lili/art/TornCard.tsx`         | Kartu kertas sobek (mask SVG meregang mengikuti isi).                                                                                                                                                                                                       |
| `doily.webp`                                           | `lili/art/doily.webp`           | Kartu renda persegi Love Story dari gambar milik pemilik (2026-11-21): latar hijau dibuang (color key) oleh `scripts/lili-doily.ts`, dipasang 9-slice (`border-image`) agar tinggi mengikuti isi; latar hijau dibuat ulang (`paperBg(--inv-forest)`).       |
| `lily-bouquet.webp`                                    | `lili/art/lily-bouquet.webp`    | Buket lili cat air milik pemilik (PNG transparan, 2026-11-21), kiri & kanan (cermin) di belakang angsa Love Story.                                                                                                                                          |
| `closing-bouquet.webp`                                 | `lili/art/closing-bouquet.webp` | Rangkaian bunga milik pemilik (PNG transparan, 2026-11-22), disusun 7× (2 baris, rotasi/cermin berbeda) sebagai hamparan bunga penutup.                                                                                                                     |
| `orchid.webp`                                          | `lili/art/orchid.webp`          | Anggrek hijau milik pemilik (PNG transparan, 2026-11-21), kiri bawah section Ucapan diputar 32°.                                                                                                                                                            |
| `wishes-lily.webp`                                     | `lili/art/wishes-lily.webp`     | Rangkaian lili milik pemilik (PNG transparan, 2026-11-21), dicerminkan menghadap kiri, kanan atas section Ucapan di atas pita renda.                                                                                                                        |
| `swans.webp`                                           | `lili/art/swans.webp`           | Sepasang angsa milik pemilik (PNG transparan, 2026-11-21) di `SwanPair` (Love Story), skala layar 482 → 430, tanpa bunga seperti diminta.                                                                                                                   |

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
