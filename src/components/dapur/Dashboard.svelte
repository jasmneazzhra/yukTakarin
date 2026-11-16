<script>
  import { hargaPerPorsi, hitungHpp, marginPersen, statusMargin, formatRupiah } from '../../lib/kitchen.js';
  import MenuManager from './MenuManager.svelte';
  import PilarGramasi from './PilarGramasi.svelte';
  import PilarInflasi from './PilarInflasi.svelte';
  import PilarTimeline from './PilarTimeline.svelte';

  let { produk = [], bahan = [], sumber = 'seed' } = $props();

  let items = $state(produk);
  let tab = $state('menu');
  let galat = $state('');
  let pesanan = $state([]);
  let memuatPesanan = $state(false);

  let gramasiPilihanId = $state(null);
  let gramasiJumlah = $state(null);
  let timelinePilihanId = $state(null);
  let timelineJam = $state(null);

  const TAB = [
    { kode: 'pesanan', label: 'Antrean' },
    { kode: 'menu', label: 'Menu & foto' },
    { kode: 'gramasi', label: 'Gramasi (K1)' },
    { kode: 'inflasi', label: 'Inflasi (K2)' },
    { kode: 'timeline', label: 'Timeline (K3)' },
  ];

  function ringkas(item) {
    const hpp = hitungHpp({
      resep: item.resep ?? [],
      porsiDasar: item.porsiDasar,
      biayaKemasan: item.biayaKemasan,
      biayaOperasional: item.biayaOperasional,
    });
    const margin = marginPersen(hargaPerPorsi(item), hpp.hppPerPorsi);
    return { hpp, margin, status: statusMargin(margin) };
  }

  const ringkasan = $derived(new Map(items.map((item) => [item.id, ringkas(item)])));
  const rataMargin = $derived(
    items.length
      ? Math.round(
          (items.reduce((total, item) => total + (ringkasan.get(item.id)?.margin ?? 0), 0) / items.length) * 10,
        ) / 10
      : 0,
  );
  const perluPerhatian = $derived(
    items.filter((item) => ringkasan.get(item.id)?.status !== 'AMAN').length,
  );

  let sedangKeluar = $state(false);

  async function keluar() {
    sedangKeluar = true;
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
    } catch {
      // tetap arahkan ke login
    }
    window.location.href = '/login';
  }

  async function muatUlang() {
    galat = '';
    try {
      const respons = await fetch('/api/products', { headers: { accept: 'application/json' } });
      const hasil = await respons.json();
      if (!respons.ok) throw new Error(hasil.error ?? 'Gagal memuat menu.');
      items = hasil.data;
    } catch (error) {
      galat = error.message;
    }
  }

  async function muatPesanan() {
    memuatPesanan = true;
    try {
      const respons = await fetch('/api/orders?hariIni=1', { headers: { accept: 'application/json' } });
      const hasil = await respons.json();
      if (!respons.ok) throw new Error(hasil.error ?? 'Gagal memuat pesanan.');
      pesanan = hasil.data ?? [];
    } catch (error) {
      galat = error.message;
    } finally {
      memuatPesanan = false;
    }
  }

  async function tarikKeDapur(p) {
    gramasiPilihanId = p.productId;
    gramasiJumlah = p.jumlahPorsi;
    timelinePilihanId = p.productId;
    timelineJam = p.jamKirim;
    try {
      await fetch(`/api/orders/${p.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'Diproses' }),
      });
      await muatPesanan();
    } catch {
      // abaikan
    }
    tab = 'gramasi';
  }

  async function konfirmasiPotong(p) {
    try {
      await fetch(`/api/orders/${p.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          status: 'Selesai',
          potongStok: true,
          productId: p.productId,
          jumlahPorsi: p.jumlahPorsi,
        }),
      });
      await muatPesanan();
      await muatUlang();
    } catch (error) {
      galat = error.message;
    }
  }

  $effect(() => {
    muatPesanan();
  });

  const labelStatus = { AMAN: 'Aman', WASPADA: 'Waspada', KRITIS: 'Kritis' };
  const kelasStatus = { AMAN: 'badge--aman', WASPADA: 'badge--waspada', KRITIS: 'badge--kritis' };
