/** Rumus dapur yukTakarin! — fungsi murni tanpa DB/UI.
 * Dipakai server (Astro) dan island (Svelte), diuji di tests/kitchen.test.js.
 */

/** Parameter kalibrasi, bukan kebenaran ilmiah. Ubah setelah uji rasa. */
export const BUMBU_EXPONENT = 0.9;

/** Bahan yang tidak tumbuh linier pada porsi besar. */
export const KATEGORI_NONLINEAR = new Set(['pemanis', 'asin', 'pedas', 'ekstrak']);

/** Satuan rumah tangga -> basis ml atau gram (baku Coffee & Kue). */
export const FAKTOR_SATUAN = {
  sejumput: { gram: 1 },
  jumput: { gram: 2 },
  lembar: { gram: 75 },
  sdt: { ml: 5 },
  sdm: { ml: 15 },
  centong: { gram: 100 },
  gelas: { ml: 240 },
  shot: { ml: 30 },
  sloki: { ml: 45 },
  jigger: { ml: 45 },
  genggam: { gram: 35 },
  ruas: { gram: 4 },
  butir: { gram: 55 },
  porsi: { gram: 100 },
  pcs: { gram: 1 },
  gram: { gram: 1 },
  ml: { ml: 1 },
  liter: { ml: 1000 },
};

/** Konversi baku Coffee & Kue */
export const ONGKIR = 15000;

/** Tabel acuan "ilmu kira-kira" untuk tampilan dapur & dokumentasi. */
export const TABEL_KONVERSI = [
  { satuan: 'shot', istilah: '1 shot espresso', ml: 30, gram: 18, catatan: '18 g biji kopi giling; bahan dengan gramPerSatuan memakai angka itu.' },
  { satuan: 'sloki', istilah: '1 sloki / jigger', ml: 45, gram: null, catatan: 'Dipakai untuk sirup atau ekstrak.' },
  { satuan: 'jumput', istilah: '1 jumput', ml: null, gram: 2, catatan: 'Untuk garam, ragi, atau rempah.' },
  { satuan: 'sdt', istilah: '1 sendok teh', ml: 5, gram: 5, catatan: 'Bubuk memakai 5 g, cairan memakai 5 ml.' },
  { satuan: 'sdm', istilah: '1 sendok makan', ml: 15, gram: 15, catatan: 'Bubuk memakai 15 g, cairan memakai 15 ml.' },
  { satuan: 'genggam', istilah: '1 genggam', ml: null, gram: 35, catatan: 'Untuk sayur, keju parut, atau kacang.' },
  { satuan: 'butir', istilah: '1 butir telur', ml: null, gram: 55, catatan: 'Telur ukuran sedang tanpa cangkang.' },
  { satuan: 'centong', istilah: '1 centong', ml: null, gram: 100, catatan: 'Untuk nasi, adonan, atau isian.' },
  { satuan: 'lembar', istilah: '1 lembar puff pastry', ml: null, gram: 75, catatan: 'Lembaran siap pakai ukuran standar.' },
];

const TIDAK_TERUKUR = new Set(['secukupnya', 'sesuai selera', 'seperlunya']);
const SATUAN_CAIR = new Set(['ml', 'liter', 'gelas', 'sloki', 'jigger']);

/** Baris ditampilkan sebagai volume (ml) atau berat (g). */
function satuanTampil(bahan) {
  if (bahan.satuanBeli === 'liter') return 'ml';
  return SATUAN_CAIR.has(String(bahan.satuan ?? '').toLowerCase()) ? 'ml' : 'g';
}

const bulat = (nilai, desimal = 2) => {
  const pangkat = 10 ** desimal;
  return Math.round(nilai * pangkat) / pangkat;
};

/** Gramasi dibulatkan ke angka yang bisa ditimbang dapur. */
export function bulatkanGram(nilai) {
  const angka = Number(nilai);
  if (!Number.isFinite(angka) || angka <= 0) return 0;
  if (angka >= 100) return Math.round(angka / 5) * 5;
  if (angka >= 10) return Math.round(angka);
  return Math.max(0.5, Math.round(angka * 2) / 2);
}

