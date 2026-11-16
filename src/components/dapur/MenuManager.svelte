<script>
  import { formatRupiah, konversiTakaran } from '../../lib/kitchen.js';

  let { items = [], bahan = [], onrefresh = async () => {} } = $props();

  const KATEGORI = ['Kopi & Minuman', 'Pastry & Roti', 'Kue Panggang', 'Paket Snack Box'];
  const SATUAN_JUAL = ['liter', 'cup', 'botol', 'pcs', 'potong', 'box'];
  const SATUAN_RESEP = [
    'gram',
    'ml',
    'sdt',
    'sdm',
    'sejumput',
    'jumput',
    'centong',
    'gelas',
    'genggam',
    'ruas',
    'shot',
    'sloki',
    'butir',
    'lembar',
    'pcs',
    'secukupnya',
  ];
  const SATUAN_DASAR = ['kg', 'liter', 'butir', 'pcs', 'lembar'];

  function kosong() {
    return {
      nama: '',
      kategori: KATEGORI[0],
      deskripsi: '',
      harga: 20000,
      satuan: 'pcs',
      minOrder: 1,
      porsiDasar: 10,
      porsiPerSatuan: 1,
      prepMenit: 15,
      prosesLabel: 'Seduh / panggang',
      prosesMenit: 20,
      packingMenit: 10,
      biayaKemasan: 1000,
      biayaOperasional: 500,
      imageUrl: null,
      resep: [{ bahan: bahan[0]?.slug ?? '', jumlah: 100, satuan: 'gram', bahanBaru: '' }],
    };
  }

  const satuanDasarDari = (satuan) =>
    ['gram', 'sdm', 'sdt', 'sejumput', 'jumput', 'genggam', 'centong', 'gelas', 'ruas', 'shot', 'sloki'].includes(satuan)
      ? 'kg'
      : satuan === 'ml'
        ? 'liter'
        : satuan === 'butir'
          ? 'butir'
          : 'pcs';

  function isBahanBaru(baris) {
    return baris?.bahan === '__baru__';
  }

  function bahanTerpilih(baris) {
    return terurut.find((item) => item.slug === baris?.bahan) ?? null;
  }

  let form = $state(kosong());
  let idUbah = $state(null);
  let sibuk = $state(false);
  let pesan = $state('');
  let galat = $state('');

  const terurut = $derived([...bahan].sort((a, b) => a.nama.localeCompare(b.nama, 'id')));

  /** Gramasi otomatis: jumlah × satuan dasar → gram, lalu dibagi porsi dasar. */
  function gramBaris(baris) {
    const jenis = isBahanBaru(baris) ? { densitas: 1 } : (bahanTerpilih(baris) ?? { densitas: 1 });
    try {
      const hasil = konversiTakaran(baris.jumlah, baris.satuan, jenis);
      return hasil.tidakTerukur ? null : hasil.gram;
    } catch {
      return null;
    }
  }

  const totalResep = $derived.by(() => {
    const gram = form.resep.reduce((total, baris) => total + (gramBaris(baris) ?? 0), 0);
    const porsi = Number(form.porsiDasar) > 0 ? Number(form.porsiDasar) : 0;
    return {
      gram: Math.round(gram),
      perPorsi: porsi ? Math.round((gram / porsi) * 10) / 10 : 0,
    };
  });

  function mulaiBaru() {
    idUbah = null;
    form = kosong();
    pesan = '';
    galat = '';
  }

  function mulaiUbah(item) {
    idUbah = item.id;
    galat = '';
    pesan = '';
    form = {
      nama: item.nama,
      kategori: item.kategori,
      deskripsi: item.deskripsi,
      harga: item.harga,
      satuan: item.satuan,
      minOrder: item.minOrder,
      porsiDasar: item.porsiDasar,
      porsiPerSatuan: item.porsiPerSatuan,
      prepMenit: item.prepMenit,
      prosesLabel: item.prosesLabel,
      prosesMenit: item.prosesMenit,
      packingMenit: item.packingMenit,
      biayaKemasan: item.biayaKemasan,
      biayaOperasional: item.biayaOperasional,
      imageUrl: item.imageUrl,
      stok: item.stok ?? 0,
      resep: (item.resep ?? []).map((baris) => ({
        bahan: baris.slug,
        jumlah: baris.jumlah,
        satuan: baris.satuan,
        bahanBaru: '',
      })),
    };
    if (!form.resep.length)
      form.resep = [{ bahan: terurut[0]?.slug ?? '', jumlah: 100, satuan: 'gram', bahanBaru: '' }];
  }

  function tambahBaris() {
    form.resep = [
      ...form.resep,
      { bahan: terurut[0]?.slug ?? '', jumlah: 1, satuan: 'gram', bahanBaru: '' },
    ];
  }

  function tambahBahanBaru() {
    form.resep = [
      ...form.resep,
      {
        bahan: '__baru__',
        jumlah: 100,
        satuan: 'gram',
        bahanBaru: '',
        satuanDasar: 'kg',
        hargaPerKg: 20000,
        substitusiSaran: '',
      },
    ];
  }

  function hapusBaris(indeks) {
    form.resep = form.resep.filter((_, i) => i !== indeks);
  }

  async function unggah(event) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    galat = '';
    pesan = 'Mengunggah foto…';
    const data = new FormData();
    data.append('file', file);
    data.append('nama', form.nama || 'Menu');
    data.append('kategori', form.kategori);

    try {
      const respons = await fetch('/api/upload', { method: 'POST', body: data });
      const hasil = await respons.json();
      if (!respons.ok) throw new Error(hasil.error ?? 'Unggah gagal.');
      form.imageUrl = hasil.data.url;
      pesan = hasil.data.pesan ?? 'Foto siap.';
    } catch (error) {
      galat = error.message;
      pesan = '';
    }
  }

  async function simpan(event) {
    event.preventDefault();
    galat = '';
    pesan = '';

    if (!form.nama.trim()) {
      galat = 'Nama menu wajib diisi.';
      return;
    }

    sibuk = true;
    const body = {
      ...form,
      harga: Number(form.harga),
      minOrder: Number(form.minOrder),
      porsiDasar: Number(form.porsiDasar),
      porsiPerSatuan: Number(form.porsiPerSatuan),
      prepMenit: Number(form.prepMenit),
      prosesMenit: Number(form.prosesMenit),
      packingMenit: Number(form.packingMenit),
      biayaKemasan: Number(form.biayaKemasan),
      biayaOperasional: Number(form.biayaOperasional),
      stok: Number(form.stok),
      resep: form.resep
        .filter(
          (baris) =>
            Number(baris.jumlah) > 0 &&
            (isBahanBaru(baris) ? String(baris.bahanBaru ?? '').trim() : Boolean(baris.bahan)),
        )
        .map((baris) =>
          isBahanBaru(baris)
            ? {
                namaBahan: String(baris.bahanBaru).trim(),
                satuanDasar: baris.satuanDasar ?? satuanDasarDari(baris.satuan),
                jumlahSatuan: Number(baris.jumlah),
                hargaPerKg: Number(baris.hargaPerKg ?? 0),
                substitusiSaran: baris.substitusiSaran || null,
                jumlah: Number(baris.jumlah),
                satuan: baris.satuan,
              }
            : { bahan: baris.bahan, jumlah: Number(baris.jumlah), satuan: baris.satuan },
        ),
    };

    try {
      const respons = await fetch(idUbah ? `/api/products/${idUbah}` : '/api/products', {
        method: idUbah ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const hasil = await respons.json();
      if (!respons.ok) throw new Error(hasil.error ?? 'Gagal menyimpan menu.');
      pesan = idUbah ? 'Menu diperbarui.' : 'Menu baru ditambahkan.';
      idUbah = null;
      form = kosong();
      await onrefresh();
    } catch (error) {
      galat = error.message;
    } finally {
      sibuk = false;
    }
  }

  async function hapus(item) {
    if (!confirm(`Hapus menu "${item.nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    galat = '';
    try {
      const respons = await fetch(`/api/products/${item.id}`, { method: 'DELETE' });
      const hasil = await respons.json();
      if (!respons.ok) throw new Error(hasil.error ?? 'Gagal menghapus menu.');
      pesan = `"${item.nama}" dihapus.`;
      if (idUbah === item.id) mulaiBaru();
      await onrefresh();
    } catch (error) {
      galat = error.message;
    }
  }
</script>

<section class="kelola">
  <div class="daftar-menu">
    <div class="kepala">
      <h2 class="panel__title">Menu aktif</h2>
      <button type="button" class="btn btn--primary btn--sm" onclick={mulaiBaru}>+ Menu baru</button>
    </div>

    {#if items.length === 0}
      <p class="panel__hint">Belum ada menu. Tambahkan menu pertama.</p>
    {/if}

    <div class="daftar">
      {#each items as item (item.id)}
        <article class="card item" class:item--aktif={idUbah === item.id}>
          {#if item.imageUrl}
            <img class="item__foto" src={item.imageUrl} alt={item.nama} loading="lazy" />
          {:else}
            <div class="item__foto item__foto--kosong">Tanpa foto</div>
          {/if}
          <div class="item__isi">
            <p class="item__kategori">{item.kategori}</p>
            <h3 class="item__nama">{item.nama}</h3>
            <p class="muted item__meta">
              {formatRupiah(item.harga)} /{item.satuan} · min. {item.minOrder} · {(item.resep ?? []).length} bahan
            </p>
            <div class="item__aksi">
              <button type="button" class="btn btn--quiet btn--sm" onclick={() => mulaiUbah(item)}>Ubah</button>
              <button type="button" class="btn btn--danger btn--sm" onclick={() => hapus(item)}>Hapus</button>
            </div>
          </div>
        </article>
      {/each}
    </div>
  </div>

  <form class="panel form" onsubmit={simpan}>
    <h2 class="panel__title">{idUbah ? `Ubah menu #${idUbah}` : 'Tambah menu'}</h2>
    <p class="panel__hint">
      Takaran resep ditulis untuk <strong>porsi dasar</strong>, bukan satu porsi. Auto-scaling menghitung
      sisanya.
    </p>

    {#if pesan}<p class="notif notif--ok" role="status">{pesan}</p>{/if}
    {#if galat}<p class="notif notif--galat" role="alert">{galat}</p>{/if}

    <div class="field">
      <label for="f-nama">Nama menu</label>
      <input id="f-nama" class="input" type="text" bind:value={form.nama} required />
    </div>

    <div class="grid-2">
      <div class="field">
        <label for="f-kategori">Kategori</label>
        <select id="f-kategori" class="select" bind:value={form.kategori}>
          {#each KATEGORI as kategori}<option value={kategori}>{kategori}</option>{/each}
        </select>
      </div>
      <div class="field">
        <label for="f-satuan">Satuan jual</label>
        <select id="f-satuan" class="select" bind:value={form.satuan}>
          {#each SATUAN_JUAL as satuan}<option value={satuan}>{satuan}</option>{/each}
        </select>
      </div>
    </div>

    <div class="field">
      <label for="f-deskripsi">Deskripsi</label>
      <textarea id="f-deskripsi" class="textarea" bind:value={form.deskripsi}></textarea>
    </div>

    <div class="grid-2">
      <div class="field">
        <label for="f-harga">Harga jual / satuan (Rp)</label>
        <input id="f-harga" class="input tabular" type="number" min="1" step="500" bind:value={form.harga} />
      </div>
      <div class="field">
        <label for="f-min">Minimum pesanan</label>
        <input id="f-min" class="input tabular" type="number" min="1" bind:value={form.minOrder} />
      </div>
      <div class="field">
        <label for="f-stok">Stok tersedia ({form.satuan})</label>
        <input id="f-stok" class="input tabular" type="number" min="0" bind:value={form.stok} />
        <p class="muted kecil">0 = tampil “Sold Out” di katalog.</p>
      </div>
    </div>

    <div class="grid-2">
      <div class="field">
        <label for="f-porsidasar">Porsi dasar resep</label>
        <input id="f-porsidasar" class="input tabular" type="number" min="1" bind:value={form.porsiDasar} />
      </div>
      <div class="field">
        <label for="f-porsisatuan">Porsi per satuan jual</label>
        <input
          id="f-porsisatuan"
          class="input tabular"
          type="number"
          min="1"
          bind:value={form.porsiPerSatuan}
        />
      </div>
    </div>

    <fieldset class="fieldset">
      <legend>Waktu kerja dapur (menit)</legend>
      <div class="grid-2">
        <div class="field">
          <label for="f-prep">Persiapan</label>
          <input id="f-prep" class="input tabular" type="number" min="0" bind:value={form.prepMenit} />
        </div>
        <div class="field">
          <label for="f-packing">Packing</label>
          <input id="f-packing" class="input tabular" type="number" min="0" bind:value={form.packingMenit} />
        </div>
      </div>
      <div class="grid-2">
        <div class="field">
          <label for="f-proseslabel">Label proses</label>
          <input id="f-proseslabel" class="input" type="text" bind:value={form.prosesLabel} />
        </div>
        <div class="field">
          <label for="f-proses">Durasi proses</label>
          <input id="f-proses" class="input tabular" type="number" min="0" bind:value={form.prosesMenit} />
        </div>
      </div>
    </fieldset>

    <div class="grid-2">
      <div class="field">
        <label for="f-kemasan">Biaya kemasan / porsi (Rp)</label>
        <input
          id="f-kemasan"
          class="input tabular"
          type="number"
          min="0"
          bind:value={form.biayaKemasan}
        />
      </div>
      <div class="field">
        <label for="f-operasional">Biaya operasional / porsi (Rp)</label>
        <input
          id="f-operasional"
          class="input tabular"
          type="number"
          min="0"
          bind:value={form.biayaOperasional}
        />
      </div>
    </div>

    <div class="field">
      <label for="f-foto">Foto menu</label>
      <input id="f-foto" class="input" type="file" accept="image/*" onchange={unggah} />
      <p class="muted kecil">
        Tanpa kredensial Cloudinary, sistem memakai placeholder SVG lokal.
      </p>
      {#if form.imageUrl}
        <img class="pratinjau" src={form.imageUrl} alt="Pratinjau foto menu" />
      {/if}
    </div>

    <div class="resep">
      <div class="resep__kepala">
        <span class="resep__judul">Resep</span>
        <span class="resep__aksi">
          <button type="button" class="btn btn--quiet btn--sm" onclick={tambahBaris}>+ Bahan</button>
          <button type="button" class="btn btn--quiet btn--sm" onclick={tambahBahanBaru}>+ Bahan baru</button>
        </span>
      </div>
      <p class="muted kecil resep__total">
        Total takaran ≈ <strong class="tabular">{totalResep.gram} g</strong> untuk
        {form.porsiDasar || 0} porsi dasar → <strong class="tabular">{totalResep.perPorsi} g/porsi</strong>
      </p>

      {#each form.resep as baris, indeks}
        <div class="resep__baris" class:resep__baris--baru={isBahanBaru(baris)}>
          {#if isBahanBaru(baris)}
            <input
              class="input"
              type="text"
              placeholder="Nama bahan baru"
              bind:value={baris.bahanBaru}
              aria-label="Nama bahan baru baris {indeks + 1}"
              required
            />
          {:else}
            <select class="select" bind:value={baris.bahan} aria-label="Bahan baris {indeks + 1}">
              <option value="__baru__">+ Bahan baru…</option>
              {#each terurut as bahanItem}
                <option value={bahanItem.slug}>{bahanItem.nama}</option>
              {/each}
            </select>
          {/if}
          <input
            class="input tabular"
            type="number"
            min="0"
            step="0.5"
            bind:value={baris.jumlah}
            aria-label="Jumlah baris {indeks + 1}"
          />
          <select class="select" bind:value={baris.satuan} aria-label="Satuan baris {indeks + 1}">
            {#each SATUAN_RESEP as satuan}<option value={satuan}>{satuan}</option>{/each}
          </select>
          <button
            type="button"
            class="btn btn--danger btn--sm"
            aria-label="Hapus bahan baris {indeks + 1}"
            onclick={() => hapusBaris(indeks)}>×</button
          >
        </div>
        {#if isBahanBaru(baris)}
          <div class="resep__baru">
            <div class="field">
              <label for="b-satuan-{indeks}">Satuan beli</label>
              <select id="b-satuan-{indeks}" class="select" bind:value={baris.satuanDasar}>
                {#each SATUAN_DASAR as satuan}<option value={satuan}>{satuan}</option>{/each}
              </select>
            </div>
            <div class="field">
              <label for="b-harga-{indeks}">Harga beli / satuan (Rp)</label>
              <input
                id="b-harga-{indeks}"
                class="input tabular"
                type="number"
                min="0"
                step="500"
                bind:value={baris.hargaPerKg}
              />
            </div>
            <div class="field">
              <label for="b-substitusi-{indeks}">Substitusi saran</label>
              <input
                id="b-substitusi-{indeks}"
                class="input"
                type="text"
                placeholder="Contoh: gula palem"
                bind:value={baris.substitusiSaran}
              />
            </div>
          </div>
        {:else if bahanTerpilih(baris)}
          <p class="muted kecil resep__info">
            {bahanTerpilih(baris).satuanBeli} · {formatRupiah(bahanTerpilih(baris).hargaSatuan)}/
            {bahanTerpilih(baris).satuanBeli}
            {#if bahanTerpilih(baris).substitusi}· substitusi: {bahanTerpilih(baris).substitusi}{/if}
          </p>
        {/if}
        <p class="muted kecil resep__gram">
          {#if gramBaris(baris) === null}
            Takaran “secukupnya” tidak dikonversi.
          {:else}
            ≈ {gramBaris(baris)} g untuk {form.porsiDasar || 0} porsi =
            <strong class="tabular">
              {Number(form.porsiDasar) > 0
                ? Math.round((gramBaris(baris) / Number(form.porsiDasar)) * 10) / 10
                : 0} g/porsi
            </strong>
          {/if}
        </p>
      {/each}
      <p class="muted kecil">
        Bahan baru otomatis masuk katalog bahan sehingga langsung terbaca oleh Gramasi, Inflasi, dan
        Timeline.
      </p>
    </div>

    <div class="aksi">
      <button class="btn btn--primary" type="submit" disabled={sibuk}>
        {sibuk ? 'Menyimpan…' : idUbah ? 'Simpan perubahan' : 'Tambah menu'}
      </button>
      {#if idUbah}
        <button type="button" class="btn btn--quiet" onclick={mulaiBaru}>Batal</button>
      {/if}
    </div>
  </form>
</section>

<style>
  .kelola {
    display: grid;
    gap: 18px;
  }

  @media (min-width: 1000px) {
    .kelola {
      grid-template-columns: minmax(0, 1fr) 420px;
      align-items: start;
    }

    .form {
      position: sticky;
      top: 92px;
      max-height: calc(100vh - 110px);
      overflow-y: auto;
    }
  }

  .kepala {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .daftar {
    display: grid;
    gap: 12px;
  }

  .item {
    display: grid;
    grid-template-columns: 96px 1fr;
    overflow: hidden;
  }

  .item--aktif {
    box-shadow: 6px 6px 0 0 var(--mustard), 6px 6px 0 2px var(--ink);
  }

  .item__foto {
    width: 96px;
    height: 100%;
    min-height: 104px;
    object-fit: cover;
    background: var(--cream-deep);
    border-right: var(--border);
  }

  .item__foto--kosong {
    display: grid;
    place-items: center;
    font-size: 11px;
    color: var(--ink-soft);
    text-align: center;
  }

  .item__isi {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .item__kategori {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .item__nama {
    font-size: 17px;
    font-weight: 700;
  }

  .item__meta {
    font-size: 13px;
  }

  .item__aksi {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .fieldset {
    border: 0;
    padding: 0;
    margin: 0 0 14px;
  }

  .fieldset legend {
    font-size: 13px;
    font-weight: 700;
    padding: 0;
    margin-bottom: 8px;
  }

  .kecil {
    font-size: 12px;
  }

  .pratinjau {
    margin-top: 8px;
    width: 100%;
    max-width: 220px;
    border: var(--border);
    border-radius: var(--radius-sm);
  }

  .resep {
    margin: 8px 0 18px;
    padding-top: 14px;
    background: var(--cream-deep);
    border-radius: var(--radius-sm);
    padding: 14px;
  }

  .resep__kepala {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .resep__judul {
    font-size: 13px;
    font-weight: 700;
  }

  .resep__aksi {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .resep__baris {
    display: grid;
    grid-template-columns: 1fr 80px 90px 40px;
    gap: 6px;
    margin-bottom: 8px;
  }

  .resep__baru {
    display: grid;
    gap: 8px;
    padding: 0 0 10px;
  }

  .resep__info {
    margin: -4px 0 2px;
  }

  .resep__gram {
    margin: 0 0 10px;
  }

  .resep__total {
    margin: -4px 0 10px;
  }

  .resep__baris .input,
  .resep__baris .select {
    min-height: 40px;
    padding: 6px 8px;
    font-size: 14px;
  }

  .resep__baris .btn {
    padding: 4px 8px;
    font-size: 16px;
  }

  .aksi {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .notif {
    border: var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .notif--ok {
    background: var(--teal);
  }

  .notif--galat {
    background: var(--coral);
  }
</style>
