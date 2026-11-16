# SPEC — yukTakarin!

> **Spesifikasi Produk & Teknis.** Menjawab *apa* yang dibangun dan *bagaimana* ia bekerja.
> Tampilan: `UI-SPEC.md`. Urutan kerja & commit: `TASKS.md`. Konteks latihan: `CATATAN.md` (tidak diubah).
> Versi 2.0 — 16 November 2026 · Tema: **UMKM Coffee & Kue**.

## 1. Ringkasan

**yukTakarin!** adalah platform dua sisi untuk UMKM coffee shop & kue rumahan.

| Sisi | Pengguna | Rute | Inti |
| --- | --- | --- | --- |
| **Katalog** | Pelanggan | `/` (publik) | 8 menu, cari/filter/urut, pilih jumlah & jam ambil/kirim, checkout WhatsApp |
| **Dapur** | Pemilik warung | `/dapur` | Statistik, CRUD menu + foto, tiga pilar presisi dapur |

Nilai produk ada di tiga pilar dapur, bukan di katalog: `YT-K1` takaran pasti & auto-scaling, `YT-K2` kendali HPP saat harga bahan naik, `YT-K3` jadwal kerja mundur dari jam pelanggan.

## 2. Persona

**Pemilik (Ibu/Raka, 28–45).** Menerima pesanan coffee break 50–200 box. Resep di kepala, satuan "secukupnya". Takut rugi saat harga butter/biji kopi naik, takut telat karena prep dan panggang tumpang tindih. Bekerja dari HP di dapur, tangan basah.

**Pelanggan.** Panitia acara/kantor. Butuh kepastian menu, harga per cup/box, dan jam tiba. Tidak boleh melihat HPP atau margin.

## 3. Stack & Keputusan

| # | Keputusan | Alasan |
| --- | --- | --- |
| D1 | **Astro 7, `output: 'server'`**, adapter Node standalone | Halaman publik & dashboard dirender server; rahasia DB tidak pernah ke browser |
| D2 | **Svelte 5 islands** (`client:load`) | Interaktivitas (cari, kalkulator, CRUD) tanpa mengirim seluruh halaman sebagai JS |
| D3 | **Neon PostgreSQL** via `@neondatabase/serverless` + **Drizzle ORM** (`drizzle-orm/neon-http`) | Driver HTTP cocok untuk serverless/SSR, query bertipe |
| D4 | **Cloudinary** upload bertanda tangan (`crypto` SHA-1, tanpa SDK) | Satu dependency lebih sedikit; signature terdokumentasi |
| D5 | **Fallback seed in-memory** saat `DATABASE_URL` kosong | Proyek dapat diuji lokal & CI tanpa kredensial; tidak ada kredensial di kode |
| D6 | **CSS token murni** (tanpa framework CSS) | Palet Soft Neo-Brutalism dipakai konsisten, bundel kecil |
| D7 | **Logika dapur = fungsi murni** di `src/lib/kitchen.js` | Diuji Vitest tanpa DB/UI; dipakai bersama server & island |
| D8 | Pembayaran **tidak diproses aplikasi**; checkout menuju WhatsApp | Tidak ada rahasia gateway di repo; pemilik konfirmasi manual |

## 4. Arsitektur

