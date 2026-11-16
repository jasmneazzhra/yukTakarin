# yukTakarin! — Point of Sale Warung Makan

Aplikasi point-of-sale untuk warung makan dengan fitur role-based auth, konversi satuan, dan checkout WhatsApp.

---

## 🚀 Fitur

| Fitur | Deskripsi |
|-------|-----------|
| **Role-based access** | Owner → `/dapur` & API mutasi; Customer → `/akun`; Guest checkout publik |
| **Sesi owner** | Cookie `yt_sesi` HttpOnly, HMAC-SHA256, 12 jam berlaku |
| **Konversi satuan** | `shot`=18g, `sloki`=45ml, `jumput`=2g, `sdt`=5g, `lembar`=75g |
| **Menu 5–7 komponen** | Setiap menu harus memiliki 5–7 bahan dengan `instruksi_dapur` |
| **Checkout WhatsApp** | `POST /api/orders` → tautan `wa.me` berisi detail pesanan |
| **Payment Gateway** | Midtrans Sandbox: `POST /api/payments/init` & `GET /api/payments/status` |
| **Role guard** | `/dapur` & API mutasi hanya untuk owner; customer di-redirect `/masuk?arah=/dapur` |

---

## 📦 Instalasi

```bash
# Clone & install
git clone <repo>
cd yuk-takarin
npm install  # atau: npx create astro@latest

# Konfigurasi environment
cp .env.example .env
# Isi nilai:
#   OWNER_USERNAME=pemilik
#   OWNER_PASSWORD=ganti-password-kuat
#   SESSION_SECRET=ganti-dengan-string-acak-panjang-32-akar
#   MIDTRANS_SERVER_KEY=SB-Midserver-XXXXXXXX-XXXXXXXX-XXXXXXXX
#   MIDTRANS_CLIENT_KEY=SB-Midclient-XXXXXXXX-XXXXXXXX-XXXXXXXX
#   PUBLIC_WA_NUMBER=6281234567890

# Jalankan database (Neon opsional) atau seed lokal
npm run seed  # seed in-memory jika DATABASE_URL kosong

# Build & test
npm run build     # lulus tanpa error
npx vitest run    # 48 tests passing
```

---

## 🔐 Akun Default

| Peran | Username | Password | Catatan |
|-------|----------|----------|---------|
| **Owner** | `pemilik` | di `.env` (`OWNER_PASSWORD`) | Login → redirect `/dapur` |
| **Customer** | `pelanggan@yuktakarin.id` | `pelanggan123` | Hanya non-production |
| **Tamu** | — | — | Checkout tanpa login via `POST /api/orders` |

---

## 🌐 Endpoint API

| Endpoint | Method | Deskripsi | Otentikasi |
|----------|--------|-----------|------------|
| `/api/auth/login` | POST | Login owner/customer | Tanpa sesi → 200 + cookie |
| `/api/auth/logout` | POST | Hapus cookie sesi | — |
| `/api/orders` | POST | Checkout tamu (201) | Tanpa sesi → user_id dari cookie |
| `/api/payments/init` | POST | Inisialisasi Midtrans | Hanya owner |
| `/api/payments/status/:id` | GET | Cek status pembayaran | Hanya owner |
| `/api/products` | GET | Daftar menu (publik) | — |
| `/api/orders?hariIni=1` | GET | Filter hari ini (owner) | Sesi owner |

---

## 📁 Struktur Penting

```
src/
├── lib/
│   ├── auth.js          # Token HMAC, verifikasi role, cookie
│   ├── kitchen.js       # ONGKIR = 15000, konversi satuan
│   └── repo.js          # CRUD menu, pesanan, seed
├── db/
│   ├── schema.js        # Tabel users, orders, payments
│   ├── seed.js          # Seed owner + customer demo
│   └── index.js         # Koneksi DB (Neon / in-memory)
├── pages/api/
│   ├── auth/            # login, logout
│   ├── orders/          # POST order, GET daftar
│   └── payments/        # init, status (Midtrans)
└── middleware.js        # Role-based guard
```

---

## 🧪 Menjalankan Test

```bash
npx vitest run  # 48 tests passing
# Jika menambahkan payment gateway:
// pastikan build lulus dan test masih pass
npm run build && npx vitest run
```

---

## 📝 Catatan Produksi

- **`.env`**: Setiap rahasia (password, secret Midtrans) harus diisi, **bukan** nilai contoh dari `.env.example`.
- **`DATABASE_URL`**: Jika diisi → menggunakan Neon PostgreSQL. Kosong → seed in-memory (default development).
- **Midtrans**: Gunakan `SB-Midserver...` dan `SB-Midclient...` untuk sandbox. Produksi butuh kredensial baru.
- **Rate limit**: Belum diimplementasi (catatan di TASKS.md §5).
- **2FA / Login maksimum**: Belum ada (tercatat sebagai opsional di TASKS.md).

---

## 🛠 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Build error import path | Pastikan `from '../../../lib/...'` untuk file di `src/pages/api/...` |
| Test 401 password salah | Pastikan `OWNER_PASSWORD` di `.env` sesuai dengan yang diuji |
| `bacaEnv is not defined` | Cek adanya `src/lib/env.js` dan import-nya di `auth.js` |
| `Midtrans server key not configured` | Isi `MIDTRANS_SERVER_KEY` dan `MIDTRANS_CLIENT_KEY` di `.env` |
| 48 tests passing tapi fitur X tidak bekerja | Cek middleware role guard dan sesi owner |

---

## 📦 Dependencies Terverifikasi

- `astro@7` + `@astrojs/node@11`
- `drizzle-orm@0.35`
- `svelte@5`
- `crypto` (node built-in untuk HMAC token)

---

**yukTakarin!** — Mudah, neboetralisme, tanpa pembayaran online kompleks.