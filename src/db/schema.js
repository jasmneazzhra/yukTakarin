import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  doublePrecision,
  timestamp,
} from 'drizzle-orm/pg-core';

/** Menu yang dijual. `harga` dalam rupiah integer per `satuan`. */
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nama: text('nama').notNull(),
  deskripsi: text('deskripsi').notNull().default(''),
  kategori: text('kategori').notNull(),
  harga: integer('harga').notNull(),
  satuan: text('satuan').notNull().default('pcs'),
  minOrder: integer('min_order').notNull().default(1),
  porsiDasar: integer('porsi_dasar').notNull().default(1),
  porsiPerSatuan: integer('porsi_per_satuan').notNull().default(1),
  prepMenit: integer('prep_menit').notNull().default(0),
  prosesLabel: text('proses_label').notNull().default('Proses'),
  prosesMenit: integer('proses_menit').notNull().default(0),
  packingMenit: integer('packing_menit').notNull().default(0),
  biayaKemasan: integer('biaya_kemasan').notNull().default(0),
  biayaOperasional: integer('biaya_operasional').notNull().default(0),
  stok: integer('stok').notNull().default(0),
  kalori: integer('kalori'),
  instruksiDapur: text('instruksi_dapur'),
  imageUrl: text('image_url'),
  aktif: boolean('aktif').notNull().default(true),
  dibuatPada: timestamp('dibuat_pada', { withTimezone: true }).notNull().defaultNow(),
});

/** Bahan baku beserta harga per satuan beli dan densitasnya. */
export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nama: text('nama').notNull(),
  satuanBeli: text('satuan_beli').notNull().default('kg'),
  isiPerSatuan: integer('isi_per_satuan').notNull().default(1000),
  hargaSatuan: integer('harga_satuan').notNull().default(0),
  kategori: text('kategori').notNull().default('utama'),
  densitas: doublePrecision('densitas').notNull().default(1),
  gramPerSatuan: doublePrecision('gram_per_satuan'),
  substitusi: text('substitusi'),
});

/** Antrean pesanan pelanggan. */
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  namaMenu: text('nama_menu').notNull(),
  jumlahPorsi: integer('jumlah_porsi').notNull().default(1),
  jamKirim: text('jam_kirim').notNull(),
  tanggalKirim: text('tanggal_kirim'),
  mode: text('mode').notNull().default('kirim'),
  totalHarga: integer('total_harga').notNull().default(0),
  catatan: text('catatan'),
  namaPemesan: text('nama_pemesan'),
  status: text('status').notNull().default('Menunggu'),
  payment_status: text('payment_status').notNull().default('pending'),
  dibuatPada: timestamp('dibuat_pada', { withTimezone: true }).notNull().defaultNow(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
});

/** Daftar pengguna warung (pemilik & customer). */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  nama: text('nama').notNull(),
  noWa: text('no_wa'),
  alamatDefault: text('alamat_default').notNull().default(''),
  role: text('role').notNull().default('customer'),
  passwordHash: text('password_hash').notNull(),
  dibuatPada: timestamp('dibuat_pada', { withTimezone: true }).notNull().defaultNow(),
});

/** Takaran rumah tangga untuk `products.porsi_dasar`. */
export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  ingredientId: integer('ingredient_id')
    .notNull()
    .references(() => ingredients.id, { onDelete: 'cascade' }),
  jumlah: doublePrecision('jumlah').notNull(),
  satuan: text('satuan').notNull(),
  urutan: integer('urutan').notNull().default(0),
  takaranKiraKira: text('takaran_kira_kira'),
  catatan: text('catatan'),
});

/** Riwayat pembayaran pelanggan. */
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull().default('midtrans'),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('IDR'),
  status: text('status').notNull().default('pending'),
  payment_id: text('payment_id'),
  signature: text('signature'),
  transaction_time: text('transaction_time'),
  conducted_at: timestamp('conducted_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});