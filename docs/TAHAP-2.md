# Ringkasan Tahap 2 — Sistem Tema

Tahap 2 membangun fondasi tema undangan: skema data, registry tema, runtime
bersama, tiga tema siap pakai, dan perkakas untuk membuat, mengaudit, serta
menguji tema. Panduan teknis lengkap ada di
[`src/themes/README.md`](../src/themes/README.md).

## 1. Yang sudah selesai

### 2a — Fondasi

- **Skema data (Zod):**
  - pernikahan, ulang tahun, bagian bersama (acara, foto, hadiah, musik, dress
    code, live streaming);
  - urutan, visibilitas, dan pengecekan paket per section (`resolveSections`).
- **Registry tema otomatis:**
  - `themes:sync` dijalankan di `predev`/`prebuild`;
  - komponen tema dimuat lazy, jadi JS, CSS, dan font tema lain tidak ikut
    terunduh.
- **Runtime bersama (`ThemeRoot`):**
  - token warna per varian dan kolom 440 px;
  - cover, musik yang mulai setelah diketuk, toast, watermark FREE;
  - mode ringan otomatis (CPU/RAM/Save-Data, atau `?lite=1`) dan reduced motion;
  - jeda animasi saat tab atau section tidak terlihat.
- **15 section default** yang otomatis mengikuti warna tema.
- **Tema Confetti Party** (ulang tahun, paket BASIC).
- **Halaman preview dan galeri:**
  - preview dengan data contoh fiktif dan toolbar (varian, nama tamu, mode
    ringan);
  - halaman galeri `/tema`.

### 2b — Aset & tema pertama

- **Pipeline referensi:**
  - `ref:assets` dan `ref:shots`;
  - audit `ASSET-AUDIT.md` (status `milik`/`free`/`pro`/`belum dicek`);
  - `assets:sync` untuk konversi WebP dan slot aset.
- **Sistem aset yang bisa ditukar:** setiap ornamen punya versi SVG orisinal dan
  memakai file asli hanya bila statusnya mengizinkan.
- **Pustaka ornamen SVG dan tekstur:** amplop, segel lilin, renda, bingkai,
  bunga, mutiara, tirai, dan lainnya. Pratinjau di `/preview/ornamen` dan
  `/preview/aset-referensi`.
- **Tema Tirai Beludru** (paket PREMIUM): adaptasi per piksel desain pemilik,
  dengan transisi amplop yang menyambung ke kartu ayat.
- **Uji performa otomatis** `pnpm perf`: CPU 4× + Fast 4G, mode normal dan
  ringan.

### 2c — Perbaikan & tema kedua

- **Musik:**
  - `pnpm music:optimize` mengompres ke AAC 96 kbps;
  - pemutar memakai `preload="none"`, jadi 0 request audio sebelum cover
    diketuk.
- **Section terkunci** (`lockedSections`): kartu ayat Tirai selalu tepat setelah
  cover.
- **Section tambahan bergaya tema** (Love Story, Dress Code, Live Streaming) dan
  tombol Instagram mempelai.
- **Tema Renda Rimba** (paket BASIC):
  - pintu daun yang terbuka;
  - nama tamu di cover;
  - ketuk dua kali untuk melewati animasi;
  - tiga varian (Rimba, Sage, Kenari).

### 2d — Perkakas & penyempurnaan

- **Prerender di balik cover** (`prepareBehindCover`): isi undangan dirender
  saat browser menganggur. Buka cover Renda naik dari 48 ke 58 fps.
- **Font OFL hasil subset** (`pnpm fonts:build`, `next/font/local`, `swap`,
  tanpa preload):
  - Renda turun dari ±490 menjadi ±232 KB;
  - file Cormorant dan Amiri dipakai bersama Tirai;
  - teks lisensi OFL tersimpan di `src/themes/_fonts/licenses/`.
- **`/preview/banding`** (hanya development):
  - screenshot referensi berdampingan dengan tema per section;
  - mode tumpuk dengan slider transparansi dan mode _difference_;
  - tab Font.
- **`pnpm theme:new`:** kerangka tema baru yang langsung muncul di `/tema` dan
  `/preview`.
- **`pnpm themes:thumbs`:** thumbnail `/tema` berupa screenshot cover sungguhan.
- **README tema lengkap:** anatomi, manifest, token, adaptasi desain, aset dan
  audit, font, musik, cover, section terkunci, mode ringan, dan checklist
  performa.

### Performa akhir

CPU 4× + Fast 4G, cache kosong, 390×844, rata-rata 3×.

| Tema           | Mode   | LCP cover | Siap diklik | Buka cover | Scroll |
| -------------- | ------ | --------- | ----------- | ---------- | ------ |
| Renda Rimba    | normal | 703 ms    | 1316 ms     | 58 fps     | 60 fps |
| Renda Rimba    | ringan | 683 ms    | 1294 ms     | 60 fps     | 60 fps |
| Tirai Beludru  | normal | 687 ms    | 1418 ms     | 54 fps     | 60 fps |
| Tirai Beludru  | ringan | 707 ms    | 1386 ms     | 56 fps     | 60 fps |
| Confetti Party | normal | 509 ms    | 1197 ms     | 58 fps     | 60 fps |
| Confetti Party | ringan | 503 ms    | 1198 ms     | 59 fps     | 60 fps |

