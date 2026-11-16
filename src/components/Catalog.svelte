<script>
  import { onMount } from 'svelte';
  import { formatRupiah, formatTakaran, skalaResep, validasiPesanan, validasiStok } from '../lib/kitchen.js';

  let { produk = [], sumber = 'seed', clientKey = '', snapUrl = '' } = $props();

  const ONGKIR = 15000;
  const KATEGORI = ['Semua', 'Kopi & Minuman', 'Pastry & Roti', 'Kue Panggang', 'Paket Snack Box'];

  const hariIni = new Date();
  const tanggalMin = `${hariIni.getFullYear()}-${String(hariIni.getMonth() + 1).padStart(2, '0')}-${String(hariIni.getDate()).padStart(2, '0')}`;
  const besok = new Date(hariIni.getTime() + 86400000);
  const tanggalAwal = `${besok.getFullYear()}-${String(besok.getMonth() + 1).padStart(2, '0')}-${String(besok.getDate()).padStart(2, '0')}`;

  const JAM = [];
  for (let menit = 7 * 60; menit <= 21 * 60; menit += 30) {
    const jam = String(Math.floor(menit / 60)).padStart(2, '0');
    const sisa = String(menit % 60).padStart(2, '0');
    JAM.push(`${jam}:${sisa}`);
  }

  let kueri = $state('');
  let kategoriAktif = $state('Semua');
  let urutan = $state('nama');
  let maksKalori = $state('');

  let keranjang = $state([]); // [{ id, jumlah }]
  let mode = $state('kirim');
  let tanggal = $state(tanggalAwal);
  let jamKirim = $state('12:00');
  let nama = $state('');
  let catatan = $state('');
  let sudahCoba = $state(false);
  let detail = $state(null);
  let detailJumlah = $state(1);
  let dipilih = $state(null);
  let jumlah = $state(1);

  const cekStok = $derived.by(() => {
    if (!dipilih) return { valid: true, pesan: '' };
    return validasiStok({ jumlah: Number(jumlah) || 0, stok: Number(dipilih.stok ?? 0) });
  });

  function pilih(item) {
    dipilih = item;
    jumlah = 1;
  }

  function tambah(selisih) {
    if (!dipilih) return;
    jumlah = Math.max(1, Math.min(Number(dipilih.stok ?? Infinity), Number(jumlah || 1) + selisih));
  }

  const hasil = $derived.by(() => {
    const teks = kueri.trim().toLowerCase();
    const saring = produk.filter((item) => {
      const cocokKategori = kategoriAktif === 'Semua' || item.kategori === kategoriAktif;
      const cocokTeks =
        !teks ||
        `${item.nama} ${item.deskripsi} ${item.kategori}`.toLowerCase().includes(teks);
      const batas = Number(maksKalori);
      const cocokKalori = !(batas > 0) || (item.kalori != null && item.kalori <= batas);
      return cocokKategori && cocokTeks && cocokKalori;
    });

    return [...saring].sort((a, b) => {
      if (urutan === 'termurah') return a.harga - b.harga;
      if (urutan === 'termahal') return b.harga - a.harga;
      return a.nama.localeCompare(b.nama, 'id');
    });
  });

  const baris = $derived(
    keranjang
      .map((k) => ({ item: produk.find((p) => p.id === k.id), jumlah: Number(k.jumlah) || 0 }))
      .filter((b) => b.item),
  );
  const jumlahItem = $derived(baris.reduce((t, b) => t + b.jumlah, 0));
  const subtotal = $derived(baris.reduce((t, b) => t + b.item.harga * b.jumlah, 0));
  const ongkir = $derived(mode === 'kirim' && baris.length ? ONGKIR : 0);
  const total = $derived(subtotal + ongkir);
  const totalKalori = $derived(
    baris.reduce((t, b) => t + (b.item.kalori ?? 0) * b.jumlah * (b.item.porsiPerSatuan ?? 1), 0),
  );

  // jumlah dummy 1: validasi keranjang ditangani terpisah (stokError).
  const validasi = $derived.by(() => validasiPesanan({ jumlah: 1, tanggal, jamKirim, nama, mode }));
  const galat = $derived(Object.fromEntries(validasi.errors.map((e) => [e.field, e.pesan])));

  const stokError = $derived.by(() => {
    for (const b of baris) {
      const cek = validasiStok({ jumlah: b.jumlah, stok: b.item.stok });
      if (!cek.valid) return `${b.item.nama}: ${cek.pesan}`;
    }
    return '';
  });

  const rincianDetail = $derived.by(() => {
    if (!detail) return null;
    try {
      return skalaResep(
        detail.komposisi ?? [],
        detail.porsiDasar ?? 1,
        Number(detailJumlah || 1) * (detail.porsiPerSatuan ?? 1),
      );
    } catch {
      return null;
    }
  });

  const adaDiKeranjang = (id) => keranjang.find((k) => k.id === id)?.jumlah ?? 0;

  function tambahKeranjang(item, qty = 1) {
    const stok = Number(item.stok ?? 0);
    if (stok <= 0) return;
    const ada = keranjang.find((k) => k.id === item.id);
    if (ada) ada.jumlah = Math.min(stok, ada.jumlah + qty);
    else keranjang.push({ id: item.id, jumlah: Math.min(stok, qty) });
    sudahCoba = false;
  }

  function ubahJumlah(id, selisih) {
    const k = keranjang.find((x) => x.id === id);
    const item = produk.find((p) => p.id === id);
    if (!k || !item) return;
    k.jumlah = Math.max(1, Math.min(Number(item.stok ?? Infinity), Number(k.jumlah || 0) + selisih));
  }

  function aturJumlah(id, nilai) {
    const k = keranjang.find((x) => x.id === id);
    if (k) k.jumlah = Math.max(1, Math.floor(Number(nilai) || 1));
  }

  function hapusItem(id) {
    keranjang = keranjang.filter((k) => k.id !== id);
  }

  // Simpan keranjang di browser supaya tidak hilang saat refresh.
  const KUNCI = 'yuktakarin-keranjang';
  let siapSimpan = false;
  onMount(() => {
    try {
      const tersimpan = JSON.parse(localStorage.getItem(KUNCI) ?? '[]');
      keranjang = tersimpan
        .map((k) => ({ id: k.id, jumlah: Number(k.jumlah) }))
        .filter((k) => produk.some((p) => p.id === k.id) && k.jumlah >= 1);
    } catch {}
    siapSimpan = true;
  });
  $effect(() => {
    const data = JSON.stringify(keranjang);
    if (!siapSimpan) return;
    try {
      localStorage.setItem(KUNCI, data);
    } catch {}
  });

  function bukaDetail(item) {
    detail = item;
    detailJumlah = 1;
  }

  function pakaiDetail() {
    tambahKeranjang(detail, Math.max(1, Math.floor(Number(detailJumlah) || 1)));
    detail = null;
  }

  let sedangBayar = $state(false);
  let pesanError = $state('');
  let infoBayar = $state('');
  let pesananId = $state(null);

  // Form berubah → pesanan lama tidak relevan lagi, buat baru saat bayar.
  $effect(() => {
    JSON.stringify(keranjang); mode; tanggal; jamKirim; nama; catatan;
    pesananId = null;
  });

  function muatSnap() {
    if (window.snap) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const skrip = document.createElement('script');
      skrip.src = snapUrl;
      skrip.dataset.clientKey = clientKey;
      skrip.onload = resolve;
      skrip.onerror = () => reject(new Error('Gagal memuat Midtrans. Periksa koneksi internet.'));
      document.head.appendChild(skrip);
    });
  }

  async function sinkronStatus(orderId) {
    try {
      await fetch(`/api/payments/status?order_id=${encodeURIComponent(orderId)}`);
    } catch {
      // webhook tetap akan mengupdate status
    }
  }

  async function bayar(event) {
    event.preventDefault();
    sudahCoba = true;
    pesanError = '';
    infoBayar = '';
    if (!validasi.valid || baris.length === 0 || stokError) return;
    if (!clientKey || !snapUrl) {
      pesanError = 'Pembayaran belum dikonfigurasi (MIDTRANS_CLIENT_KEY kosong).';
      return;
    }

    sedangBayar = true;
    try {
      if (!pesananId) {
        const resPesanan = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            items: baris.map((b) => ({ productId: b.item.id, jumlah: b.jumlah })),
            jamKirim,
            tanggal,
            mode,
            catatan,
            nama,
          }),
        });
        const hasilPesanan = await resPesanan.json();
        if (!resPesanan.ok) throw new Error(hasilPesanan.error ?? 'Gagal membuat pesanan.');
        pesananId = hasilPesanan.data.id;
      }

      const resBayar = await fetch('/api/payments/init', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ order_id: pesananId }),
      });
      const hasilBayar = await resBayar.json();
      if (!resBayar.ok) throw new Error(hasilBayar.error ?? 'Gagal memulai pembayaran.');

      await muatSnap();
      window.snap.pay(hasilBayar.data.token, {
        onSuccess: (hasil) => {
          infoBayar = 'Pembayaran berhasil! Pesananmu sudah kami terima.';
          keranjang = [];
          sinkronStatus(hasil.order_id);
        },
        onPending: (hasil) => {
          infoBayar = 'Menunggu pembayaran. Selesaikan sesuai instruksi di layar.';
          keranjang = [];
          sinkronStatus(hasil.order_id);
        },
        onError: () => {
          pesanError = 'Pembayaran gagal. Silakan coba lagi.';
        },
        onClose: () => {
          infoBayar = 'Jendela pembayaran ditutup. Pesananmu tersimpan, klik Bayar lagi untuk melanjutkan.';
        },
      });
    } catch (error) {
      pesanError = error.message;
    } finally {
      sedangBayar = false;
    }
  }

  const rupiah = (nilai) => formatRupiah(nilai);
