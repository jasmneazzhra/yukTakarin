<script>
  import { skalaResep, formatRupiah, formatBerat, formatTakaran } from '../../lib/kitchen.js';

  let { produk = [], pilihanId = null, jumlahAwal = null } = $props();

  const awal = (pilihanId ? produk.find((p) => p.id === pilihanId) : null) ?? produk[0] ?? null;
  let idTerpilih = $state(awal?.id ?? null);
  let jumlah = $state(jumlahAwal ?? awal?.minOrder ?? 1);

  const terpilih = $derived(produk.find((item) => item.id === idTerpilih) ?? null);
  const porsiPesanan = $derived(terpilih ? Number(jumlah || 0) * (terpilih.porsiPerSatuan || 1) : 0);

  const hasil = $derived.by(() => {
    if (!terpilih || !(terpilih.porsiDasar > 0) || !(porsiPesanan > 0)) return null;
    try {
      return skalaResep(terpilih.resep ?? [], terpilih.porsiDasar, porsiPesanan);
    } catch {
      return null;
    }
  });

  const utama = $derived(hasil?.baris.filter((baris) => !baris.nonLinear) ?? []);
  const bumbu = $derived(hasil?.baris.filter((baris) => baris.nonLinear) ?? []);

  function gantiProduk(event) {
    const id = Number(event.currentTarget.value);
    idTerpilih = id;
    const item = produk.find((p) => p.id === id);
    jumlah = item?.minOrder ?? 1;
  }
</script>

