# Deploy Undangku — Staging (Vercel + Neon + Cloudflare R2)

Panduan ini menyiapkan **staging** di `https://<nama-proyek>.vercel.app` tanpa
domain sendiri. **Vercel hanya untuk staging/percobaan; production berjalan
di VPS** (Docker + Caddy) — lihat `docs/DEPLOY-VPS.md` (tahap 4e). Kode tidak
bergantung pada Vercel. Link undangan memakai `/u/{slug}`; subdomain bisa diaktifkan
nanti (lihat [Mengaktifkan subdomain](#mengaktifkan-subdomain-nanti)).

Penanda di setiap langkah:

- **[ANDA]** — Anda kerjakan sendiri di dashboard layanan (butuh akun/login Anda).
- **[OTOMATIS]** — sudah diatur di kode; terjadi sendiri setiap deploy.

> Angka batas paket di bawah dicek dari dokumentasi resmi Vercel, Neon &
> Cloudflare pada **13 November 2026**. Cek ulang sebelum mengambil keputusan
> biaya karena bisa berubah.

---

## 1. Gambaran & kenapa semuanya harus di Singapura

```
Tamu (Indonesia) ──► Vercel CDN (PoP terdekat, mis. Jakarta/Singapura)
                        │
                        ▼
               Fungsi Next.js  — Vercel  sin1 (Singapura)
                 │                         │
                 ▼                         ▼
     Postgres — Neon             Foto & musik — Cloudflare R2
     aws-ap-southeast-1          location hint: Asia-Pacific (APAC)
     (Singapura)
```

Satu halaman undangan menjalankan **beberapa query database berurutan**
(undangan, ucapan, rekap kehadiran). Setiap query adalah satu perjalanan
pulang-pergi fungsi ↔ database:

| Posisi database terhadap fungsi      | Per query   | 5 query          |
| ------------------------------------ | ----------- | ---------------- |
| Region sama (Singapura–Singapura)    | ±1–5 ms     | ±5–25 ms         |
| Beda benua (mis. Singapura–AS Timur) | ±200–250 ms | **±1–1,2 detik** |

Jadi bila salah satu salah region, TTFB tamu bisa naik dari ±200 ms menjadi
lebih dari 1 detik walau kodenya sama. Vercel juga **default ke `iad1` (AS
Timur)** untuk proyek baru — karena itu region `sin1` dipaku di `vercel.json`
**[OTOMATIS]**. Neon dan R2 dipilih saat membuat **[ANDA]** dan tidak bisa
dipindah setelahnya (harus buat ulang), jadi pastikan benar sejak awal.

Upload foto/musik dikirim browser **langsung ke R2** (tidak lewat fungsi),
sedangkan kompresi musik & potong foto dikerjakan fungsi yang membaca/menulis
R2 — makanya R2 juga perlu dekat.

---

## 2. Staging di Vercel Hobby (gratis) — production di VPS

Staging memakai paket **Hobby**. Batas yang relevan:

| Hal                             | Hobby                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------- |
| **Penggunaan komersial**        | **Tidak boleh** — hanya personal/non-komersial                                  |
| Durasi maksimum fungsi          | 300 dtk                                                                         |
| Cron job                        | 1× per hari, waktu meleset hingga ±59 menit                                     |
| Region fungsi                   | 1 region (kita: `sin1`)                                                         |
| Kuota bulanan (perkiraan wajar) | 1 juta invocation, 4 jam Active CPU, 100 GB transfer, 5.000 transformasi gambar |
| Rollback                        | hanya ke deploy sebelumnya                                                      |

**Aturan untuk Undangku:**

- **Staging (Vercel) hanya untuk uji coba internal**: tidak menerima pembayaran
  sungguhan dan tidak dipromosikan ke publik. Vercel mendefinisikan komersial
  sebagai deploy untuk keuntungan finansial siapa pun, termasuk _"any method
  of requesting or processing payment from visitors of the site"_ dan
  _"advertising the sale of a product or service"_.
- **Production pindah ke VPS** (milik rekan), bukan ke Vercel Pro. Pembayaran
  nyata (Midtrans) dan promosi hanya dilakukan di production VPS.
- Kuota 5.000 transformasi gambar/bulan (next/image) cukup untuk staging.

### Kompresi musik vs batas 300 detik Hobby

Kompresi musik berjalan di fungsi `/api/media/[id]/process` (`maxDuration = 300`,
ffmpeg dibatasi 240 dtk). Kasus terberat yang diizinkan aplikasi: file 10 MB,
dipotong ke 15 menit, dikodekan ulang AAC 96 kbps.

- Diukur lokal: **9,2 detik** (satu core Apple M1, `-threads 1`) untuk 15 menit audio.
- Perkiraan di Vercel (vCPU lebih lambat 2–3×, + unduh/unggah R2 di region
  yang sama): **±20–40 detik** — jauh di bawah 300 dtk. **Hobby cukup.**
- Binary ffmpeg ikut terbundel ke fungsi (sudah dicek di hasil build).

Jika suatu saat tetap melewati batas (mis. CPU Vercel sedang padat): status
musik menjadi **"Gagal"**, file mentah dibersihkan cron, dan pengguna melihat
pesan untuk mencoba lagi — tidak ada data rusak. Di staging cukup coba lagi;
bila sering terjadi, turunkan `MAX_AUDIO_SECONDS` di `src/lib/media/limits.ts`.
Di production VPS tidak ada batas waktu Vercel (`maxDuration` diabaikan).

---

## 3. Variabel lingkungan staging

Isi di **Vercel → Project → Settings → Environment Variables**, centang
**Production** saja (lihat [preview](#preview-deployment) di bawah).

| Variabel                  | Nilai                                          | Catatan                               |
| ------------------------- | ---------------------------------------------- | ------------------------------------- |
| `NEXT_PUBLIC_BRAND_NAME`  | `Undangku`                                     |                                       |
| `NEXT_PUBLIC_APP_URL`     | `https://<nama-proyek>.vercel.app`             | tanpa `/` di akhir                    |
| `NEXT_PUBLIC_ROOT_DOMAIN` | _(kosongkan / jangan dibuat)_                  | kosong = link `/u/{slug}`             |
| `DATABASE_URL`            | string Neon **pooled** + `&connect_timeout=15` | host berisi `-pooler`                 |
| `DATABASE_URL_UNPOOLED`   | string Neon **langsung**                       | host tanpa `-pooler`; dipakai migrasi |
| `AUTH_SECRET`             | baru: `openssl rand -base64 32`                | **jangan** pakai nilai lokal          |
| `AUTH_GOOGLE_ID`          | dari Google Cloud                              |                                       |
| `AUTH_GOOGLE_SECRET`      | dari Google Cloud                              |                                       |
| `STORAGE_DRIVER`          | `r2`                                           |                                       |
| `R2_ACCOUNT_ID`           | dari Cloudflare                                |                                       |
| `R2_ACCESS_KEY_ID`        | dari token R2                                  |                                       |
| `R2_SECRET_ACCESS_KEY`    | dari token R2                                  |                                       |
| `R2_BUCKET`               | mis. `undangku-staging`                        |                                       |
| `R2_PUBLIC_URL`           | `https://pub-xxxx.r2.dev`                      | tanpa `/` di akhir                    |
| `CRON_SECRET`             | `openssl rand -hex 24`                         | huruf & angka saja                    |

**Jangan** isi di Vercel: `AUTH_TRUST_HOST` (Vercel sudah dipercaya otomatis),
`ALLOW_SEED_PERF`, `PROTECTED_DB_HOSTS`, `NODE_ENV`.

Variabel `NEXT_PUBLIC_*` ditanam saat build → setelah mengubahnya, **Redeploy**.

---

## 4. Langkah-langkah

### 4.1 Neon (database) — [ANDA]

1. Masuk ke <https://console.neon.tech> → **New Project**.
2. Nama: `undangku-staging`. Postgres version: **16** (sama dengan lokal).
3. **Region: AWS Asia Pacific (Singapore)** — kode `aws-ap-southeast-1`.
4. Setelah jadi, buka **Connect** (Dashboard → tombol _Connect_):
   - **Connection pooling ON** → salin → ini `DATABASE_URL`. Tambahkan
     `&connect_timeout=15` di akhir (Neon “tidur” setelah beberapa menit tanpa
     aktivitas; bangunnya butuh beberapa detik — tanpa ini bisa muncul error
     `P1001 Can't reach database server`).
   - **Connection pooling OFF** → salin → ini `DATABASE_URL_UNPOOLED`.
5. Simpan keduanya di pengelola kata sandi Anda; jangan tempel di chat/issue.

### 4.2 Cloudflare R2 (foto & musik) — [ANDA]

1. Dashboard Cloudflare → **R2 Object Storage** → **Create bucket**.
   - Nama: `undangku-staging`.
   - **Location → Asia-Pacific (APAC)**. (Petunjuk lokasi bersifat _best effort_
     dan hanya berlaku saat bucket pertama kali dibuat.)
2. Bucket → **Settings → Public access → R2.dev subdomain → Allow**. Salin URL
   `https://pub-….r2.dev` → `R2_PUBLIC_URL`.
   _r2.dev dibatasi lajunya dan tidak untuk production; untuk production nanti
   pakai custom domain (mis. `media.domainanda.id`)._
3. Bucket → **Settings → CORS policy → Add/Edit**, tempel (ganti origin):

   ```json
   [
     {
       "AllowedOrigins": ["https://<nama-proyek>.vercel.app"],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedHeaders": ["Content-Type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   Tanpa ini upload dari browser gagal dengan error CORS.

4. R2 → **Manage API tokens** → **Create API token**:
   - Permissions: **Object Read & Write**; batasi ke bucket `undangku-staging`.
   - Salin **Access Key ID** dan **Secret Access Key** (secret hanya tampil sekali).
5. **Account ID** ada di halaman ringkasan R2 (kanan) → `R2_ACCOUNT_ID`.

### 4.3 Google OAuth — [ANDA]

1. <https://console.cloud.google.com> → **APIs & Services → Credentials**.
2. Pilih OAuth client yang dipakai lokal, atau buat baru (**Web application**,
   disarankan terpisah: “Undangku Staging”).
3. **Authorized JavaScript origins**: `https://<nama-proyek>.vercel.app`
4. **Authorized redirect URIs**:
   `https://<nama-proyek>.vercel.app/api/auth/callback/google`
5. Bila **OAuth consent screen** masih _Testing_, tambahkan email penguji di
   **Test users** (hanya mereka yang bisa login).

### 4.4 Vercel — [ANDA]

1. <https://vercel.com/new> → **Import** repo GitHub `jorgifatwa/undangan-online`.
2. **Project Name** menentukan URL: `<nama-proyek>.vercel.app` (mis.
   `undangku-staging`). Tentukan dulu karena dipakai di 4.2–4.3.
3. Framework: **Next.js** (terdeteksi). Build/Install command: biarkan default
   (Vercel otomatis memakai script `vercel-build`).
4. Buka **Environment Variables** di layar yang sama → isi tabel bagian 3.
5. **Deploy**.
6. Setelah selesai: **Settings → Functions** → pastikan **Function Region =
   Singapore (sin1)** dan **Node.js Version = 22.x**.
7. **Settings → Git → Ignored Build Step** → pilih **Only build production**
   (lihat [preview](#preview-deployment)).

### 4.5 Setiap deploy — [OTOMATIS]

`scripts/vercel-build.sh` (dipanggil lewat script `vercel-build`):

1. `prisma migrate deploy` lewat `DATABASE_URL_UNPOOLED` (migrasi butuh koneksi
   langsung, bukan pooler).
2. `prisma db seed` — koleksi musik bawaan (idempoten, aman diulang).
3. `pnpm run build` (termasuk sinkronisasi tema).

Lainnya dari `vercel.json`: fungsi di **sin1**, cron
`/api/cron/media-cleanup` setiap hari **19:00 UTC = 02:00 WIB** (Hobby: bisa
meleset sampai 02:59 WIB). Cron membersihkan upload yang tak selesai dan
media undangan Gratis 30 hari setelah kedaluwarsa. Vercel mengirim
`CRON_SECRET` otomatis sebagai header `Authorization: Bearer …`.

### 4.6 Data uji performa di staging (opsional) — [ANDA]

Untuk mengukur TTFB perlu undangan terbit. Paling sederhana: buat undangan
lewat aplikasi lalu terbitkan. Atau isi undangan contoh `/u/perf-*`:

```bash
DATABASE_URL="<DATABASE_URL_UNPOOLED staging>" ALLOW_SEED_PERF=1 pnpm seed:perf
```

Lihat [aturan alat uji](#7-aturan-alat-uji-seedperf--e2e) — **jangan pernah** ke production.

---

## 5. Cek pasca-deploy

### 5.1 Otomatis dari Indonesia — [ANDA] menjalankan

Jalankan dari laptop/jaringan di Indonesia (agar mewakili tamu):

```bash
CRON_SECRET="<nilai CRON_SECRET staging>" pnpm deploy:check https://<nama-proyek>.vercel.app --slug=perf-renda-rimba
```

Yang dicek:

- **Region fungsi = sin1** (dari header `x-vercel-id`).
- **Latensi database dari dalam fungsi < 15 ms** (lewat `/api/health`) →
  Neon satu region. Ratusan ms = Neon salah region.
- **Latensi R2 dari fungsi** (peringatan bila > 150 ms).
- **TTFB halaman undangan**: pertama (dingin) + median & p75 dari 10×.
  **Target median < 600 ms.** Permintaan pertama bisa lambat karena koneksi
  baru (DNS/TLS) atau Neon baru bangun — yang dinilai median.
- `X-Robots-Tag: noindex`, gambar pratinjau link JPEG < 150 KB, cookie
  perangkat ber-atribut `Secure`, `/.env` 404, cron tanpa rahasia 401.

### 5.2 Manual — [ANDA]

- [ ] Neon console → proyek → **Region: AWS Asia Pacific (Singapore)**.
- [ ] R2 → bucket → **Settings → Location: Asia-Pacific (APAC)**.
- [ ] Vercel → **Settings → Functions → sin1**.
- [ ] Login Google berhasil.
- [ ] Buat undangan, unggah foto (cek CORS R2) dan musik (status “Siap”).
- [ ] Terbitkan, buka `/u/{slug}?to=Nama` di HP, kirim RSVP & ucapan.
- [ ] Bagikan ke WhatsApp → pratinjau link menampilkan gambar & judul.
- [ ] Vercel → **Schedules → Cron Jobs**: `/api/cron/media-cleanup` terdaftar;
      setelah 02:00–03:00 WIB, **View Logs** menunjukkan status 200.

---

## 6. Keamanan & catatan penting

### `x-forwarded-for` (rate limit buku tamu)

Batas kiriman per IP membaca IP tamu dari `x-vercel-forwarded-for`, lalu
`x-forwarded-for` (`src/lib/guestbook/ip.ts`). **Di Vercel ini aman**: Vercel
menimpa `x-forwarded-for` dengan IP asli pengunjung (_"we currently overwrite
the X-Forwarded-For header … to prevent IP spoofing"_), jadi tamu tidak bisa
memalsukannya. Jangan pasang proxy lain (mis. Cloudflare “awan oranye”) di
depan Vercel; bila terpaksa, `x-vercel-forwarded-for` tetap membawa IP asli. **Di hosting
lain** (VPS, Docker di belakang Nginx/Cloudflare), proxy terdepan **wajib
menimpa** (bukan menambahkan) `X-Forwarded-For`; bila tidak, penyerang bisa
mengirim IP palsu untuk melewati batas per IP. Batas per perangkat (cookie)
dan per undangan tetap berlaku.

### `AUTH_TRUST_HOST`

Auth.js menolak host yang tidak dikenal (`UntrustedHost`, login gagal).
Vercel dipercaya otomatis — **jangan** isi di Vercel. Wajib `true` untuk
`next start` lokal (uji build production) atau server sendiri di belakang proxy.

### `CRON_SECRET`

Melindungi `/api/cron/media-cleanup` dan detail `/api/health`. Mengubahnya
baru berlaku setelah **redeploy**.

### Preview deployment

Deploy preview (branch selain `main`) memakai database yang sama dan URL
acak sehingga login Google tidak jalan, dan migrasi dari branch yang belum
digabung bisa mengubah database staging. Karena itu: env hanya untuk
**Production** dan **Ignored Build Step → Only build production**.

### Neon “tidur”

Paket gratis Neon menidurkan database setelah beberapa menit tanpa aktivitas;
permintaan pertama sesudahnya lebih lambat beberapa ratus ms–detik. Wajar
untuk staging. Production di VPS memakai database sendiri yang selalu menyala
(lihat `docs/DEPLOY-VPS.md`).

---

## 7. Aturan alat uji (`seed:perf` & `e2e:*`)

Script yang membuat/menghapus data uji dijaga `scripts/lib/guard.ts`:

| Kondisi                                     | Hasil                                         |
| ------------------------------------------- | --------------------------------------------- |
| `DATABASE_URL` ke `localhost` / `127.0.0.1` | jalan                                         |
| Database lain (mis. Neon staging)           | **ditolak**, kecuali `ALLOW_SEED_PERF=1`      |
| `NODE_ENV=production`                       | **selalu ditolak**                            |
| Host ada di `PROTECTED_DB_HOSTS`            | **selalu ditolak**, walau `ALLOW_SEED_PERF=1` |

Aturan:

1. `ALLOW_SEED_PERF=1` hanya ditulis **di terminal saat menjalankan**, untuk
   staging. Jangan simpan di `.env`, jangan di Vercel.
2. Setelah database production (VPS) ada, tambahkan host/IP-nya ke
   `PROTECTED_DB_HOSTS` di `.env` lokal.
3. Database staging (Neon) dan production (VPS) **selalu terpisah**.

---

## 8. Mengaktifkan subdomain nanti

Kode subdomain sudah ada (`src/middleware.ts`), aktif bila
`NEXT_PUBLIC_ROOT_DOMAIN` diisi.

1. **[ANDA]** Beli domain (mis. `undangku.id`).
2. **[ANDA]** Vercel → **Settings → Domains**: tambahkan `undangku.id`,
   `www.undangku.id`, dan **`*.undangku.id`**. Domain wildcard di Vercel
   **wajib memakai nameserver Vercel** — ubah nameserver di registrar sesuai
   petunjuk Vercel.
3. **[ANDA]** Ubah env lalu **Redeploy**:
   - `NEXT_PUBLIC_APP_URL=https://undangku.id`
   - `NEXT_PUBLIC_ROOT_DOMAIN=undangku.id`
4. **[ANDA]** Google OAuth: ganti origin & redirect URI ke `https://undangku.id`.
5. **[ANDA]** R2 CORS: tambahkan `https://undangku.id` ke `AllowedOrigins`.
6. **[OTOMATIS]** Link baru menjadi `https://{slug}.undangku.id/?to=Nama`; link
   lama `/u/{slug}` tetap berfungsi. `www`, `app`, `api`, dll. tidak pernah
   dianggap undangan (`src/lib/invitations/reserved.ts`).
7. Uji lokal: isi `NEXT_PUBLIC_ROOT_DOMAIN="localhost:3000"` di `.env`, buka
   `http://slug.localhost:3000` di Chrome.

---

## 9. Masalah umum

| Gejala                                         | Penyebab & solusi                                                                            |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Build gagal `Environment variable tidak valid` | Ada variabel wajib kosong (lihat bagian 3) → isi → Redeploy.                                 |
| Build gagal di `prisma migrate deploy`         | `DATABASE_URL_UNPOOLED` salah/pakai `-pooler`.                                               |
| `P1001 Can't reach database server`            | Neon bangun dari tidur → pastikan `&connect_timeout=15`.                                     |
| Login: `redirect_uri_mismatch`                 | Redirect URI di Google belum persis `https://…/api/auth/callback/google`.                    |
| Login: `UntrustedHost` (bukan di Vercel)       | Isi `AUTH_TRUST_HOST=true`.                                                                  |
| Upload foto gagal (error CORS di konsol)       | CORS R2 belum diisi / origin tidak persis sama (https, tanpa `/`).                           |
| Musik “Gagal”                                  | Lihat **Logs** fungsi `/api/media/[id]/process`; lihat bagian 2.                             |
| Cron 401 di log                                | `CRON_SECRET` berbeda/berisi spasi → perbaiki → Redeploy.                                    |
| TTFB > 600 ms                                  | Jalankan `pnpm deploy:check`: region bukan sin1 atau latensi database tinggi = salah region. |