```
src/
├── pages/
│   ├── index.astro ............... katalog publik (SSR, data tanpa HPP)
│   ├── login.astro ............... halaman masuk Pemilik Warung
│   ├── dapur.astro ............... dashboard (SSR, data penuh, wajib sesi)
│   └── api/
│       ├── auth/login.js ......... verifikasi kredensial + set cookie sesi
│       ├── auth/logout.js ........ hapus cookie sesi
│       ├── products/index.js ..... GET daftar, POST buat (wajib sesi)
│       ├── products/[id].js ...... GET, PUT, DELETE (mutasi wajib sesi)
│       └── upload.js ............. unggah foto ke Cloudinary (wajib sesi)
├── middleware.js ................. penjaga /dapur + endpoint mutasi
├── components/
│   ├── Catalog.svelte ............ island katalog + modal rincian + checkout WhatsApp
│   ├── LoginForm.svelte .......... form masuk Pemilik Warung
│   └── dapur/ .................... Dashboard, MenuManager, 3 pilar
├── lib/
│   ├── kitchen.js ................ rumus murni (konversi, scaling, HPP, timer, validasi)
│   ├── auth.js ................... tanda tangan sesi HMAC + kredensial env
│   ├── repo.js ................... akses data: Neon bila ada, seed bila tidak
│   ├── cloudinary.js ............. signed upload + fallback placeholder
│   └── placeholder.js ............ SVG data-URI per menu
├── db/
│   ├── schema.js ................. products, ingredients, recipes (Drizzle pg-core)
│   ├── index.js .................. koneksi neon-http (null bila tanpa env)
│   ├── seed-data.js .............. 8 menu + 23 bahan
│   └── seed.js ................... DDL + insert idempoten (`npm run seed`)
└── styles/global.css ............. token UI-SPEC
```

Batas kebocoran data: `daftarProduk({ publik: true })` **membuang** `resep`, `hargaSatuan`, `isiPerSatuan`, `biayaKemasan`, dan `instruksiDapur`. Katalog hanya menerima `komposisi` (nama, takaran, gram/ml per porsi) tanpa harga. Hanya dashboard memakai data penuh.

## 5. Skema Data

```
products     id serial PK, slug text UNIQUE, nama, deskripsi, kategori,
             harga integer (Rp per satuan), satuan text, min_order integer,
             porsi_dasar integer, prep_menit, proses_label, proses_menit,
             packing_menit, biaya_kemasan integer, stok integer, instruksi_dapur text,
             image_url, aktif boolean, dibuat_pada timestamptz
ingredients  id serial PK, slug UNIQUE, nama, satuan_beli, isi_per_satuan integer,
             harga_satuan integer, kategori text, substitusi text
recipes      id serial PK, product_id FK→products (cascade), ingredient_id FK→ingredients,
             jumlah numeric, satuan text, urutan integer, takaran_kira_kira text
orders       id serial PK, product_id FK→products (set null), nama_menu text,
             jumlah_porsi integer, jam_kirim text, tanggal_kirim text, mode text,
             total_harga integer, catatan text, nama_pemesan text,
             status text ('Menunggu'|'Diproses'|'Selesai'), dibuat_pada timestamptz
```

`recipes.jumlah` adalah takaran untuk `products.porsi_dasar`, bukan satu porsi—titik salah hitung yang paling sering terjadi. `harga` disimpan sebagai integer rupiah (tanpa desimal).

## 6. Data Seed (8 Menu)

| Menu | Kategori | Satuan | Harga | Porsi dasar |
| --- | --- | --- | --- | --- |
| Kopi Susu Gula Aren Literan | Kopi & Minuman | liter | 85.000 | 5 cup |
| Es Kopi Pandan | Kopi & Minuman | cup | 22.000 | 10 cup |
| Croissant Butter | Pastry & Roti | pcs | 18.000 | 12 pcs |
| Cinnamon Roll | Pastry & Roti | pcs | 20.000 | 12 pcs |
| Brownies Fudgy Panggang | Kue Panggang | potong | 25.000 | 16 potong |
| Bolu Tape Keju | Kue Panggang | potong | 22.000 | 12 potong |
| Paket Coffee Break Box | Paket Snack Box | box | 48.000 | 10 box |
| Matcha Latte Botolan | Kopi & Minuman | botol | 28.000 | 6 botol |

Bahan utama yang dipantau inflasinya: biji kopi, butter, susu UHT, gula aren, telur. Harga bahan disimpan per satuan beli (kg/liter/butir/pcs) beserta `isi_per_satuan` agar konversi ke rupiah/gram dapat diuji.

Setiap menu memiliki **5–7 komponen bahan** (Kopi Susu Gula Aren Literan: biji kopi espresso, air ekstraksi, susu UHT, gula aren cair, krimer kental manis, es batu). Tiap baris membawa `takaranKiraKira`, `satuanDasar`, `jumlahSatuan`, `gramPerPorsi`, `hargaPerKg`, `substitusiSaran`, dan menu membawa `instruksiDapur` (langkah seduh/panggang singkat).

