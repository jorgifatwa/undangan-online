# Tema Undangan

Panduan membuat dan merawat tema. Semua tema berbagi satu runtime
(`_shared/runtime`) dan satu rute undangan, jadi aturan di bawah ini menjaga agar
satu tema tidak memperlambat tema lain.

## Daftar isi

1. [Anatomi tema](#1-anatomi-tema)
2. [Membuat tema baru](#2-membuat-tema-baru)
3. [Manifest](#3-manifest)
4. [Token warna & varian](#4-token-warna--varian)
5. [Definisi tema (index.tsx)](#5-definisi-tema-indextsx)
6. [Mengadaptasi desain statis](#6-mengadaptasi-desain-statis)
7. [Sistem aset & audit](#7-sistem-aset--audit)
8. [Font](#8-font)
9. [Musik (WAJIB)](#9-musik-wajib)
10. [Cover](#10-cover)
11. [Section terkunci](#11-section-terkunci)
12. [Mode ringan & reduced motion](#12-mode-ringan--reduced-motion)
13. [Thumbnail galeri](#13-thumbnail-galeri)
14. [Checklist performa](#14-checklist-performa)
15. [Ringkasan perintah](#15-ringkasan-perintah)

---

## 1. Anatomi tema

```
src/themes/
├── {slug}/                     satu folder per tema (slug = manifest.id)
│   ├── manifest.ts             metadata, paket minimum, varian, section, musik
│   ├── tokens.ts               varian warna (token --inv-*)
│   ├── fonts.ts                font (next/font/local dari _fonts/)
│   ├── index.tsx               ThemeDefinition + komponen default export
│   ├── theme.css               gaya & animasi tema (selector [data-theme="{slug}"])
│   ├── sections/               override section (opsional)
│   └── assets/                 hasil `pnpm assets:sync` (JANGAN diedit manual)
├── _shared/                    runtime, section default, ornamen SVG, tekstur, efek
├── _fonts/                     font OFL yang sudah di-subset + licenses/
├── registry.generated.ts       dibuat `pnpm themes:sync` (daftar manifest + thumbnail)
├── components.generated.tsx    dibuat `pnpm themes:sync` (komponen lazy per tema)
├── ASSET-AUDIT.md              status setiap aset referensi
└── ASSET-NOTES.md              catatan ornamen SVG pengganti
```

Folder berawalan `_` bukan tema. Registry dibuat ulang otomatis di `predev`,
`prebuild`, dan `theme:new`. Komponen tema dimuat lazy, jadi JS, CSS, dan font
tema lain tidak ikut terunduh.

## 2. Membuat tema baru

```bash
pnpm theme:new melati-putih                    # pernikahan
pnpm theme:new pesta-dino --acara=ultah        # ulang tahun
pnpm theme:new melati-putih --nama="Melati Putih"
```

Perintah ini membuat kerangka yang langsung tampil di `/tema` dan
`/preview/{slug}` dengan section default. Lanjutkan dengan langkah berikut:

1. Isi `manifest.ts` (deskripsi, kategori, paket), `tokens.ts` (2–4 varian),
   dan `fonts.ts` (§8).
2. Bila mengadaptasi desain yang sudah ada, ikuti §6 dan §7.
3. Override `Cover` dan section yang perlu. Section yang tidak di-override
   memakai `_shared/sections` dan otomatis memakai token warna tema.
4. Tambahkan musik lewat `pnpm music:optimize` (§9).
5. Jalankan `pnpm themes:thumbs` (§13), lalu `pnpm perf` sampai checklist §14
   lolos.

Untuk menghapus tema, hapus foldernya lalu jalankan `pnpm themes:sync`.

## 3. Manifest

| Field            | Isi                                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| `id`             | sama persis dengan nama folder (dicek oleh `themes:sync`)                                                 |
| `minPackage`     | paket minimum agar undangan **aktif permanen**; semua tema tetap bisa dicoba di FREE (3 hari + watermark) |
| `variants`       | 2–4 varian; yang pertama jadi default                                                                     |
| `sections`       | section yang didukung tema; section lain tidak pernah dirender                                            |
| `lockedSections` | lihat §11                                                                                                 |
| `defaultMusic`   | musik bawaan bila pengguna belum memilih lagu (file `.m4a`, §9)                                           |
| `thumbnail`      | gradien cadangan bila belum ada screenshot (§13)                                                          |

Urutan akhir section ditentukan `resolveSections` (`src/schemas/sections.ts`)
dengan urutan langkah berikut:

1. Urutan dari data undangan (atau urutan default per jenis acara).
2. Section terkunci dipindah tepat setelah cover.
3. Filter dukungan tema.
4. Filter section yang disembunyikan pengguna.
5. Filter fitur paket.
6. Filter section yang datanya kosong.

## 4. Token warna & varian

- Section dan ornamen **hanya** membaca token `--inv-*` dari varian, tidak
  pernah warna tetap. Dengan begitu, mengganti varian cukup dengan mengganti
  nilai token.
- Token yang dipakai runtime:
  - `--inv-bg`, `--inv-bg-alt`, `--inv-text`, `--inv-text-muted`
  - `--inv-primary` dan `--inv-primary-text` (tombol musik)
  - `--inv-surface` dan `--inv-surface-text` (toast)
  - `--inv-backdrop` (latar desktop)
  - `--inv-font-*`
- Gambar asli yang perlu diwarnai ulang per varian (tirai, daun, tekstur) memakai
  token filter, misalnya `--inv-filter-leaf: hue-rotate(...)`. **Nilainya tidak
  boleh `none`**, karena sering digabung dengan filter lain. Pakai
  `saturate(1)` sebagai nilai netral.

## 5. Definisi tema (index.tsx)

```ts
const definition: ThemeDefinition = {
  manifest,
  fontClassName,
  assets: THEME_ASSETS, // hasil assets:sync
  Cover, // opsional; default _shared/sections/Cover
  sections: { ayat: MyIntro }, // override per section
  Ambient, // efek di atas undangan (kelopak, konfeti)
  MusicControl, // opsional; default tombol melayang
  prepareBehindCover: true, // opsional, lihat §10
};
```

`ThemeRoot` sudah menangani hal-hal yang sama untuk semua tema:

- token varian dan font tema
- kolom 440 px (penuh di HP) dengan latar desktop
- cover dan proses membukanya
- musik, yang baru mulai setelah tamu mengetuk cover
- mode ringan dan `MotionConfig reducedMotion="user"`
- jeda animasi saat tab tidak aktif atau section tidak terlihat (`data-inview`)
- toast, watermark paket FREE, dan urutan section

Setiap section dibungkus `SectionShell` dengan `id="inv-{sectionId}"`.

## 6. Mengadaptasi desain statis

Pola Tirai Beludru dan Renda Rimba untuk desain Canva/HTML milik pemilik:

1. **Screenshot referensi:** jalankan `pnpm ref:shots` untuk memotret situs live
   per section ke `public/_ref/shots/` dan `.reference/shots.json` (keduanya
   gitignored).
2. **Kanvas:**
   - Tentukan lebar kanvas desain (Tirai 440, Renda 430). Fungsi `u(px)` di
     `{tema}/canvas.tsx` mengubah px desain menjadi `cqw`, dan section memakai
     `container-type: inline-size`.
   - Koordinat di kode adalah **koordinat asli** desain, jadi posisi bisa
     dicocokkan angka per angka.
3. **Teks dari data pengguna:**
   - Nama dan alamat bisa jauh lebih panjang daripada contoh desain. Pakai
     pengecil otomatis (`CText fit` di Tirai, `useFit` di Renda), batas baris,
     atau tinggi section yang mengikuti isi.
   - Jangan biarkan teks keluar dari kotaknya.
4. **Animasi masuk:**
   - Ikuti koreografi desain: delay berurutan.
   - Animasikan transform dan opacity saja.
   - Renda memakai kelas CSS (`data-a`) yang dipicu sekali saat section
     terlihat. Tirai memakai `<Reveal>` (framer-motion).
5. **Banding:**
   - `/preview/banding` (hanya development) menampilkan screenshot referensi di
     kiri dan tema di kanan per section.
   - Mode tumpuk punya slider transparansi dan mode _difference_ (area hitam
     berarti sama persis).
   - Tab Font membandingkan font asli dengan font pengganti.
   - Iframe memakai `/preview/{tema}?bare=1&open=1&ref=1&focus={section}`.
     `ref=1` membuang section yang tidak ada di desain asli.
6. **Section tambahan** (love story, dress code, live streaming, dan
   sebagainya) yang tidak ada di desain asli tetap **wajib bergaya tema**:
   pakai latar, ornamen, judul, dan animasi yang sama. Jangan memakai kotak
   polos.

## 7. Sistem aset & audit

- **Audit:** `pnpm ref:assets` memindai folder referensi dan menulis
  `ASSET-AUDIT.md`. Pemilik mengisi kolom **Status** tiap baris:
  - `belum dicek` atau `pro`: tema memakai **pengganti SVG orisinal**
    (`_shared/ornaments`, `_shared/textures`).
  - `free` atau `milik`, dan barisnya punya **slot**: file asli dipakai.
- **Sinkronisasi:** `pnpm assets:sync` mengonversi file berstatus
  `free`/`milik` ke WebP, menyimpannya di `src/themes/{tema}/assets/{slot}.webp`,
  dan menulis `assets/index.generated.ts`.
  - Ukuran sisi maksimum per slot diatur di `MAX_SIDE`.
  - Aset animasi (GIF atau WebP animasi) disimpan di
    `public/theme-assets/{tema}/{slot}.anim.webp` dan disajikan tanpa optimasi
    Next.
  - File yang statusnya dicabut ikut dihapus otomatis.
- **Slot:**
  - Ornamen dibungkus `withAsset(slot, Svg)`. Komponen tema membaca file lewat
    `useSlotAsset(slot)` atau `<Art slot=…>`.
  - Bila slot tidak punya file, versi SVG yang tampil, dan animasi tetap
    berjalan di kedua versi.
  - `slot={false}` memaksa versi SVG.
- **Yang tidak pernah dipakai:**
  - foto pribadi pasangan di referensi
  - foto demo template
  - ikon situs dan gambar OG referensi
  - file berstatus `pro`
- **Foto contoh** berasal dari Unsplash (`public/placeholders/`, kredit di
  `CREDITS.md`).

## 8. Font

- **Hanya font berlisensi OFL** dari repo resmi google/fonts. Jangan pernah
  memakai file font ekspor Canva atau font berlisensi komersial. Font berlisensi
  lain, termasuk Apache, juga tidak dipakai. Contohnya, Yellowtail (Apache 2.0)
  diganti Kaushan Script.
- **`pnpm fonts:build`** mengunduh sumber TTF (cache di `.cache/`, gitignored)
  dan men-subset setiap font ke `src/themes/_fonts/*.woff2`. Teks lisensi
  disalin ke `_fonts/licenses/`.
  - Teks dinamis (nama, alamat, ucapan) memakai Latin dasar, Latin-1, dan tanda
    baca tipografis.
  - Judul statis hanya menyimpan huruf yang dipakai (misalnya "Our Gallery",
    nama bulan). **Bila menambah teks statis pada font ber-`text`, tambahkan
    hurufnya di `scripts/fonts-build.ts`.**
  - Font variabel hanya menyimpan rentang berat yang dipakai.
  - Hinting dibuang, dan fitur OpenType dibatasi ke `kern`/`liga`/`calt` dan
    sejenisnya.
  - Amiri hanya menyimpan blok Arab utama. Tanda baca Quran ikut tersimpan.
- **`fonts.ts`:** pakai `next/font/local` dengan **`display: "swap"` dan
  `preload: false`**. Semua tema berbagi satu rute, jadi preload akan membuat
  setiap undangan mengunduh font semua tema.
- **Nama konstanta wajib unik antartema.** `next/font/local` memakai nama
  konstanta sebagai nama font-family. Bila dua tema sama-sama punya
  `const script`, @font-face keduanya bertabrakan: teks bisa tampil dengan font
  tema lain dan kedua file ikut terunduh. Selalu beri awalan tema (`rrScript`,
  `tbScript`). Template `theme:new` sudah melakukannya.
- **Berbagi file:** file yang sama (Cormorant, Amiri, Lora) dipakai bersama
  antartema, sehingga ter-cache sekali.
- **Anggaran:** cover maksimal 3 file font, total font per tema **di bawah
  250 KB**.

## 9. Musik (WAJIB)

Semua musik tema **wajib** dikompres ke **AAC 96 kbps** sebelum dipakai:

```bash
pnpm music:optimize                 # semua file di public/placeholders/music/
pnpm music:optimize path/lagu.mp3   # file tertentu
```

- Hasilnya `<nama>.m4a`. File sumber non-m4a dihapus; tambahkan `--keep` untuk
  menyimpannya.
- AAC 96 kbps tetap jernih di speaker HP dan sekitar 3× lebih kecil daripada MP3
  biasa. Contoh: Tirai Beludru turun dari 7,0 MB menjadi 2,7 MB.
- `defaultMusic.url` di manifest harus menunjuk file `.m4a` hasil script ini,
  dan kreditnya dicatat di `public/placeholders/CREDITS.md`.
- Pemutar (`_shared/runtime/audio.tsx`) memakai `preload="none"` dan baru
  memasang `src` saat musik pertama kali diputar, yaitu saat tamu mengetuk
  "Buka Undangan". Musik tidak pernah memperlambat cover.
- Musik yang di-upload pengguna akan dikompres otomatis di tahap editor.

## 10. Cover

- **Nama pasangan dan nama tamu (`?to=`) terlihat sejak HTML pertama.** Jangan
  memakai `opacity: 0` yang menunggu JavaScript. Animasi masuk cover memakai CSS
  transform (lihat `rr-c-*` dan `cp-enter`).
- **Nama tamu** ditampilkan dengan label "Kepada Yth. …", dibatasi 2 baris.
- **Musik:** panggil `startMusic()` **langsung** di handler ketukan. Browser
  menolak autoplay bila musik dimulai lewat timer.
- **Ketuk dua kali untuk melewati animasi.** Ketukan kedua (lebih dari ±400 ms
  setelah yang pertama) langsung membuka isi undangan.
- **`prefers-reduced-motion`:** buka langsung tanpa animasi.
- **`prepareBehindCover: true`** cocok untuk cover yang terbuka ke isi di
  baliknya (pintu, tirai).
  - Isi undangan dirender di balik cover saat browser menganggur
    (`requestIdleCallback`, batas 2,5 s, sebagai transisi React yang bisa
    diinterupsi). Saat cover dibuka, yang berjalan hanya animasinya.
  - Selama disiapkan, `<main>` diberi `inert` dan `aria-hidden`.
  - Animasi masuk section **harus menunggu `opened`** dari context.

## 11. Section terkunci

`manifest.lockedSections` (misalnya `["ayat"]` di Tirai Beludru) berisi section
yang:

- selalu tampil **tepat setelah cover**, sesuai urutan di array;
- tidak bisa dipindah atau disembunyikan di editor (`isSectionLocked`);
- tetap tampil walau datanya kosong, tetapi tetap dicek dukungan tema dan fitur
  paket.

Pakai fitur ini untuk section yang menjadi tujuan transisi cover. Contohnya,
amplop Tirai "berjalan" menjadi kartu ayat.

## 12. Mode ringan & reduced motion

- **Mode ringan aktif** bila salah satu kondisi berikut terpenuhi (`lite.ts`):
  - `hardwareConcurrency` ≤ 4
  - `deviceMemory` ≤ 4 GB
  - Save-Data aktif
  - `?lite=1`

  Mode ringan menandai root dengan `data-lite` dan memberi `lite` di context.

- **Yang dimatikan atau dikurangi tema** di mode ringan:
  - kelopak dan konfeti (sekitar ¼)
  - semburan kelopak
  - parallax
  - goyang bunga dan kilau berulang
  - filter SVG mahal (marmer, noise)
- **Yang tetap berjalan:** transisi cover dan animasi masuk, dalam versi yang
  lebih ringan.
- **`prefers-reduced-motion`:** semua animasi masuk dan berulang dimatikan. Isi
  langsung terlihat dan cover terbuka tanpa animasi.
- Animasi CSS otomatis dijeda saat tab tidak aktif dan di section yang tidak
  terlihat (`runtime.css`).

## 13. Thumbnail galeri

Halaman `/tema` memakai screenshot cover sungguhan.

```bash
pnpm dev                                  # atau build + start
pnpm themes:thumbs [base-url] [themeId…]  # → public/theme-thumbs/{id}.webp + themes:sync
```

Jalankan ulang setiap kali cover berubah. Script menolak memotret halaman error.
Tema tanpa thumbnail memakai gradien `manifest.thumbnail`.

## 14. Checklist performa

Ukur dengan `pnpm build && pnpm start -p 3300`, lalu `pnpm perf
http://localhost:3300 {tema} --runs=3`. Kondisinya CPU 4× lebih lambat, Fast
4G, cache kosong, viewport 390×844, untuk mode normal dan `?lite=1`.

- [ ] **LCP cover ≤ 2,5 s**. Saat ini ketiga tema ada di sekitar 0,6–0,8 s.
- [ ] **Buka cover ≥ 55 fps**, scroll ±60 fps, frame patah < 2 %.
- [ ] **Berat cover ≤ 600 KB**: gambar, font, dan JS sebelum diketuk.
- [ ] **Font tema < 250 KB** total (§8), maksimal 3 file di cover, semua
      `swap`, tanpa preload.
- [ ] **Musik `.m4a` AAC 96 kbps, maksimal ±3 MB**, dengan **0 request audio
      sebelum diketuk**.
- [ ] Gambar lewat `next/image` dengan `sizes` sesuai lebar tampil. Hanya
      gambar cover yang `priority`. Aset besar diberi `MAX_SIDE` yang wajar.
- [ ] Animasi hanya transform dan opacity. Tidak ada animasi `filter`,
      `box-shadow`, atau `width/height` yang berulang.
- [ ] Mode ringan dan reduced motion diuji, termasuk ketuk dua kali di cover.
- [ ] Teks dari data panjang (nama 40+ huruf, alamat 3 baris) tidak meluap.
- [ ] Screenshot 390 px semua varian disimpan di `.reference/report/{tahap}/`.

## 15. Ringkasan perintah

| Perintah                        | Fungsi                                                           |
| ------------------------------- | ---------------------------------------------------------------- |
| `pnpm theme:new slug`           | kerangka tema baru + themes:sync                                 |
| `pnpm themes:sync`              | buat ulang registry & komponen lazy (otomatis di dev/build)      |
| `pnpm themes:thumbs`            | screenshot cover → thumbnail `/tema`                             |
| `pnpm fonts:build`              | subset font OFL → `src/themes/_fonts/`                           |
| `pnpm music:optimize`           | kompres musik ke AAC 96 kbps                                     |
| `pnpm ref:assets` / `ref:shots` | pindai aset & potret situs referensi (gitignored)                |
| `pnpm assets:sync`              | salin aset `free`/`milik` sesuai ASSET-AUDIT.md                  |
| `pnpm perf`                     | uji performa CPU 4× + Fast 4G                                    |
| `/preview/{tema}`               | preview dengan data contoh (`?variant`, `?to`, `?lite`, `?open`) |
| `/preview/banding`              | banding referensi ↔ tema (development)                           |
| `/preview/ornamen`              | galeri ornamen SVG & aset (development)                          |
| `/preview/aset-referensi`       | daftar aset referensi + status (development)                     |
