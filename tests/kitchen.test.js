import { describe, it, expect } from 'vitest';

import {
  BUMBU_EXPONENT,
  TABEL_KONVERSI,
  bulatkanGram,
  formatBerat,
  formatVolume,
  komposisiPublik,
  formatMenit,
  formatRupiah,
  faseKhususKafe,
  validasiStok,
  hargaPerPorsi,
  hitungHpp,
  konversiTakaran,
  marginPersen,
  parseJam,
  simulasiInflasi,
  skalaResep,
  statusMargin,
  statusSegmen,
  susunTimeline,
  validasiPesanan,
} from '../src/lib/kitchen.js';

import {
  buatPesanan,
  daftarPesanan,
  daftarProduk,
  potongStok,
  terapkanInflasi,
  ubahStatusPesanan,
} from '../src/lib/repo.js';
import { MENU } from '../src/db/seed-data.js';
import { NAMA_COOKIE, kredensialPemilik } from '../src/lib/auth.js';
import { POST as loginPemilik } from '../src/pages/api/auth/login.js';
import { POST as logoutPemilik } from '../src/pages/api/auth/logout.js';
import { GET as ambilPesananApi } from '../src/pages/api/orders/index.js';
import { POST as buatProdukApi } from '../src/pages/api/products/index.js';

describe('konversi takaran', () => {
  it('mengonversi sdm kopi dengan densitas', () => {
    const hasil = konversiTakaran(1, 'sdm', { densitas: 0.35 });
    expect(hasil.gram).toBeCloseTo(5.25, 2);
  });

  it('mengonversi shot espresso', () => {
    expect(konversiTakaran(1, 'shot', { densitas: 1 }).gram).toBe(30);
  });

  it('mengonversi butir telur', () => {
    expect(konversiTakaran(1, 'butir', { gramPerSatuan: 60 }).gram).toBe(60);
  });

  it('tidak mengonversi secukupnya', () => {
    const hasil = konversiTakaran(2, 'secukupnya', {});
    expect(hasil.gram).toBeNull();
    expect(hasil.tidakTerukur).toBe(true);
  });

  it('menolak satuan tidak dikenal', () => {
    expect(() => konversiTakaran(1, 'genggang', {})).toThrow();
  });
});

describe('pembulatan gramasi', () => {
  it('pembulatan dasar', () => {
    expect(bulatkanGram(0.3)).toBe(0.5);
    expect(bulatkanGram(137)).toBe(135);
    expect(bulatkanGram(13)).toBe(13);
    expect(bulatkanGram(0)).toBe(0);
  });
});

describe('auto-scaling resep', () => {
  const resep = [
    { slug: 'tepung', nama: 'Tepung', jumlah: 500, satuan: 'gram', kategori: 'utama', densitas: 1, hargaSatuan: 12000, isiPerSatuan: 1000 },
    { slug: 'gula', nama: 'Gula', jumlah: 100, satuan: 'gram', kategori: 'pemanis', densitas: 1, hargaSatuan: 16000, isiPerSatuan: 1000 },
    { slug: 'vanila', nama: 'Vanila', jumlah: 5, satuan: 'ml', kategori: 'ekstrak', densitas: 1, hargaSatuan: 150000, isiPerSatuan: 1000 },
    { slug: 'secukupnya', nama: 'Garam', jumlah: 1, satuan: 'secukupnya', kategori: 'asin', densitas: 1, hargaSatuan: 8000, isiPerSatuan: 1000 },
  ];

  it('mengalikan bahan utama linier dan bumbu non-linear', () => {
    const hasil = skalaResep(resep, 10, 30);
    expect(hasil.faktor).toBe(3);
    const tepung = hasil.baris.find((b) => b.slug === 'tepung');
    const gula = hasil.baris.find((b) => b.slug === 'gula');
    expect(tepung.gramasi).toBe(1500);
    expect(gula.gramasi).toBe(270);
    expect(gula.gramasi).toBeLessThan(300);
    expect(gula.gramasi).toBeGreaterThan(200);
  });

  it('tidak mengonversi takaran secukupnya', () => {
    const hasil = skalaResep(resep, 10, 30);
    const baris = hasil.baris.find((b) => b.slug === 'secukupnya');
    expect(baris.gramasi).toBeNull();
    expect(baris.gramasiDasar).toBeNull();
  });

  it('menolak faktor tidak valid', () => {
    expect(() => skalaResep(resep, 0, 10)).toThrow();
    expect(() => skalaResep(resep, 10, 0)).toThrow();
  });
});