## 7. Pilar 1 — `YT-K1` Konverter "Ilmu Kira-Kira" → Gramasi + Auto-Scaling

```
gram = jumlah × faktorSatuan × densitas(bahan)
```

| Satuan rumah | Basis baku Coffee & Kue |
| --- | --- |
| `1 shot` espresso | 30 ml, setara **18 g biji kopi giling** |
| `1 sloki` / jigger | 45 ml |
| `1 jumput` | 2 g |
| `1 sdt` | 5 g / 5 ml |
| `1 sdm` | 15 g / 15 ml |
| `1 genggam` | 35 g |
| `1 butir` telur | 55 g |
| `1 centong` | 100 g |
| `1 lembar` puff pastry | 75 g |
| `gelas` | 240 ml |
| `ruas` | 4 g |
| `sejumput` | 1 g |
| `secukupnya` | **tidak dikonversi** |

Nilai yang sama diekspor sebagai `TABEL_KONVERSI` sehingga UI dan test memakai satu sumber. Bahan ber-`gramPerSatuan` (biji kopi 18 g) menimpa angka shot; cairan memakai densitas.

Densitas per bahan (contoh: kopi bubuk 0,35 g/ml; susu 1,03; butter 0,96; tepung 0,53; matcha 0,4; gula 0,85). "Secukupnya" disimpan sebagai catatan dan tidak pernah dikarang angkanya.

**Scaling:**

```
faktor  = porsiPesanan / porsiDasar
pengali = faktor^0,9   untuk bahan kategori pemanis / asin / ekstrak (bumbu keras)
pengali = faktor        untuk bahan utama & pelengkap
gramasi = bulatkan(gramasiDasar × pengali)
```

Pembulatan timbangan: `≥100 g` kelipatan 5 g; `10–99 g` kelipatan 1 g; `<10 g` kelipatan 0,5 g; minimum 0,5 g. Bahan yang naik >300% diberi peringatan kapasitas alat. `0,9` adalah parameter kalibrasi (`BUMBU_EXPONENT`), bukan kebenaran ilmiah.

**Daftar belanja pasar terpadu:** setiap baris hasil dijumlahkan dan beratnya diringkas otomatis (`<1000 g` → gram, `≥1000 g` → kg dengan dua desimal). Cairan memakai ml/liter. Baris "secukupnya" tetap tanpa angka.

**Rincian per porsi:** setiap baris hasil auto-scaling membawa `gramPerPorsi` / `mlPerPorsi` dan kebutuhan ter-skala; total `gramPerPorsi` + `mlPerPorsi` ditampilkan di dashboard dan modal katalog. Komposisi publik hanya memuat nama bahan, takaran, dan gram/ml — tanpa harga.

## 8. Pilar 2 — `YT-K2` Radar Inflasi & Penyesuaian Resep

```
hargaPerGram = hargaSatuan / isiPerSatuan
hppPerPorsi  = Σ(gramasiDasar × hargaPerGram) / porsiDasar + biayaKemasan + biayaOperasional
margin       = (hargaJual − hppPerPorsi) / hargaJual × 100
```

| Status | Kondisi |
| --- | --- |
| **Aman** | margin ≥ 40% dan tak ada bahan naik > 10% |
| **Waspada** | 30% ≤ margin < 40% atau ada bahan naik 10–20% |
| **Kritis** | margin < 30% atau ada bahan naik > 20% |

Simulasi: pilih bahan + persentase kenaikan (0–100%), sistem menghitung ulang HPP, margin, status, dan saran deterministik: (1) substitusi dari peta `substitusi` bahan, (2) penyesuaian takaran ±10–15% pada bahan non-linear, (3) harga jual baru untuk mencapai margin target 40%, dibulatkan ke ribuan. Saran **tidak** mengubah resep otomatis; perubahan harga bahan hanya terjadi bila pemilik menekan **"Terapkan Harga Baru ke Resep"** (`POST /api/apply-inflation`).

