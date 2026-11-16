# TASKS — yukTakarin!

> Urutan kerja, berkas yang disentuh, pengujian, dan rencana commit.
> Rujukan: `SPEC.md` (perilaku), `UI-SPEC.md` (visual). **Tidak ada `git commit` yang dijalankan.**

## 1. Prinsip

- Vertikal per milestone: setiap tahap menghasilkan alur yang bisa diklik.
- Rumus dulu: `src/lib/kitchen.js` murni & teruji, baru dipasang ke island.
- Satu paket dependency per tahap, diverifikasi dari dokumentasi resmi/paket terpasang.
- Tanpa kredensial di kode; fallback seed wajib bekerja tanpa `.env`.
- Setiap tahap ditutup `npm run build` + `npx vitest run`.

## 2. Kondisi Awal

- Scaffold hanya berisi dokumen + `package.json` stub (`test` masih `echo`, selalu lulus).
- Tidak ada `src/`, tidak ada `.env`, tidak ada database.

## 3. Milestone

### M0 — Fondasi Astro + Svelte ✅
- [x] `astro@7`, `@astrojs/node@11`, `@astrojs/svelte@9`, `svelte@5`.
- [x] `astro.config.mjs`: `output: 'server'`, adapter Node `mode: 'standalone'`.
- [x] Script `dev`, `build`, `preview`, `test` (`vitest run`), `seed`.
- [x] `src/styles/global.css` berisi token `UI-SPEC.md`; `src/layouts/Base.astro`.
- [x] `.env.example`, `.gitignore` (`node_modules`, `dist`, `.env`, `test.db`).
- **File:** `package.json`, `astro.config.mjs`, `.env.example`, `.gitignore`, `src/styles/global.css`, `src/layouts/Base.astro`.

### M1 — Data: skema, seed, fallback ✅
- [x] `src/db/schema.js` — `products`, `ingredients`, `recipes` (Drizzle pg-core).
- [x] `src/db/index.js` — koneksi `neon-http` hanya bila `DATABASE_URL` ada.
- [x] `src/db/seed-data.js` — 8 menu kafe & 23 bahan (harga, densitas, substitusi).
- [x] `src/db/seed.js` — DDL `CREATE TABLE IF NOT EXISTS` + insert idempoten.
- [x] `src/lib/repo.js` — `daftarProduk`, `ambilProduk`, `buatProduk`, `ubahProduk`, `hapusProduk`; fallback store in-memory saat tanpa `DATABASE_URL`; mode `publik` membuang data modal.
- **File:** `src/db/*.js`, `src/lib/repo.js`.
- **Uji:** daftar 8 menu tanpa DB; payload publik tanpa `resep`/`hargaSatuan`.

### M2 — Logika dapur ✅
- [x] `src/lib/kitchen.js` — `konversiTakaran`, `bulatkanGram`, `skalaResep`, `hitungHpp`, `marginPersen`, `statusMargin`, `simulasiInflasi`, `saranPenyesuaian`, `susunTimeline`, `statusSegmen`, `validasiPesanan`, `formatRupiah`, `parseJam`, `formatMenit`.
- **File:** `src/lib/kitchen.js`, `tests/kitchen.test.js`.
- **Uji:** konversi sdm/shot/butir/secukupnya; scaling 3× dengan koreksi bumbu; pembulatan; HPP & inflasi; reverse timer; validasi.

### M3 — API ✅
- [x] `src/pages/api/products/index.js` (GET/POST), `[id].js` (GET/PUT/DELETE).
- [x] `src/lib/cloudinary.js` — signed upload SHA-1 + fallback.
- [x] `src/lib/placeholder.js` — SVG data-URI per kategori.
- [x] `src/pages/api/upload.js`.
- **File:** `src/pages/api/products/*`, `src/pages/api/upload.js`, `src/lib/cloudinary.js`, `src/lib/placeholder.js`.
- **Uji:** validasi 400 pada input kosong; upload tanpa env → `fallback: true` + data URI.

### M4 — Katalog pelanggan ✅
- [x] `src/pages/index.astro` (SSR, data publik).
- [x] `src/components/Catalog.svelte`: pencarian real-time, filter 4 kategori, urutan, stepper jumlah, mode ambil/kirim, tanggal, jam, validasi, tautan `wa.me`.
- **File:** `src/pages/index.astro`, `src/components/Catalog.svelte`.

### M5 — Dashboard dapur ✅
- [x] `src/pages/dapur.astro` (SSR, data penuh).
- [x] `Dashboard.svelte` (statistik, tab), `MenuManager.svelte` (CRUD + upload foto), `PilarGramasi.svelte`, `PilarInflasi.svelte`, `PilarTimeline.svelte`.
- **File:** `src/pages/dapur.astro`, `src/components/dapur/*.svelte`.

