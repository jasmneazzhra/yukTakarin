# UI-SPEC — yukTakarin!

> **Gaya: Soft Neo-Brutalism** untuk UMKM Coffee & Kue. Brutal karena jujur: border tebal, bayangan keras, tanpa gradien. *Soft* karena hangat: latar cream, sudut 10–12px, warna bumbu dapur. Dokumen ini sumber tunggal token visual.

## 1. Prinsip

1. **Foto kopi & kue adalah bintang.** Kartu bersih di dalam; seluruh garis dan bayangan berada di luar batas kartu. Tidak ada bingkai ganda, garis dekoratif, atau watermark di dalam kartu.
2. **Hangat, bukan dingin.** Hanya cream, mustard, coral, teal, sage, ink. Tidak ada electric blue, ungu, atau neon.
3. **Jujur soal status.** Warna selalu disertai label teks.
4. **Satu tangan di dapur.** Target sentuh ≥ 44px, angka besar, kontras tinggi.

## 2. Warna

| Token | Hex | Peran | Teks di atasnya |
| --- | --- | --- | --- |
| `--cream` | `#F6F2E9` | Latar halaman & permukaan | Ink |
| `--cream-deep` | `#EDE6D6` | Latar sekunder, baris tabel selang-seling, placeholder | Ink |
| `--ink` | `#1F1B16` | Teks utama, border, hard shadow | — |
| `--ink-soft` | `#5C544A` | Teks sekunder, label, meta | Cream |
| `--mustard` | `#FFD23F` | Tombol utama, chip aktif, status Waspada, sorotan | Ink |
| `--coral` | `#FF5C38` | Status Kritis, aksi penting sekunder | Ink (putih hanya teks ≥24px bold) |
| `--teal` | `#2DD4BF` | Status Aman, konfirmasi, progres | Ink |
| `--sage` | `#A8C3A0` | Aksen tenang: chip kategori, ilustrasi kosong | Ink |

- Latar halaman **selalu cream**; tidak ada putih murni, tidak ada mode gelap.
- Border dan shadow **selalu ink**; border berwarna hanya untuk status.
- Mustard maksimal satu blok besar per layar.
- Dilarang: gradien, `backdrop-filter`, blur shadow, opacity < 1 pada teks, border 1px dekoratif.

Kontras: ink/cream ≈ 14,9:1 · ink/mustard ≈ 11,6:1 · ink/teal ≈ 9:1 · ink/coral ≈ 5,4:1. **Putih di atas mustard (1,4:1) dan teal (1,9:1) dilarang.**

## 3. Tipografi

| Peran | Ukuran / baris | Bobot |
| --- | --- | --- |
| Display (hero, nama menu besar) | 34–44px / 1,1 | 800 |
| Judul halaman | 26–30px / 1,2 | 800 |
| Judul kartu | 18–20px / 1,3 | 700 |
| Body | 16px / 1,55 | 400 |
| Label/meta | 13px / 1,4 | 600 |
| Angka dapur (gramasi, HPP, timer) | 24–44px | 800, `tabular-nums` |

Font: **Plus Jakarta Sans** via `font-family` stack dengan fallback `system-ui, -apple-system, "Segoe UI", sans-serif` (tanpa unduhan font eksternal agar build & offline tetap cepat).

## 4. Bentuk

```css
--radius-sm: 10px;  /* input, chip, tombol kecil */
--radius-md: 12px;  /* kartu, panel, modal */
--border: 2px solid var(--ink);
--shadow-card: 4px 4px 0 0 var(--ink);
--shadow-action: 3px 3px 0 0 var(--ink);
```

- **Kartu:** cream, `2px solid ink`, radius 12px, `4px 4px 0 ink`; isi bersih tanpa divider dekoratif.
- **Tombol aksi:** `2px solid ink`, radius 10px, `3px 3px 0 ink`; saat ditekan `transform: translate(2px,2px)` + shadow 1px. Fokus: `outline: 3px solid ink; outline-offset: 3px`.
- **Badge:** radius 999px hanya untuk badge.
- Satu bayangan per komponen; tidak bertumpuk.

## 5. Spacing & Grid

Skala 4px (`4 8 12 16 24 32 48 64`). Padding kartu 20px mobile / 24px desktop. Gap grid 16px. Konten maksimum 1120px.

Katalog: 1 kolom (<640), 2 (640–1023), 3 (≥1024). Dapur: 1 kolom <1024, lalu 260px sidebar + konten.

## 6. Komponen

**Header katalog.** Wordmark "yukTakarin!" (24px/800) + sublabel kecil "Coffee & Kue". Tautan "Dapur" sebagai tombol quiet. Sticky di atas, latar cream, border-bawah 2px ink.

**Hero ringkas.** Satu `h1` 2 baris + satu chip sage "Katering harian & acara". Tanpa slider, tanpa video.

**Filter bar.** Input pencarian (ikon + placeholder "Cari kopi, croissant, bolu…"), chip kategori (Semua, Kopi & Minuman, Pastry & Roti, Kue Panggang, Paket Snack Box), dan `<select>` urutan (Nama A–Z, Harga terendah, Harga tertinggi). Chip aktif berlatar mustard + border ink.

**Kartu menu.** Foto 4:3 penuh di atas, radius atas mengikuti kartu, tanpa border internal. Badan kartu: nama (20px/700), deskripsi 2 baris (`-webkit-line-clamp: 2`), baris meta `Rp85.000 /liter` + `min. 5`, dan tombol primary "Pesan" selebar kartu. Bila `stok === 0`, tombol berganti label "Sold Out" dan nonaktif (opacity 45%). Badge kategori kecil di atas foto (latar cream, border 2px).

