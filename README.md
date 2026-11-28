# undanganonline.id

Platform undangan digital (pernikahan & ulang tahun): landing + galeri tema, pemesanan
lewat website (bayar Midtrans) atau marketplace (link khusus dari admin), form bertahap
untuk pembeli, dashboard pembeli (tamu, kirim WhatsApp, ucapan & RSVP), dan panel admin
(ringkasan bisnis, link khusus, pesanan, pengguna, sistem & log).

Stack: Next.js 15 (App Router) · Prisma + PostgreSQL · Auth.js · shadcn/ui · Tailwind v4.

- Deploy staging (Vercel + Neon + R2) secara rinci: [`docs/DEPLOY.md`](docs/DEPLOY.md)
- Panduan menghubungkan layanan pihak ketiga: [bagian di bawah](#menghubungkan-layanan-pihak-ketiga)

---

## Menjalankan di komputer sendiri

Butuh: Node.js 20, pnpm, Docker Desktop (untuk database lokal).

```bash
pnpm install
cp .env.example .env          # lalu isi nilainya (lihat panduan di bawah)
pnpm db:up                    # PostgreSQL lokal (docker compose)
pnpm db:migrate               # buat tabel
pnpm dev                      # http://localhost:3001
```

Buat akun **superadmin** pertama (login email + kata sandi di `/masuk`):

```bash
pnpm admin:create email-anda@contoh.com --name="Nama Anda"
# kata sandi acak ditampilkan SEKALI — simpan.
# Ganti kata sandi: pnpm admin:create email-anda@contoh.com --password="minimal-12-karakter"
```

Tanpa layanan pihak ketiga apa pun, aplikasi tetap bisa dicoba: email disembunyikan
(admin kirim lewat WhatsApp), pembayaran memakai tombol **Simulasi bayar** (hanya
development), foto disimpan di folder lokal `.uploads/`.

---

## Menghubungkan layanan pihak ketiga

Semua kunci diisi di file **`.env`** (lokal) atau **Environment Variables** di hosting
(mis. Vercel → Project → Settings → Environment Variables). **Jangan pernah commit `.env`.**
Setelah mengubah `.env` di lokal, **restart** `pnpm dev`.

Cek hasilnya kapan saja di panel admin: **`/dashboard/sistem`** → kartu *Konfigurasi*
(hijau = aktif).

| Layanan | Untuk apa | Wajib? | Variabel |
|---|---|---|---|
| [Kunci aplikasi](#1-kunci-aplikasi--alamat-situs) | sesi login & URL situs | **Wajib** | `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BRAND_NAME` |
| [PostgreSQL / Neon](#2-database-postgresql--neon) | database | **Wajib** | `DATABASE_URL`, `DATABASE_URL_UNPOOLED` |
| [Google OAuth](#3-google-login-admin) | login admin dengan Google | Opsional | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ADMIN_EMAILS` |
| [Email SMTP](#4-email-smtp) | kirim link khusus, data login, laporan harian | Disarankan | `SMTP_*` |
| [Midtrans](#5-pembayaran-midtrans) | pembayaran pesanan website | Wajib untuk jualan online | `MIDTRANS_*` |
| [Cloudflare R2](#6-penyimpanan-foto--musik-cloudflare-r2) | foto & musik undangan | **Wajib di production** | `STORAGE_DRIVER`, `R2_*` |
| [Cron](#7-tugas-terjadwal-cron) | bersih-bersih & email harian | **Wajib di production** | `CRON_SECRET` |
| [WhatsApp](#8-nomor-whatsapp-admin) | tombol "Chat WhatsApp" | Opsional | `src/config/business.ts` |

### 1. Kunci aplikasi & alamat situs

```env
NEXT_PUBLIC_BRAND_NAME="undanganonline.id"
NEXT_PUBLIC_APP_URL="https://undanganonline.id"   # lokal: http://localhost:3001
AUTH_SECRET="..."                                  # buat: npx auth secret
```

- `AUTH_SECRET`: jalankan `npx auth secret` (atau `openssl rand -base64 32`). **Jangan
  diganti** setelah live — semua sesi login & link pembeli yang sedang dibuka akan keluar.
- `NEXT_PUBLIC_APP_URL`: alamat utama **tanpa** `/` di akhir. Dipakai di link khusus,
  email, dan alamat undangan (`domain/{nama}`).
- Server sendiri / `pnpm start` di belakang proxy (bukan Vercel): tambahkan
  `AUTH_TRUST_HOST=true`.

### 2. Database (PostgreSQL / Neon)

- **Lokal:** `pnpm db:up` sudah menyediakan PostgreSQL; biarkan `DATABASE_URL` bawaan.
- **Production (Neon, region Singapura):**
  1. Buat project di [neon.tech](https://neon.tech) → region **AWS Singapore**.
  2. *Connection Details* → salin string **Pooled** → `DATABASE_URL`
     (tambahkan `&connect_timeout=15` di akhir).
  3. Salin string **Direct** (tanpa `-pooler`) → `DATABASE_URL_UNPOOLED` (dipakai migrasi).
  4. Isi `PROTECTED_DB_HOSTS` dengan host production agar alat uji tidak pernah menyentuhnya.

Rinci: [`docs/DEPLOY.md` §4.1](docs/DEPLOY.md).

### 3. Google login (admin)

Admin bisa masuk dengan email + kata sandi (`pnpm admin:create`) **atau** dengan Google.
Untuk Google:

1. [Google Cloud Console](https://console.cloud.google.com/) → buat project →
   **APIs & Services → OAuth consent screen** → External → isi nama aplikasi & email.
2. **Credentials → Create credentials → OAuth client ID** → *Web application*.
3. **Authorized redirect URIs** — tambahkan SEMUA alamat yang dipakai:
   - `http://localhost:3001/api/auth/callback/google`
   - `https://undanganonline.id/api/auth/callback/google`
4. Salin **Client ID** → `AUTH_GOOGLE_ID`, **Client secret** → `AUTH_GOOGLE_SECRET`.
5. Isi email yang boleh masuk sebagai admin lewat Google:

```env
ADMIN_EMAILS="anda@gmail.com,rekan@gmail.com"
```

> Pembeli **tidak** login dengan Google — mereka masuk lewat link khusus atau email +
> kata sandi yang dibuat admin.

### 4. Email (SMTP)

Dipakai untuk: link khusus ke pembeli (website & marketplace), data login pembeli,
notifikasi pesanan lunas & **ringkasan harian** ke admin. Kosong = tombol email
disembunyikan (admin kirim lewat WhatsApp).

```env
SMTP_HOST=smtp.contoh.com
SMTP_PORT=465            # 465 = SSL, 587 = STARTTLS
SMTP_USER=halo@undanganonline.id
SMTP_PASS=kata-sandi-atau-app-password
SMTP_FROM="undanganonline.id <halo@undanganonline.id>"
```

Contoh penyedia:

| Penyedia | `SMTP_HOST` | Port | Catatan |
|---|---|---|---|
| Email hosting domain (Hostinger, Niagahoster, cPanel, Zoho) | dari panel hosting, mis. `smtp.hostinger.com` / `smtp.zoho.com` | 465 | **Disarankan** — alamat pengirim memakai domain sendiri |
| Gmail / Google Workspace | `smtp.gmail.com` | 465 | Aktifkan *2-Step Verification*, lalu buat **App Password** (myaccount.google.com → Security → App passwords) untuk `SMTP_PASS`. Batas ±500 email/hari |
| Brevo (Sendinblue) | `smtp-relay.brevo.com` | 587 | Kuota gratis harian; `SMTP_USER`/`SMTP_PASS` dari menu *SMTP & API* |

Agar email tidak masuk spam saat memakai domain sendiri: tambahkan record **SPF** dan
**DKIM** dari penyedia email di DNS domain.

**Uji:** buka `/dashboard/link-khusus` → buat link → di dialog pesan, isi email Anda →
**Kirim email**.

### 5. Pembayaran (Midtrans)

Pesanan website dibayar lewat halaman Snap Midtrans (QRIS, transfer bank/VA, e-wallet).
Kosong = tombol bayar menampilkan "pembayaran online belum aktif" (di development muncul
tombol **Simulasi bayar**).

1. Daftar di [dashboard.midtrans.com](https://dashboard.midtrans.com) dan mulai di mode
   **Sandbox** (pojok kiri atas).
2. **Settings → Access Keys** → salin **Server Key**.

   ```env
   MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxxxxx"   # sandbox diawali SB-
   MIDTRANS_IS_PRODUCTION=false
   ```

3. **Settings → Configuration → Payment Notification URL**:

   ```
   https://undanganonline.id/api/midtrans/notification
   ```

   Tanpa ini pesanan tetap ditandai lunas saat pembeli kembali ke halaman hasil, tetapi
   pesanan yang pembelinya menutup browser baru diproses lewat tombol *Cek status
   Midtrans* di `/dashboard/pesanan`. Jadi URL notifikasi **wajib** diisi di production.
4. *Finish Redirect URL* tidak perlu diisi — aplikasi mengirimnya sendiri
   (`/pesan/selesai`).
5. **Uji di sandbox:** pesan tema di `/tema` → bayar → pilih QRIS/VA → selesaikan
   pembayaran di [simulator.sandbox.midtrans.com](https://simulator.sandbox.midtrans.com)
   → kembali ke situs → link khusus muncul + email terkirim.
6. **Go live:** setelah akun Midtrans disetujui untuk production, ganti ke Server Key
   production (tanpa `SB-`) dan `MIDTRANS_IS_PRODUCTION=true`, lalu isi ulang
   *Payment Notification URL* di dashboard **production**.

> Webhook tidak bisa menjangkau `localhost`. Untuk menguji notifikasi dari komputer
> sendiri, buka tunnel (mis. `cloudflared tunnel --url http://localhost:3001`) dan
> pakai URL tunnel tersebut sebagai Notification URL sandbox.

### 6. Penyimpanan foto & musik (Cloudflare R2)

Lokal memakai folder `.uploads/` (`STORAGE_DRIVER="local"`). **Di production wajib R2**
(rute upload lokal otomatis mati).

1. Cloudflare Dashboard → **R2** → *Create bucket* (lokasi **Asia-Pacific**).
2. **R2 → Manage R2 API Tokens → Create API token** → izin *Object Read & Write*
   untuk bucket tersebut → salin *Access Key ID* & *Secret Access Key*.
3. Buka akses publik: bucket → **Settings → Custom Domains** (mis. `media.undanganonline.id`)
   atau aktifkan *r2.dev subdomain*.
4. **CORS** bucket (Settings → CORS policy):

   ```json
   [{"AllowedOrigins":["https://undanganonline.id"],"AllowedMethods":["GET","PUT"],
     "AllowedHeaders":["Content-Type"],"MaxAgeSeconds":3600}]
   ```

5. Isi env:

   ```env
   STORAGE_DRIVER="r2"
   R2_ACCOUNT_ID="..."          # di halaman R2, kanan atas
   R2_ACCESS_KEY_ID="..."
   R2_SECRET_ACCESS_KEY="..."
   R2_BUCKET="undangan-media"
   R2_PUBLIC_URL="https://media.undanganonline.id"   # tanpa "/" di akhir
   ```

Rinci: [`docs/DEPLOY.md` §4.2](docs/DEPLOY.md).

### 7. Tugas terjadwal (cron)

| Rute | Jadwal (WIB) | Tugas |
|---|---|---|
| `/api/cron/media-cleanup` | 02.00 | hapus file foto/musik yang tidak terpakai |
| `/api/cron/claims-cleanup` | 02.30 | hapus link khusus kedaluwarsa & pesanan tidak dibayar |
| `/api/cron/daily-report` | 07.00 | email ringkasan kemarin ke admin |

1. Buat rahasia (min. 16 karakter huruf & angka): `openssl rand -hex 24` →
   `CRON_SECRET`.
2. **Vercel:** jadwal sudah ada di `vercel.json` — cukup isi `CRON_SECRET`, Vercel
   mengirimnya otomatis.
3. **Server sendiri (VPS):** tambahkan ke `crontab -e` (jam server UTC):

   ```cron
   0 19 * * *  curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://undanganonline.id/api/cron/media-cleanup
   30 19 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://undanganonline.id/api/cron/claims-cleanup
   0 0 * * *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://undanganonline.id/api/cron/daily-report
   ```

Cek di `/dashboard/sistem` → *Tugas terjadwal* (menampilkan kapan terakhir berjalan).

### 8. Nomor WhatsApp admin

Bukan variabel env — ubah di [`src/config/business.ts`](src/config/business.ts):

```ts
whatsapp: "628xxxxxxxxxx",        // format internasional tanpa "+"; null = disembunyikan
email: null,                      // mis. "halo@undanganonline.id"
instagram: null,                  // nama akun tanpa "@"
```

Dipakai untuk tombol *Chat WhatsApp* di footer, ajakan penutup, dan strip jaminan.

---

## Daftar periksa sebelum live

- [ ] `AUTH_SECRET` dibuat sekali & disimpan aman
- [ ] `NEXT_PUBLIC_APP_URL` = domain production (https)
- [ ] Database Neon + `PROTECTED_DB_HOSTS`
- [ ] `STORAGE_DRIVER="r2"` + CORS bucket
- [ ] SMTP terisi & email uji diterima (cek folder spam, pasang SPF/DKIM)
- [ ] Midtrans production + *Payment Notification URL*
- [ ] `CRON_SECRET` & ketiga cron berjalan (lihat `/dashboard/sistem`)
- [ ] Akun superadmin dibuat (`ALLOW_ADMIN_CREATE=1 pnpm admin:create …` saat ke
      database production)
- [ ] Redirect URI Google untuk domain production (bila memakai login Google)
- [ ] Semua kartu di `/dashboard/sistem → Konfigurasi` hijau

## Perintah yang sering dipakai

| Perintah | Fungsi |
|---|---|
| `pnpm dev` | server development (port 3001) |
| `pnpm build && pnpm start` | build & jalankan production lokal |
| `pnpm db:migrate` / `pnpm db:studio` | migrasi / lihat isi database |
| `pnpm admin:create <email>` | buat / atur ulang superadmin |
| `pnpm themes:thumbs` | rekam ulang sampul tema |
| `pnpm landing:record` / `pnpm landing:story` | rekam ulang video hero & layar "HP bercerita" |
| `pnpm e2e:claim-flow`, `e2e:web-order`, `e2e:admin`, `e2e:landing` | uji alur utama (butuh `pnpm dev`, database lokal) |
