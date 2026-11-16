<script>
  import { formatRupiah, hargaPerPorsi, simulasiInflasi } from '../../lib/kitchen.js';

  let { produk = [] } = $props();

  const awal = produk.find((item) => (item.resep ?? []).length) ?? produk[0] ?? null;
  let idTerpilih = $state(awal?.id ?? null);
  let slugBahan = $state(awal?.resep?.[0]?.slug ?? '');
  let persen = $state(20);
  let tersalin = $state('');
  let menerapkan = $state(false);
  let pesanTerapkan = $state('');

  const terpilih = $derived(produk.find((item) => item.id === idTerpilih) ?? null);
  const daftarBahan = $derived(terpilih?.resep ?? []);

  const hasil = $derived.by(() => {
    if (!terpilih || !slugBahan) return null;
    try {
      return simulasiInflasi({ produk: terpilih, slugBahan, persen: Number(persen) });
    } catch {
      return null;
    }
  });

  const label = { AMAN: 'Aman', WASPADA: 'Waspada', KRITIS: 'Kritis' };
  const kelas = { AMAN: 'badge--aman', WASPADA: 'badge--waspada', KRITIS: 'badge--kritis' };

  function gantiProduk(event) {
    const id = Number(event.currentTarget.value);
    idTerpilih = id;
    const item = produk.find((p) => p.id === id);
    slugBahan = item?.resep?.[0]?.slug ?? '';
  }

  async function salin(teks) {
    try {
      await navigator.clipboard.writeText(teks);
      tersalin = 'Saran disalin.';
    } catch {
      tersalin = 'Peramban menolak akses clipboard.';
    }
  }

  async function terapkanHargaBaru() {
    if (!slugBahan) return;
    menerapkan = true;
    pesanTerapkan = '';
    try {
      const respons = await fetch('/api/apply-inflation', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slugBahan, persen: Number(persen) }),
      });
      const hasil = await respons.json();
      if (!respons.ok) throw new Error(hasil.error ?? 'Gagal menerapkan.');
      pesanTerapkan = `Harga ${slugBahan} diperbarui ke ${formatRupiah(hasil.data.hargaSatuan)}. Muat ulang menu untuk melihat HPP baru.`;
    } catch (error) {
      pesanTerapkan = error.message;
    } finally {
      menerapkan = false;
    }
  }
</script>

<section class="panel">
  <h2 class="panel__title">Radar inflasi bahan</h2>
  <p class="panel__hint">
    Simulasikan kenaikan harga bahan dan lihat dampaknya pada HPP serta margin. Saran bersifat usulan —
    resep tidak diubah otomatis.
  </p>

  {#if !terpilih}
    <p class="muted">Belum ada menu.</p>
  {:else}
    <div class="kontrol">
      <div class="field">
        <label for="k2-produk">Menu</label>
        <select id="k2-produk" class="select" value={idTerpilih} onchange={gantiProduk}>
          {#each produk as item (item.id)}
            <option value={item.id}>{item.nama}</option>
          {/each}
        </select>
      </div>

      <div class="field">
        <label for="k2-bahan">Bahan yang naik</label>
        <select id="k2-bahan" class="select" bind:value={slugBahan}>
          {#each daftarBahan as baris (baris.slug)}
            <option value={baris.slug}>{baris.nama}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="field">
      <label for="k2-persen">
        Kenaikan harga <span class="tabular">{persen}%</span>
      </label>
      <input id="k2-persen" class="slider" type="range" min="0" max="100" step="5" bind:value={persen} />
      <div class="skala muted kecil"><span>0%</span><span>50%</span><span>100%</span></div>
    </div>

    {#if !hasil}
      <p class="muted">Pilih bahan untuk melihat simulasi.</p>
    {:else}
      <div class="ringkas">
        <span class="badge {kelas[hasil.status]}">{label[hasil.status]} · margin {hasil.marginAkhir}%</span>
        <span class="muted kecil">dari margin awal {hasil.marginAwal}%</span>
      </div>

      <div class="angka">
        <div class="angka__kotak">
          <p class="angka__label">HPP awal</p>
          <p class="angka__nilai tabular">{formatRupiah(hasil.hppAwal)}</p>
        </div>
        <div class="angka__kotak angka__kotak--sorot">
          <p class="angka__label">HPP setelah naik</p>
          <p class="angka__nilai tabular">{formatRupiah(hasil.hppAkhir)}</p>
        </div>
        <div class="angka__kotak">
          <p class="angka__label">Harga jual / porsi</p>
          <p class="angka__nilai tabular">{formatRupiah(hargaPerPorsi(terpilih))}</p>
        </div>
      </div>

      {#if hasil.bahan}
        <p class="muted kecil sumber">
          Simulasi: {hasil.bahan.nama} +{hasil.kenaikan}% · HPP digabung biaya kemasan dan operasional.
        </p>
      {/if}

      <h3 class="sub">Saran penyesuaian</h3>
      {#if hasil.saran.length === 0}
        <p class="aman">Margin masih sehat. Tidak perlu penyesuaian.</p>
      {:else}
        <ul class="saran">
          {#each hasil.saran as saran}
            <li class="saran__item">
              <div>
                <p class="saran__judul">{saran.judul}</p>
                <p class="saran__detail">{saran.detail}</p>
                <p class="saran__dampak muted kecil">{saran.dampak}</p>
              </div>
              <button
                type="button"
                class="btn btn--quiet btn--sm"
                onclick={() => salin(`${saran.judul}: ${saran.detail} ${saran.dampak}`)}>Salin</button
              >
            </li>
          {/each}
        </ul>
      {/if}

      {#if tersalin}
        <p class="muted kecil" role="status">{tersalin}</p>
      {/if}

      <div class="terapkan">
        <button
          type="button"
          class="btn btn--primary btn--sm"
          disabled={menerapkan || !slugBahan}
          onclick={terapkanHargaBaru}
        >
          {menerapkan ? 'Menerapkan…' : 'Terapkan Harga Baru ke Resep'}
        </button>
        {#if pesanTerapkan}
          <p class="muted kecil" role="status">{pesanTerapkan}</p>
        {/if}
      </div>
    {/if}
  {/if}
</section>

<style>
  .kontrol {
    display: grid;
    gap: 12px;
  }

  @media (min-width: 720px) {
    .kontrol {
      grid-template-columns: 1fr 1fr;
    }
  }

  .slider {
    width: 100%;
    accent-color: var(--mustard);
    min-height: 44px;
  }

  .skala {
    display: flex;
    justify-content: space-between;
  }

  .kecil {
    font-size: 12px;
  }

  .ringkas {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .angka {
    display: grid;
    gap: 8px;
    margin-bottom: 12px;
  }

  @media (min-width: 600px) {
    .angka {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .angka__kotak {
    background: var(--cream-deep);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
  }

  .angka__kotak--sorot {
    background: var(--mustard);
  }

  .angka__label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .angka__nilai {
    font-size: 20px;
    font-weight: 800;
  }

  .sumber {
    margin-bottom: 12px;
  }

  .sub {
    font-size: 14px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 16px 0 8px;
  }

  .saran {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }

  .saran__item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    border: var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
  }

  .saran__judul {
    font-weight: 700;
    font-size: 14px;
  }

  .saran__detail {
    font-size: 13px;
  }

  .aman {
    background: var(--teal);
    border: var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 600;
  }
</style>