describe('HPP dan inflasi', () => {
  const resep = [
    { slug: 'kopi', nama: 'Kopi', jumlah: 60, satuan: 'gram', kategori: 'utama', densitas: 0.35, hargaSatuan: 180000, isiPerSatuan: 1000 },
    { slug: 'susu', nama: 'Susu', jumlah: 900, satuan: 'ml', kategori: 'utama', densitas: 1.03, hargaSatuan: 20000, isiPerSatuan: 1000 },
    { slug: 'gula-aren', nama: 'Gula aren', jumlah: 150, satuan: 'ml', kategori: 'pemanis', densitas: 1.3, hargaSatuan: 35000, isiPerSatuan: 1000 },
    { slug: 'es', nama: 'Es', jumlah: 500, satuan: 'gram', kategori: 'utama', densitas: 1, hargaSatuan: 5000, isiPerSatuan: 1000 },
  ];

  const produk = {
    harga: 85000,
    porsiDasar: 5,
    porsiPerSatuan: 5,
    biayaKemasan: 1200,
    biayaOperasional: 600,
    resep,
  };

  it('menghitung HPP per porsi kopi susu gula aren', () => {
    const hpp = hitungHpp({
      resep,
      porsiDasar: 5,
      biayaKemasan: 1200,
      biayaOperasional: 600,
    });
    expect(hpp.hppPerPorsi).toBeGreaterThan(7000);
    expect(hpp.hppPerPorsi).toBeLessThan(10000);
  });

  it('margin awal kopi susu gula aren sekitar 43%', () => {
    const hpp = hitungHpp({ resep, porsiDasar: 5, biayaKemasan: 1200, biayaOperasional: 600 });
    const margin = marginPersen(hargaPerPorsi(produk), hpp.hppPerPorsi);
    expect(margin).toBeGreaterThan(40);
    expect(margin).toBeLessThan(46);
  });

  it('kenaikan 50% biji kopi menurunkan margin dan menghasilkan saran', () => {
    const hasil = simulasiInflasi({ produk, slugBahan: 'kopi', persen: 50 });
    expect(hasil.hppAkhir).toBeGreaterThan(hasil.hppAwal);
    expect(hasil.marginAkhir).toBeLessThan(hasil.marginAwal);
    expect(hasil.saran.length).toBeGreaterThan(0);
  });

  it('status margin mengikuti ambang batas', () => {
    expect(statusMargin(45, 0)).toBe('AMAN');
    expect(statusMargin(35, 0)).toBe('WASPADA');
    expect(statusMargin(25, 0)).toBe('KRITIS');
    expect(statusMargin(45, 25)).toBe('KRITIS');
  });
});

describe('reverse kitchen timer', () => {
  it('menyusun timeline dari jam kirim 14.30', () => {
    const hasil = susunTimeline({
      jamKirim: '14:30',
      prepMenit: 25,
      prosesMenit: 20,
      packingMenit: 15,
      tempuhMenit: 20,
      bufferMenit: 10,
    });
    expect(hasil.mulaiPersiapanLabel).toBe('13.00');
    expect(hasil.tibaLabel).toBe('14.30');
    expect(hasil.totalMenit).toBe(90);
    expect(hasil.segmen).toHaveLength(4);
    expect(hasil.segmen[0].kode).toBe('PERSIAPAN');
    expect(hasil.segmen[3].kode).toBe('KIRIM');
  });

  it('menggeser seluruh segmen saat jam kirim berubah', () => {
    const awal = susunTimeline({ jamKirim: '12:00', prepMenit: 10, prosesMenit: 10, packingMenit: 10, tempuhMenit: 10, bufferMenit: 10 });
    const geser = susunTimeline({ jamKirim: '13:00', prepMenit: 10, prosesMenit: 10, packingMenit: 10, tempuhMenit: 10, bufferMenit: 10 });
    expect(geser.mulaiPersiapan - awal.mulaiPersiapan).toBe(60);
  });

  it('menandai segmen terlambat', () => {
    const hasil = susunTimeline({ jamKirim: '12:00', prepMenit: 10, prosesMenit: 10, packingMenit: 10, tempuhMenit: 10, bufferMenit: 10 });
    const status = statusSegmen(11 * 60 + 45, hasil.segmen[0]);
    expect(status.status).toBe('TERLAMBAT');
  });

  it('menandai waspada di 25% akhir durasi', () => {
    const hasil = susunTimeline({ jamKirim: '12:00', prepMenit: 60, prosesMenit: 10, packingMenit: 10, tempuhMenit: 10, bufferMenit: 10 });
    const segmen = hasil.segmen[0];
    const titik = segmen.selesai - Math.round(segmen.durasiMenit * 0.1);
    expect(statusSegmen(titik, segmen).status).toBe('WASPADA');
  });

  it('menolak jam tidak valid', () => {
    expect(() => susunTimeline({ jamKirim: '25:00', prepMenit: 10, prosesMenit: 10, packingMenit: 10 })).toThrow();
  });
});