### M5b — Jembatan pesanan, stok, dan pilar end-to-end ✅
- [x] `orders` + `products.stok` di skema, DDL seed, dan fallback in-memory.
- [x] `GET/POST /api/orders`, `PATCH /api/orders/[id]` (status + potong stok), `POST /api/apply-inflation`.
- [x] Katalog: checkout mencatat pesanan lalu membuka `wa.me`; tombol "Sold Out" saat stok 0; jumlah dibatasi stok.
- [x] Dashboard tab **Antrean**: "Tarik ke Dapur" (mengisi Gramasi + Timeline) dan "Konfirmasi & Potong Stok".
- [x] Gramasi: satuan `jumput`, `lembar`, plus Daftar Belanja Pasar (g → kg).
- [x] Inflasi: "Terapkan Harga Baru ke Resep" memperbarui `ingredients.harga_satuan`.
- [x] Timeline: fase `PRAPROSES` (cold brew 720 menit / proofing 180 / setting 60) dan `PERACIKAN` 15 menit sebelum kirim.
- [x] MenuManager: baris resep dinamis + bahan baru (`namaBahan`, `satuanDasar`, `jumlahSatuan`, `hargaPerKg`, `substitusiSaran`) dan input stok.
- **Uji:** 39 kasus Vitest (termasuk stok, antrean, H-1, fase kafe).

### M5c — Login Pemilik Warung & resep detail ✅
- [x] `src/lib/auth.js`: kredensial dari env, token HMAC-SHA256, cookie `yt_sesi` HttpOnly 12 jam, fallback dev.
- [x] `src/middleware.js`: `/dapur` → redirect `/login`; API mutasi + `GET /api/orders` → 401. `POST /api/orders` tetap publik.
- [x] `src/pages/login.astro` + `LoginForm.svelte`, `src/pages/api/auth/login.js`, `src/pages/api/auth/logout.js`, tombol Logout di dashboard.
- [x] Guard `sesiDariRequest()` di handler products, upload, orders, apply-inflation (pertahanan berlapis).
- [x] Tabel baku `TABEL_KONVERSI` (shot 30 ml/18 g, sloki 45, jumput 2, sdt 5, sdm 15, genggam 35, butir 55, centong 100, lembar 75).
- [x] 8 menu seed dirinci 5–7 komponen + `takaranKiraKira`, `satuanDasar`, `jumlahSatuan`, `gramPerPorsi`, `hargaPerKg`, `substitusiSaran`, `instruksiDapur`; kolom `instruksi_dapur` & `takaran_kira_kira` masuk DDL/migrasi.
- [x] Gramasi & modal katalog: komposisi, total gram/ml per porsi, kebutuhan ter-skala (g→kg, ml→liter).
- [x] MenuManager: `gramPerPorsi` dan total resep dihitung otomatis dari jumlah × satuan.
- **Uji:** 48 kasus Vitest (tambah 401/200 sesi, logout, konversi detail, kelengkapan seed).

### M6 — Verifikasi & dokumentasi ✅ / sisa opsional
- [x] `npm install`, `npm run build`, `npx vitest run`.
- [x] `npm run seed` disiapkan untuk Neon (butuh `DATABASE_URL`).
- [ ] Opsional: jalankan `npm run seed` ke Neon nyata dan unggah 1 foto ke Cloudinary (butuh kredensial pengguna).
- [ ] Opsional: rate-limit login dan sesi persisten di Neon (lihat §5).

### M7 — Payment Gateway Integration ✅ / sisa opsional
- [x] Tabel `payments` di schema Drizzle & DDL idempoten di `seed.js`
- [x] Endpoint `POST /api/payments/init` & `GET /api/payments/status`
- [x] Integrasi Midtrans/Sandbox test credentials di `.env`
- [x] `POST /api/orders` menyimpan `payment_status` default `pending`
- [x] Validasi amount sesuai `totalHarga` order di server
- [ ] Opsional: Webhook handler Midtrans untuk otomatis update status
- [ ] Opsional: Refund & Cancel payment

### M8 — Dokumentasi & Deploy ✅ / sisa opsional
- [x] `README.md` singkat: cara integrasi payment gateway, env vars yang dibutuhkan
- [x] `SPEC.md` updated: AC-30 s.d. AC-35 tentang payment (diuji)
- [x] Semua test `npm run build` + `npx vitest run` lulus
- [ ] Opsional: Deploy ke production dengan kredensial gateway aktual
- [ ] Opsional: Otomatis update status order via webhook

## 4. Rencana Pengujian

