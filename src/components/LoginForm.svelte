<script>
  let { modeDev = false, galat = false } = $props();

  let username = $state('');
  let password = $state('');
  let sibuk = $state(false);
  let pesan = $state(galat ? 'Username atau password salah. Coba lagi.' : '');

  async function masuk(event) {
    event.preventDefault();
    pesan = '';
    sibuk = true;
    try {
      const respons = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const hasil = await respons.json();
      if (!respons.ok) throw new Error(hasil.error ?? 'Gagal masuk.');
      window.location.href = '/dapur';
    } catch (error) {
      pesan = error.message;
    } finally {
      sibuk = false;
    }
  }
</script>

<section class="card panel">
  <p class="eyebrow">Khusus pemilik warung</p>
  <h1>Masuk ke Dapur</h1>
  <p class="muted">
    Katalog tetap terbuka untuk pelanggan. Halaman dapur, kelola menu, dan perubahan pesanan hanya bisa
    diakses setelah masuk.
  </p>

  {#if pesan}
    <p class="notif notif--galat" role="alert">{pesan}</p>
  {/if}

  {#if modeDev}
    <p class="notif">
      <strong>Mode dev.</strong> <code>OWNER_PASSWORD</code> belum diisi, jadi kredensial cadangan lokal
      dipakai. Isi <code>.env</code> sebelum dipakai di warung sungguhan.
    </p>
  {/if}

  <form class="form" onsubmit={masuk}>
    <div class="field">
      <label for="username">Username pemilik</label>
      <input
        id="username"
        class="input"
        name="username"
        type="text"
        autocomplete="username"
        bind:value={username}
        required
      />
    </div>
    <div class="field">
      <label for="password">Password</label>
      <input
        id="password"
        class="input"
        name="password"
        type="password"
        autocomplete="current-password"
        bind:value={password}
        required
      />
    </div>
    <button class="btn btn--primary btn--block" type="submit" disabled={sibuk}>
      {sibuk ? 'Memeriksa…' : 'Masuk ke dapur'}
    </button>
  </form>

  <p class="muted kecil">Sesi berlaku 12 jam dan disimpan sebagai cookie HttpOnly.</p>
</section>

<style>
  .eyebrow {
    display: inline-block;
    background: var(--sage);
    border: var(--border);
    border-radius: 999px;
    padding: 2px 12px;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 10px;
  }

  h1 {
    font-size: clamp(26px, 6vw, 34px);
    font-weight: 800;
    margin-bottom: 8px;
  }

  .form {
    display: grid;
    gap: 12px;
    margin-top: 18px;
  }

  .notif {
    border: var(--border);
    border-radius: var(--radius-sm);
    background: var(--mustard);
    padding: 10px 12px;
    font-size: 13px;
    margin-top: 14px;
  }

  .notif--galat {
    background: var(--coral);
  }

  .kecil {
    font-size: 12px;
    margin-top: 14px;
  }
</style>
