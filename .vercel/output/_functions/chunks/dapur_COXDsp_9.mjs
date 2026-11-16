import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { C as renderComponent, O as renderTemplate } from "./sequence_ne2iXGz0.mjs";
import "./compiler_DXCFmxuo.mjs";
import { n as createComponent, t as $$Base } from "./Base_DgT9nmK4.mjs";
import { a as stringify, n as derived, o as attr, r as ensure_array_like, s as escape_html, t as attr_class } from "./dev_CJZ64T7G.mjs";
import { _ as hargaPerPorsi, a as daftarBahan, b as marginPersen, g as formatRupiah, l as modeData, s as daftarProduk, v as hitungHpp, x as statusMargin, y as konversiTakaran } from "./repo_CAXlixrm.mjs";
// src/components/dapur/MenuManager.svelte
function MenuManager($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { items = [], bahan = [], onrefresh = async () => {} } = $$props;
		const KATEGORI = [
			"Kopi & Minuman",
			"Pastry & Roti",
			"Kue Panggang",
			"Paket Snack Box"
		];
		const SATUAN_JUAL = [
			"liter",
			"cup",
			"botol",
			"pcs",
			"potong",
			"box"
		];
		const SATUAN_RESEP = [
			"gram",
			"ml",
			"sdt",
			"sdm",
			"sejumput",
			"jumput",
			"centong",
			"gelas",
			"genggam",
			"ruas",
			"shot",
			"sloki",
			"butir",
			"lembar",
			"pcs",
			"secukupnya"
		];
		const SATUAN_DASAR = [
			"kg",
			"liter",
			"butir",
			"pcs",
			"lembar"
		];
		function kosong() {
			return {
				nama: "",
				kategori: KATEGORI[0],
				deskripsi: "",
				harga: 2e4,
				satuan: "pcs",
				minOrder: 1,
				porsiDasar: 10,
				porsiPerSatuan: 1,
				prepMenit: 15,
				prosesLabel: "Seduh / panggang",
				prosesMenit: 20,
				packingMenit: 10,
				biayaKemasan: 1e3,
				biayaOperasional: 500,
				imageUrl: null,
				resep: [{
					bahan: bahan[0]?.slug ?? "",
					jumlah: 100,
					satuan: "gram",
					bahanBaru: ""
				}]
			};
		}
		function isBahanBaru(baris) {
			return baris?.bahan === "__baru__";
		}
		function bahanTerpilih(baris) {
			return terurut().find((item) => item.slug === baris?.bahan) ?? null;
		}
		let form = kosong();
		let idUbah = null;
		let sibuk = false;
		const terurut = derived(() => [...bahan].sort((a, b) => a.nama.localeCompare(b.nama, "id")));
		/** Gramasi otomatis: jumlah × satuan dasar → gram, lalu dibagi porsi dasar. */
		function gramBaris(baris) {
			const jenis = isBahanBaru(baris) ? { densitas: 1 } : bahanTerpilih(baris) ?? { densitas: 1 };
			try {
				const hasil = konversiTakaran(baris.jumlah, baris.satuan, jenis);
				return hasil.tidakTerukur ? null : hasil.gram;
			} catch {
				return null;
			}
		}
		const totalResep = derived(() => {
			const gram = form.resep.reduce((total, baris) => total + (gramBaris(baris) ?? 0), 0);
			const porsi = Number(form.porsiDasar) > 0 ? Number(form.porsiDasar) : 0;
			return {
				gram: Math.round(gram),
				perPorsi: porsi ? Math.round(gram / porsi * 10) / 10 : 0
			};
		});
		$$renderer.push(`<section class="kelola svelte-z5hh5j"><div class="daftar-menu"><div class="kepala svelte-z5hh5j"><h2 class="panel__title">Menu aktif</h2> <button type="button" class="btn btn--primary btn--sm">+ Menu baru</button></div> `);
		if (items.length === 0) $$renderer.push(`<!--[0--><p class="panel__hint">Belum ada menu. Tambahkan menu pertama.</p>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="daftar svelte-z5hh5j"><!--[-->`);
		const each_array = ensure_array_like(items);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let item = each_array[$$index];
			$$renderer.push(`<article${attr_class("card item svelte-z5hh5j", void 0, { "item--aktif": idUbah === item.id })}>`);
			if (item.imageUrl) $$renderer.push(`<!--[0--><img class="item__foto svelte-z5hh5j"${attr("src", item.imageUrl)}${attr("alt", item.nama)} loading="lazy"/>`);
			else $$renderer.push(`<!--[-1--><div class="item__foto item__foto--kosong svelte-z5hh5j">Tanpa foto</div>`);
			$$renderer.push(`<!--]--> <div class="item__isi svelte-z5hh5j"><p class="item__kategori svelte-z5hh5j">${escape_html(item.kategori)}</p> <h3 class="item__nama svelte-z5hh5j">${escape_html(item.nama)}</h3> <p class="muted item__meta svelte-z5hh5j">${escape_html(formatRupiah(item.harga))} /${escape_html(item.satuan)} · min. ${escape_html(item.minOrder)} · ${escape_html((item.resep ?? []).length)} bahan</p> <div class="item__aksi svelte-z5hh5j"><button type="button" class="btn btn--quiet btn--sm">Ubah</button> <button type="button" class="btn btn--danger btn--sm">Hapus</button></div></div></article>`);
		}
		$$renderer.push(`<!--]--></div></div> <form class="panel form svelte-z5hh5j"><h2 class="panel__title">${escape_html("Tambah menu")}</h2> <p class="panel__hint">Takaran resep ditulis untuk <strong>porsi dasar</strong>, bukan satu porsi. Auto-scaling menghitung
      sisanya.</p> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="field"><label for="f-nama">Nama menu</label> <input id="f-nama" class="input" type="text"${attr("value", form.nama)} required=""/></div> <div class="grid-2"><div class="field"><label for="f-kategori">Kategori</label> `);
		$$renderer.select({
			id: "f-kategori",
			class: "select",
			value: form.kategori
		}, ($$renderer) => {
			$$renderer.push(`<!--[-->`);
			const each_array_1 = ensure_array_like(KATEGORI);
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let kategori = each_array_1[$$index_1];
				$$renderer.option({ value: kategori }, ($$renderer) => {
					$$renderer.push(`${escape_html(kategori)}`);
				});
			}
			$$renderer.push(`<!--]-->`);
		});
		$$renderer.push(`</div> <div class="field"><label for="f-satuan">Satuan jual</label> `);
		$$renderer.select({
			id: "f-satuan",
			class: "select",
			value: form.satuan
		}, ($$renderer) => {
			$$renderer.push(`<!--[-->`);
			const each_array_2 = ensure_array_like(SATUAN_JUAL);
			for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
				let satuan = each_array_2[$$index_2];
				$$renderer.option({ value: satuan }, ($$renderer) => {
					$$renderer.push(`${escape_html(satuan)}`);
				});
			}
			$$renderer.push(`<!--]-->`);
		});
		$$renderer.push(`</div></div> <div class="field"><label for="f-deskripsi">Deskripsi</label> <textarea id="f-deskripsi" class="textarea">`);
		const $$body = escape_html(form.deskripsi);
		if ($$body) $$renderer.push(`${$$body}`);
		$$renderer.push(`</textarea></div> <div class="grid-2"><div class="field"><label for="f-harga">Harga jual / satuan (Rp)</label> <input id="f-harga" class="input tabular" type="number" min="1" step="500"${attr("value", form.harga)}/></div> <div class="field"><label for="f-min">Minimum pesanan</label> <input id="f-min" class="input tabular" type="number" min="1"${attr("value", form.minOrder)}/></div> <div class="field"><label for="f-stok">Stok tersedia (${escape_html(form.satuan)})</label> <input id="f-stok" class="input tabular" type="number" min="0"${attr("value", form.stok)}/> <p class="muted kecil svelte-z5hh5j">0 = tampil “Sold Out” di katalog.</p></div></div> <div class="grid-2"><div class="field"><label for="f-porsidasar">Porsi dasar resep</label> <input id="f-porsidasar" class="input tabular" type="number" min="1"${attr("value", form.porsiDasar)}/></div> <div class="field"><label for="f-porsisatuan">Porsi per satuan jual</label> <input id="f-porsisatuan" class="input tabular" type="number" min="1"${attr("value", form.porsiPerSatuan)}/></div></div> <fieldset class="fieldset svelte-z5hh5j"><legend class="svelte-z5hh5j">Waktu kerja dapur (menit)</legend> <div class="grid-2"><div class="field"><label for="f-prep">Persiapan</label> <input id="f-prep" class="input tabular" type="number" min="0"${attr("value", form.prepMenit)}/></div> <div class="field"><label for="f-packing">Packing</label> <input id="f-packing" class="input tabular" type="number" min="0"${attr("value", form.packingMenit)}/></div></div> <div class="grid-2"><div class="field"><label for="f-proseslabel">Label proses</label> <input id="f-proseslabel" class="input" type="text"${attr("value", form.prosesLabel)}/></div> <div class="field"><label for="f-proses">Durasi proses</label> <input id="f-proses" class="input tabular" type="number" min="0"${attr("value", form.prosesMenit)}/></div></div></fieldset> <div class="grid-2"><div class="field"><label for="f-kemasan">Biaya kemasan / porsi (Rp)</label> <input id="f-kemasan" class="input tabular" type="number" min="0"${attr("value", form.biayaKemasan)}/></div> <div class="field"><label for="f-operasional">Biaya operasional / porsi (Rp)</label> <input id="f-operasional" class="input tabular" type="number" min="0"${attr("value", form.biayaOperasional)}/></div></div> <div class="field"><label for="f-foto">Foto menu</label> <input id="f-foto" class="input" type="file" accept="image/*"/> <p class="muted kecil svelte-z5hh5j">Tanpa kredensial Cloudinary, sistem memakai placeholder SVG lokal.</p> `);
		if (form.imageUrl) $$renderer.push(`<!--[0--><img class="pratinjau svelte-z5hh5j"${attr("src", form.imageUrl)} alt="Pratinjau foto menu"/>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> <div class="resep svelte-z5hh5j"><div class="resep__kepala svelte-z5hh5j"><span class="resep__judul svelte-z5hh5j">Resep</span> <span class="resep__aksi svelte-z5hh5j"><button type="button" class="btn btn--quiet btn--sm">+ Bahan</button> <button type="button" class="btn btn--quiet btn--sm">+ Bahan baru</button></span></div> <p class="muted kecil resep__total svelte-z5hh5j">Total takaran ≈ <strong class="tabular">${escape_html(totalResep().gram)} g</strong> untuk
        ${escape_html(form.porsiDasar || 0)} porsi dasar → <strong class="tabular">${escape_html(totalResep().perPorsi)} g/porsi</strong></p> <!--[-->`);
		const each_array_3 = ensure_array_like(form.resep);
		for (let indeks = 0, $$length = each_array_3.length; indeks < $$length; indeks++) {
			let baris = each_array_3[indeks];
			$$renderer.push(`<div${attr_class("resep__baris svelte-z5hh5j", void 0, { "resep__baris--baru": isBahanBaru(baris) })}>`);
			if (isBahanBaru(baris)) $$renderer.push(`<!--[0--><input class="input svelte-z5hh5j" type="text" placeholder="Nama bahan baru"${attr("value", baris.bahanBaru)}${attr("aria-label", `Nama bahan baru baris ${stringify(indeks + 1)}`)} required=""/>`);
			else {
				$$renderer.push("<!--[-1-->");
				$$renderer.select({
					class: "select",
					value: baris.bahan,
					"aria-label": `Bahan baris ${stringify(indeks + 1)}`
				}, ($$renderer) => {
					$$renderer.option({ value: "__baru__" }, ($$renderer) => {
						$$renderer.push(`+ Bahan baru…`);
					});
					$$renderer.push(`<!--[-->`);
					const each_array_4 = ensure_array_like(terurut());
					for (let $$index_3 = 0, $$length = each_array_4.length; $$index_3 < $$length; $$index_3++) {
						let bahanItem = each_array_4[$$index_3];
						$$renderer.option({ value: bahanItem.slug }, ($$renderer) => {
							$$renderer.push(`${escape_html(bahanItem.nama)}`);
						});
					}
					$$renderer.push(`<!--]-->`);
				}, "svelte-z5hh5j");
			}
			$$renderer.push(`<!--]--> <input class="input tabular svelte-z5hh5j" type="number" min="0" step="0.5"${attr("value", baris.jumlah)}${attr("aria-label", `Jumlah baris ${stringify(indeks + 1)}`)}/> `);
			$$renderer.select({
				class: "select",
				value: baris.satuan,
				"aria-label": `Satuan baris ${stringify(indeks + 1)}`
			}, ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				const each_array_5 = ensure_array_like(SATUAN_RESEP);
				for (let $$index_4 = 0, $$length = each_array_5.length; $$index_4 < $$length; $$index_4++) {
					let satuan = each_array_5[$$index_4];
					$$renderer.option({ value: satuan }, ($$renderer) => {
						$$renderer.push(`${escape_html(satuan)}`);
					});
				}
				$$renderer.push(`<!--]-->`);
			}, "svelte-z5hh5j");
			$$renderer.push(` <button type="button" class="btn btn--danger btn--sm svelte-z5hh5j"${attr("aria-label", `Hapus bahan baris ${stringify(indeks + 1)}`)}>×</button></div> `);
			if (isBahanBaru(baris)) {
				$$renderer.push(`<!--[0--><div class="resep__baru svelte-z5hh5j"><div class="field"><label${attr("for", `b-satuan-${stringify(indeks)}`)}>Satuan beli</label> `);
				$$renderer.select({
					id: `b-satuan-${stringify(indeks)}`,
					class: "select",
					value: baris.satuanDasar
				}, ($$renderer) => {
					$$renderer.push(`<!--[-->`);
					const each_array_6 = ensure_array_like(SATUAN_DASAR);
					for (let $$index_5 = 0, $$length = each_array_6.length; $$index_5 < $$length; $$index_5++) {
						let satuan = each_array_6[$$index_5];
						$$renderer.option({ value: satuan }, ($$renderer) => {
							$$renderer.push(`${escape_html(satuan)}`);
						});
					}
					$$renderer.push(`<!--]-->`);
				});
				$$renderer.push(`</div> <div class="field"><label${attr("for", `b-harga-${stringify(indeks)}`)}>Harga beli / satuan (Rp)</label> <input${attr("id", `b-harga-${stringify(indeks)}`)} class="input tabular" type="number" min="0" step="500"${attr("value", baris.hargaPerKg)}/></div> <div class="field"><label${attr("for", `b-substitusi-${stringify(indeks)}`)}>Substitusi saran</label> <input${attr("id", `b-substitusi-${stringify(indeks)}`)} class="input" type="text" placeholder="Contoh: gula palem"${attr("value", baris.substitusiSaran)}/></div></div>`);
			} else if (bahanTerpilih(baris)) {
				$$renderer.push(`<!--[1--><p class="muted kecil resep__info svelte-z5hh5j">${escape_html(bahanTerpilih(baris).satuanBeli)} · ${escape_html(formatRupiah(bahanTerpilih(baris).hargaSatuan))}/
            ${escape_html(bahanTerpilih(baris).satuanBeli)} `);
				if (bahanTerpilih(baris).substitusi) $$renderer.push(`<!--[0-->· substitusi: ${escape_html(bahanTerpilih(baris).substitusi)}`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></p>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <p class="muted kecil resep__gram svelte-z5hh5j">`);
			if (gramBaris(baris) === null) $$renderer.push(`<!--[0-->Takaran “secukupnya” tidak dikonversi.`);
			else $$renderer.push(`<!--[-1-->≈ ${escape_html(gramBaris(baris))} g untuk ${escape_html(form.porsiDasar || 0)} porsi = <strong class="tabular">${escape_html(Number(form.porsiDasar) > 0 ? Math.round(gramBaris(baris) / Number(form.porsiDasar) * 10) / 10 : 0)} g/porsi</strong>`);
			$$renderer.push(`<!--]--></p>`);
		}
		$$renderer.push(`<!--]--> <p class="muted kecil svelte-z5hh5j">Bahan baru otomatis masuk katalog bahan sehingga langsung terbaca oleh Gramasi, Inflasi, dan
        Timeline.</p></div> <div class="aksi svelte-z5hh5j"><button class="btn btn--primary" type="submit"${attr("disabled", sibuk, true)}>${escape_html("Tambah menu")}</button> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></form></section>`);
	});
}
// src/components/dapur/Dashboard.svelte
function Dashboard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { produk = [], bahan = [], sumber = "seed" } = $$props;
		let items = produk;
		let tab = "menu";
		let galat = "";
		const TAB = [
			{
				kode: "pesanan",
				label: "Antrean"
			},
			{
				kode: "menu",
				label: "Menu & foto"
			},
			{
				kode: "gramasi",
				label: "Gramasi (K1)"
			},
			{
				kode: "inflasi",
				label: "Inflasi (K2)"
			},
			{
				kode: "timeline",
				label: "Timeline (K3)"
			}
		];
		function ringkas(item) {
			const hpp = hitungHpp({
				resep: item.resep ?? [],
				porsiDasar: item.porsiDasar,
				biayaKemasan: item.biayaKemasan,
				biayaOperasional: item.biayaOperasional
			});
			const margin = marginPersen(hargaPerPorsi(item), hpp.hppPerPorsi);
			return {
				hpp,
				margin,
				status: statusMargin(margin)
			};
		}
		const ringkasan = derived(() => new Map(items.map((item) => [item.id, ringkas(item)])));
		const rataMargin = derived(() => items.length ? Math.round(items.reduce((total, item) => total + (ringkasan().get(item.id)?.margin ?? 0), 0) / items.length * 10) / 10 : 0);
		const perluPerhatian = derived(() => items.filter((item) => ringkasan().get(item.id)?.status !== "AMAN").length);
		let sedangKeluar = false;
		async function muatUlang() {
			galat = "";
			try {
				const respons = await fetch("/api/products", { headers: { accept: "application/json" } });
				const hasil = await respons.json();
				if (!respons.ok) throw new Error(hasil.error ?? "Gagal memuat menu.");
				items = hasil.data;
			} catch (error) {
				galat = error.message;
			}
		}
		$$renderer.push(`<header class="topbar svelte-u3api1"><div class="wrap topbar__inner svelte-u3api1"><div><p class="wordmark svelte-u3api1">yukTakarin! <span class="wordmark__sub svelte-u3api1">Dapur</span></p> <p class="tagline svelte-u3api1">Coffee &amp; Kue rumahan</p></div> <div class="topbar__aksi svelte-u3api1"><span${attr_class(`badge ${sumber === "neon" ? "badge--aman" : "badge--netral"}`)}>${escape_html(sumber === "neon" ? "Neon PostgreSQL" : "Mode seed")}</span> <a class="btn btn--quiet btn--sm" href="/">Lihat katalog</a> <button type="button" class="btn btn--quiet btn--sm"${attr("disabled", sedangKeluar, true)}>${escape_html("Logout")}</button></div></div></header> <main class="wrap halaman svelte-u3api1"><div class="judul svelte-u3api1"><h1 class="svelte-u3api1">Kendali dapur</h1> <p class="muted">Hitung gramasi, pantau margin saat harga bahan naik, dan susun jadwal kerja mundur dari jam kirim
      pelanggan.</p></div> `);
		if (sumber === "seed") $$renderer.push(`<!--[0--><p class="notif svelte-u3api1"><strong>Mode demo.</strong> Belum ada <code>DATABASE_URL</code>, jadi menu berasal dari seed lokal dan
      perubahan hanya bertahan selama server hidup.</p>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (galat) $$renderer.push(`<!--[0--><p class="notif notif--galat svelte-u3api1" role="alert">${escape_html(galat)}</p>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <section class="stats svelte-u3api1" aria-label="Ringkasan dapur"><div class="card stat svelte-u3api1"><p class="stat__label svelte-u3api1">Total menu</p> <p class="stat__angka tabular svelte-u3api1">${escape_html(items.length)}</p> <p class="stat__ket svelte-u3api1">aktif di katalog</p></div> <div class="card stat svelte-u3api1"><p class="stat__label svelte-u3api1">Rata-rata margin</p> <p class="stat__angka tabular svelte-u3api1">${escape_html(rataMargin())}%</p> <p class="stat__ket svelte-u3api1">setelah kemasan &amp; operasional</p></div> <div${attr_class("card stat svelte-u3api1", void 0, { "stat--perhatian": perluPerhatian() > 0 })}><p class="stat__label svelte-u3api1">Perlu perhatian</p> <p class="stat__angka tabular svelte-u3api1">${escape_html(perluPerhatian())}</p> <p class="stat__ket svelte-u3api1">${escape_html(perluPerhatian() > 0 ? "margin di bawah 40%" : "semua margin sehat")}</p></div></section> <nav class="tabbar svelte-u3api1" aria-label="Bagian dapur"><!--[-->`);
		const each_array = ensure_array_like(TAB);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let bagian = each_array[$$index];
			$$renderer.push(`<button type="button" class="tab svelte-u3api1"${attr("aria-pressed", tab === bagian.kode)}>${escape_html(bagian.label)}</button>`);
		}
		$$renderer.push(`<!--]--></nav> `);
		$$renderer.push("<!--[1-->");
		MenuManager($$renderer, {
			items,
			bahan,
			onrefresh: muatUlang
		});
		$$renderer.push(`<!--]--></main>`);
	});
}
// src/pages/dapur.astro
var dapur_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Dapur,
	file: () => $$file,
	url: () => $$url
});
var $$Dapur = createComponent(async ($$result, $$props, $$slots) => {
	const produk = (await daftarProduk()).map(({ dibuatPada, ...sisa }) => sisa);
	const bahan = (await daftarBahan()).map(({ id, ...sisa }) => sisa);
	const sumber = modeData();
	return renderTemplate`${renderComponent($$result, "Base", $$Base, {
		"judul": "Dapur — yukTakarin!",
		"deskripsi": "Dashboard dapur: kendali menu, gramasi, inflasi bahan, dan jadwal masak mundur."
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "Dashboard", Dashboard, {
		"client:load": true,
		"produk": produk,
		"bahan": bahan,
		"sumber": sumber,
		"client:component-hydration": "load",
		"client:component-path": "C:/Users/jasmi/pawonboga-lab/src/components/dapur/Dashboard.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/Users/jasmi/pawonboga-lab/src/pages/dapur.astro", void 0);
var $$file = "C:/Users/jasmi/pawonboga-lab/src/pages/dapur.astro";
var $$url = "/dapur";
// \0virtual:astro:page:src/pages/dapur@_@astro
var page = () => dapur_exports;
export { page };