</script>

<header class="topbar">
  <div class="wrap topbar__inner">
    <div>
      <p class="wordmark">yukTakarin! <span class="wordmark__sub">Dapur</span></p>
      <p class="tagline">Coffee &amp; Kue rumahan</p>
    </div>
    <div class="topbar__aksi">
      <span class="badge {sumber === 'neon' ? 'badge--aman' : 'badge--netral'}">
        {sumber === 'neon' ? 'Neon PostgreSQL' : 'Mode seed'}
      </span>
      <a class="btn btn--quiet btn--sm" href="/">Lihat katalog</a>
      <button type="button" class="btn btn--quiet btn--sm" onclick={keluar} disabled={sedangKeluar}>
        {sedangKeluar ? 'Keluar…' : 'Logout'}
      </button>
    </div>
  </div>
</header>

<main class="wrap halaman">
  <div class="judul">
    <h1>Kendali dapur</h1>
    <p class="muted">
      Hitung gramasi, pantau margin saat harga bahan naik, dan susun jadwal kerja mundur dari jam kirim
      pelanggan.
    </p>
  </div>

  {#if sumber === 'seed'}
    <p class="notif">
      <strong>Mode demo.</strong> Belum ada <code>DATABASE_URL</code>, jadi menu berasal dari seed lokal dan
      perubahan hanya bertahan selama server hidup.
    </p>
  {/if}

  {#if galat}
    <p class="notif notif--galat" role="alert">{galat}</p>
  {/if}

  <section class="stats" aria-label="Ringkasan dapur">
    <div class="card stat">
      <p class="stat__label">Total menu</p>
      <p class="stat__angka tabular">{items.length}</p>
      <p class="stat__ket">aktif di katalog</p>
    </div>
    <div class="card stat">
      <p class="stat__label">Rata-rata margin</p>
      <p class="stat__angka tabular">{rataMargin}%</p>
      <p class="stat__ket">setelah kemasan &amp; operasional</p>
    </div>
    <div class="card stat" class:stat--perhatian={perluPerhatian > 0}>
      <p class="stat__label">Perlu perhatian</p>
      <p class="stat__angka tabular">{perluPerhatian}</p>
      <p class="stat__ket">{perluPerhatian > 0 ? 'margin di bawah 40%' : 'semua margin sehat'}</p>
    </div>
  </section>

  <nav class="tabbar" aria-label="Bagian dapur">
    {#each TAB as bagian}
      <button
        type="button"
        class="tab"
        aria-pressed={tab === bagian.kode}
        onclick={() => (tab = bagian.kode)}>{bagian.label}</button
      >
    {/each}
  </nav>

  {#if tab === 'pesanan'}
    <section class="daftar">
      <div class="kepala">
        <h2 class="panel__title">Pesanan masuk hari ini</h2>
        <button type="button" class="btn btn--quiet btn--sm" onclick={muatPesanan} disabled={memuatPesanan}>
          {memuatPesanan ? 'Memuat…' : 'Muat ulang'}
        </button>
      </div>
      {#if pesanan.length === 0}
        <p class="panel__hint">Belum ada pesanan hari ini.</p>
      {:else}
        {#each pesanan as p (p.id)}
          <article class="card baris">
            <div class="baris__info">
              <h2 class="baris__nama">{p.namaMenu}</h2>
              <p class="muted">
                {p.jumlahPorsi} porsi · {p.mode === 'kirim' ? 'kirim' : 'ambil'} {p.jamKirim} · {p.namaPemesan ?? '-'} ·
                {formatRupiah(p.totalHarga)}
              </p>
              {#if p.catatan}<p class="muted kecil">{p.catatan}</p>{/if}
            </div>
            <span class="badge {p.status === 'Selesai' ? 'badge--aman' : p.status === 'Diproses' ? 'badge--waspada' : 'badge--netral'}">
              {p.status}
            </span>
            <div class="baris__aksi">
              <button type="button" class="btn btn--quiet btn--sm" onclick={() => tarikKeDapur(p)}>Tarik ke Dapur</button>
              {#if p.status !== 'Selesai'}
                <button type="button" class="btn btn--primary btn--sm" onclick={() => konfirmasiPotong(p)}>
                  Konfirmasi &amp; Potong Stok
                </button>
              {/if}
            </div>
          </article>
        {/each}
      {/if}
    </section>
  {:else if tab === 'menu'}
    <MenuManager {items} {bahan} onrefresh={muatUlang} />
  {:else if tab === 'gramasi'}
    <PilarGramasi produk={items} pilihanId={gramasiPilihanId} jumlahAwal={gramasiJumlah} />
  {:else if tab === 'inflasi'}
    <div class="daftar">
      {#each items as item (item.id)}
        <article class="card baris">
          <div class="baris__info">
            <h2 class="baris__nama">{item.nama}</h2>
            <p class="muted">
              {formatRupiah(item.harga)} /{item.satuan} · HPP {formatRupiah(ringkasan.get(item.id)?.hpp.hppPerPorsi ?? 0)}
            </p>
          </div>
          <span class="badge {kelasStatus[ringkasan.get(item.id)?.status ?? 'AMAN']}">
            {labelStatus[ringkasan.get(item.id)?.status ?? 'AMAN']} · {ringkasan.get(item.id)?.margin ?? 0}%
          </span>
        </article>
      {/each}
    </div>
    <PilarInflasi produk={items} />
  {:else if tab === 'timeline'}
    <PilarTimeline produk={items} pilihanId={timelinePilihanId} jamAwal={timelineJam} />
  {/if}
</main>

<style>
  .topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--cream);
    border-bottom: var(--border);
  }

  .topbar__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    padding-top: 12px;
    padding-bottom: 12px;
  }

  .topbar__aksi {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .wordmark {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }

  .wordmark__sub {
    font-size: 14px;
    font-weight: 700;
    color: var(--ink-soft);
  }

  .tagline {
    font-size: 12px;
    font-weight: 600;
    color: var(--ink-soft);
  }

  .halaman {
    padding-top: 24px;
    padding-bottom: 56px;
  }

  .judul {
    max-width: 720px;
    margin-bottom: 20px;
  }

  .judul h1 {
    font-size: clamp(26px, 5vw, 34px);
    font-weight: 800;
    margin-bottom: 8px;
  }

  .notif {
    background: var(--mustard);
    border: var(--border);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-action);
    padding: 12px 14px;
    font-size: 14px;
    margin-bottom: 20px;
  }

  .notif--galat {
    background: var(--coral);
  }

  .stats {
    display: grid;
    gap: 14px;
    margin-bottom: 22px;
  }

  @media (min-width: 720px) {
    .stats {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .stat {
    padding: 16px 18px;
  }

  .stat--perhatian {
    box-shadow: 6px 6px 0 0 var(--coral);
  }

  .stat__label {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-soft);
  }

  .stat__angka {
    font-size: 32px;
    font-weight: 800;
    line-height: 1.1;
    margin: 4px 0;
  }

  .stat__ket {
    font-size: 12px;
    color: var(--ink-soft);
  }

  .tabbar {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 4px;
    margin-bottom: 18px;
  }

  .tab {
    min-height: 44px;
    padding: 8px 14px;
    background: var(--cream);
    border: var(--border);
    border-radius: var(--radius-sm);
    font-size: 14px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
  }

  .tab[aria-pressed="true"] {
    background: var(--mustard);
    box-shadow: var(--shadow-action);
  }

  .daftar {
    display: grid;
    gap: 10px;
    margin-bottom: 16px;
  }

  .baris {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 14px 16px;
  }

  .baris__nama {
    font-size: 17px;
    font-weight: 700;
  }
</style>
