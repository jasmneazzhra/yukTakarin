import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { C as renderComponent, O as renderTemplate } from "./sequence_ne2iXGz0.mjs";
import "./compiler_DXCFmxuo.mjs";
import { n as createComponent, t as $$Base } from "./Base_DgT9nmK4.mjs";
import { n as derived, o as attr, r as ensure_array_like, s as escape_html, t as attr_class } from "./dev_CJZ64T7G.mjs";
import "./index-server_BfMsyjkz.mjs";
import { C as validasiStok, S as validasiPesanan, d as repo_exports, g as formatRupiah } from "./repo_CAXlixrm.mjs";
import { t as placeholderMenu } from "./placeholder_C0fw62bR.mjs";
import { t as bacaEnv } from "./env_Bf19XHEq.mjs";
// src/components/Catalog.svelte
function Catalog($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { produk = [], sumber = "seed", clientKey = "", snapUrl = "" } = $$props;
		const ONGKIR = 15e3;
		const KATEGORI = [
			"Semua",
			"Kopi & Minuman",
			"Pastry & Roti",
			"Kue Panggang",
			"Paket Snack Box"
		];
		const hariIni = /* @__PURE__ */ new Date();
		`${hariIni.getFullYear()}${String(hariIni.getMonth() + 1).padStart(2, "0")}${String(hariIni.getDate()).padStart(2, "0")}`;
		const besok = new Date(hariIni.getTime() + 864e5);
		const tanggalAwal = `${besok.getFullYear()}-${String(besok.getMonth() + 1).padStart(2, "0")}-${String(besok.getDate()).padStart(2, "0")}`;
		const JAM = [];
		for (let menit = 420; menit <= 1260; menit += 30) {
			const jam = String(Math.floor(menit / 60)).padStart(2, "0");
			const sisa = String(menit % 60).padStart(2, "0");
			JAM.push(`${jam}:${sisa}`);
		}
		let kueri = "";
		let kategoriAktif = "Semua";
		let urutan = "nama";
		let maksKalori = "";
		let keranjang = [];
		let mode = "kirim";
		let tanggal = tanggalAwal;
		let jamKirim = "12:00";
		let nama = "";
		derived(() => {
			return {
				valid: true,
				pesan: ""
			};
		});
		const hasil = derived(() => {
			const teks = kueri.trim().toLowerCase();
			return [...produk.filter((item) => {
				const cocokTeks = !teks || `${item.nama} ${item.deskripsi} ${item.kategori}`.toLowerCase().includes(teks);
				const batas = Number(maksKalori);
				const cocokKalori = !(batas > 0) || item.kalori != null && item.kalori <= batas;
				return cocokTeks && cocokKalori;
			})].sort((a, b) => {
				return a.nama.localeCompare(b.nama, "id");
			});
		});
		const baris = derived(() => keranjang.map((k) => ({
			item: produk.find((p) => p.id === k.id),
			jumlah: Number(k.jumlah) || 0
		})).filter((b) => b.item));
		derived(() => baris().reduce((t, b) => t + b.jumlah, 0));
		const subtotal = derived(() => baris().reduce((t, b) => t + b.item.harga * b.jumlah, 0));
		const ongkir = derived(() => baris().length ? ONGKIR : 0);
		derived(() => subtotal() + ongkir());
		derived(() => baris().reduce((t, b) => t + (b.item.kalori ?? 0) * b.jumlah * (b.item.porsiPerSatuan ?? 1), 0));
		const validasi = derived(() => validasiPesanan({
			jumlah: 1,
			tanggal,
			jamKirim,
			nama,
			mode
		}));
		derived(() => Object.fromEntries(validasi().errors.map((e) => [e.field, e.pesan])));
		derived(() => {
			for (const b of baris()) {
				const cek = validasiStok({
					jumlah: b.jumlah,
					stok: b.item.stok
				});
				if (!cek.valid) return `${b.item.nama}: ${cek.pesan}`;
			}
			return "";
		});
		derived(() => {
			return null;
		});
		const rupiah = (nilai) => formatRupiah(nilai);
		$$renderer.push(`<header class="topbar svelte-qickb7"><div class="wrap topbar__inner svelte-qickb7"><div><p class="wordmark svelte-qickb7">yukTakarin!</p> <p class="tagline svelte-qickb7">Coffee &amp; Kue rumahan</p></div> <a class="btn btn--quiet btn--sm" href="/login">Masuk Pemilik</a></div></header> <main class="wrap halaman svelte-qickb7"><section class="hero svelte-qickb7"><p class="hero__eyebrow svelte-qickb7">Katering harian &amp; acara</p> <h1 class="svelte-qickb7">Kopi, pastry, dan kue rumahan untuk rapat dan acara.</h1> <p class="hero__sub svelte-qickb7">Pilih menu, tentukan jumlah dan jam ambil atau kirim, lalu bayar online. Pesanan langsung
      diteruskan ke dapur setelah pembayaran.</p> <div class="hero__badges svelte-qickb7"><span class="badge badge--netral">Dipanggang harian</span> <span class="badge badge--netral">Tanpa minimal pesanan</span> <span class="badge badge--netral">Harga transparan</span></div></section> <section class="filters svelte-qickb7" aria-label="Filter menu"><div class="filters__cari"><label class="sr-only" for="cari">Cari menu</label> <input id="cari" class="input" type="search" placeholder="Cari kopi, croissant, bolu…"${attr("value", kueri)}/></div> <div class="chips" role="group" aria-label="Kategori"><!--[-->`);
		const each_array = ensure_array_like(KATEGORI);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let kategori = each_array[$$index];
			$$renderer.push(`<button type="button" class="chip"${attr("aria-pressed", kategoriAktif === kategori)}>${escape_html(kategori)}</button>`);
		}
		$$renderer.push(`<!--]--></div> <div class="filters__kalori svelte-qickb7"><label for="kalori">Maks. kalori / porsi</label> <div class="kalori__baris svelte-qickb7"><input id="kalori" class="input tabular" type="number" min="0" step="10" inputmode="numeric" placeholder="mis. 250"${attr("value", maksKalori)}/> <span class="muted">kkal</span></div> <div class="chips" role="group" aria-label="Pilihan cepat kalori"><!--[-->`);
		const each_array_1 = ensure_array_like([
			200,
			300,
			400
		]);
		for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
			let batas = each_array_1[$$index_1];
			$$renderer.push(`<button type="button" class="chip"${attr("aria-pressed", Number(maksKalori) === batas)}>≤ ${escape_html(batas)}</button>`);
		}
		$$renderer.push(`<!--]--></div></div> <div class="filters__urut svelte-qickb7"><label for="urut" class="svelte-qickb7">Urutkan</label> `);
		$$renderer.select({
			id: "urut",
			class: "select",
			value: urutan
		}, ($$renderer) => {
			$$renderer.option({ value: "nama" }, ($$renderer) => {
				$$renderer.push(`Nama A–Z`);
			});
			$$renderer.option({ value: "termurah" }, ($$renderer) => {
				$$renderer.push(`Harga terendah`);
			});
			$$renderer.option({ value: "termahal" }, ($$renderer) => {
				$$renderer.push(`Harga tertinggi`);
			});
		}, "svelte-qickb7");
		$$renderer.push(`</div></section> <div class="layout svelte-qickb7"><section aria-label="Katalog menu"><p class="hasil svelte-qickb7" aria-live="polite">${escape_html(hasil().length)} menu ditampilkan</p> `);
		if (Number(maksKalori) > 0) $$renderer.push(`<!--[0--><p class="muted">Menu ≤ ${escape_html(maksKalori)} kkal per porsi. Menu tanpa data kalori disembunyikan.</p>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (hasil().length === 0) $$renderer.push(`<!--[0--><div class="kosong panel svelte-qickb7"><p class="kosong__judul svelte-qickb7">Belum ada menu yang cocok.</p> <p class="muted">Coba kata kunci lain atau pilih kategori “Semua”.</p> <button type="button" class="btn btn--quiet btn--sm">Reset filter</button></div>`);
		else {
			$$renderer.push(`<!--[-1--><div class="grid svelte-qickb7"><!--[-->`);
			const each_array_2 = ensure_array_like(hasil());
			for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
				let item = each_array_2[$$index_2];
				$$renderer.push(`<article${attr_class("card kartu svelte-qickb7", void 0, { "dipilih-kartu": void 0 === item.id })}><div class="kartu__foto svelte-qickb7"><img${attr("src", item.imageUrl)}${attr("alt", item.nama)} loading="lazy" width="400" height="300" class="svelte-qickb7"/> <span class="badge badge--netral kartu__badge svelte-qickb7">${escape_html(item.kategori)}</span></div> <div class="kartu__isi svelte-qickb7"><h2 class="kartu__nama svelte-qickb7">${escape_html(item.nama)}</h2> <p class="kartu__deskripsi svelte-qickb7">${escape_html(item.deskripsi)}</p> <p class="kartu__meta svelte-qickb7"><span class="tabular">${escape_html(rupiah(item.harga))}</span> <span class="muted">/${escape_html(item.satuan)}</span> `);
				if (item.kalori) $$renderer.push(`<!--[0--><span class="muted">· ±${escape_html(item.kalori)} kkal/porsi</span>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></p> <div class="kartu__aksi svelte-qickb7"><button type="button" class="btn btn--quiet btn--sm btn--block">Rincian bahan</button> <button type="button" class="btn btn--primary btn--block"${attr("disabled", Number(item.stok ?? 0) <= 0, true)}>${escape_html(Number(item.stok ?? 0) <= 0 ? "Sold Out" : void 0 === item.id ? "Menu dipilih" : "Pesan")}</button></div></div></article>`);
			}
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></section> <aside class="checkout svelte-qickb7" aria-label="Pesanan"><div class="panel"><h2 class="panel__title">Pesanan kamu</h2> `);
		$$renderer.push(`<!--[0--><p class="panel__hint">Pilih satu menu untuk mulai memesan.</p> <div class="checkout__kosong svelte-qickb7"><span class="badge badge--netral">Belum ada menu</span></div>`);
		$$renderer.push(`<!--]--></div></aside></div></main> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <footer class="footer svelte-qickb7"><div class="wrap footer__inner svelte-qickb7"><p><strong>yukTakarin!</strong> · Coffee &amp; Kue rumahan</p> <p class="muted">Data menu: ${escape_html(sumber === "neon" ? "Neon PostgreSQL" : "seed lokal (mode demo)")} · Buka 07.00–21.00 WIB</p></div></footer>`);
	});
}
// src/pages/menu.astro
var menu_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Menu,
	file: () => $$file,
	url: () => $$url
});
var $$Menu = createComponent(async ($$result, $$props, $$slots) => {
	const repoApi = repo_exports;
	const loader = [
		"daftarProduk",
		"listProduk",
		"getProducts"
	].map((nama) => repoApi[nama]).find((nilai) => typeof nilai === "function") ?? Object.entries(repoApi).find(([nama, nilai]) => /produk|product/i.test(nama) && /list|get|daftar/i.test(nama) && typeof nilai === "function")?.[1];
	if (typeof loader !== "function") throw new Error("Tidak ada fungsi untuk mengambil daftar produk di repo.");
	const katalog = (await loader({ publik: true })).map((item) => {
		const produkItem = item;
		return {
			...produkItem,
			imageUrl: (typeof produkItem.imageUrl === "string" ? produkItem.imageUrl : "") || placeholderMenu(String(produkItem.nama ?? ""), String(produkItem.kategori ?? ""))
		};
	});
	const sumber = String(repoApi.modeData?.() ?? "");
	const clientKey = String(bacaEnv("MIDTRANS_CLIENT_KEY") ?? "");
	const snapUrl = String(bacaEnv("MIDTRANS_IS_PRODUCTION") === "true" ? "https://app.midtrans.com/snap/snap.js" : "https://app.sandbox.midtrans.com/snap/snap.js");
	return renderTemplate`${renderComponent($$result, "Base", $$Base, {
		"judul": "yukTakarin! — Katalog",
		"deskripsi": "Katalog menu kopi, pastry, dan kue rumahan. Pilih menu, atur jumlah dan jadwal, lalu bayar online."
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "Catalog", Catalog, {
		"client:load": true,
		"produk": katalog,
		"sumber": sumber,
		"clientKey": clientKey,
		"snapUrl": snapUrl,
		"client:component-hydration": "load",
		"client:component-path": "C:/Users/jasmi/pawonboga-lab/src/components/Catalog.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/Users/jasmi/pawonboga-lab/src/pages/menu.astro", void 0);
var $$file = "C:/Users/jasmi/pawonboga-lab/src/pages/menu.astro";
var $$url = "/menu";
// \0virtual:astro:page:src/pages/menu@_@astro
var page = () => menu_exports;
export { page };
