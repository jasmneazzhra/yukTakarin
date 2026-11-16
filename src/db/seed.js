/**
 * Seed Neon: buat tabel (idempoten) lalu isi menu + bahan + resep + user.
 * Jalankan: npm run seed   (membaca .env via --env-file-if-exists)
 */
import { randomBytes, scryptSync } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { BAHAN, MENU } from './seed-data.js';

const url = process.env.DATABASE_URL;

if (!/^postgres(ql)?:\/\//.test(url ?? '')) {
  console.error(
    'DATABASE_URL belum diisi. Salin .env.example ke .env dan tempel connection string Neon.\n' +
      'Tanpa DATABASE_URL aplikasi tetap jalan memakai seed lokal (mode demo).',
  );
  process.exit(1);
}

const sql = neon(url);

const DDL = [
  `CREATE TABLE IF NOT EXISTS products (
    id serial PRIMARY KEY,
    slug text NOT NULL UNIQUE,
    nama text NOT NULL,
    deskripsi text NOT NULL DEFAULT '',
    kategori text NOT NULL,
    harga integer NOT NULL,
    satuan text NOT NULL DEFAULT 'pcs',
    min_order integer NOT NULL DEFAULT 1,
    porsi_dasar integer NOT NULL DEFAULT 1,
    porsi_per_satuan integer NOT NULL DEFAULT 1,
    prep_menit integer NOT NULL DEFAULT 0,
    proses_label text NOT NULL DEFAULT 'Proses',
    proses_menit integer NOT NULL DEFAULT 0,
    packing_menit integer NOT NULL DEFAULT 0,
    biaya_kemasan integer NOT NULL DEFAULT 0,
    biaya_operasional integer NOT NULL DEFAULT 0,
    stok integer NOT NULL DEFAULT 0,
    kalori integer,
    instruksi_dapur text,
    image_url text,
    aktif boolean NOT NULL DEFAULT true,
    dibuat_pada timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS ingredients (
    id serial PRIMARY KEY,
    slug text NOT NULL UNIQUE,
    nama text NOT NULL,
    satuan_beli text NOT NULL DEFAULT 'kg',
    isi_per_satuan integer NOT NULL DEFAULT 1000,
    harga_satuan integer NOT NULL DEFAULT 0,
    kategori text NOT NULL DEFAULT 'utama',
    densitas double precision NOT NULL DEFAULT 1,
    gram_per_satuan double precision,
    substitusi text
  )`,
  // users dibuat SEBELUM orders karena orders merujuk ke users
  `CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    email text NOT NULL UNIQUE,
    username text NOT NULL UNIQUE,
    nama text NOT NULL,
    no_wa text,
    alamat_default text NOT NULL DEFAULT '',
    role text NOT NULL DEFAULT 'customer',
    password_hash text NOT NULL,
    dibuat_pada timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id serial PRIMARY KEY,
    product_id integer REFERENCES products(id) ON DELETE SET NULL,
    nama_menu text NOT NULL,
    jumlah_porsi integer NOT NULL DEFAULT 1,
    jam_kirim text NOT NULL,
    tanggal_kirim text,
    mode text NOT NULL DEFAULT 'kirim',
    total_harga integer NOT NULL DEFAULT 0,
    catatan text,
    nama_pemesan text,
    status text NOT NULL DEFAULT 'Menunggu',
    payment_status text NOT NULL DEFAULT 'pending',
    dibuat_pada timestamptz NOT NULL DEFAULT now(),
    user_id integer REFERENCES users(id) ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS recipes (
    id serial PRIMARY KEY,
    product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id integer NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    jumlah double precision NOT NULL,
    satuan text NOT NULL,
    urutan integer NOT NULL DEFAULT 0,
    takaran_kira_kira text,
    catatan text
  )`,
];