describe('validasi pesanan', () => {
  it('menolak porsi di bawah minimum', () => {
    const hasil = validasiPesanan({ jumlah: 3, minOrder: 5, tanggal: '2099-12-31', jamKirim: '12:00', nama: 'Raka' });
    expect(hasil.valid).toBe(false);
    expect(hasil.errors.some((e) => e.field === 'jumlah')).toBe(true);
  });

  it('menolak jam di luar layanan dan bukan kelipatan 30', () => {
    const hasil = validasiPesanan({ jumlah: 5, minOrder: 5, tanggal: '2099-12-31', jamKirim: '22:15', nama: 'Raka' });
    expect(hasil.errors.some((e) => e.field === 'jamKirim')).toBe(true);
  });

  it('menolak nama kosong dan tanggal lalu', () => {
    const hasil = validasiPesanan({ jumlah: 5, minOrder: 5, tanggal: '2020-01-01', jamKirim: '12:00', nama: '' });
    expect(hasil.errors.map((e) => e.field)).toContain('nama');
    expect(hasil.errors.map((e) => e.field)).toContain('tanggal');
  });

  it('lolos pada input valid', () => {
    const hasil = validasiPesanan({ jumlah: 5, minOrder: 5, tanggal: '2099-12-31', jamKirim: '12:00', nama: 'Raka' });
    expect(hasil.valid).toBe(true);
  });
});

describe('format dan akses data', () => {
  it('format rupiah', () => {
    expect(formatRupiah(50000)).toBe('Rp50.000');
  });

  it('format menit', () => {
    expect(formatMenit(780)).toBe('13.00');
  });

  it('memuat 8 menu seed tanpa database', async () => {
    const data = await daftarProduk();
    expect(data).toHaveLength(8);
  });

  it('payload publik tidak membawa data modal', async () => {
    const data = await daftarProduk({ publik: true });
    const contoh = data[0];
    expect(contoh).not.toHaveProperty('resep');
    expect(contoh).not.toHaveProperty('hargaSatuan');
    expect(contoh).not.toHaveProperty('biayaKemasan');
  });
});

