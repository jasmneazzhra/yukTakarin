<script>
  import { susunTimeline, statusSegmen, formatMenit, faseKhususKafe } from '../../lib/kitchen.js';

  let { produk = [], pilihanId = null, jamAwal = null } = $props();

  const awal = (pilihanId ? produk.find((p) => p.id === pilihanId) : null) ?? produk[0] ?? null;
  let idTerpilih = $state(awal?.id ?? null);
  let jamKirim = $state(jamAwal ?? '12:00');
  let tempuh = $state(20);
  let buffer = $state(10);
  let tanggal = $state(new Date().toISOString().slice(0, 10));

  let sekarang = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (sekarang = Date.now()), 30000);
    return () => clearInterval(id);
  });

  const terpilih = $derived(produk.find((item) => item.id === idTerpilih) ?? null);

  const fase = $derived(faseKhususKafe(terpilih));

  const hasil = $derived.by(() => {
    if (!terpilih) return null;
    try {
      return susunTimeline({
        jamKirim,
        prepMenit: terpilih.prepMenit,
        prosesMenit: terpilih.prosesMenit,
        packingMenit: terpilih.packingMenit,
        tempuhMenit: Number(tempuh),
        bufferMenit: Number(buffer),
        ...fase,
      });
    } catch {
      return null;
    }
  });

  const hariIni = new Date().toISOString().slice(0, 10);
  const menitSekarang = $derived.by(() => {
    const d = new Date(sekarang);
    return d.getHours() * 60 + d.getMinutes();
  });

  function gantiProduk(event) {
    const id = Number(event.currentTarget.value);
    idTerpilih = id;
  }

  const labelStatus = { MENUNGGU: 'Menunggu', JALAN: 'Berjalan', WASPADA: 'Waspada', TERLAMBAT: 'Terlambat' };
  const kelasStatus = {
    MENUNGGU: 'badge--netral',
    JALAN: 'badge--aman',
    WASPADA: 'badge--waspada',
    TERLAMBAT: 'badge--kritis',
  };
</script>

<section class="panel">
  <h2 class="panel__title">Timeline masak mundur</h2>
  <p class="panel__hint">
    Hitung mundur dari jam kirim/ambil pelanggan: persiapan → seduh/panggang → packing → kirim. Waktu
    tempuh dan buffer adalah input pemilik.
  </p>

  {#if !terpilih}
    <p class="muted">Belum ada menu.</p>
  {:else}
    <div class="kontrol">
      <div class="field">
        <label for="k3-produk">Menu</label>
        <select id="k3-produk" class="select" value={idTerpilih} onchange={gantiProduk}>
          {#each produk as item (item.id)}
            <option value={item.id}>{item.nama}</option>
          {/each}
        </select>
      </div>

      <div class="field">
        <label for="k3-tanggal">Tanggal kirim/ambil</label>
        <input id="k3-tanggal" class="input" type="date" bind:value={tanggal} />
      </div>

      <div class="field">
        <label for="k3-jam">Jam kirim/ambil</label>
        <input id="k3-jam" class="input" type="time" step="1800" bind:value={jamKirim} />
      </div>

      <div class="field">
        <label for="k3-tempuh">Waktu tempuh (menit)</label>
        <input id="k3-tempuh" class="input tabular" type="number" min="0" bind:value={tempuh} />
      </div>

      <div class="field">
        <label for="k3-buffer">Buffer (menit)</label>
        <input id="k3-buffer" class="input tabular" type="number" min="0" bind:value={buffer} />
      </div>
    </div>

    {#if !hasil}
      <p class="muted">Jam kirim tidak valid.</p>
    {:else}
      <p class="mulai">
        Mulai persiapan <strong class="tabular">{hasil.mulaiPersiapanLabel}</strong> · tiba di pelanggan
        <strong class="tabular">{formatMenit(hasil.tiba)} WIB</strong> · total kerja
        <strong class="tabular">{hasil.totalMenit} menit</strong>
      </p>

      <p class="muted kecil">
        Waktu kerja menu: persiapan {terpilih.prepMenit} menit · {terpilih.prosesLabel}
        {terpilih.prosesMenit} menit · packing {terpilih.packingMenit} menit.
        {#if fase.praProsesMenit > 0}· {fase.praProsesLabel} {fase.praProsesMenit} menit (mulai jauh lebih awal){/if}
        {#if fase.peracikanMenit > 0}· {fase.peracikanLabel} {fase.peracikanMenit} menit sebelum kirim{/if}
      </p>

      <ol class="timeline">
        {#each hasil.segmen as segmen (segmen.kode)}
          {@const status = tanggal === hariIni
            ? statusSegmen(menitSekarang, segmen).status
            : 'MENUNGGU'}
          <li class="timeline__item timeline__item--{status.toLowerCase()}">
            <div class="timeline__jam tabular">
              {segmen.mulaiLabel} – {segmen.selesaiLabel}
            </div>
            <div class="timeline__isi">
              <p class="timeline__nama">{segmen.label}</p>
              <p class="muted kecil">{segmen.durasiMenit} menit</p>
            </div>
            <span class="badge {kelasStatus[status]}">{labelStatus[status]}</span>
          </li>
        {/each}
      </ol>

      {#if tanggal !== hariIni}
        <p class="muted kecil">
          Status dihitung hanya untuk jadwal hari ini. Untuk hari lain, jadwal tetap ditampilkan.
        </p>
      {/if}
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
      grid-template-columns: 1fr 1fr;
    }
  }

  .mulai {
    background: var(--mustard);
    border: var(--border);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-action);
    padding: 10px 12px;
    font-size: 14px;
    margin-bottom: 12px;
  }

  .kecil {
    font-size: 12px;
  }

  .timeline {
    list-style: none;
    margin: 14px 0 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }

  .timeline__item {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 10px;
    align-items: center;
    border: var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    background: var(--cream);
  }

  .timeline__item--terlambat {
    background: var(--coral);
  }

  .timeline__item--waspada {
    background: var(--mustard);
  }

  .timeline__item--menunggu {
    background: var(--cream-deep);
  }

  .timeline__jam {
    font-weight: 800;
    font-size: 14px;
  }

  .timeline__nama {
    font-weight: 700;
    font-size: 15px;
  }
</style>