## 9. Pilar 3 — `YT-K3` Timeline Seduh/Panggang Mundur

```
tiba           = jamKirim
berangkat      = tiba − tempuh
selesaiPacking = berangkat − buffer
mulaiPacking   = selesaiPacking − packing
mulaiProses    = mulaiPacking − proses   (seduh / panggang)
mulaiPersiapan = mulaiProses − prep      (timbang, adonan, bumbu)
```

Segmen urut naik: `PRAPROSES?` → `PERSIAPAN` → `PROSES` → `PACKING` → `PERACIKAN?` → `KIRIM`. Waktu tempuh (default 20 menit) dan buffer (10 menit) adalah input pemilik. Segmen yang melewati tenggat ditandai `TERLAMBAT`; status `WASPADA` saat sisa ≤ 25% durasi segmen. Semua label disertai teks, bukan hanya warna.

**Fase khusus coffee & kue** (`faseKhususKafe`):

| Kategori | Pra-proses | Peracikan akhir |
| --- | --- | --- |
| Kopi & Minuman (cold brew/drip/fermentasi) | 720 menit sebelum persiapan | 15 menit sebelum kirim (es tidak mencair) |
| Kopi & Minuman (lain) | — | 15 menit sebelum kirim |
| Pastry & Roti | 180 menit proofing/marinasi adonan | — |
| Kue Panggang / Snack Box | 60 menit pendinginan/setting | — |

Persiapan yang jatuh sebelum pukul 00.00 diberi label `(H-1)` dan jamnya dibungkus 24 jam (`formatMenit`).

## 10. API

| Method | Rute | Perilaku |
| --- | --- | --- |
| GET | `/api/products` | Daftar menu. `?publik=1` membuang data modal/HPP |
| POST | `/api/products` | Buat menu + baris resep; validasi wajib nama, kategori, harga > 0, porsiDasar > 0 |
| GET | `/api/products/[id]` | Detail satu menu (penuh) |
| PUT | `/api/products/[id]` | Ubah menu; baris resep diganti seluruhnya |
| DELETE | `/api/products/[id]` | Hapus menu (resep ikut terhapus via cascade) |
| POST | `/api/upload` | `multipart/form-data` field `file`; butuh `CLOUDINARY_*`; fallback SVG lokal |
| GET | `/api/orders` | Antrean pesanan; `?hariIni=1` hanya pesanan yang dibuat hari ini |
| POST | `/api/orders` | Catat pesanan dari katalog (`productId`, `namaMenu`, `jumlahPorsi`, `jamKirim`, `totalHarga`, `catatan`); status awal `Menunggu` |
| PATCH | `/api/orders/[id]` | Ubah status (`Menunggu`/`Diproses`/`Selesai`); `potongStok: true` sekaligus mengurangi `products.stok` |
| POST | `/api/apply-inflation` | Naikkan `ingredients.harga_satuan` sesuai `slugBahan` + `persen` |
| POST | `/api/auth/login` | Terima JSON atau form `username` + `password`; cocok → cookie `yt_sesi` HttpOnly 12 jam; salah → 401 |
| POST | `/api/auth/logout` | Hapus cookie `yt_sesi` (`Max-Age=0`) |

Semua respons JSON `{ data }` atau `{ error }` dengan status HTTP yang benar (400 validasi, 401 belum login, 404 tidak ada, 500 galat server). Endpoint mutasi dan `GET /api/orders` mengembalikan **401** tanpa sesi; `POST /api/orders` tetap publik untuk checkout pelanggan.

## 10b. Akses Pemilik Warung