describe('satuan khas coffee & kue', () => {
  it('mengonversi seluruh satuan baku Coffee & Kue', () => {
    expect(konversiTakaran(1, 'shot', { densitas: 0.35, gramPerSatuan: 18 }).gram).toBe(18);
    expect(konversiTakaran(1, 'shot', { densitas: 1 }).gram).toBe(30);
    expect(konversiTakaran(1, 'sloki', { densitas: 1 }).gram).toBe(45);
    expect(konversiTakaran(1, 'jumput', {}).gram).toBe(2);
    expect(konversiTakaran(1, 'sdt', { densitas: 1 }).gram).toBe(5);
    expect(konversiTakaran(1, 'sdm', { densitas: 1 }).gram).toBe(15);
    expect(konversiTakaran(1, 'genggam', {}).gram).toBe(35);
    expect(konversiTakaran(1, 'butir', {}).gram).toBe(55);
    expect(konversiTakaran(1, 'centong', {}).gram).toBe(100);
    expect(konversiTakaran(1, 'lembar', {}).gram).toBe(75);
  });

  it('mendokumentasikan tabel konversi lengkap', () => {
    const satuan = TABEL_KONVERSI.map((baris) => baris.satuan);
    expect(satuan).toEqual(['shot', 'sloki', 'jumput', 'sdt', 'sdm', 'genggam', 'butir', 'centong', 'lembar']);
    const shot = TABEL_KONVERSI.find((baris) => baris.satuan === 'shot');
    expect(shot).toMatchObject({ ml: 30, gram: 18 });
  });

  it('menghitung gram dan ml per porsi pada auto-scaling', () => {
    const resep = [
      {
        slug: 'susu-uht',
        nama: 'Susu UHT',
        jumlah: 900,
        satuan: 'ml',
        satuanBeli: 'liter',
        densitas: 1,
        kategori: 'utama',
        hargaSatuan: 20000,
        isiPerSatuan: 1000,
      },
    ];
    const hasil = skalaResep(resep, 5, 10);
    expect(hasil.baris[0].gramPerPorsi).toBe(180);
    expect(hasil.baris[0].mlPerPorsi).toBe(180);
    expect(hasil.baris[0].ml).toBe(1800);
    expect(hasil.baris[0].satuanTampil).toBe('ml');
    expect(hasil.totalMlPerPorsi).toBe(180);
  });

  it('menyusun komposisi publik tanpa harga bahan', () => {
    const komposisi = komposisiPublik(
      [{ slug: 'kopi-arabika', nama: 'Biji kopi', jumlah: 5, satuan: 'shot', gramPerSatuan: 18, densitas: 0.35 }],
      5,
    );
    expect(komposisi[0].gramPerPorsi).toBe(18);
    expect(komposisi[0]).not.toHaveProperty('hargaSatuan');
  });

  it('meringkas berat dan volume ke kg/liter', () => {
    expect(formatBerat(750)).toBe('750 g');
    expect(formatBerat(12500)).toBe('12.5 kg');
    expect(formatBerat(0)).toBe('0 g');
    expect(formatVolume(750)).toBe('750 ml');
    expect(formatVolume(1250)).toBe('1.25 liter');
  });

  it('mengenali fase khusus per kategori', () => {
    const kopi = faseKhususKafe({ nama: 'Cold Brew Botolan', kategori: 'Kopi & Minuman' });
    expect(kopi.praProsesMenit).toBe(720);
    expect(kopi.peracikanMenit).toBe(15);
    expect(faseKhususKafe({ nama: 'Croissant Butter', kategori: 'Pastry & Roti' }).praProsesMenit).toBe(180);
    expect(faseKhususKafe({ nama: 'Bolu Tape', kategori: 'Kue Panggang' }).praProsesMenit).toBe(60);
  });

  it('menyusun fase cold brew dan peracikan dingin', () => {
    const hasil = susunTimeline({
      jamKirim: '12:00',
      prepMenit: 10,
      prosesMenit: 20,
      packingMenit: 5,
      tempuhMenit: 20,
      bufferMenit: 10,
      praProsesMenit: 720,
      peracikanMenit: 15,
    });
    const kode = hasil.segmen.map((s) => s.kode);
    expect(kode).toEqual(['PRAPROSES', 'PERSIAPAN', 'PROSES', 'PACKING', 'PERACIKAN', 'KIRIM']);
    const peracikan = hasil.segmen.find((s) => s.kode === 'PERACIKAN');
    expect(peracikan.selesai).toBe(11 * 60 + 30);
    expect(peracikan.mulai).toBe(11 * 60 + 15);
    expect(hasil.mulaiPraProsesLabel).toContain('H-1');
  });
});

describe('validasi stok', () => {
  it('menolak menu sold out', () => {
    const hasil = validasiStok({ jumlah: 1, stok: 0, minOrder: 1 });
    expect(hasil.valid).toBe(false);
    expect(hasil.pesan).toContain('Sold Out');
  });

  it('menolak jumlah melebihi stok', () => {
    const hasil = validasiStok({ jumlah: 6, stok: 5, minOrder: 1 });
    expect(hasil.valid).toBe(false);
    expect(hasil.pesan).toContain('5');
  });

  it('menerima jumlah dalam stok', () => {
    expect(validasiStok({ jumlah: 5, stok: 5, minOrder: 1 }).valid).toBe(true);
  });
});

describe('timeline lewat tengah malam', () => {
  it('memberi label H-1 saat persiapan jatuh sebelum pukul 00.00', () => {
    const hasil = susunTimeline({
      jamKirim: '00:30',
      prepMenit: 60,
      prosesMenit: 30,
      packingMenit: 10,
      tempuhMenit: 15,
      bufferMenit: 5,
    });
    expect(hasil.mulaiPersiapan).toBeLessThan(0);
    expect(hasil.mulaiPersiapanLabel).toContain('H-1');
    expect(hasil.tibaLabel).toBe('00.30');
    expect(hasil.segmen[0].mulaiLabel).toContain('H-1');
  });

  it('membungkus jam negatif dengan benar', () => {
    expect(formatMenit(-30)).toBe('23.30');
  });
});