/** Konversi takaran rumah tangga ke gram. */
export function konversiTakaran(jumlah, satuan, bahan = {}) {
  const kunci = String(satuan ?? '').trim().toLowerCase();
  if (TIDAK_TERUKUR.has(kunci)) {
    return { gram: null, tidakTerukur: true, catatan: 'Takaran "secukupnya" tidak dikonversi—ikuti rasa.' };
  }

  const faktor = FAKTOR_SATUAN[kunci];
  if (!faktor) throw new Error(`Satuan tidak dikenal: ${satuan}`);

  const angka = Number(jumlah);
  if (!Number.isFinite(angka) || angka < 0) throw new Error(`Jumlah tidak valid: ${jumlah}`);

  if (faktor.gram !== undefined) {
    const gramPerSatuan = Number(bahan.gramPerSatuan ?? faktor.gram);
    return { gram: bulat(angka * gramPerSatuan), ml: null, tidakTerukur: false };
  }

  const ml = bulat(angka * faktor.ml);
  // Satu shot espresso = 30 ml; untuk biji kopi, gramPerSatuan (18 g) yang dipakai.
  if (kunci === 'shot' && Number(bahan.gramPerSatuan) > 0) {
    return { gram: bulat(angka * Number(bahan.gramPerSatuan)), ml, tidakTerukur: false };
  }

  const densitas = Number(bahan.densitas ?? 1);
  return { gram: bulat(ml * densitas), ml, tidakTerukur: false };
}

/** Berat gram -> satuan belanja pasar (g / kg). */
export function formatBerat(gram) {
  const angka = Number(gram);
  if (!Number.isFinite(angka) || angka <= 0) return '0 g';
  if (angka < 1000) return `${Math.round(angka * 10) / 10} g`;
  return `${Math.round((angka / 1000) * 100) / 100} kg`;
}

/** Volume ml -> ml/liter untuk cairan (susu, air, sirup, gula cair). */
export function formatVolume(ml) {
  const angka = Number(ml);
  if (!Number.isFinite(angka) || angka <= 0) return '0 ml';
  if (angka < 1000) return `${Math.round(angka * 10) / 10} ml`;
  return `${Math.round((angka / 1000) * 100) / 100} liter`;
}

/** Pilih format gram atau ml sesuai jenis baris. */
export function formatTakaran(nilai, jenis = 'g') {
  return jenis === 'ml' ? formatVolume(nilai) : formatBerat(nilai);
}

/** Validasi jumlah pesanan terhadap stok tersedia. */
export function validasiStok({ jumlah, stok, minOrder = 1 }) {
  const porsi = Number(jumlah);
  const tersedia = Number(stok);
  if (!Number.isFinite(tersedia) || tersedia <= 0) {
    return { valid: false, pesan: 'Stok habis (Sold Out).' };
  }
  if (!Number.isInteger(porsi) || porsi < Number(minOrder)) {
    return { valid: false, pesan: `Jumlah minimal ${minOrder}.` };
  }
  if (porsi > tersedia) {
    return { valid: false, pesan: `Stok tersisa ${tersedia}.` };
  }
  return { valid: true };
}