</script>

<header class="topbar">
  <div class="wrap topbar__inner">
    <div>
      <p class="wordmark">yukTakarin!</p>
      <p class="tagline">Coffee &amp; Kue rumahan</p>
    </div>
    <a class="btn btn--quiet btn--sm" href="/login">Masuk Pemilik</a>
  </div>
</header>

<main class="wrap halaman">
  <section class="hero">
    <p class="hero__eyebrow">Katering harian &amp; acara</p>
    <h1>Kopi, pastry, dan kue rumahan untuk rapat dan acara.</h1>
    <p class="hero__sub">
      Pilih menu, tentukan jumlah dan jam ambil atau kirim, lalu bayar online. Pesanan langsung
      diteruskan ke dapur setelah pembayaran.
    </p>
    <div class="hero__badges">
      <span class="badge badge--netral">Dipanggang harian</span>
      <span class="badge badge--netral">Tanpa minimal pesanan</span>
      <span class="badge badge--netral">Harga transparan</span>
    </div>
  </section>

  <section class="filters" aria-label="Filter menu">
    <div class="filters__cari">
      <label class="sr-only" for="cari">Cari menu</label>
      <input
        id="cari"
        class="input"
        type="search"
        placeholder="Cari kopi, croissant, bolu…"
        bind:value={kueri}
      />
    </div>

    <div class="chips" role="group" aria-label="Kategori">
      {#each KATEGORI as kategori}
        <button
          type="button"
          class="chip"
          aria-pressed={kategoriAktif === kategori}
          onclick={() => (kategoriAktif = kategori)}
        >
          {kategori}
        </button>
      {/each}
    </div>

    <div class="filters__kalori">
      <label for="kalori">Maks. kalori / porsi</label>
      <div class="kalori__baris">
        <input
          id="kalori"
          class="input tabular"
          type="number"
          min="0"
          step="10"
          inputmode="numeric"
          placeholder="mis. 250"
          bind:value={maksKalori}
        />
        <span class="muted">kkal</span>
      </div>
      <div class="chips" role="group" aria-label="Pilihan cepat kalori">
        {#each [200, 300, 400] as batas}
          <button
            type="button"
            class="chip"
            aria-pressed={Number(maksKalori) === batas}
            onclick={() => (maksKalori = Number(maksKalori) === batas ? '' : batas)}
          >
            ≤ {batas}
          </button>
        {/each}
      </div>
    </div>

    <div class="filters__urut">
      <label for="urut">Urutkan</label>
      <select id="urut" class="select" bind:value={urutan}>
        <option value="nama">Nama A–Z</option>
        <option value="termurah">Harga terendah</option>
        <option value="termahal">Harga tertinggi</option>
      </select>
    </div>
  </section>

  <div class="layout">
    <section aria-label="Katalog menu">
      <p class="hasil" aria-live="polite">{hasil.length} menu ditampilkan</p>
      {#if Number(maksKalori) > 0}
        <p class="muted">Menu ≤ {maksKalori} kkal per porsi. Menu tanpa data kalori disembunyikan.</p>
      {/if}

      {#if hasil.length === 0}
        <div class="kosong panel">
          <p class="kosong__judul">Belum ada menu yang cocok.</p>
          <p class="muted">Coba kata kunci lain atau pilih kategori “Semua”.</p>
          <button
            type="button"
            class="btn btn--quiet btn--sm"
            onclick={() => {
              kueri = '';
              kategoriAktif = 'Semua';
              maksKalori = '';
            }}>Reset filter</button
          >
        </div>
      {:else}
        <div class="grid">
          {#each hasil as item (item.id)}
            <article class="card kartu" class:dipilih-kartu={dipilih?.id === item.id}>
              <div class="kartu__foto">
                <img src={item.imageUrl} alt={item.nama} loading="lazy" width="400" height="300" />
                <span class="badge badge--netral kartu__badge">{item.kategori}</span>
              </div>
              <div class="kartu__isi">
                <h2 class="kartu__nama">{item.nama}</h2>
                <p class="kartu__deskripsi">{item.deskripsi}</p>
                <p class="kartu__meta">
                  <span class="tabular">{rupiah(item.harga)}</span>
                  <span class="muted">/{item.satuan}</span>
                  {#if item.kalori}<span class="muted">· ±{item.kalori} kkal/porsi</span>{/if}
                </p>
                <div class="kartu__aksi">
                  <button type="button" class="btn btn--quiet btn--sm btn--block" onclick={() => bukaDetail(item)}>
                    Rincian bahan
                  </button>
                  <button
                    type="button"
                    class="btn btn--primary btn--block"
                    disabled={Number(item.stok ?? 0) <= 0}
                    onclick={() => pilih(item)}
                  >
                    {Number(item.stok ?? 0) <= 0 ? 'Sold Out' : dipilih?.id === item.id ? 'Menu dipilih' : 'Pesan'}
                  </button>
                </div>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </section>

    <aside class="checkout" aria-label="Pesanan">
      <div class="panel">
        <h2 class="panel__title">Pesanan kamu</h2>
        {#if !dipilih}
          <p class="panel__hint">Pilih satu menu untuk mulai memesan.</p>
          <div class="checkout__kosong">
            <span class="badge badge--netral">Belum ada menu</span>
          </div>
        {:else}
          <p class="checkout__menu">{dipilih.nama}</p>
          <p class="muted checkout__harga">
            {rupiah(dipilih.harga)} /{dipilih.satuan}
          </p>

          <div class="field">
            <label for="jumlah">Jumlah ({dipilih.satuan})</label>
            <div class="stepper">
              <button
                type="button"
                class="stepper__btn"
                aria-label="Kurangi jumlah"
                onclick={() => tambah(-1)}
                disabled={Number(jumlah) <= 1}>−</button
              >
              <input
                id="jumlah"
                class="stepper__input tabular"
                type="number"
                min="1"
                max={dipilih.stok ?? undefined}
                step="1"
                bind:value={jumlah}
                aria-invalid={sudahCoba && galat.jumlah ? 'true' : 'false'}
                aria-describedby={sudahCoba && galat.jumlah ? 'galat-jumlah' : undefined}
              />
              <button type="button" class="stepper__btn" aria-label="Tambah jumlah" onclick={() => tambah(1)}>
                +
              </button>
            </div>
            {#if sudahCoba && galat.jumlah}
              <p class="error-text" id="galat-jumlah"><span aria-hidden="true">!</span>{galat.jumlah}</p>
            {/if}
          </div>

          <div class="field">
            <span class="label-teks">Cara terima</span>
            <div class="segmented" role="group" aria-label="Cara terima">
              <button
                type="button"
                class="segmented__btn"
                aria-pressed={mode === 'ambil'}
                onclick={() => (mode = 'ambil')}>Ambil</button
              >
              <button
                type="button"
                class="segmented__btn"
                aria-pressed={mode === 'kirim'}
                onclick={() => (mode = 'kirim')}>Kirim</button
              >
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <label for="tanggal">Tanggal</label>
              <input
                id="tanggal"
                class="input"
                type="date"
                min={tanggalMin}
                bind:value={tanggal}
                aria-invalid={sudahCoba && galat.tanggal ? 'true' : 'false'}
              />
              {#if sudahCoba && galat.tanggal}
                <p class="error-text"><span aria-hidden="true">!</span>{galat.tanggal}</p>
              {/if}
            </div>

            <div class="field">
              <label for="jam">Jam {mode === 'kirim' ? 'kirim' : 'ambil'}</label>
              <select id="jam" class="select" bind:value={jamKirim}>
                {#each JAM as opsi}
                  <option value={opsi}>{opsi.replace(':', '.')}</option>
                {/each}
              </select>
              {#if sudahCoba && galat.jamKirim}
                <p class="error-text"><span aria-hidden="true">!</span>{galat.jamKirim}</p>
              {/if}
            </div>
          </div>

          <div class="field">
            <label for="nama">Nama pemesan</label>
            <input
              id="nama"
              class="input"
              type="text"
              placeholder="Nama atau instansi"
              bind:value={nama}
              aria-invalid={sudahCoba && galat.nama ? 'true' : 'false'}
            />
            {#if sudahCoba && galat.nama}
              <p class="error-text"><span aria-hidden="true">!</span>{galat.nama}</p>
            {/if}
          </div>

          <div class="field">
            <label for="catatan">Catatan <span class="muted">(opsional)</span></label>
            <textarea
              id="catatan"
              class="textarea"
              placeholder="Contoh: tanpa es, kirim ke lobi gedung"
              bind:value={catatan}
            ></textarea>
          </div>

          <dl class="rincian">
            <div><dt>Subtotal</dt><dd class="tabular">{rupiah(subtotal)}</dd></div>
            <div>
              <dt>{mode === 'kirim' ? 'Ongkir' : 'Ambil sendiri'}</dt>
              <dd class="tabular">{mode === 'kirim' ? rupiah(ongkir) : 'Rp0'}</dd>
            </div>
            <div class="rincian__total"><dt>Total</dt><dd class="tabular">{rupiah(total)}</dd></div>
          </dl>

          {#if dipilih.kalori}
            <p class="muted catatan-kecil">
              Perkiraan ±{dipilih.kalori * Number(jumlah || 0) * (dipilih.porsiPerSatuan ?? 1)} kkal total
              ({dipilih.kalori} kkal × {Number(jumlah || 0) * (dipilih.porsiPerSatuan ?? 1)} porsi).
            </p>
          {/if}

          <button
            type="button"
            class="btn btn--primary btn--block"
            disabled={!validasi.valid || !cekStok.valid || sedangBayar}
            onclick={bayar}>{sedangBayar ? 'Memproses…' : `Bayar ${rupiah(total)}`}</button
          >
          {#if !cekStok.valid}
            <p class="error-text"><span aria-hidden="true">!</span>{cekStok.pesan}</p>
          {/if}
          {#if pesanError}
            <p class="error-text" role="alert"><span aria-hidden="true">!</span>{pesanError}</p>
          {/if}
          {#if infoBayar}
            <p class="muted" role="status"><strong>{infoBayar}</strong></p>
          {/if}
          <p class="muted catatan-kecil">
            Pembayaran aman via Midtrans (QRIS, transfer bank, e-wallet, kartu). Pesanan dikonfirmasi setelah pembayaran diterima.
          </p>
        {/if}
      </div>
    </aside>
  </div>
</main>

{#if detail}
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-judul">
    <div class="modal__kartu panel">
      <div class="modal__kepala">
        <div>
          <p class="muted kecil">{detail.kategori}</p>
          <h2 id="modal-judul" class="modal__judul">{detail.nama}</h2>
        </div>
        <button type="button" class="btn btn--quiet btn--sm" aria-label="Tutup rincian" onclick={() => (detail = null)}>
          ×
        </button>
      </div>
      <p class="muted modal__deskripsi">{detail.deskripsi}</p>
      <p class="muted kecil">
        {rupiah(detail.harga)} /{detail.satuan} ·
        {detail.porsiPerSatuan ?? 1} porsi per {detail.satuan}
      </p>

      <div class="field">
        <label for="modal-jumlah">Hitung kebutuhan untuk jumlah ({detail.satuan})</label>
        <input
          id="modal-jumlah"
          class="input tabular"
          type="number"
          min="1"
          step="1"
          bind:value={detailJumlah}
        />
      </div>

      {#if rincianDetail}
        <p class="faktor-modal">
          Total per porsi ≈ <strong class="tabular">{rincianDetail.totalGramPerPorsi} g</strong>
          {#if rincianDetail.totalMlPerPorsi > 0}
            · <strong class="tabular">{formatTakaran(rincianDetail.totalMlPerPorsi, 'ml')}</strong>
          {/if}
        </p>

        <div class="komposisi">
          <div class="komposisi__kepala">
            <span>Bahan</span>
            <span>Takaran</span>
            <span>Kebutuhan</span>
          </div>
          {#each rincianDetail.baris as baris (baris.slug)}
            <div class="komposisi__baris">
              <span>{baris.nama}</span>
              <span class="muted">{baris.takaranKiraKira ?? baris.takaranRumah}</span>
              <span class="tabular">
                {baris.gramasi === null
                  ? 'secukupnya'
                  : formatTakaran(
                      baris.satuanTampil === 'ml' ? baris.ml : baris.gramasi,
                      baris.satuanTampil,
                    )}
              </span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="muted kecil">Rincian bahan belum tersedia untuk menu ini.</p>
      {/if}

      <div class="modal__aksi">
        <button type="button" class="btn btn--primary" onclick={pakaiDetail}>Pilih menu ini</button>
        <button type="button" class="btn btn--quiet" onclick={() => (detail = null)}>Tutup</button>
      </div>
    </div>
  </div>
{/if}

<footer class="footer">
  <div class="wrap footer__inner">
    <p><strong>yukTakarin!</strong> · Coffee &amp; Kue rumahan</p>
    <p class="muted">
      Data menu: {sumber === 'neon' ? 'Neon PostgreSQL' : 'seed lokal (mode demo)'} · Buka 07.00–21.00 WIB
    </p>
  </div>
</footer>

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
    gap: 16px;
    padding-top: 12px;
    padding-bottom: 12px;
  }

  .wordmark {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }

  .tagline {
    font-size: 12px;
    font-weight: 600;
    color: var(--ink-soft);
  }

  .halaman {
    padding-top: 28px;
    padding-bottom: 48px;
  }

  .hero {
    max-width: 720px;
    margin-bottom: 24px;
  }

  .hero__eyebrow {
    display: inline-block;
    background: var(--sage);
    border: var(--border);
    border-radius: 999px;
    padding: 2px 12px;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 12px;
  }

  .hero h1 {
    font-size: clamp(28px, 6vw, 44px);
    font-weight: 800;
    line-height: 1.08;
  }

  .hero__sub {
    margin-top: 12px;
    color: var(--ink-soft);
    max-width: 56ch;
  }

  .hero__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }

  .filters {
    display: grid;
    gap: 12px;
    padding: 16px;
    margin-bottom: 24px;
    background: var(--cream);
    border: var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-card);
  }

  .filters__urut {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .filters__urut label {
    font-size: 13px;
    font-weight: 700;
  }

  .filters__urut .select {
    width: auto;
    min-width: 190px;
  }

  @media (min-width: 900px) {
    .filters {
      grid-template-columns: 280px 1fr auto auto;
      align-items: center;
    }
  }

  .layout {
    display: grid;
    gap: 24px;
  }

  @media (min-width: 960px) {
    .layout {
      grid-template-columns: minmax(0, 1fr) 360px;
      align-items: start;
    }

    .checkout {
      position: sticky;
      top: 92px;
    }
  }

  .hasil {
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-soft);
    margin-bottom: 12px;
  }

  .grid {
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr;
  }

  @media (min-width: 640px) {
    .grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (min-width: 1100px) {
    .grid {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }

  .kartu {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: box-shadow 160ms ease-out, transform 160ms ease-out;
  }

  .kartu.dipilih-kartu {
    box-shadow: 6px 6px 0 0 var(--mustard), 6px 6px 0 2px var(--ink);
  }

  .kartu__foto {
    position: relative;
    background: var(--cream-deep);
  }

  .kartu__foto img {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }

  .kartu__badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: var(--cream);
  }

  .kartu__isi {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    flex: 1;
  }

  .kartu__nama {
    font-size: 20px;
    font-weight: 700;
  }

  .kartu__deskripsi {
    font-size: 14px;
    color: var(--ink-soft);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .kartu__meta {
    margin-top: auto;
    padding-top: 4px;
    font-weight: 700;
  }

  .kosong {
    display: grid;
    gap: 8px;
    justify-items: start;
  }

  .kosong__judul {
    font-weight: 800;
    font-size: 18px;
  }

  .checkout__kosong {
    background: var(--cream-deep);
    border-radius: var(--radius-sm);
    padding: 24px;
    text-align: center;
  }

  .checkout__menu {
    font-size: 18px;
    font-weight: 800;
  }

  .checkout__harga {
    font-size: 13px;
    margin-bottom: 14px;
  }

  .stepper {
    display: grid;
    grid-template-columns: 44px 1fr 44px;
    gap: 8px;
    align-items: stretch;
  }

  .stepper__btn {
    min-height: 44px;
    background: var(--cream-deep);
    border: var(--border);
    border-radius: var(--radius-sm);
    font-size: 20px;
    font-weight: 800;
    cursor: pointer;
  }

  .stepper__btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .stepper__input {
    width: 100%;
    min-height: 44px;
    text-align: center;
    font-size: 18px;
    font-weight: 800;
    background: var(--cream);
    border: var(--border);
    border-radius: var(--radius-sm);
  }

  .label-teks {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .segmented {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: var(--border);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .segmented__btn {
    min-height: 44px;
    background: var(--cream);
    border: 0;
    font-weight: 700;
    cursor: pointer;
  }

  .segmented__btn[aria-pressed="true"] {
    background: var(--mustard);
  }

  .segmented__btn + .segmented__btn {
    border-left: var(--border);
  }

  .rincian {
    margin: 8px 0 16px;
    padding-top: 12px;
    border-top: var(--border);
    display: grid;
    gap: 6px;
    font-size: 14px;
  }

  .rincian div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .rincian dt {
    color: var(--ink-soft);
  }

  .rincian dd {
    margin: 0;
    font-weight: 700;
  }

  .rincian__total {
    padding-top: 8px;
    font-size: 18px;
  }

  .rincian__total dt {
    color: var(--ink);
    font-weight: 800;
  }

  .catatan-kecil {
    font-size: 12px;
    margin-top: 10px;
  }

  .footer {
    border-top: var(--border);
    background: var(--cream-deep);
    padding: 20px 0;
  }

  .footer__inner {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
  }
  .kartu__aksi {
    display: grid;
    gap: 6px;
  }

  .modal {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: grid;
    place-items: center;
    padding: 16px;
    background: rgb(43 38 32 / 0.55);
  }

  .modal__kartu {
    width: min(560px, 100%);
    max-height: 88vh;
    overflow-y: auto;
    box-shadow: 8px 8px 0 0 var(--ink);
    padding: 18px 20px;
  }

  .modal__kepala {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .modal__judul {
    font-size: 22px;
    font-weight: 800;
    line-height: 1.15;
  }

  .modal__deskripsi {
    margin: 10px 0 6px;
    font-size: 14px;
  }

  .faktor-modal {
    background: var(--cream-deep);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    font-size: 14px;
    margin: 10px 0;
  }

  .komposisi {
    border: var(--border);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .komposisi__kepala,
  .komposisi__baris {
    display: grid;
    grid-template-columns: 1.2fr 1fr 0.8fr;
    gap: 8px;
    padding: 8px 10px;
    align-items: center;
    font-size: 13px;
  }

  .komposisi__kepala {
    background: var(--cream-deep);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .komposisi__baris:nth-child(even) {
    background: var(--cream-deep);
  }

  .modal__aksi {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 14px;
  }

  .filters__kalori {
    display: grid;
    gap: 6px;
  }

  .kalori__baris {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 200px;
  }
</style>