describe('antrean pesanan & pemotongan stok', () => {
  it('mencatat pesanan lalu membacanya kembali', async () => {
    const pesanan = await buatPesanan({
      productId: 1,
      namaMenu: 'Kopi Susu Gula Aren Literan',
      jumlahPorsi: 2,
      jamKirim: '12:00',
      tanggal: new Date().toISOString().slice(0, 10),
      totalHarga: 170000,
      nama: 'Raka',
      catatan: 'tanpa es',
    });
    expect(pesanan.id).toBeGreaterThan(0);
    expect(pesanan.status).toBe('Menunggu');

    const antrean = await daftarPesanan({ hariIni: true });
    expect(antrean.some((row) => row.id === pesanan.id)).toBe(true);

    const diperbarui = await ubahStatusPesanan(pesanan.id, 'Diproses');
    expect(diperbarui.status).toBe('Diproses');
  });

  it('menolak status tidak dikenal', async () => {
    await expect(ubahStatusPesanan(1, 'Dibuang')).rejects.toThrow(/Status/);
  });

  it('memotong stok dan menolak potongan melebihi stok', async () => {
    const [produk] = await daftarProduk();
    const stokAwal = produk.stok;
    expect(stokAwal).toBeGreaterThan(0);

    const setelah = await potongStok(produk.id, 1);
    expect(setelah.stok).toBe(stokAwal - 1);

    await expect(potongStok(produk.id, 9999)).rejects.toThrow(/Stok tidak cukup/);
    await expect(potongStok(produk.id, 0)).rejects.toThrow(/potong/);
  });
});

describe('terapkan inflasi ke bahan', () => {
  it('menaikkan harga bahan sesuai persen', async () => {
    const hasil = await terapkanInflasi({ slugBahan: 'butter', persen: 10 });
    expect(hasil.hargaSatuan).toBeGreaterThan(0);
    await expect(terapkanInflasi({ slugBahan: 'tidak-ada', persen: 10 })).rejects.toThrow(/tidak ditemukan/);
  });
});

describe('detail resep seed 8 menu', () => {
  it('setiap menu punya 5–7 komponen dengan gramasi per porsi', () => {
    for (const menu of MENU) {
      expect(menu.resep.length).toBeGreaterThanOrEqual(5);
      expect(menu.instruksiDapur.length).toBeGreaterThan(20);
      for (const baris of menu.resep) {
        expect(baris.takaranKiraKira).toBeTruthy();
        expect(baris.satuanDasar).toBeTruthy();
        expect(baris.gramPerPorsi).toBeGreaterThan(0);
        expect(baris.hargaPerKg).toBeGreaterThan(0);
      }
    }
  });
});

describe('sesi Pemilik Warung', () => {
  const permintaan = (jalur, { metode = 'GET', cookie, body } = {}) =>
    new Request(`http://localhost${jalur}`, {
      method: metode,
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

  const sesi = kredensialPemilik();

  it('menolak API dapur tanpa login dengan 401', async () => {
    const antrean = await ambilPesananApi({
      url: new URL('http://localhost/api/orders?hariIni=1'),
      request: permintaan('/api/orders?hariIni=1'),
    });
    expect(antrean.status).toBe(401);

    const produk = await buatProdukApi({
      request: permintaan('/api/products', { metode: 'POST', body: {} }),
    });
    expect(produk.status).toBe(401);
  });

  it('menolak password salah', async () => {
    const respons = await loginPemilik({
      request: permintaan('/api/auth/login', {
        metode: 'POST',
        body: { username: sesi.username, password: 'salah-sekali' },
      }),
    });
    expect(respons.status).toBe(401);
  });

  it('memberi cookie HttpOnly setelah login benar', async () => {
    const respons = await loginPemilik({
      request: permintaan('/api/auth/login', {
        metode: 'POST',
        body: { username: sesi.username, password: sesi.password },
      }),
    });
    expect(respons.status).toBe(200);
    const cookie = respons.headers.get('set-cookie');
    expect(cookie).toContain(`${NAMA_COOKIE}=`);
    expect(cookie.toLowerCase()).toContain('httponly');
  });

  it('mengizinkan data dapur dengan cookie sesi dan menolak cookie palsu', async () => {
    const login = await loginPemilik({
      request: permintaan('/api/auth/login', {
        metode: 'POST',
        body: { username: sesi.username, password: sesi.password },
      }),
    });
    const cookie = login.headers.get('set-cookie').split(';')[0];

    const diterima = await ambilPesananApi({
      url: new URL('http://localhost/api/orders?hariIni=1'),
      request: permintaan('/api/orders?hariIni=1', { cookie }),
    });
    expect(diterima.status).toBe(200);

    const ditolak = await ambilPesananApi({
      url: new URL('http://localhost/api/orders?hariIni=1'),
      request: permintaan('/api/orders?hariIni=1', { cookie: `${NAMA_COOKIE}=palsu.salah` }),
    });
    expect(ditolak.status).toBe(401);
  });

  it('logout menghapus cookie sesi', async () => {
    const respons = await logoutPemilik({
      request: permintaan('/api/auth/logout', {
        metode: 'POST',
        body: {},
      }),
    });
    expect(respons.status).toBe(200);
    expect(respons.headers.get('set-cookie').toLowerCase()).toContain('max-age=0');
  });
});