/** Hash password sungguhan (scrypt bawaan Node, tanpa library tambahan). */
function hashPassword(teks) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(teks, salt, 64).toString('hex')}`;
}

async function main() {
  for (const perintah of DDL) await sql.query(perintah);

  // Untuk database lama yang tabelnya sudah ada tapi kolomnya kurang
  await sql.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS stok integer NOT NULL DEFAULT 0');
  await sql.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS instruksi_dapur text');
  await sql.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS kalori integer');
  await sql.query('UPDATE products SET min_order = 1'); // tidak ada minimal pemesanan lagi
  await sql.query('ALTER TABLE recipes ADD COLUMN IF NOT EXISTS takaran_kira_kira text');
  await sql.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending'");
  await sql.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id integer REFERENCES users(id) ON DELETE SET NULL');
  console.log('Tabel siap: products, ingredients, users, orders, recipes.');

  const idBahan = new Map();
  for (const bahan of BAHAN) {
    const [row] = await sql`
      INSERT INTO ingredients (slug, nama, satuan_beli, isi_per_satuan, harga_satuan, kategori, densitas, gram_per_satuan, substitusi)
      VALUES (${bahan.slug}, ${bahan.nama}, ${bahan.satuanBeli}, ${bahan.isiPerSatuan}, ${bahan.hargaSatuan},
              ${bahan.kategori}, ${bahan.densitas}, ${bahan.gramPerSatuan ?? null}, ${bahan.substitusi ?? null})
      ON CONFLICT (slug) DO UPDATE SET
        nama = EXCLUDED.nama,
        satuan_beli = EXCLUDED.satuan_beli,
        isi_per_satuan = EXCLUDED.isi_per_satuan,
        harga_satuan = EXCLUDED.harga_satuan,
        kategori = EXCLUDED.kategori,
        densitas = EXCLUDED.densitas,
        gram_per_satuan = EXCLUDED.gram_per_satuan,
        substitusi = EXCLUDED.substitusi
      RETURNING id
    `;
    idBahan.set(bahan.slug, row.id);
  }
  console.log(`Bahan: ${idBahan.size} baris.`);

  for (const menu of MENU) {
    const [row] = await sql`
      INSERT INTO products (slug, nama, deskripsi, kategori, harga, satuan, min_order, porsi_dasar,
                            porsi_per_satuan, prep_menit, proses_label, proses_menit, packing_menit,
                            biaya_kemasan, biaya_operasional, stok, kalori, instruksi_dapur, image_url, aktif)
      VALUES (${menu.slug}, ${menu.nama}, ${menu.deskripsi}, ${menu.kategori}, ${menu.harga}, ${menu.satuan},
              ${menu.minOrder}, ${menu.porsiDasar}, ${menu.porsiPerSatuan}, ${menu.prepMenit},
              ${menu.prosesLabel}, ${menu.prosesMenit}, ${menu.packingMenit}, ${menu.biayaKemasan},
              ${menu.biayaOperasional}, ${menu.stok ?? 0}, ${menu.kalori ?? null}, ${menu.instruksiDapur ?? null}, ${menu.imageUrl ?? null}, ${menu.aktif})
      ON CONFLICT (slug) DO UPDATE SET
        nama = EXCLUDED.nama,
        deskripsi = EXCLUDED.deskripsi,
        kategori = EXCLUDED.kategori,
        harga = EXCLUDED.harga,
        satuan = EXCLUDED.satuan,
        min_order = EXCLUDED.min_order,
        porsi_dasar = EXCLUDED.porsi_dasar,
        porsi_per_satuan = EXCLUDED.porsi_per_satuan,
        prep_menit = EXCLUDED.prep_menit,
        proses_label = EXCLUDED.proses_label,
        proses_menit = EXCLUDED.proses_menit,
        packing_menit = EXCLUDED.packing_menit,
        biaya_kemasan = EXCLUDED.biaya_kemasan,
        biaya_operasional = EXCLUDED.biaya_operasional,
        stok = EXCLUDED.stok,
        kalori = EXCLUDED.kalori,
        instruksi_dapur = EXCLUDED.instruksi_dapur,
        aktif = EXCLUDED.aktif
      RETURNING id
    `;

    await sql`DELETE FROM recipes WHERE product_id = ${row.id}`;
    for (const [urutan, baris] of menu.resep.entries()) {
      const ingredientId = idBahan.get(baris.bahan);
      if (!ingredientId) throw new Error(`Bahan tidak dikenal pada ${menu.slug}: ${baris.bahan}`);
      await sql`
        INSERT INTO recipes (product_id, ingredient_id, jumlah, satuan, urutan, takaran_kira_kira, catatan)
        VALUES (${row.id}, ${ingredientId}, ${baris.jumlah}, ${baris.satuan}, ${urutan},
                ${baris.takaranKiraKira ?? null}, ${baris.catatan ?? null})
      `;
    }
  }

  console.log(`Menu: ${MENU.length} baris beserta resepnya.`);

  // ---- User: owner (dari env) + customer demo (hanya non-production) ----
  const isProd = process.env.NODE_ENV === 'production';
  const ownerPassword = process.env.OWNER_PASSWORD || (isProd ? '' : 'dapur-lokal');

  if (!ownerPassword) {
    console.error('Seed gagal: OWNER_PASSWORD wajib diisi di production.');
    process.exit(1);
  }

  const ownerUsername = process.env.OWNER_USERNAME ?? 'pemilik';
  await sql`
    INSERT INTO users (email, username, nama, role, password_hash, no_wa, alamat_default)
    VALUES (${ownerUsername + '@warung.local'}, ${ownerUsername}, ${'Pemilik Warung'}, ${'owner'},
            ${hashPassword(ownerPassword)}, ${'6281234567890'}, ${'Jl. Utama No. 1'})
    ON CONFLICT (username) DO UPDATE SET
      email = EXCLUDED.email,
      nama = EXCLUDED.nama,
      role = EXCLUDED.role,
      password_hash = EXCLUDED.password_hash,
      no_wa = EXCLUDED.no_wa,
      alamat_default = EXCLUDED.alamat_default
  `;
  console.log(`User: owner ${ownerUsername} siap.`);

  if (!isProd) {
    await sql`
      INSERT INTO users (email, username, nama, role, password_hash, no_wa, alamat_default)
      VALUES (${'pelanggan@yuktakarin.id'}, ${'pelanggan'}, ${'Pelanggan Demo'}, ${'customer'},
              ${hashPassword('pelanggan123')}, ${'6281234567890'}, ${'Jl. Contoh No. 2'})
      ON CONFLICT (email) DO NOTHING
    `;
    console.log('User: customer demo siap.');
  }

  console.log('Selesai.');
}

main().catch((error) => {
  console.error('Seed gagal:', error.message);
  process.exit(1);
});