- `/` dan `POST /api/orders` **publik**: pelanggan melihat katalog dan checkout tanpa login.
- `/dapur`, `GET /api/orders`, `POST/PUT/DELETE /api/products/*`, `PATCH /api/orders/*`, `/api/upload`, dan `/api/apply-inflation` **wajib sesi**. Tanpa sesi: `/dapur` → redirect `/login?arah=/dapur`, API → `401` (dijaga `src/middleware.js` dan guard di handler).
- Kredensial dari `OWNER_USERNAME`, `OWNER_PASSWORD`, `SESSION_SECRET`; fallback lokal (`pemilik` / `dapur-lokal`) hanya saat `OWNER_PASSWORD` kosong dan ditandai banner “Mode dev” di halaman login.
- Cookie `yt_sesi`: payload `{u, exp}` + HMAC-SHA256, `HttpOnly`, `SameSite=Lax`, umur 12 jam. Tidak ada token di localStorage.

## 11. Keamanan Kredensial & Mitigasi Halusinasi

- **Tidak ada kredensial di kode.** `DATABASE_URL`, `CLOUDINARY_*`, `OWNER_*`, `SESSION_SECRET`, `PUBLIC_WA_NUMBER` dibaca dari `import.meta.env` (Astro) / `process.env` (skrip seed). `.env` masuk `.gitignore`; hanya `.env.example` yang di-commit dengan nilai contoh non-rahasia.
- **Tanpa `DATABASE_URL`:** aplikasi memakai seed in-memory dan menandainya di UI ("mode seed"), tidak pernah mencoba koneksi dengan URL palsu.
- **Upload tanpa Cloudinary:** mengembalikan placeholder SVG + `fallback: true`, bukan error 500.
- **Secret server tidak pernah diekspos** ke island: hanya `PUBLIC_WA_NUMBER` yang berprefiks `PUBLIC_`.
- **Checklist dependency** (per `CATATAN.md` §4): setiap paket diverifikasi ada di npm, versi terpasang dicek, API dibaca dari dokumentasi/`node_modules` sebelum dipakai. Astro 7 & @astrojs/node 11 diverifikasi lewat `config.d.ts` dan `types.d.ts` terpasang (bukan ingatan model).
- **Dashboard sudah diproteksi sesi Pemilik Warung.** Password dibandingkan timing-safe; cookie ditandatangani HMAC; logout menghapus cookie. Belum ada rate-limit login atau 2FA—tercatat di `TASKS.md` §5.

## 12. Non-Fungsional

- Mobile-first 375px; tanpa scroll horizontal.
- Angka uang integer rupiah, format `Rp75.000`; jam `HH.MM`; tanggal `id-ID`.
- Number input memakai `tabular-nums`.
- Foto menu `loading="lazy"`, rasio 4:3, `alt` bermakna.
- Tanpa animasi berkedip; hormati `prefers-reduced-motion`.
- Kegagalan Neon (env diisi tapi koneksi gagal) ditangani sebagai error yang terlihat, bukan fallback diam-diam—agar data tidak terlihat "hilang".

## 13. Kriteria Penerimaan