/** Skala seluruh baris resep ke jumlah porsi pesanan. */
export function skalaResep(resep = [], porsiDasar, porsiPesanan) {
  const dasar = Number(porsiDasar);
  const pesanan = Number(porsiPesanan);
  if (!(dasar > 0)) throw new Error('porsiDasar harus lebih dari 0');
  if (!(pesanan > 0)) throw new Error('porsiPesanan harus lebih dari 0');

  const faktor = pesanan / dasar;

  const baris = resep.map((bahan) => {
    const konversi = konversiTakaran(bahan.jumlah, bahan.satuan, bahan);
    const takaranKiraKira =
      bahan.takaranKiraKira ?? `${bahan.jumlah} ${bahan.satuan}`.trim();

    if (konversi.tidakTerukur) {
      return {
        ...bahan,
        takaranRumah: `${bahan.jumlah} ${bahan.satuan}`.trim(),
        takaranKiraKira,
        gramasiDasar: null,
        gramasi: null,
        ml: null,
        gramPerPorsi: null,
        mlPerPorsi: null,
        nonLinear: false,
        catatan: konversi.catatan,
      };
    }

    const nonLinear = KATEGORI_NONLINEAR.has(String(bahan.kategori ?? '').toLowerCase());
    const pengali = nonLinear ? faktor ** BUMBU_EXPONENT : faktor;
    const isi = Number(bahan.isiPerSatuan ?? 1000) || 1000;

    return {
      ...bahan,
      takaranRumah: `${bahan.jumlah} ${bahan.satuan}`.trim(),
      takaranKiraKira,
      gramasiDasar: konversi.gram,
      gramasi: bulatkanGram(konversi.gram * pengali),
      ml: konversi.ml === null ? null : bulat(konversi.ml * pengali, 1),
      gramPerPorsi: bulat(konversi.gram / dasar, 1),
      mlPerPorsi: konversi.ml === null ? null : bulat(konversi.ml / dasar, 1),
      jumlahSatuan: bulat(konversi.gram / isi, 3),
      satuanDasar: bahan.satuanBeli ?? 'kg',
      hargaPerKg: Number(bahan.hargaSatuan ?? 0),
      substitusiSaran: bahan.substitusiSaran ?? bahan.substitusi ?? null,
      satuanTampil: satuanTampil(bahan),
      nonLinear,
      catatan: bahan.catatan ?? null,
    };
  });

  const peringatan = baris
    .filter((b) => b.gramasiDasar && b.gramasi / b.gramasiDasar > 3)
    .map((b) => `${b.nama} naik ${Math.round((b.gramasi / b.gramasiDasar) * 10) / 10}×—periksa kapasitas alat.`);

  return {
    faktor,
    baris,
    totalGram: Math.round(baris.reduce((total, b) => total + (b.gramasi ?? 0), 0)),
    totalMl: Math.round(baris.reduce((total, b) => total + (b.ml ?? 0), 0)),
    totalGramPerPorsi: Math.round(baris.reduce((total, b) => total + (b.gramPerPorsi ?? 0), 0)),
    totalMlPerPorsi: Math.round(baris.reduce((total, b) => total + (b.mlPerPorsi ?? 0), 0)),
    peringatan,
  };
}

/** Komposisi aman-publik untuk modal katalog: nama, takaran, gramasi per porsi. */
export function komposisiPublik(resep = [], porsiDasar = 1) {
  const dasar = Number(porsiDasar) > 0 ? Number(porsiDasar) : 1;
  return resep.map((bahan) => {
    const konversi = konversiTakaran(bahan.jumlah, bahan.satuan, bahan);
    return {
      slug: bahan.slug,
      nama: bahan.nama,
      jumlah: Number(bahan.jumlah),
      satuan: bahan.satuan,
      kategori: bahan.kategori ?? 'utama',
      takaranKiraKira: bahan.takaranKiraKira ?? `${bahan.jumlah} ${bahan.satuan}`.trim(),
      gramPerPorsi: konversi.tidakTerukur ? null : bulat(konversi.gram / dasar, 1),
      mlPerPorsi: konversi.tidakTerukur || konversi.ml === null ? null : bulat(konversi.ml / dasar, 1),
      satuanTampil: satuanTampil(bahan),
    };
  });
}

/** HPP per porsi dari baris resep (takaran untuk porsiDasar). */
export function hitungHpp({ resep = [], porsiDasar, biayaKemasan = 0, biayaOperasional = 0, hargaOverride = {} }) {
  const dasar = Number(porsiDasar);
  if (!(dasar > 0)) throw new Error('porsiDasar harus lebih dari 0');

  const rincian = [];
  let totalBahan = 0;

  for (const bahan of resep) {
    const konversi = konversiTakaran(bahan.jumlah, bahan.satuan, bahan);
    if (konversi.tidakTerukur) continue;

    const harga = Number(hargaOverride[bahan.slug] ?? bahan.hargaSatuan ?? 0);
    const isi = Number(bahan.isiPerSatuan ?? 1000) || 1000;
    const biaya = (konversi.gram / isi) * harga;
    totalBahan += biaya;
    rincian.push({ slug: bahan.slug, nama: bahan.nama, gramasi: konversi.gram, biaya: Math.round(biaya) });
  }

  const hppBahan = totalBahan / dasar;
  const hppPerPorsi = hppBahan + Number(biayaKemasan ?? 0) + Number(biayaOperasional ?? 0);

  return {
    hppBahan: Math.round(hppBahan),
    hppPerPorsi: Math.round(hppPerPorsi),
    totalBahan: Math.round(totalBahan),
    rincian,
  };
}

