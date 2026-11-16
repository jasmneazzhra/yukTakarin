# 🍲 KATALOG PROYEK: yukTakarin!

> **Platform Katalog Menu Katering Pelanggan & Asisten Dapur Presisi untuk UMKM Kuliner**

| 📋 Informasi Umum | Detail Keterangan |
| --- | --- |
| **Jenis Dokumen** | Catatan Latihan & Dokumentasi Eksplorasi AI |
| **Fokus Pengembangan** | *Web Development* dengan Asistensi AI yang Efektif & Bertanggung Jawab |
| **Arsitektur Pengguna** | **2 Sisi Terintegrasi:** Katalog Pemesanan (Pelanggan) & Dapur Pintar (Pemilik Warung) |

---

### 🎯 1. Tujuan Latihan

Meningkatkan kemahiran dalam merancang dan mengembangkan aplikasi web modern dengan memanfaatkan alat bantu AI secara **efektif**, **terukur**, dan **bertanggung jawab** tanpa mengorbankan kualitas kode.

---

### 🏪 2. Profil & Pembagian Peran Aplikasi: yukTakarin!

**yukTakarin!** memisahkan pengalaman pengguna sesuai perannya masing-masing agar mudah dipakai pelanggan sekaligus rapi di dapur warung:

* **🛍️ Sisi Depan — Katalog Menu untuk Pelanggan (*Customer View*):**
Pelanggan hanya melihat tampilan katalog menu katering yang menggugah selera, transparan, dan mudah dipesan—lengkap dengan pilihan paket, foto menu, estimasi waktu kirim, dan checkout pesanan.
* **👩‍🍳 Sisi Belakang — Kendali Dapur untuk Pemilik Warung (*Kitchen & Owner View*):**
Seluruh perhitungan teknis dapur dirahasiakan dan dikelola khusus oleh pemilik warung: mulai dari konversi takaran bumbu, pantauan harga modal, hingga hitung mundur jadwal masak begitu pesanan pelanggan masuk.

---

### ✨ 3. Fitur Unggulan Berdasarkan Sisi Pengguna

#### A. Fitur Sisi Pelanggan (Katalog & Pemesanan)

| Kode | Nama Fitur | Pengalaman Pelanggan |
| --- | --- | --- |
| **`YT-C1`** | **📖 Katalog Menu Katering Interaktif** | Pelanggan bebas memilih paket katering harian atau acara, menentukan jumlah porsi, dan memilih jam pengantaran yang diinginkan. |
| **`YT-C2`** | **💳 Pemesanan & Pembayaran Praktis** | Proses *checkout* pesanan katering yang ringkas dengan rincian biaya transparan dan konfirmasi jadwal pengiriman otomatis. |

#### B. Tiga Pilar Dapur Warung (Internal UMKM)

| Kode | Nama Fitur | Cara Kerja & Dampak Nyata di Dapur Warung |
| --- | --- | --- |
| **`YT-K1`** | **🥄 Konverter "Ilmu Kira-Kira" ke Gramasi** | Menerjemahkan catatan resep khas rumahan (*1 jumput, 2 centong, secukupnya*) menjadi angka gramasi pasti, lalu otomatis melipatgandakannya sesuai jumlah porsi yang dipesan pelanggan. |
| **`YT-K2`** | **🌶️ Radar Inflasi Bahan & Penyesuaian Resep** | Memantau kenaikan harga bahan baku pasar (cabai, bawang, telur, minyak) dan memberi peringatan jika margin menipis, lengkap dengan saran penyesuaian takaran/substitusi tanpa merusak rasa. |
| **`YT-K3`** | **⏱️ Timeline Masak Mundur (*Reverse Kitchen Timer*)** | Otomatis menarik data **jam pengantaran pilihan pelanggan** untuk menghitung mundur jadwal kerja dapur (jam persiapan bumbu, proses masak, hingga *packing*) agar katering bebas telat kirim. |

> **💡 Alur Terpadu Depan–Belakang:** Pelanggan memesan 50 boks untuk dikirim **pukul 12.00 WIB** di Katalog (**`YT-C1`**) $\rightarrow$ Sistem dapur otomatis mengalikan takaran resep (**`YT-K1`**), mengecek keamanan modal terhadap harga bahan hari ini (**`YT-K2`**), dan langsung menyusun jadwal masak mundur di layar warung (**`YT-K3`**).

---

### 🛡️ 4. Audit & Mitigasi Risiko Penggunaan AI

Dalam proses pengembangan *yukTakarin!*, fokus pengawasan utama diarahkan pada pencegahan risiko teknis berikut:

> ⚠️ **Risiko Utama: Halusinasi Kode (*Code Hallucination*)**
> * **Indikator:** AI menyarankan pustaka (*library*), *package*, atau fungsi API yang sudah usang (*deprecated*) maupun fiktif.
> * **Area Kritis:** Modul **Keamanan Sistem (Autentikasi/Otorisasi Pemisah Akses Pelanggan vs. Pemilik Warung)** dan **Integrasi Gerbang Pembayaran (*Payment Gateway*)**.
> * **Langkah Mitigasi:** Verifikasi manual terhadap dokumentasi resmi dan versi terbaru setiap *dependency* sebelum diintegrasikan ke dalam *codebase*.
> 
> 

---