Berat unduhan (di luar musik):

| Tema           | Sampai cover siap | Total setelah scroll habis | Font   | Musik  |
| -------------- | ----------------- | -------------------------- | ------ | ------ |
| Renda Rimba    | 515 KB            | 1,38 MB                    | 236 KB | 1,5 MB |
| Tirai Beludru  | 555 KB            | 1,27 MB                    | 116 KB | 2,7 MB |
| Confetti Party | 388 KB            | 0,56 MB                    | 68 KB  | 1,0 MB |

Ketiga tema mengirim 0 request audio sebelum cover diketuk. Tirai Beludru
(buka cover 54 fps pada mode normal) sedikit di bawah target 55 fps; perlu
optimasi transisi amplop di tahap berikutnya.

## 2. WAJIB beres sebelum peluncuran publik

### Lisensi & hak cipta

- [ ] **Aset tema berstatus `milik`.** Dapatkan konfirmasi tertulis bahwa semua
      ornamen di `ASSET-AUDIT.md` benar buatan atau milik sendiri, dan **bukan
      elemen Canva**. Canva Content License melarang elemen Free maupun Pro
      dipakai di template yang dijual atau didistribusikan ke pengguna lain.
      Elemen yang ragu diganti versi SVG (`status: pro`).
- [ ] **Lisensi font.**
  - Semua font sudah OFL. Sertakan teks lisensi saat font didistribusikan
    (sudah ada di `_fonts/licenses/`), lalu tambahkan halaman atau tautan
    "Lisensi pihak ketiga".
  - Pastikan tidak ada lagi font non-OFL. Yellowtail (Apache) sudah diganti.
- [ ] **Perpustakaan musik resmi.**
  - Musik bawaan sekarang placeholder dari Pixabay. Lisensi Pixabay melarang
    redistribusi musik sebagai file mandiri, sehingga perpustakaan lagu yang
    bisa dipilih pengguna butuh lisensi komersial yang jelas (layanan
    _production music_ berlisensi) atau musik milik sendiri.
  - Siapkan kebijakan untuk musik yang di-upload pengguna: S&K tentang hak
    cipta dan prosedur _takedown_.
- [ ] **Foto contoh resmi.**
  - Foto preview, thumbnail `/tema`, dan galeri contoh sekarang berasal dari
    Unsplash (`CREDITS.md`). Unsplash tidak menyertakan _model release_, jadi
    gantilah dengan foto sesi sendiri atau stok berlisensi yang punya model
    release, lalu jalankan ulang `pnpm themes:thumbs`.

### Fitur & mutu

- [ ] **RSVP & Ucapan tersimpan ke database** (saat ini hanya state lokal di
      browser), lengkap dengan anti-spam, rate limit, dan moderasi ucapan oleh
      pemilik undangan.
- [ ] **Uji di perangkat nyata:**
  - Android kelas bawah;
  - iPhone Safari;
  - browser bawaan WhatsApp, Instagram, dan Facebook (WebView).

  Uji yang sudah dilakukan baru emulasi Chrome.

- [ ] **Pemeriksaan aksesibilitas** (kontras teks di atas foto/tekstur,
      pembaca layar, navigasi keyboard) dan teks panjang ekstrem di semua tema.
- [ ] **Halaman legal:** Kebijakan Privasi (data tamu, RSVP, ucapan) serta
      Syarat & Ketentuan.
- [ ] **Gambar OG / pratinjau tautan per undangan** untuk dibagikan di
      WhatsApp.
- [ ] **Uji performa di lingkungan produksi** (CDN, optimasi gambar Next di
      hosting, beserta biayanya) dengan checklist README §14.
- [ ] **Halaman development** (`/preview/banding`, `/preview/ornamen`,
      `/preview/aset-referensi`) dipastikan 404 di produksi. Folder `.reference/`
      dan `public/_ref/` tidak ikut ter-deploy (keduanya sudah di-gitignore).

## 3. Sengaja ditunda ke tahap berikutnya

- **RSVP & Ucapan ke database.** Tabel `Rsvp`/`Wish` sudah ada di Prisma; UI
  sudah jadi. _(Wajib sebelum peluncuran.)_
- **Editor undangan:**
  - isi data, upload foto, dan pilih varian;
  - atur urutan dan sembunyikan section (menghormati `lockedSections`);
  - **kompresi otomatis musik upload** ke AAC 96 kbps.
- **Pembayaran & aktivasi paket** (`Order`): masa aktif FREE 3 hari, watermark,
  dan batas galeri per paket.
- **Daftar tamu:**
  - nama tamu personal per tautan;
  - impor Excel;
  - kirim WhatsApp massal.
- **QR check-in** dan buku tamu digital di lokasi acara.
- **Mode privat**, **tema interaktif**, dan statistik kunjungan
  (`InvitationView`).
- **Lebih banyak tema**, terutama ulang tahun (baru Confetti Party), dibuat
  dengan `pnpm theme:new`.
- **Otomatisasi di CI:** `pnpm perf` dan `themes:thumbs` setiap ada perubahan
  tema.