**Panel pesanan (checkout).** Kartu terpisah/sticky di kanan (desktop) atau di bawah (mobile). Isi: nama menu terpilih, stepper jumlah 44px, mode Ambil/Kirim (segmented), tanggal `<input type="date">`, jam `<select>` 30 menit (07.00–21.00), nama pemesan, catatan. Ringkasan `subtotal + ongkir (kirim) = total`. Tombol primary "Checkout via WhatsApp" (hijau WhatsApp **tidak** dipakai; tetap mustard, ikon teks). Galat validasi di bawah field: teks coral + ikon + penjelasan. Stepper dibatasi `minOrder`–`stok`; pesan "Stok tersisa N" tampil di bawah tombol bila jumlah melebihi stok.

**Dashboard — statistik.** Tiga kartu: Total menu, Rata-rata margin, Menu perlu perhatian. Angka 32px/800 tabular, label 13px. Kartu "perlu perhatian" ber-border coral bila > 0.

**Tabel/daftar menu (CRUD).** Baris berisi nama + kategori, harga, margin chip status, dan tombol "Ubah"/"Hapus" (quiet). Form tambah/ubah tampil sebagai panel: input teks/angka, textarea deskripsi, select kategori & satuan, upload foto (file input + pratinjau). Form resep dinamis: select bahan per baris + jumlah + satuan (termasuk `jumput`, `lembar`, `secukupnya`), tombol "+ Bahan" dan "+ Bahan baru" (input `namaBahan`, satuan beli, harga beli, substitusi). Input "Stok tersedia" (0 = Sold Out). Tombol primary "Simpan menu", quiet "Batal".

**Tabel gramasi (`YT-K1`).** Dua nilai per baris: "Takaran rumah" (teks, ink-soft) dan "Gramasi produksi" (angka 20px/800 tabular). Kelompok Utama vs Bumbu dipisah judul kecil, bukan garis. Toggle/segmented tidak diperlukan karena keduanya tampil berdampingan. Catatan "secukupnya" tampil miring tanpa angka. Di bawah tabel: ringkasan **Daftar Belanja Pasar** — baris nama + berat (`g`/`kg`, tabular) dengan total berat berlatar mustard.

**Radar inflasi (`YT-K2`).** Chip status besar (Aman/Waspada/Kritis) + tiga angka: HPP/porsi, harga jual, margin. Slider persen 0–100 (thumb ink, track cream-deep) + select bahan. Daftar saran sebagai kartu kecil ber-border, masing-masing dengan tombol "Salin" (bukan "Terapkan otomatis"). Tombol terpisah "Terapkan Harga Baru ke Resep" (primary) di bawah panel, dengan pesan status setelah berhasil.

**Timeline (`YT-K3`).** Daftar vertikal segmen: jam target (tabular 22px/800), nama segmen, durasi, badge status teks. Segmen pra-proses (cold brew/proofing) dan peracikan dingin tampil sebagai baris tambahan dengan label teks. Segmen pertama (persiapan) disorot mustard. Baris terhubung garis luar 2px ink, tanpa hiasan di dalam kartu.

**Antrean pesanan (tab baru).** Daftar kartu: nama menu + jumlah porsi, mode & jam, nama pemesan, total, catatan, chip status (`Menunggu` netral, `Diproses` mustard, `Selesai` sage). Tombol quiet "Tarik ke Dapur" dan primary "Konfirmasi & Potong Stok".

## 7. Layout

**Katalog:** header → hero → filter bar → grid kartu → panel pesanan → footer. Panel pesanan muncul setelah menu dipilih; sebelum itu tampil kartu "Pilih menu untuk mulai memesan".

**Dapur:** header (judul + status sumber data "Neon" / "Mode seed") → statistik → tab (Antrean, Menu, Gramasi, Inflasi, Timeline) → konten tab. Tab berupa tombol segmented ber-border ink; tab aktif mustard.

## 8. Gerak

Transisi tombol 120ms `ease-out`, hover naik 1px, kartu masuk 160ms opacity. `prefers-reduced-motion: reduce` mematikan transform. **Dilarang:** kedip, getar, pulse status kritis. Status kritis = warna + label + border coral.

## 9. Aksesibilitas

- Kontras ≥ 4,5:1 teks normal, ≥ 3:1 teks besar.
- `label` nyata untuk semua input; galat dihubungkan `aria-describedby`; `aria-live="polite"` untuk hasil pencarian kosong.
- Target sentuh ≥ 44px.
- Status selalu punya teks: "Aman", "Waspada", "Kritis", "Terlambat".
- Fokus terlihat di semua kontrol, termasuk slider dan file input.
- Satu `h1` per halaman.

## 10. Do / Don't

| Lakukan | Hindari |
| --- | --- |
| Border 2px ink + hard shadow 4px di luar kartu | Shadow blur, border abu 1px |
| Latar cream, satu blok mustard per layar | Putih bersih, gradien oranye, glassmorphism |
| Radius 10–12px | Sudut 0px atau pill pada kartu |
| Foto menu tanpa garis dalam | Bingkai ganda, garis dekoratif |
| Status = warna + label | Status hanya warna |
| Tombol WhatsApp tetap mustard + ikon teks | Tombol hijau neon WhatsApp |

## 11. Kriteria Penerimaan UI

| Kode | Kriteria |
| --- | --- |
| AC-U1 | Semua warna berasal dari token §2; tidak ada hex acak di komponen. |
| AC-U2 | Setiap kartu & tombol aksi memakai border 2px ink + hard shadow luar; isi kartu tanpa garis dekoratif. |
| AC-U3 | Radius 10px atau 12px (999px hanya badge). |
| AC-U4 | Alur pilih menu → checkout selesai di 375px tanpa scroll horizontal. |
| AC-U5 | Status Kritis/Terlambat terbaca tanpa warna dan tanpa animasi berkedip. |
