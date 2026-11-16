/**
 * Akses data menu. Memakai Neon bila DATABASE_URL diisi, selain itu seed lokal
 * in-memory. Kegagalan koneksi TIDAK diam-diam jatuh ke seed—galat diteruskan.
 */
import { and, asc, desc, eq, gte, sql } from 'drizzle-orm';
import { adaDatabase, db } from '../db/index.js';
import { ingredients, orders, products, recipes } from '../db/schema.js';
import { BAHAN, MENU } from '../db/seed-data.js';
import { komposisiPublik } from './kitchen.js';

const FIELD_PUBLIK = [
  'id',
  'slug',
  'nama',
  'deskripsi',
  'kategori',
  'harga',
  'satuan',
  'minOrder',
  'porsiPerSatuan',
  'porsiDasar',
  'stok',
  'imageUrl',
];

const BAHAN_LOKAL = [...BAHAN];

let idPesananBerikut = 1;
const storePesanan = [];

function galat(pesan, status) {
  const error = new Error(pesan);
  error.status = status;
  return error;
}

function slugify(nama) {
  return String(nama)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const tanggalJakarta = (nilai = new Date()) =>
  new Date(nilai).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

function lengkapiResep(daftar = []) {
  return daftar.map((baris, urutan) => {
    const bahan = BAHAN_LOKAL.find((item) => item.slug === (baris.bahan ?? baris.slug));
    if (!bahan) throw galat(`Bahan tidak dikenal: ${baris.bahan ?? baris.slug}`, 400);
    return {
      slug: bahan.slug,
      nama: bahan.nama,
      jumlah: Number(baris.jumlah),
      satuan: baris.satuan,
      kategori: bahan.kategori,
      densitas: bahan.densitas,
      gramPerSatuan: bahan.gramPerSatuan ?? null,
      hargaSatuan: bahan.hargaSatuan,
      isiPerSatuan: bahan.isiPerSatuan,
      satuanBeli: bahan.satuanBeli ?? 'kg',
      substitusi: bahan.substitusi ?? null,
      takaranKiraKira: baris.takaranKiraKira ?? null,
      catatan: baris.catatan ?? null,
      urutan,
    };
  });
}

/* ------------------------------- seed lokal ------------------------------- */

let idBerikut = 1;
const storeProduk = MENU.map((menu) => ({
  id: idBerikut++,
  ...menu,
  resep: lengkapiResep(menu.resep),
}));

function bentukPublik(produk) {
  return {
    ...Object.fromEntries(FIELD_PUBLIK.map((field) => [field, produk[field] ?? null])),
    komposisi: komposisiPublik(produk.resep ?? [], produk.porsiDasar),
  };
}

/* --------------------------- validasi & normalisasi ------------------------ */

function angkaWajib(nilai, nama, minimum = 0) {
  const angka = Number(nilai);
  if (!Number.isFinite(angka) || angka < minimum) {
    throw galat(`${nama} harus angka >= ${minimum}.`, 400);
  }
  return Math.round(angka);
}

function normalisasi(input, lama = {}) {
  const nama = String(input.nama ?? lama.nama ?? '').trim();
  const kategori = String(input.kategori ?? lama.kategori ?? '').trim();
  if (!nama) throw galat('Nama menu wajib diisi.', 400);
  if (!kategori) throw galat('Kategori wajib dipilih.', 400);

  const harga = angkaWajib(input.harga ?? lama.harga, 'Harga', 1);
  const porsiDasar = angkaWajib(input.porsiDasar ?? lama.porsiDasar, 'Porsi dasar', 1);

  return {
    slug: String(input.slug ?? lama.slug ?? slugify(nama)).trim() || slugify(nama),
    nama,
    deskripsi: String(input.deskripsi ?? lama.deskripsi ?? '').trim(),
    kategori,
    harga,
    satuan: String(input.satuan ?? lama.satuan ?? 'pcs').trim() || 'pcs',
    minOrder: angkaWajib(input.minOrder ?? lama.minOrder ?? 1, 'Minimum pesanan', 1),
    porsiDasar,
    porsiPerSatuan: angkaWajib(input.porsiPerSatuan ?? lama.porsiPerSatuan ?? 1, 'Porsi per satuan', 1),
    prepMenit: angkaWajib(input.prepMenit ?? lama.prepMenit ?? 0, 'Waktu persiapan'),
    prosesLabel: String(input.prosesLabel ?? lama.prosesLabel ?? 'Proses').trim() || 'Proses',
    prosesMenit: angkaWajib(input.prosesMenit ?? lama.prosesMenit ?? 0, 'Waktu proses'),
    packingMenit: angkaWajib(input.packingMenit ?? lama.packingMenit ?? 0, 'Waktu packing'),
    biayaKemasan: angkaWajib(input.biayaKemasan ?? lama.biayaKemasan ?? 0, 'Biaya kemasan'),
    biayaOperasional: angkaWajib(input.biayaOperasional ?? lama.biayaOperasional ?? 0, 'Biaya operasional'),
    instruksiDapur: String(input.instruksiDapur ?? lama.instruksiDapur ?? '').trim() || null,
    imageUrl: input.imageUrl ?? lama.imageUrl ?? null,
    aktif: input.aktif ?? lama.aktif ?? true,
    stok: angkaWajib(input.stok ?? lama.stok ?? 0, 'Stok', 0),
  };
}

function pastikanBahanLokal(baris) {
  if (baris.bahan || baris.slug) {
    const slug = baris.bahan ?? baris.slug;
    const ada = BAHAN_LOKAL.find((item) => item.slug === slug);
    if (ada) return slug;
  }
  if (baris.namaBahan) {
    const slug = slugify(baris.namaBahan);
    let ada = BAHAN_LOKAL.find((item) => item.slug === slug);
    if (!ada) {
      const satuanBeli = baris.satuanDasar ?? 'kg';
      const isiPerSatuan = ['kg', 'liter'].includes(satuanBeli) ? 1000 : 1;
      ada = {
        slug,
        nama: baris.namaBahan,
        satuanBeli,
        isiPerSatuan,
        hargaSatuan: Math.round(Number(baris.hargaPerKg ?? 0)),
        kategori: 'utama',
        densitas: 1,
        gramPerSatuan: null,
        substitusi: baris.substitusiSaran ?? null,
      };
      BAHAN_LOKAL.push(ada);
    }
    return slug;
  }
  return baris.bahan ?? baris.slug ?? null;
}

function barisResepMasuk(input) {
  if (!Array.isArray(input.resep)) return null;
  return input.resep
    .filter((baris) => baris && (baris.bahan || baris.slug || baris.namaBahan))
    .map((baris) => ({
      bahan: pastikanBahanLokal(baris),
      namaBahan: baris.namaBahan ?? null,
      satuanDasar: baris.satuanDasar ?? null,
      jumlahSatuan: baris.jumlahSatuan ?? null,
      hargaPerKg: baris.hargaPerKg ?? null,
      substitusiSaran: baris.substitusiSaran ?? null,
      jumlah: Number(baris.jumlah) || 0,
      satuan: String(baris.satuan ?? 'gram'),
      takaranKiraKira: baris.takaranKiraKira ?? null,
      catatan: baris.catatan ?? null,
    }));
}

/* --------------------------------- Neon ---------------------------------- */

async function barisResepDatabase() {
  const rows = await db
    .select({
      productId: recipes.productId,
      jumlah: recipes.jumlah,
      satuan: recipes.satuan,
      urutan: recipes.urutan,
      takaranKiraKira: recipes.takaranKiraKira,
      catatan: recipes.catatan,
      slug: ingredients.slug,
      nama: ingredients.nama,
      kategori: ingredients.kategori,
      densitas: ingredients.densitas,
      gramPerSatuan: ingredients.gramPerSatuan,
      hargaSatuan: ingredients.hargaSatuan,
      isiPerSatuan: ingredients.isiPerSatuan,
      satuanBeli: ingredients.satuanBeli,
      substitusi: ingredients.substitusi,
    })
    .from(recipes)
    .innerJoin(ingredients, eq(recipes.ingredientId, ingredients.id))
    .orderBy(asc(recipes.productId), asc(recipes.urutan));

  const peta = new Map();
  for (const { productId, ...baris } of rows) {
    if (!peta.has(productId)) peta.set(productId, []);
    peta.get(productId).push(baris);
  }
  return peta;
}

async function daftarDariDatabase() {
  const [rows, resep] = await Promise.all([
    db.select().from(products).orderBy(asc(products.id)),
    barisResepDatabase(),
  ]);
  return rows.map((row) => ({ ...row, resep: resep.get(row.id) ?? [] }));
}

async function idBahanDatabase() {
  const rows = await db.select({ id: ingredients.id, slug: ingredients.slug }).from(ingredients);
  return new Map(rows.map((row) => [row.slug, row.id]));
}

async function pastikanBahanDatabase(baris) {
  const slug = baris.bahan ?? (baris.namaBahan ? slugify(baris.namaBahan) : null);
  if (!slug) return null;
  const [ada] = await db.select().from(ingredients).where(eq(ingredients.slug, slug)).limit(1);
  if (ada) return slug;
  if (!baris.namaBahan) return slug;
  const satuanBeli = baris.satuanDasar ?? 'kg';
  const isiPerSatuan = ['kg', 'liter'].includes(satuanBeli) ? 1000 : 1;
  await db.insert(ingredients).values({
    slug,
    nama: baris.namaBahan,
    satuanBeli,
    isiPerSatuan,
    hargaSatuan: Math.round(Number(baris.hargaPerKg ?? 0)),
    kategori: 'utama',
    densitas: 1,
    substitusi: baris.substitusiSaran ?? null,
  });
  return slug;
}

async function simpanResepDatabase(productId, daftar) {
  if (!daftar) return;
  for (const baris of daftar) {
    const slug = await pastikanBahanDatabase(baris);
    if (slug) baris.bahan = slug;
  }
  const peta = await idBahanDatabase();
  await db.delete(recipes).where(eq(recipes.productId, productId));
  const siap = daftar
    .map((baris, urutan) => {
      const ingredientId = peta.get(baris.bahan);
      if (!ingredientId) throw galat(`Bahan tidak ditemukan: ${baris.bahan ?? baris.namaBahan}`, 400);
      return {
        productId,
        ingredientId,
        jumlah: Number(baris.jumlah) || 0,
        satuan: String(baris.satuan ?? 'gram'),
        urutan,
        takaranKiraKira: baris.takaranKiraKira ?? null,
        catatan: baris.catatan ?? null,
      };
    })
    .filter((baris) => baris.jumlah > 0);
  if (siap.length) await db.insert(recipes).values(siap);
}

/* --------------------------------- API ----------------------------------- */

export function modeData() {
  return adaDatabase ? 'neon' : 'seed';
}

export async function daftarProduk({ publik = false } = {}) {
  const data = adaDatabase ? await daftarDariDatabase() : storeProduk;
  return publik ? data.filter((p) => p.aktif !== false).map(bentukPublik) : data;
}

export async function daftarBahan() {
  if (adaDatabase) {
    return db.select().from(ingredients).orderBy(asc(ingredients.id));
  }
  return BAHAN_LOKAL;
}

export async function ambilProduk(id) {
  const kunci = Number(id);
  if (adaDatabase) {
    const [row] = await db.select().from(products).where(eq(products.id, kunci)).limit(1);
    if (!row) throw galat('Menu tidak ditemukan.', 404);
    const peta = await barisResepDatabase();
    return { ...row, resep: peta.get(kunci) ?? [] };
  }
  const produk = storeProduk.find((item) => item.id === kunci);
  if (!produk) throw galat('Menu tidak ditemukan.', 404);
  return produk;
}

export async function buatProduk(input) {
  const data = normalisasi(input);
  const resepMasuk = barisResepMasuk(input);

  if (adaDatabase) {
    const [row] = await db.insert(products).values(data).returning({ id: products.id });
    await simpanResepDatabase(row.id, resepMasuk);
    return ambilProduk(row.id);
  }

  if (storeProduk.some((item) => item.slug === data.slug)) {
    throw galat('Slug menu sudah dipakai.', 400);
  }
  const produk = {
    id: idBerikut++,
    ...data,
    resep: lengkapiResep(resepMasuk ?? []),
  };
  storeProduk.push(produk);
  return produk;
}

export async function ubahProduk(id, input) {
  const kunci = Number(id);

  if (adaDatabase) {
    const lama = await ambilProduk(kunci);
    const data = normalisasi(input, lama);
    await db.update(products).set(data).where(eq(products.id, kunci));
    await simpanResepDatabase(kunci, barisResepMasuk(input));
    return ambilProduk(kunci);
  }

  const indeks = storeProduk.findIndex((item) => item.id === kunci);
  if (indeks === -1) throw galat('Menu tidak ditemukan.', 404);
  const lama = storeProduk[indeks];
  const data = normalisasi(input, lama);
  const resepMasuk = barisResepMasuk(input);
  storeProduk[indeks] = {
    ...lama,
    ...data,
    resep: resepMasuk ? lengkapiResep(resepMasuk) : lama.resep,
  };
  return storeProduk[indeks];
}

export async function hapusProduk(id) {
  const kunci = Number(id);

  if (adaDatabase) {
    const terhapus = await db.delete(products).where(eq(products.id, kunci)).returning({ id: products.id });
    if (!terhapus.length) throw galat('Menu tidak ditemukan.', 404);
    return { id: kunci };
  }

  const indeks = storeProduk.findIndex((item) => item.id === kunci);
  if (indeks === -1) throw galat('Menu tidak ditemukan.', 404);
  storeProduk.splice(indeks, 1);
  return { id: kunci };
}

/* ------------------------------ Pesanan & stok ----------------------------- */

export async function daftarPesanan({ hariIni = false } = {}) {
  const semua = adaDatabase ? await db.select().from(orders).orderBy(desc(orders.id)) : [...storePesanan];
  if (!hariIni) return semua;
  const hari = tanggalJakarta();
  return semua.filter((row) => row.dibuatPada && tanggalJakarta(row.dibuatPada) === hari);
}

export async function ambilPesanan(id) {
  const kunci = Number(id);
  if (!Number.isInteger(kunci)) throw galat('ID pesanan tidak valid.', 400);
  if (adaDatabase) {
    const [row] = await db.select().from(orders).where(eq(orders.id, kunci)).limit(1);
    if (!row) throw galat('Pesanan tidak ditemukan.', 404);
    return row;
  }
  const pesanan = storePesanan.find((item) => item.id === kunci);
  if (!pesanan) throw galat('Pesanan tidak ditemukan.', 404);
  return pesanan;
}

const ONGKIR = 15000; // samakan dengan ONGKIR di Catalog.svelte

export async function buatPesanan(input = {}) {
  const mode = input.mode === 'ambil' ? 'ambil' : 'kirim';
  const jumlahPorsi = angkaWajib(input.jumlahPorsi ?? input.jumlah ?? 1, 'Jumlah porsi', 1);
  const productId = input.productId != null ? Number(input.productId) : null;

  let namaMenu = String(input.namaMenu ?? input.nama_menu ?? '').trim();
  let totalHarga = angkaWajib(input.totalHarga ?? input.total_harga ?? 0, 'Total harga', 0);

  // Kalau menu dikenal, harga & nama diambil dari database, bukan dari browser.
  if (productId != null) {
    const produk = await ambilProduk(productId);
    if (produk.aktif === false) throw galat('Menu sedang tidak tersedia.', 400);
    if (jumlahPorsi < (produk.minOrder ?? 1)) throw galat(`Jumlah minimal ${produk.minOrder}.`, 400);
    if (produk.stok != null && jumlahPorsi > produk.stok) throw galat('Stok tidak cukup.', 400);
    namaMenu = produk.nama;
    totalHarga = produk.harga * jumlahPorsi + (mode === 'kirim' ? ONGKIR : 0);
  }

  const data = {
    productId,
    namaMenu,
    jumlahPorsi,
    jamKirim: String(input.jamKirim ?? input.jam_kirim ?? '12:00'),
    tanggalKirim: input.tanggal ?? input.tanggalKirim ?? input.tanggal_kirim ?? null,
    mode,
    totalHarga,
    catatan: input.catatan ?? null,
    namaPemesan: input.nama ?? input.namaPemesan ?? input.nama_pemesan ?? null,
    status: 'Menunggu',
    payment_status: 'pending',
  };
  if (!data.namaMenu) throw galat('Nama menu wajib diisi.', 400);

  if (adaDatabase) {
    const [row] = await db.insert(orders).values(data).returning();
    return row;
  }
  const pesanan = { id: idPesananBerikut++, ...data, dibuatPada: new Date().toISOString() };
  storePesanan.push(pesanan);
  return pesanan;
}

export async function ubahStatusPesanan(id, status) {
  const kunci = Number(id);
  const allowed = ['Menunggu', 'Diproses', 'Selesai'];
  if (!allowed.includes(status)) throw galat('Status tidak valid.', 400);
  if (adaDatabase) {
    const [row] = await db.update(orders).set({ status }).where(eq(orders.id, kunci)).returning();
    if (!row) throw galat('Pesanan tidak ditemukan.', 404);
    return row;
  }
  const pesanan = storePesanan.find((item) => item.id === kunci);
  if (!pesanan) throw galat('Pesanan tidak ditemukan.', 404);
  pesanan.status = status;
  return pesanan;
}

export async function ubahStatusBayar(id, status) {
  const boleh = ['pending', 'paid', 'failed', 'refunded'];
  if (!boleh.includes(status)) throw galat('Status pembayaran tidak valid.', 400);
  const lama = await ambilPesanan(id);
  if (lama.payment_status === 'paid' && status === 'pending') return lama; // jangan turunkan status
  if (adaDatabase) {
    const [row] = await db.update(orders).set({ payment_status: status }).where(eq(orders.id, lama.id)).returning();
    return row;
  }
  lama.payment_status = status;
  return lama;
}

export async function potongStok(productId, jumlah) {
  const kunci = Number(productId);
  const jml = Number(jumlah);
  if (!Number.isFinite(jml) || jml <= 0) throw galat('Jumlah potong harus > 0.', 400);

  if (adaDatabase) {
    // Atomic: hanya berhasil kalau stok masih cukup.
    const [row] = await db
      .update(products)
      .set({ stok: sql`${products.stok} - ${jml}` })
      .where(and(eq(products.id, kunci), gte(products.stok, jml)))
      .returning();
    if (row) return row;
    const [ada] = await db.select({ id: products.id }).from(products).where(eq(products.id, kunci)).limit(1);
    throw ada ? galat('Stok tidak cukup.', 400) : galat('Menu tidak ditemukan.', 404);
  }

  const produk = storeProduk.find((item) => item.id === kunci);
  if (!produk) throw galat('Menu tidak ditemukan.', 404);
  if ((produk.stok ?? 0) < jml) throw galat('Stok tidak cukup.', 400);
  produk.stok -= jml;
  return produk;
}

export async function terapkanInflasi({ slugBahan, persen }) {
  const kenaikan = Math.max(0, Number(persen) || 0);
  if (adaDatabase) {
    const [bahan] = await db.select().from(ingredients).where(eq(ingredients.slug, slugBahan)).limit(1);
    if (!bahan) throw galat('Bahan tidak ditemukan.', 404);
    const hargaBaru = Math.round(Number(bahan.hargaSatuan) * (1 + kenaikan / 100));
    await db.update(ingredients).set({ hargaSatuan: hargaBaru }).where(eq(ingredients.slug, slugBahan));
    return { slug: slugBahan, hargaSatuan: hargaBaru };
  }
  const bahan = BAHAN_LOKAL.find((item) => item.slug === slugBahan);
  if (!bahan) throw galat('Bahan tidak ditemukan.', 404);
  bahan.hargaSatuan = Math.round(Number(bahan.hargaSatuan) * (1 + kenaikan / 100));
  return { slug: slugBahan, hargaSatuan: bahan.hargaSatuan };
}

export async function buatBahan(input = {}) {
  const nama = String(input.nama ?? input.namaBahan ?? '').trim();
  if (!nama) throw galat('Nama bahan wajib diisi.', 400);
  const slug = slugify(nama);
  const satuanBeli = String(input.satuanBeli ?? input.satuanDasar ?? 'kg').trim() || 'kg';
  const isiPerSatuan = ['kg', 'liter'].includes(satuanBeli) ? 1000 : 1;
  const hargaSatuan = Math.round(Number(input.hargaSatuan ?? input.hargaPerKg ?? 0));
  const data = {
    slug,
    nama,
    satuanBeli,
    isiPerSatuan,
    hargaSatuan,
    kategori: String(input.kategori ?? 'utama'),
    densitas: Number(input.densitas ?? 1) || 1,
    substitusi: input.substitusi ?? input.substitusiSaran ?? null,
  };
  if (adaDatabase) {
    const [ada] = await db.select().from(ingredients).where(eq(ingredients.slug, slug)).limit(1);
    if (ada) return ada;
    const [row] = await db.insert(ingredients).values(data).returning();
    return row;
  }
  let ada = BAHAN_LOKAL.find((item) => item.slug === slug);
  if (!ada) {
    ada = { ...data, gramPerSatuan: null };
    BAHAN_LOKAL.push(ada);
  }
  return ada;
}