/** Harga jual yang dibandingkan dengan HPP selalu per satu porsi. */
export function hargaPerPorsi(produk) {
  const perSatuan = Number(produk?.porsiPerSatuan ?? 1) || 1;
  return Number(produk?.harga ?? 0) / perSatuan;
}

export function marginPersen(hargaJual, hppPerPorsi) {
  const harga = Number(hargaJual);
  if (!(harga > 0)) return 0;
  return Math.round(((harga - Number(hppPerPorsi)) / harga) * 1000) / 10;
}

export function statusMargin(margin, kenaikanMaks = 0) {
  if (margin < 30 || kenaikanMaks > 20) return 'KRITIS';
  if (margin < 40 || kenaikanMaks > 10) return 'WASPADA';
  return 'AMAN';
}

/** Simulasi kenaikan harga satu bahan terhadap HPP & margin produk. */
export function simulasiInflasi({ produk, slugBahan, persen }) {
  const kenaikan = Math.max(0, Number(persen) || 0);
  const resep = produk.resep ?? [];
  const bahan = resep.find((b) => b.slug === slugBahan);

  const hargaOverride = {};
  if (bahan) {
    hargaOverride[slugBahan] = Number(bahan.hargaSatuan) * (1 + kenaikan / 100);
  }

  const opsi = {
    resep,
    porsiDasar: produk.porsiDasar,
    biayaKemasan: produk.biayaKemasan,
    biayaOperasional: produk.biayaOperasional,
  };

  const sebelum = hitungHpp(opsi);
  const sesudah = hitungHpp({ ...opsi, hargaOverride });

  const hargaPorsi = hargaPerPorsi(produk);
  const marginAwal = marginPersen(hargaPorsi, sebelum.hppPerPorsi);
  const marginAkhir = marginPersen(hargaPorsi, sesudah.hppPerPorsi);
  const status = statusMargin(marginAkhir, kenaikan);

  return {
    bahan: bahan ? { slug: bahan.slug, nama: bahan.nama, substitusi: bahan.substitusi } : null,
    kenaikan,
    hppAwal: sebelum.hppPerPorsi,
    hppAkhir: sesudah.hppPerPorsi,
    marginAwal,
    marginAkhir,
    status,
    saran: saranPenyesuaian({
      produk,
      margin: marginAkhir,
      hppPerPorsi: sesudah.hppPerPorsi,
      bahanTerdampak: bahan,
      kenaikanMaks: kenaikan,
    }),
  };
}

/** Saran deterministik; tidak pernah diterapkan otomatis. */
export function saranPenyesuaian({
  produk,
  margin,
  hppPerPorsi,
  bahanTerdampak,
  kenaikanMaks = 0,
  targetMargin = 40,
}) {
  const saran = [];
  const hargaJual = hargaPerPorsi(produk);
  const aman = margin >= targetMargin && kenaikanMaks <= 10;
  if (aman) return saran;

  if (bahanTerdampak?.substitusi) {
    saran.push({
      jenis: 'substitusi',
      judul: `Substitusi ${bahanTerdampak.nama}`,
      detail: bahanTerdampak.substitusi,
      dampak: 'HPP turun dengan profil rasa terdekat.',
    });
  }

  if (hargaJual > 0 && hppPerPorsi > 0) {
    const hargaBaru = Math.ceil(hppPerPorsi / (1 - targetMargin / 100) / 1000) * 1000;
    if (hargaBaru > hargaJual) {
      saran.push({
        jenis: 'harga',
        judul: 'Sesuaikan harga jual',
        detail: `Naikkan ke ${formatRupiah(hargaBaru)} per ${produk.satuan ?? 'porsi'} untuk margin ${targetMargin}%.`,
        dampak: `Selisih ${formatRupiah(hargaBaru - hargaJual)} per unit.`,
      });
    }
  }

  if (bahanTerdampak && KATEGORI_NONLINEAR.has(String(bahanTerdampak.kategori ?? ''))) {
    saran.push({
      jenis: 'takaran',
      judul: 'Kurangi takaran bumbu 10%',
      detail: `Turunkan ${bahanTerdampak.nama} maksimum 10–15% dan cicipi sebelum produksi besar.`,
      dampak: 'Margin naik tipis tanpa mengubah karakter rasa.',
    });
  }

  if (margin < 0) {
    saran.push({
      jenis: 'hentikan',
      judul: 'Tinjau harga sebelum menerima pesanan',
      detail: 'HPP melebihi harga jual. Tahan promo dan hitung ulang porsi.',
      dampak: 'Mencegah kerugian pada setiap unit terjual.',
    });
  }

  return saran;
}