<section class="panel">
  <h2 class="panel__title">Gramasi &amp; auto-scaling</h2>
  <p class="panel__hint">
    Takaran rumah tangga diterjemahkan ke gram, lalu dikali sesuai porsi pesanan. Bumbu keras memakai
    faktor <span class="tabular">^0,9</span> agar tidak keasinan pada pesanan besar.
  </p>

  {#if !terpilih}
    <p class="muted">Belum ada menu untuk dihitung.</p>
  {:else}
    <div class="kontrol">
      <div class="field">
        <label for="k1-produk">Menu</label>
        <select id="k1-produk" class="select" value={idTerpilih} onchange={gantiProduk}>
          {#each produk as item (item.id)}
            <option value={item.id}>{item.nama}</option>
          {/each}
        </select>
      </div>

      <div class="field">
        <label for="k1-jumlah">Jumlah pesanan ({terpilih.satuan})</label>
        <input
          id="k1-jumlah"
          class="input tabular"
          type="number"
          min={terpilih.minOrder}
          step="1"
          bind:value={jumlah}
        />
        <p class="muted kecil">
          Resep dasar {terpilih.porsiDasar} porsi · pesanan ≈ {porsiPesanan} porsi ·
          {terpilih.porsiPerSatuan > 1 ? `${terpilih.porsiPerSatuan} porsi per ${terpilih.satuan}` : `1 porsi per ${terpilih.satuan}`}
        </p>
      </div>
    </div>

    {#if !hasil}
      <p class="muted">Isi jumlah pesanan minimal {terpilih.minOrder}.</p>
    {:else}
      <p class="faktor">
        Faktor skala <strong class="tabular">{Math.round(hasil.faktor * 100) / 100}×</strong> · total
        kebutuhan <strong class="tabular">{formatBerat(hasil.totalGram)}</strong>
        {#if hasil.totalMl > 0}· <strong class="tabular">{formatTakaran(hasil.totalMl, 'ml')}</strong>{/if}
        <br />
        <span class="muted kecil">
          Per porsi ≈ <strong class="tabular">{hasil.totalGramPerPorsi} g</strong>
          {#if hasil.totalMlPerPorsi > 0}· <strong class="tabular">{formatTakaran(hasil.totalMlPerPorsi, 'ml')}</strong>{/if}
        </span>
      </p>

      {#if utama.length}
        <h3 class="sub">Bahan utama</h3>
        <div class="tabel" role="table" aria-label="Bahan utama">
          <div class="tabel__kepala" role="row">
            <span role="columnheader">Bahan</span>
            <span role="columnheader">Takaran</span>
            <span role="columnheader">Per porsi</span>
            <span role="columnheader">Kebutuhan</span>
          </div>
          {#each utama as baris (baris.slug)}
            <div class="tabel__baris" role="row">
              <span role="cell">
                {baris.nama}
                <span class="muted kecil">({formatRupiah(baris.hargaSatuan)}/{baris.satuanBeli ?? 'satuan'})</span>
              </span>
              <span role="cell" class="muted">{baris.takaranKiraKira ?? baris.takaranRumah}</span>
              <span role="cell" class="tabular kecil">
                {baris.gramPerPorsi !== null
                  ? formatTakaran(
                      baris.satuanTampil === 'ml' ? baris.mlPerPorsi : baris.gramPerPorsi,
                      baris.satuanTampil,
                    )
                  : '—'}
              </span>
              <span role="cell" class="tabular gramasi">
                {baris.gramasi !== null
                  ? formatTakaran(baris.satuanTampil === 'ml' ? baris.ml : baris.gramasi, baris.satuanTampil)
                  : '—'}
              </span>
            </div>
          {/each}
        </div>
      {/if}

      {#if bumbu.length}
        <h3 class="sub">Bumbu &amp; pemanis (non-linear)</h3>
        <div class="tabel" role="table" aria-label="Bumbu dan pemanis">
          <div class="tabel__kepala" role="row">
            <span role="columnheader">Bahan</span>
            <span role="columnheader">Takaran</span>
            <span role="columnheader">Per porsi</span>
            <span role="columnheader">Kebutuhan</span>
          </div>
          {#each bumbu as baris (baris.slug)}
            <div class="tabel__baris" role="row">
              <span role="cell">{baris.nama}</span>
              <span role="cell" class="muted">{baris.takaranKiraKira ?? baris.takaranRumah}</span>
              <span role="cell" class="tabular kecil">
                {baris.gramPerPorsi !== null
                  ? formatTakaran(
                      baris.satuanTampil === 'ml' ? baris.mlPerPorsi : baris.gramPerPorsi,
                      baris.satuanTampil,
                    )
                  : '—'}
              </span>
              <span role="cell" class="tabular gramasi">
                {baris.gramasi !== null
                  ? formatTakaran(baris.satuanTampil === 'ml' ? baris.ml : baris.gramasi, baris.satuanTampil)
                  : 'secukupnya'}
              </span>
            </div>
          {/each}
        </div>
      {/if}

      <h3 class="sub">Daftar belanja pasar terpadu</h3>
      <div class="belanja">
        {#each hasil.baris as baris (baris.slug)}
          {#if baris.gramasi !== null}
            <div class="belanja__baris">
              <span>{baris.nama}</span>
              <span class="tabular">
                {formatTakaran(baris.satuanTampil === 'ml' ? baris.ml : baris.gramasi, baris.satuanTampil)}
              </span>
            </div>
          {:else}
            <div class="belanja__baris">
              <span>{baris.nama}</span>
              <span class="muted kecil">secukupnya</span>
            </div>
          {/if}
        {/each}
        <div class="belanja__total">
          <span>Total belanja</span>
          <span class="tabular">
            {formatBerat(hasil.totalGram)}{#if hasil.totalMl > 0} · {formatTakaran(hasil.totalMl, 'ml')}{/if}
          </span>
        </div>
      </div>

      {#each hasil.peringatan as pesan}
        <p class="ingat">⚠ {pesan}</p>
      {/each}

      <p class="muted kecil catatan">
        Gramasi dibulatkan ke 5 g (≥100 g), 1 g (≥10 g), atau 0,5 g (&lt;10 g). Tidak pernah 0 g.
      </p>
    {/if}
  {/if}
</section>

<style>
  .kontrol {
    display: grid;
    gap: 12px;
    margin-bottom: 16px;
  }

  @media (min-width: 720px) {
    .kontrol {
      grid-template-columns: 2fr 1fr;
      align-items: start;
    }
  }

  .faktor {
    background: var(--cream-deep);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    font-size: 14px;
    margin-bottom: 16px;
  }

  .sub {
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin: 16px 0 8px;
  }

  .tabel {
    border: var(--border);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .tabel__kepala,
  .tabel__baris {
    display: grid;
    grid-template-columns: 1.4fr 1fr 0.7fr 0.9fr;
    gap: 8px;
    padding: 8px 12px;
    align-items: center;
  }

  .tabel__kepala {
    background: var(--cream-deep);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .tabel__baris {
    font-size: 14px;
  }

  .tabel__baris:nth-child(even) {
    background: var(--cream-deep);
  }

  .gramasi {
    font-size: 18px;
    font-weight: 800;
    text-align: right;
  }

  .kecil {
    font-size: 12px;
  }

  .ingat {
    margin-top: 12px;
    background: var(--mustard);
    border: var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 700;
  }

  .catatan {
    margin-top: 12px;
  }

  .belanja {
    border: var(--border);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .belanja__baris,
  .belanja__total {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 12px;
    font-size: 14px;
  }

  .belanja__baris:nth-child(even) {
    background: var(--cream-deep);
  }

  .belanja__total {
    background: var(--mustard);
    font-weight: 800;
  }
</style>
