import { adaDatabase, db } from '../db/index.js';
import { BAHAN, MENU } from '../db/seed-data.js';

const isMemory = !adaDatabase || !db;

let _bahan = BAHAN.map((b, i) => ({
  id: i + 1,
  slug: b.slug,
  nama: b.nama,
  satuanBeli: b.satuanBeli ?? 'kg',
  isiPerSatuan: b.isiPerSatuan ?? 1000,
  hargaSatuan: b.hargaSatuan ?? 0,
  kategori: b.kategori ?? 'utama',
  densitas: b.densitas ?? 1,
  gramPerSatuan: b.gramPerSatuan ?? null,
  substitusi: b.substitusi ?? null,
}));

let _produk = MENU.map((m, i) => ({
  id: i + 1,
  slug: m.slug,
  nama: m.nama,
  deskripsi: m.deskripsi ?? '',
  kategori: m.kategori ?? '',
  harga: m.harga ?? 0,
  satuan: m.satuan ?? 'pcs',
  minOrder: m.minOrder ?? m.min_order ?? 1,
  porsiDasar: m.porsiDasar ?? m.porsi_dasar ?? 1,
  porsiPerSatuan: m.porsiPerSatuan ?? m.porsi_per_satuan ?? 1,
  prepMenit: m.prepMenit ?? m.prep_menit ?? 0,
  prosesLabel: m.prosesLabel ?? m.proses_label ?? 'Proses',
  prosesMenit: m.prosesMenit ?? m.proses_menit ?? 0,
  packingMenit: m.packingMenit ?? m.packing_menit ?? 0,
  biayaKemasan: m.biayaKemasan ?? m.biaya_kemasan ?? 0,
  biayaOperasional: m.biayaOperasional ?? m.biaya_operasional ?? 0,
  stok: m.stok ?? 20,
  instruksiDapur: m.instruksiDapur ?? m.instruksi_dapur ?? null,
  imageUrl: m.imageUrl ?? m.image_url ?? null,
  aktif: m.aktif ?? true,
  dibuatPada: new Date().toISOString(),
  resep: (m.resep ?? []).map((r) => ({ ...r })),
}));

let _orders = [];
let _nextOrderId = 1;
let _nextProductId = _produk.length + 1;

export function modeData() {
  return isMemory ? 'seed lokal (demo)' : 'neon';
}

const err = (message, status = 400) => Object.assign(new Error(message), { status });

function produkPublik(p) {
  const {
    resep,
    biayaKemasan,
    biayaOperasional,
    porsiDasar,
    porsiPerSatuan,
    prepMenit,
    prosesLabel,
    prosesMenit,
    packingMenit,
    instruksiDapur,
    dibuatPada,
    ...pub
  } = p;
  // pastikan tidak ada field modal resep/harga bahan
  return { ...pub };
}

export async function daftarProduk(opts = {}) {
  const list = _produk.map((p) => ({ ...p, resep: (p.resep ?? []).map((r) => ({ ...r })) }));
  if (opts.publik) return list.map(produkPublik);
  return list;
}

export async function ambilProduk(id) {
  const p = _produk.find((x) => String(x.id) === String(id) || x.slug === String(id));
  if (!p) throw err('Produk tidak ditemukan.', 404);
  return { ...p, resep: (p.resep ?? []).map((r) => ({ ...r })) };
}

export async function buatProduk(body) {
  const p = {
    id: _nextProductId++,
    slug: body.slug ?? `produk-${Date.now()}`,
    nama: body.nama ?? 'Produk',
    deskripsi: body.deskripsi ?? '',
    kategori: body.kategori ?? 'Kopi & Minuman',
    harga: Number(body.harga) || 0,
    satuan: body.satuan ?? 'pcs',
    minOrder: Number(body.minOrder ?? body.min_order ?? 1),
    porsiDasar: Number(body.porsiDasar ?? body.porsi_dasar ?? 1),
    porsiPerSatuan: Number(body.porsiPerSatuan ?? body.porsi_per_satuan ?? 1),
    prepMenit: Number(body.prepMenit ?? body.prep_menit ?? 0),
    prosesLabel: body.prosesLabel ?? body.proses_label ?? 'Proses',
    prosesMenit: Number(body.prosesMenit ?? body.proses_menit ?? 0),
    packingMenit: Number(body.packingMenit ?? body.packing_menit ?? 0),
    biayaKemasan: Number(body.biayaKemasan ?? body.biaya_kemasan ?? 0),
    biayaOperasional: Number(body.biayaOperasional ?? body.biaya_operasional ?? 0),
    stok: Number(body.stok ?? 0),
    instruksiDapur: body.instruksiDapur ?? body.instruksi_dapur ?? null,
    imageUrl: body.imageUrl ?? body.image_url ?? null,
    aktif: body.aktif ?? true,
    dibuatPada: new Date().toISOString(),
    resep: Array.isArray(body.resep) ? body.resep : [],
  };
  _produk.push(p);
  return { ...p };
}