| Kode | Kriteria |
| --- | --- |
| AC-1 | Halaman `/` menampilkan 8 menu; pencarian "kopi" menyisakan menu kopi; filter kategori & urutan harga bekerja. |
| AC-2 | Checkout menghasilkan tautan `wa.me` berisi menu, jumlah, tanggal, jam, mode ambil/kirim, dan total. |
| AC-3 | Props katalog publik tidak memuat `resep`, `hargaSatuan`, `isiPerSatuan`, `biayaKemasan` (diuji). |
| AC-4 | CRUD menu lewat API mengubah daftar di Neon (atau store seed) dan langsung tampil setelah refresh. |
| AC-5 | Upload tanpa kredensial Cloudinary mengembalikan URL SVG lokal dan `fallback: true`. |
| AC-6 | Resep 12 pcs → pesanan 36 pcs: bahan utama tepat 3×; gula/garam memakai `3^0,9`; tidak ada hasil 0 g. |
| AC-7 | Kenaikan biji kopi 50% menaikkan HPP, menurunkan margin, dan mengubah status (diuji). |
| AC-8 | Jam kirim 14.30 dengan prep 25 + proses 20 + packing 15 + tempuh 20 + buffer 10 → mulai persiapan 13.00. |
| AC-9 | Porsi < `minOrder` atau jam di luar 07.00–21.00 ditolak validasi dengan pesan spesifik. |
| AC-10 | `npm run build` dan `npx vitest run` lulus. |
| AC-11 | Checkout mencatat pesanan ke `orders` sekaligus membuka WhatsApp; dashboard menampilkan antrean hari ini dengan aksi “Tarik ke Dapur” dan “Konfirmasi & Potong Stok”. |
| AC-12 | `stok === 0` menonaktifkan tombol pesan (“Sold Out”); jumlah tidak bisa melebihi stok; potong stok melebihi sisa ditolak (diuji). |
| AC-13 | Daftar belanja menampilkan gram di bawah 1000 g dan kg di atasnya. |
| AC-14 | Timeline menampilkan `PRAPROSES` (cold brew/proofing) dan `PERACIKAN` 15 menit sebelum kirim untuk minuman dingin. |
| AC-15 | Produksi tanpa `SESSION_SECRET` menolak start (diuji). |
| AC-16 | Brute force login → 429 + `Retry-After` (diuji). |
| AC-17 | Akun demo tidak ada di production (diuji). |
| AC-18 | Payment Gateway terintegrasi: `POST /api/payments/init` menghasilkan `payment_url` (diuji). |
| AC-19 | Status order ikut update dari payment (`pending` → `confirmed` → `completed`, diuji). |
| AC-20 | Client `totalHarga` diabaikan; dihitung ulang dari produk di server (diuji). |
| AC-21 | Role ikut diverifikasi: customer tidak bisa akses API owner (diuji). |
| AC-22 | `POST /api/orders` publik tetap 201 (checkout tamu); tapi user_id dari cookie otomatis jika ada sesi (diuji). |
| AC-23 | `POST /api/payments/init` butuh sesi owner, body: `order_id`, `amount` (diuji). |
| AC-24 | `GET /api/payments/status/:id` butuh sesi owner, balas `status` (diuji). |
| AC-25 | `.env.example` lengkap: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY` (contoh sandbox); `SESSION_SECRET` (diuji produksi menolak jika kosong). |
| AC-26 | Tidak ada string `/dapur` di HTML publik (`/`, `/menu`, `/masuk`); pemilik login lewat `/masuk` dan otomatis ke `/dapur` (diuji). |
| AC-27 | Payload publik tanpa data modal; hash password tidak pernah bocor. |
| AC-28 | Semua warna dari token; tanpa font/skrip eksternal build lulus. |
| AC-29 | `npm run build` dan `npx vitest run` lulus setelah integrasi payment (diuji). |
| AC-30 | `README.md` ada dan mencakup: cara integrasi, env vars, cara menjalankan seed (diuji). |
| AC-15 | Form resep dinamis menerima bahan baru (`namaBahan`, `satuanDasar`, `jumlahSatuan`, `hargaPerKg`, `substitusiSaran`) dan durasi, langsung terbaca 3 pilar. |
| AC-16 | Tanpa login, `/dapur` redirect ke `/login` dan API mutasi/`GET /api/orders` mengembalikan 401; login benar memberi cookie HttpOnly dan akses 200 (diuji). |
| AC-17 | `POST /api/orders` tetap 201 tanpa sesi sehingga pelanggan bisa checkout. |
| AC-18 | Konversi baku: shot 30 ml / 18 g biji, sloki 45 ml, jumput 2 g, sdt 5, sdm 15, genggam 35 g, butir 55 g, centong 100 g, lembar 75 g (diuji). |
| AC-19 | Setiap menu seed punya 5–7 komponen + `gramPerPorsi` + `instruksiDapur`; modal katalog menampilkan komposisi dan total per porsi tanpa harga bahan. |

## 14. Batasan v1

Tidak termasuk: multi-pengguna/role selain satu Pemilik Warung, rate-limit login, 2FA, pembayaran online, notifikasi otomatis (WhatsApp dibuka manual), multi-cabang, sinkronisasi harga pasar otomatis. Antrean pesanan disimpan di tabel `orders` dengan pemotongan stok manual satu klik; pembatalan pesanan dan pengembalian stok belum ada.