| Lapis | Alat | Cakupan | Status |
| --- | --- | --- | --- |
| Unit rumus | Vitest (`tests/kitchen.test.js`) | konversi baku Coffee & Kue (shot/sloki/jumput/sdt/sdm/genggam/butir/centong/lembar), gram/ml per porsi, scaling, HPP/inflasi, timer + H-1 + fase kafe, validasi | ✅ |
| Integrasi data | Vitest | fallback 8 menu, kelengkapan 5–7 komponen, payload publik tanpa data modal, antrean, potong stok, inflasi | ✅ |
| Sesi | Vitest | 401 tanpa login, 401 password salah, 200 + cookie HttpOnly setelah login, 200 data dapur dengan cookie, logout `Max-Age=0` | ✅ |
| Build/SSR | `astro build` | semua halaman & API terkompilasi, island ter-resolve | ✅ |
| Manual | browser | cari/filter/checkout, CRUD, 3 pilar di 375px | dilakukan setelah build |
| Neon nyata | `npm run seed` | DDL + seed idempoten | butuh kredensial |
| Cloudinary nyata | `POST /api/upload` | signed upload | butuh kredensial |

Konvensi: `tests/*.test.js`, tanpa skip, tanpa DB nyata. DB memori di-reset per import modul.

## 5. Risiko Terbuka

1. **Login belum punya rate-limit/2FA.** Sesi ditandatangani HMAC dan cookie HttpOnly, tetapi percobaan password berulang belum dibatasi. Isi `OWNER_PASSWORD` dan `SESSION_SECRET` kuat sebelum deploy; fallback dev otomatis mati saat `OWNER_PASSWORD` diisi.
2. **Fallback in-memory tidak persisten**—mutasi hilang saat server restart. Hanya untuk demo/uji.
3. **Harga bahan seed adalah estimasi**, bukan data pasar. Radar inflasi adalah simulasi; "Terapkan Harga Baru ke Resep" hanya mengubah harga bahan yang dipilih, bukan seluruh pasar.
4. **Stok hanya berkurang lewat tombol konfirmasi**; pesanan yang tidak dikonfirmasi tidak memotong stok, dan belum ada pembatalan/pengembalian stok.
5. **Cloudinary tanpa kredensial** hanya memberi placeholder; foto asli tidak tersimpan.

## 6. Definition of Done

- [x] `npm run build` lulus tanpa error.
- [x] `npx vitest run` lulus semua test.
- [x] Tidak ada `DATABASE_URL`/`CLOUDINARY_*` hardcoded.
- [x] `.env.example` lengkap dan `.env` di-ignore.
- [x] 8 menu seed tampil tanpa `.env`.
- [x] Semua warna dari token `UI-SPEC.md`.
- [x] Alur katalog → antrean → potong stok → tiga pilar menyatu tanpa ketik ulang.
- [x] Autentikasi dashboard (sesi cookie HttpOnly) dan API mutasi 401 tanpa login.
- [x] Detail resep 5–7 komponen per menu dengan konversi gramasi baku.

## 7. Rencana Pesan Commit

Format Conventional Commits, belum dieksekusi.

| # | Isi | Pesan |
| --- | --- | --- |
| 1 | `SPEC.md`, `UI-SPEC.md`, `TASKS.md` | `docs: sesuaikan rencana yukTakarin! ke Astro, Neon, dan Cloudinary` |
| 2 | `package.json`, config, `.env.example`, `.gitignore` | `chore(setup): scaffold Astro SSR dengan Svelte dan Vitest` |
| 3 | `src/styles`, `src/layouts` | `feat(ui): terapkan token Soft Neo-Brutalism dan layout dasar` |
| 4 | `src/db/*`, `src/lib/repo.js` | `feat(data): skema Drizzle, seed 8 menu kafe, dan fallback in-memory` |
| 5 | `src/lib/kitchen.js`, `tests/kitchen.test.js` | `feat(kitchen): konversi takaran, auto-scaling, HPP inflasi, dan reverse timer` |
| 6 | `src/pages/api/*`, `src/lib/cloudinary.js`, `src/lib/placeholder.js` | `feat(api): CRUD menu Neon dan unggah foto Cloudinary dengan fallback SVG` |
| 7 | `src/pages/index.astro`, `src/components/Catalog.svelte` | `feat(katalog): katalog 8 menu dengan pencarian, filter, dan checkout WhatsApp` |
| 8 | `src/pages/dapur.astro`, `src/components/dapur/*` | `feat(dapur): dashboard CRUD dan tiga pilar dapur presisi` |
| 9 | `src/db/schema.js`, `src/lib/repo.js`, `src/pages/api/orders/*`, `src/pages/api/apply-inflation.js`, `src/components/*` | `feat(orders): antrean pesanan, potong stok, dan integrasi satu klik ke tiga pilar` |
| 10 | `README.md` | `docs: cara menjalankan, mengisi env, dan seed Neon` |

Aturan: satu milestone satu commit; jangan sertakan `.env`, `node_modules`, `dist`, atau perubahan `CATATAN.md`.