export function parseJam(jam) {
  const cocok = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(jam ?? '').trim());
  if (!cocok) throw new Error('Format jam harus HH:MM');
  return Number(cocok[1]) * 60 + Number(cocok[2]);
}

export function formatMenit(totalMenit) {
  const angka = Number(totalMenit);
  if (!Number.isFinite(angka)) return '--:--';
  const dibungkus = ((Math.round(angka) % 1440) + 1440) % 1440;
  const jam = String(Math.floor(dibungkus / 60)).padStart(2, '0');
  const menit = String(dibungkus % 60).padStart(2, '0');
  return `${jam}.${menit}`;
}

/** Susun jadwal kerja mundur dari jam kirim/ambil pelanggan. */
export function susunTimeline({
  jamKirim,
  prepMenit = 0,
  prosesMenit = 0,
  packingMenit = 0,
  tempuhMenit = 20,
  bufferMenit = 10,
  praProsesMenit = 0,
  peracikanMenit = 0,
  praProsesLabel = 'Pra-proses panjang',
  peracikanLabel = 'Peracikan akhir',
}) {
  const tiba = parseJam(jamKirim);
  const angka = (nilai, nama) => {
    const n = Number(nilai);
    if (!Number.isFinite(n) || n < 0) throw new Error(`${nama} harus angka >= 0`);
    return n;
  };

  const prep = angka(prepMenit, 'prepMenit');
  const proses = angka(prosesMenit, 'prosesMenit');
  const packing = angka(packingMenit, 'packingMenit');
  const tempuh = angka(tempuhMenit, 'tempuhMenit');
  const buffer = angka(bufferMenit, 'bufferMenit');

  const praProses = angka(praProsesMenit, 'praProsesMenit');
  const peracikan = angka(peracikanMenit, 'peracikanMenit');

  const berangkat = tiba - tempuh;
  const selesaiPeracikan = berangkat - buffer;
  const mulaiPeracikan = selesaiPeracikan - peracikan;
  const selesaiPacking = mulaiPeracikan;
  const mulaiPacking = selesaiPacking - packing;
  const mulaiProses = mulaiPacking - proses;
  const mulaiPersiapan = mulaiProses - prep;
  const mulaiPraProses = mulaiPersiapan - praProses;

  const label = (menit) => `${formatMenit(menit)}${menit < 0 ? ' (H-1)' : ''}`;
  const segmen = [
    praProses > 0 && { kode: 'PRAPROSES', label: praProsesLabel, mulai: mulaiPraProses, selesai: mulaiPersiapan, durasiMenit: praProses },
    { kode: 'PERSIAPAN', label: 'Persiapan bahan', mulai: mulaiPersiapan, selesai: mulaiProses, durasiMenit: prep },
    { kode: 'PROSES', label: 'Seduh / panggang', mulai: mulaiProses, selesai: mulaiPacking, durasiMenit: proses },
    { kode: 'PACKING', label: 'Packing', mulai: mulaiPacking, selesai: selesaiPacking, durasiMenit: packing },
    peracikan > 0 && { kode: 'PERACIKAN', label: peracikanLabel, mulai: mulaiPeracikan, selesai: selesaiPeracikan, durasiMenit: peracikan },
    { kode: 'KIRIM', label: 'Kirim / ambil', mulai: berangkat, selesai: tiba, durasiMenit: tempuh },
  ]
    .filter(Boolean)
    .map((s) => ({ ...s, mulaiLabel: label(s.mulai), selesaiLabel: label(s.selesai) }));

  return {
    mulaiPersiapan,
    mulaiPersiapanLabel: label(mulaiPersiapan),
    mulaiPraProses,
    mulaiPraProsesLabel: label(mulaiPraProses),
    tiba,
    tibaLabel: label(tiba),
    totalMenit: praProses + prep + proses + packing + peracikan + tempuh + buffer,
    segmen,
  };
}