export async function ubahProduk(id, body) {
  const idx = _produk.findIndex((x) => String(x.id) === String(id));
  if (idx === -1) throw err('Produk tidak ditemukan.', 404);
  _produk[idx] = { ..._produk[idx], ...body, id: _produk[idx].id };
  return { ..._produk[idx] };
}

export async function hapusProduk(id) {
  const idx = _produk.findIndex((x) => String(x.id) === String(id));
  if (idx === -1) throw err('Produk tidak ditemukan.', 404);
  const [hapus] = _produk.splice(idx, 1);
  return { id: hapus.id, terhapus: true };
}

export async function daftarBahan() {
  return _bahan.map((b) => ({ ...b }));
}

export async function terapkanInflasi({ slugBahan, persen }) {
  const bahan = _bahan.find((b) => b.slug === slugBahan);
  if (!bahan) throw err('Bahan tidak ditemukan.', 404);
  const faktor = 1 + Number(persen || 0) / 100;
  bahan.hargaSatuan = Math.round(Number(bahan.hargaSatuan || 0) * faktor);
  return { ...bahan };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function buatPesanan(body) {
  const pesanan = {
    id: _nextOrderId++,
    productId: body.productId ?? body.product_id ?? null,
    namaMenu: body.namaMenu ?? body.nama_menu ?? body.nama ?? 'Pesanan',
    jumlahPorsi: Number(body.jumlahPorsi ?? body.jumlah_porsi ?? body.jumlah ?? 1),
    jamKirim: body.jamKirim ?? body.jam_kirim ?? '',
    tanggalKirim: body.tanggalKirim ?? body.tanggal_kirim ?? body.tanggal ?? todayStr(),
    mode: body.mode ?? 'kirim',
    totalHarga: Number(body.totalHarga ?? body.total_harga ?? 0),
    catatan: body.catatan ?? null,
    namaPemesan: body.namaPemesan ?? body.nama_pemesan ?? body.nama ?? null,
    status: body.status ?? 'Menunggu',
    paymentStatus: body.paymentStatus ?? body.payment_status ?? 'pending',
    dibuatPada: new Date().toISOString(),
    userId: body.userId ?? body.user_id ?? null,
  };
  _orders.push(pesanan);
  return { ...pesanan };
}

export async function daftarPesanan(opts = {}) {
  let list = _orders.map((o) => ({ ...o }));
  if (opts.hariIni) {
    const t = todayStr();
    list = list.filter((o) => (o.tanggalKirim || '').slice(0, 10) === t);
  }
  return list;
}

export async function ambilPesanan(id) {
  const p = _orders.find((x) => String(x.id) === String(id));
  if (!p) throw err('Pesanan tidak ditemukan.', 404);
  return { ...p };
}

export async function ubahStatusPesanan(id, status) {
  const valid = ['Menunggu', 'Diproses', 'Siap', 'Selesai', 'Dibatalkan'];
  if (!valid.includes(status)) throw err('Status pesanan tidak dikenal.', 400);
  const p = _orders.find((x) => String(x.id) === String(id));
  if (!p) throw err('Pesanan tidak ditemukan.', 404);
  p.status = status;
  return { ...p };
}

export async function ubahStatusBayar(id, paymentStatus) {
  const p = _orders.find((x) => String(x.id) === String(id));
  if (!p) throw err('Pesanan tidak ditemukan.', 404);
  p.paymentStatus = paymentStatus;
  return { ...p };
}

export async function potongStok(productId, jumlah) {
  const j = Number(jumlah);
  if (!(j > 0)) throw err('Jumlah potong harus lebih dari 0.', 400);
  const p = _produk.find((x) => String(x.id) === String(productId));
  if (!p) throw err('Produk tidak ditemukan.', 404);
  if (Number(p.stok) < j) throw err('Stok tidak cukup.', 400);
  p.stok = Number(p.stok) - j;
  return { ...p };
}