/** Fase khusus coffee & kue: cold brew / proofing adonan jauh sebelum proses,
 * dan peracikan minuman dingin dekat jam kirim agar es tidak mencair.
 */
export function faseKhususKafe(produk) {
  const kategori = String(produk?.kategori ?? '').toLowerCase();
  const nama = String(produk?.nama ?? '').toLowerCase();

  if (kategori.includes('kopi')) {
    const praProsesMenit = /cold brew|drip|fermentasi/.test(nama) ? 720 : 0;
    return {
      praProsesMenit,
      praProsesLabel: 'Cold brew / ekstraksi dingin',
      peracikanMenit: 15,
      peracikanLabel: 'Peracikan minuman dingin (es)',
    };
  }

  if (kategori.includes('pastry') || kategori.includes('roti')) {
    return {
      praProsesMenit: 180,
      praProsesLabel: 'Proofing / marinasi adonan',
      peracikanMenit: 0,
      peracikanLabel: 'Peracikan akhir',
    };
  }

  if (kategori.includes('kue') || kategori.includes('box')) {
    return {
      praProsesMenit: 60,
      praProsesLabel: 'Pendinginan / setting',
      peracikanMenit: 0,
      peracikanLabel: 'Peracikan akhir',
    };
  }

  return { praProsesMenit: 0, praProsesLabel: 'Pra-proses panjang', peracikanMenit: 0, peracikanLabel: 'Peracikan akhir' };
}

export function statusSegmen(sekarangMenit, segmen) {
  const sekarang = Number(sekarangMenit);
  const sisa = segmen.selesai - sekarang;
  const durasi = Math.max(1, segmen.durasiMenit ?? segmen.selesai - segmen.mulai);

  if (sekarang < segmen.mulai) return { status: 'MENUNGGU', sisaMenit: sisa };
  if (sisa < 0) return { status: 'TERLAMBAT', sisaMenit: sisa };
  if (sisa <= durasi * 0.25) return { status: 'WASPADA', sisaMenit: sisa };
  return { status: 'JALAN', sisaMenit: sisa };
}

/** Validasi checkout. Mengembalikan daftar galat per field. */
export function validasiPesanan({
  jumlah,
  minOrder = 1,
  tanggal,
  jamKirim,
  nama = '',
  mode = 'kirim',
  jamBuka = '07:00',
  jamTutup = '21:00',
}) {
  const galat = [];

  const porsi = Number(jumlah);
  if (!Number.isInteger(porsi) || porsi < Number(minOrder)) {
    galat.push({ field: 'jumlah', pesan: `Jumlah minimal ${minOrder}.` });
  }

  if (!String(nama).trim()) {
    galat.push({ field: 'nama', pesan: 'Nama pemesan wajib diisi.' });
  }

  if (mode !== 'ambil' && mode !== 'kirim') {
    galat.push({ field: 'mode', pesan: 'Pilih ambil atau kirim.' });
  }

  if (!tanggal) {
    galat.push({ field: 'tanggal', pesan: 'Tanggal wajib dipilih.' });
  } else {
    const dipilih = new Date(`${tanggal}T00:00:00`);
    const hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0);
    if (Number.isNaN(dipilih.getTime())) {
      galat.push({ field: 'tanggal', pesan: 'Tanggal tidak valid.' });
    } else if (dipilih < hariIni) {
      galat.push({ field: 'tanggal', pesan: 'Tanggal tidak boleh di masa lalu.' });
    }
  }

  try {
    const menit = parseJam(jamKirim);
    const buka = parseJam(jamBuka);
    const tutup = parseJam(jamTutup);
    if (menit < buka || menit > tutup) {
      galat.push({ field: 'jamKirim', pesan: `Jam layanan ${jamBuka}–${jamTutup}.` });
    } else if (menit % 30 !== 0) {
      galat.push({ field: 'jamKirim', pesan: 'Jam harus kelipatan 30 menit.' });
    }
  } catch {
    galat.push({ field: 'jamKirim', pesan: 'Jam kirim wajib dipilih.' });
  }

  return { valid: galat.length === 0, errors: galat };
}


export function formatRupiah(nilai) {
  const angka = Number(nilai);
  if (!Number.isFinite(angka)) return 'Rp0';
  return `Rp${Math.round(angka).toLocaleString('id-ID')}`;
}