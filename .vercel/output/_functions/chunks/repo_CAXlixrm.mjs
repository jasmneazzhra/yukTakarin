import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { t as bacaEnv } from "./env_Bf19XHEq.mjs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
// src/db/index.js
/**
* Koneksi Neon opsional. Tanpa DATABASE_URL, aplikasi memakai seed lokal
* (`src/db/seed-data.js`) supaya bisa dijalankan & diuji tanpa kredensial.
*/
var databaseUrl = bacaEnv("DATABASE_URL");
var adaDatabase = /^postgres(ql)?:\/\//.test(databaseUrl);
var db = adaDatabase ? drizzle(neon(databaseUrl)) : null;
// src/lib/kitchen.js
/** Satuan rumah tangga -> basis ml atau gram (baku Coffee & Kue). */
var FAKTOR_SATUAN = {
	sejumput: { gram: 1 },
	jumput: { gram: 2 },
	lembar: { gram: 75 },
	sdt: { ml: 5 },
	sdm: { ml: 15 },
	centong: { gram: 100 },
	gelas: { ml: 240 },
	shot: { ml: 30 },
	sloki: { ml: 45 },
	jigger: { ml: 45 },
	genggam: { gram: 35 },
	ruas: { gram: 4 },
	butir: { gram: 55 },
	porsi: { gram: 100 },
	pcs: { gram: 1 },
	gram: { gram: 1 },
	ml: { ml: 1 },
	liter: { ml: 1e3 }
};
var TIDAK_TERUKUR = /* @__PURE__ */ new Set([
	"secukupnya",
	"sesuai selera",
	"seperlunya"
]);
var bulat = (nilai, desimal = 2) => {
	const pangkat = 10 ** desimal;
	return Math.round(nilai * pangkat) / pangkat;
};
/** Konversi takaran rumah tangga ke gram. */
function konversiTakaran(jumlah, satuan, bahan = {}) {
	const kunci = String(satuan ?? "").trim().toLowerCase();
	if (TIDAK_TERUKUR.has(kunci)) return {
		gram: null,
		tidakTerukur: true,
		catatan: "Takaran \"secukupnya\" tidak dikonversi—ikuti rasa."
	};
	const faktor = FAKTOR_SATUAN[kunci];
	if (!faktor) throw new Error(`Satuan tidak dikenal: ${satuan}`);
	const angka = Number(jumlah);
	if (!Number.isFinite(angka) || angka < 0) throw new Error(`Jumlah tidak valid: ${jumlah}`);
	if (faktor.gram !== void 0) return {
		gram: bulat(angka * Number(bahan.gramPerSatuan ?? faktor.gram)),
		ml: null,
		tidakTerukur: false
	};
	const ml = bulat(angka * faktor.ml);
	if (kunci === "shot" && Number(bahan.gramPerSatuan) > 0) return {
		gram: bulat(angka * Number(bahan.gramPerSatuan)),
		ml,
		tidakTerukur: false
	};
	return {
		gram: bulat(ml * Number(bahan.densitas ?? 1)),
		ml,
		tidakTerukur: false
	};
}
/** Validasi jumlah pesanan terhadap stok tersedia. */
function validasiStok({ jumlah, stok, minOrder = 1 }) {
	const porsi = Number(jumlah);
	const tersedia = Number(stok);
	if (!Number.isFinite(tersedia) || tersedia <= 0) return {
		valid: false,
		pesan: "Stok habis (Sold Out)."
	};
	if (!Number.isInteger(porsi) || porsi < Number(minOrder)) return {
		valid: false,
		pesan: `Jumlah minimal ${minOrder}.`
	};
	if (porsi > tersedia) return {
		valid: false,
		pesan: `Stok tersisa ${tersedia}.`
	};
	return { valid: true };
}
/** HPP per porsi dari baris resep (takaran untuk porsiDasar). */
function hitungHpp({ resep = [], porsiDasar, biayaKemasan = 0, biayaOperasional = 0, hargaOverride = {} }) {
	const dasar = Number(porsiDasar);
	if (!(dasar > 0)) throw new Error("porsiDasar harus lebih dari 0");
	const rincian = [];
	let totalBahan = 0;
	for (const bahan of resep) {
		const konversi = konversiTakaran(bahan.jumlah, bahan.satuan, bahan);
		if (konversi.tidakTerukur) continue;
		const harga = Number(hargaOverride[bahan.slug] ?? bahan.hargaSatuan ?? 0);
		const isi = Number(bahan.isiPerSatuan ?? 1e3) || 1e3;
		const biaya = konversi.gram / isi * harga;
		totalBahan += biaya;
		rincian.push({
			slug: bahan.slug,
			nama: bahan.nama,
			gramasi: konversi.gram,
			biaya: Math.round(biaya)
		});
	}
	const hppBahan = totalBahan / dasar;
	const hppPerPorsi = hppBahan + Number(biayaKemasan ?? 0) + Number(biayaOperasional ?? 0);
	return {
		hppBahan: Math.round(hppBahan),
		hppPerPorsi: Math.round(hppPerPorsi),
		totalBahan: Math.round(totalBahan),
		rincian
	};
}
/** Harga jual yang dibandingkan dengan HPP selalu per satu porsi. */
function hargaPerPorsi(produk) {
	const perSatuan = Number(produk?.porsiPerSatuan ?? 1) || 1;
	return Number(produk?.harga ?? 0) / perSatuan;
}
function marginPersen(hargaJual, hppPerPorsi) {
	const harga = Number(hargaJual);
	if (!(harga > 0)) return 0;
	return Math.round((harga - Number(hppPerPorsi)) / harga * 1e3) / 10;
}
function statusMargin(margin, kenaikanMaks = 0) {
	if (margin < 30 || kenaikanMaks > 20) return "KRITIS";
	if (margin < 40 || kenaikanMaks > 10) return "WASPADA";
	return "AMAN";
}
function parseJam(jam) {
	const cocok = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(jam ?? "").trim());
	if (!cocok) throw new Error("Format jam harus HH:MM");
	return Number(cocok[1]) * 60 + Number(cocok[2]);
}
/** Validasi checkout. Mengembalikan daftar galat per field. */
function validasiPesanan({ jumlah, minOrder = 1, tanggal, jamKirim, nama = "", mode = "kirim", jamBuka = "07:00", jamTutup = "21:00" }) {
	const galat = [];
	const porsi = Number(jumlah);
	if (!Number.isInteger(porsi) || porsi < Number(minOrder)) galat.push({
		field: "jumlah",
		pesan: `Jumlah minimal ${minOrder}.`
	});
	if (!String(nama).trim()) galat.push({
		field: "nama",
		pesan: "Nama pemesan wajib diisi."
	});
	if (mode !== "ambil" && mode !== "kirim") galat.push({
		field: "mode",
		pesan: "Pilih ambil atau kirim."
	});
	if (!tanggal) galat.push({
		field: "tanggal",
		pesan: "Tanggal wajib dipilih."
	});
	else {
		const dipilih = /* @__PURE__ */ new Date(`${tanggal}T00:00:00`);
		const hariIni = /* @__PURE__ */ new Date();
		hariIni.setHours(0, 0, 0, 0);
		if (Number.isNaN(dipilih.getTime())) galat.push({
			field: "tanggal",
			pesan: "Tanggal tidak valid."
		});
		else if (dipilih < hariIni) galat.push({
			field: "tanggal",
			pesan: "Tanggal tidak boleh di masa lalu."
		});
	}
	try {
		const menit = parseJam(jamKirim);
		const buka = parseJam(jamBuka);
		const tutup = parseJam(jamTutup);
		if (menit < buka || menit > tutup) galat.push({
			field: "jamKirim",
			pesan: `Jam layanan ${jamBuka}–${jamTutup}.`
		});
		else if (menit % 30 !== 0) galat.push({
			field: "jamKirim",
			pesan: "Jam harus kelipatan 30 menit."
		});
	} catch {
		galat.push({
			field: "jamKirim",
			pesan: "Jam kirim wajib dipilih."
		});
	}
	return {
		valid: galat.length === 0,
		errors: galat
	};
}
function formatRupiah(nilai) {
	const angka = Number(nilai);
	if (!Number.isFinite(angka)) return "Rp0";
	return `Rp${Math.round(angka).toLocaleString("id-ID")}`;
}
// src/db/seed-data.js
/**
* Data seed yukTakarin! — 8 menu UMKM coffee & kue + bahan baku.
* Dipakai `npm run seed` (Neon) dan fallback in-memory saat DATABASE_URL kosong.
*
* `jumlah` pada resep adalah takaran untuk `porsiDasar`, BUKAN untuk satu porsi.
* `isiPerSatuan` menyatakan gram/ml per satuan beli agar HPP dapat dihitung.
* Setiap baris resep juga memuat `takaranKiraKira`, `satuanDasar`, `jumlahSatuan`,
* `gramPerPorsi`, `hargaPerKg`, dan `substitusiSaran` (dihitung di bagian bawah).
*/
var BAHAN = [
	{
		slug: "kopi-arabika",
		nama: "Biji kopi arabika",
		satuanBeli: "kg",
		isiPerSatuan: 1e3,
		hargaSatuan: 18e4,
		kategori: "utama",
		densitas: .35,
		gramPerSatuan: 18,
		substitusi: "Campur robusta 30% untuk menekan harga tanpa kehilangan body."
	},
	{
		slug: "air-ekstraksi",
		nama: "Air ekstraksi",
		satuanBeli: "liter",
		isiPerSatuan: 1e3,
		hargaSatuan: 3e3,
		kategori: "utama",
		densitas: 1,
		substitusi: "Air mineral kemasan bila sumber air warung berbau."
	},
	{
		slug: "susu-uht",
		nama: "Susu UHT full cream",
		satuanBeli: "liter",
		isiPerSatuan: 1e3,
		hargaSatuan: 2e4,
		kategori: "utama",
		densitas: 1.03,
		substitusi: "Susu UHT lokal dengan kadar lemak sama."
	},
	{
		slug: "gula-aren",
		nama: "Gula aren cair",
		satuanBeli: "liter",
		isiPerSatuan: 1e3,
		hargaSatuan: 35e3,
		kategori: "pemanis",
		densitas: 1.3,
		substitusi: "Gula aren bubuk yang diseduh—rasa lebih pekat, dosis dikurangi 10%."
	},
	{
		slug: "gula-pasir",
		nama: "Gula pasir",
		satuanBeli: "kg",
		isiPerSatuan: 1e3,
		hargaSatuan: 16e3,
		kategori: "pemanis",
		densitas: .85,
		substitusi: "Gula kelapa butiran untuk aroma karamel."
	},
	{
		slug: "es-batu",
		nama: "Es batu",
		satuanBeli: "kg",
		isiPerSatuan: 1e3,
		hargaSatuan: 5e3,
		kategori: "utama",
		densitas: 1,
		substitusi: "Es kristal kemasan bila pasokan air bermasalah."
	},
	{
		slug: "sirup-pandan",
		nama: "Sirup pandan",
		satuanBeli: "liter",
		isiPerSatuan: 1e3,
		hargaSatuan: 45e3,
		kategori: "ekstrak",
		densitas: 1.25,
		substitusi: "Pasta pandan + gula, pakai setengah dosis."
	},
	{
		slug: "tepung-terigu",
		nama: "Tepung terigu protein tinggi",
		satuanBeli: "kg",
		isiPerSatuan: 1e3,
		hargaSatuan: 12e3,
		kategori: "utama",
		densitas: .53,
		substitusi: "Tepung protein sedang untuk tekstur lebih lembut."
	},
	{
		slug: "butter",
		nama: "Butter tawar",
		satuanBeli: "kg",
		isiPerSatuan: 1e3,
		hargaSatuan: 12e4,
		kategori: "utama",
		densitas: .96,
		substitusi: "Margarin pastry 50:50—biaya turun, tekstur sedikit lebih padat."
	},
	{
		slug: "ragi",
		nama: "Ragi instan",
		satuanBeli: "kg",
		isiPerSatuan: 1e3,
		hargaSatuan: 6e4,
		kategori: "ekstrak",
		densitas: .9,
		substitusi: "Ragi kering aktif, proofing ditambah 10 menit."
	},
	{
		slug: "garam",
		nama: "Garam halus",
		satuanBeli: "kg",
		isiPerSatuan: 1e3,
		hargaSatuan: 8e3,
		kategori: "asin",
		densitas: 1.2,
		substitusi: null
	},
	{
		slug: "kayu-manis",
		nama: "Kayu manis bubuk",
		satuanBeli: "kg",
		isiPerSatuan: 1e3,
		hargaSatuan: 9e4,
		kategori: "ekstrak",
		densitas: .5,
		substitusi: "Kayu manis batang yang digerus sendiri."
	},
	{
		slug: "gula-palm",
		nama: "Gula palm",
		satuanBeli: "kg",
		isiPerSatuan: 1e3,
		hargaSatuan: 3e4,
		kategori: "pemanis",
		densitas: .75,
		substitusi: "Gula aren bubuk dengan dosis sama."
	},
	{
		slug: "cokelat-dark",
		nama: "Dark chocolate 70%",
		satuanBeli: "kg",
		isiPerSatuan: 1e3,
		hargaSatuan: 95e3,
		kategori: "utama",
		densitas: .7,
		substitusi: "Cokelat compound 60% untuk versi lebih ekonomis."
	},
	{
		slug: "telur",
		nama: "Telur ayam",
		satuanBeli: "kg",
		isiPerSatuan: 1e3,
		hargaSatuan: 28e3,
		kategori: "utama",
		densitas: 1.03,
		gramPerSatuan: 55,
		substitusi: "Telur omega dengan harga lebih stabil."
	},
	{
		slug: "bubuk-kakao",
		nama: "Bubuk kakao",
		satuanBeli: "kg",
		isiPerSatuan: 1e3,
		hargaSatuan: 8e4,
		kategori: "ekstrak",
		densitas: .5,
		substitusi: "Kakao hitam kadar lemak rendah, tambah 5% dosis."
	},
	{
		slug: "tape-singkong",
		nama: "Tape singkong",
		satuanBeli: "kg",
		isiPerSatuan: 1e3,
		hargaSatuan: 18e3,
		kategori: "utama",
		densitas: .9,
		substitusi: "Tape ketan untuk aroma lebih kuat."
	},
	{
		slug: "keju-cheddar",
		nama: "Keju cheddar",
		satuanBeli: "kg",
		isiPerSatuan: 1e3,
		hargaSatuan: 11e4,
		kategori: "utama",
		densitas: .6,
		substitusi: "Keju edam parut untuk rasa lebih gurih."
	},
	{
		slug: "susu-kental",
		nama: "Susu kental manis",
		satuanBeli: "kg",
		isiPerSatuan: 1e3,
		hargaSatuan: 28e3,
		kategori: "pemanis",
		densitas: 1.3,
		substitusi: "Susu evaporasi + gula pasir 8%."
	},
	{
		slug: "matcha",
		nama: "Matcha bubuk",
		satuanBeli: "kg",
		isiPerSatuan: 1e3,
		hargaSatuan: 32e4,
		kategori: "ekstrak",
		densitas: .4,
		substitusi: "Matcha grade latte untuk volume besar."
	},
	{
		slug: "ekstrak-vanila",
		nama: "Ekstrak vanila",
		satuanBeli: "liter",
		isiPerSatuan: 1e3,
		hargaSatuan: 15e4,
		kategori: "ekstrak",
		densitas: 1,
		substitusi: "Vanila bubuk, dosis setengah."
	},
	{
		slug: "croissant-siap",
		nama: "Croissant setengah jadi",
		satuanBeli: "pcs",
		isiPerSatuan: 1,
		hargaSatuan: 9e3,
		kategori: "utama",
		densitas: 1,
		substitusi: "Produksi sendiri dari adonan laminasi."
	},
	{
		slug: "brownies-siap",
		nama: "Brownies potong",
		satuanBeli: "pcs",
		isiPerSatuan: 1,
		hargaSatuan: 12e3,
		kategori: "utama",
		densitas: 1,
		substitusi: "Potong dari loyang produksi sendiri."
	}
];
var r = (bahan, jumlah, satuan, opsi = {}) => ({
	bahan,
	jumlah,
	satuan,
	...opsi
});
/** Perkiraan kkal PER PORSI (hitungan kasar dari resep). Sesuaikan dengan data asli. */
var KALORI = {
	"kopi-susu-gula-aren-literan": 235,
	"es-kopi-pandan": 175,
	"croissant-butter": 375,
	"cinnamon-roll": 350,
	"brownies-fudgy-panggang": 350,
	"bolu-tape-keju": 400,
	"paket-coffee-break-box": 900,
	"matcha-latte-botolan": 240
};
var MENU = [
	{
		slug: "kopi-susu-gula-aren-literan",
		nama: "Kopi Susu Gula Aren Literan",
		deskripsi: "Espresso arabika dengan susu full cream dan gula aren cair, dikemas per liter. Cukup untuk 5 cup, praktis untuk rapat kantor.",
		kategori: "Kopi & Minuman",
		harga: 85e3,
		satuan: "liter",
		minOrder: 1,
		porsiDasar: 5,
		porsiPerSatuan: 5,
		prepMenit: 10,
		prosesLabel: "Seduh espresso",
		prosesMenit: 15,
		packingMenit: 5,
		biayaKemasan: 1200,
		biayaOperasional: 600,
		stok: 20,
		imageUrl: null,
		aktif: true,
		instruksiDapur: "Giling 18 g biji per shot, ekstrak 30 ml. Larutkan gula aren dengan susu hangat, dinginkan, lalu botolkan dengan es dan susu kental manis.",
		resep: [
			r("kopi-arabika", 5, "shot", { takaranKiraKira: "5 shot espresso (±150 ml)" }),
			r("air-ekstraksi", 150, "ml", { takaranKiraKira: "5 shot air ekstraksi" }),
			r("susu-uht", 700, "ml", { takaranKiraKira: "2¾ gelas susu" }),
			r("gula-aren", 150, "ml", { takaranKiraKira: "10 sdm gula aren cair" }),
			r("susu-kental", 50, "gram", { takaranKiraKira: "3 sdm krimer kental manis" }),
			r("es-batu", 400, "gram", { takaranKiraKira: "2 genggam es batu" })
		]
	},
	{
		slug: "es-kopi-pandan",
		nama: "Es Kopi Pandan",
		deskripsi: "Kopi susu dingin dengan sirup pandan harum. Manisnya pas, aromanya khas, cocok untuk sore hari.",
		kategori: "Kopi & Minuman",
		harga: 22e3,
		satuan: "cup",
		minOrder: 5,
		porsiDasar: 10,
		porsiPerSatuan: 1,
		prepMenit: 15,
		prosesLabel: "Seduh & racik",
		prosesMenit: 20,
		packingMenit: 15,
		biayaKemasan: 1200,
		biayaOperasional: 500,
		stok: 20,
		imageUrl: null,
		aktif: true,
		instruksiDapur: "Seduh 5 shot espresso lalu dinginkan cepat. Racik sirup pandan, gula, dan susu di shaker, tuang ke cup berisi es, terakhir tuang kopi agar lapisan pandan terlihat.",
		resep: [
			r("kopi-arabika", 5, "shot", { takaranKiraKira: "5 shot espresso (±150 ml)" }),
			r("air-ekstraksi", 300, "ml", { takaranKiraKira: "10 shot air ekstraksi" }),
			r("susu-uht", 1200, "ml", { takaranKiraKira: "5 gelas susu" }),
			r("sirup-pandan", 200, "ml", { takaranKiraKira: "13 sdm sirup pandan" }),
			r("gula-pasir", 80, "gram", { takaranKiraKira: "6 sdm gula pasir" }),
			r("es-batu", 1500, "gram", { takaranKiraKira: "7 genggam es batu" })
		]
	},
	{
		slug: "croissant-butter",
		nama: "Croissant Butter",
		deskripsi: "Laminasi butter tawar, luar renyah dan dalam berongga. Dipanggang pagi hari sebelum jam kirim.",
		kategori: "Pastry & Roti",
		harga: 18e3,
		satuan: "pcs",
		minOrder: 6,
		porsiDasar: 12,
		porsiPerSatuan: 1,
		prepMenit: 90,
		prosesLabel: "Proofing & panggang",
		prosesMenit: 45,
		packingMenit: 15,
		biayaKemasan: 1e3,
		biayaOperasional: 900,
		stok: 20,
		imageUrl: null,
		aktif: true,
		instruksiDapur: "Campur tepung, gula, ragi, garam, dan susu hingga kalis. Laminasi dengan butter, lipat 3×3, istirahatkan dingin 30 menit, bentuk, proofing 90 menit, lalu panggang 190°C selama 18–20 menit. Oles telur sebelum panggang.",
		resep: [
			r("tepung-terigu", 500, "gram", { takaranKiraKira: "4 gelas tepung" }),
			r("butter", 300, "gram", { takaranKiraKira: "1½ blok butter" }),
			r("susu-uht", 250, "ml", { takaranKiraKira: "1 gelas susu" }),
			r("gula-pasir", 60, "gram", { takaranKiraKira: "5 sdm gula" }),
			r("ragi", 10, "gram", { takaranKiraKira: "1 sdm ragi" }),
			r("garam", 8, "gram", { takaranKiraKira: "1½ sdt garam" }),
			r("telur", 1, "butir", { takaranKiraKira: "1 butir untuk olesan" })
		]
	},
	{
		slug: "cinnamon-roll",
		nama: "Cinnamon Roll",
		deskripsi: "Roti gulung kayu manis dengan gula palm dan butter. Aroma rempahnya kuat, glaze tipis di atas.",
		kategori: "Pastry & Roti",
		harga: 2e4,
		satuan: "pcs",
		minOrder: 6,
		porsiDasar: 12,
		porsiPerSatuan: 1,
		prepMenit: 75,
		prosesLabel: "Proofing & panggang",
		prosesMenit: 30,
		packingMenit: 15,
		biayaKemasan: 1e3,
		biayaOperasional: 800,
		stok: 20,
		imageUrl: null,
		aktif: true,
		instruksiDapur: "Uleni adonan manis hingga elastis, gilas, oles butter dan taburi gula palm + kayu manis. Gulung, potong 12, proofing 75 menit, panggang 180°C 25 menit, beri glaze tipis setelah dingin.",
		resep: [
			r("tepung-terigu", 600, "gram", { takaranKiraKira: "5 gelas tepung" }),
			r("butter", 150, "gram", { takaranKiraKira: "¾ blok butter" }),
			r("gula-palm", 180, "gram", { takaranKiraKira: "12 sdm gula palm" }),
			r("kayu-manis", 12, "gram", { takaranKiraKira: "4 sdt kayu manis" }),
			r("susu-uht", 300, "ml", { takaranKiraKira: "1¼ gelas susu" }),
			r("ragi", 11, "gram", { takaranKiraKira: "1 sdm ragi" }),
			r("garam", 6, "gram", { takaranKiraKira: "1 sdt garam" })
		]
	},
	{
		slug: "brownies-fudgy-panggang",
		nama: "Brownies Fudgy Panggang",
		deskripsi: "Cokelat 70% dengan butter, tekstur padat dan lembap. Dipotong rapi, tahan 3 hari di suhu ruang.",
		kategori: "Kue Panggang",
		harga: 25e3,
		satuan: "potong",
		minOrder: 8,
		porsiDasar: 16,
		porsiPerSatuan: 1,
		prepMenit: 30,
		prosesLabel: "Panggang",
		prosesMenit: 40,
		packingMenit: 20,
		biayaKemasan: 1e3,
		biayaOperasional: 900,
		stok: 20,
		imageUrl: null,
		aktif: true,
		instruksiDapur: "Lelehkan cokelat dan butter di atas air panas, kocok telur + gula hingga pucat, lipat tepung dan kakao, panggang 170°C selama 25–30 menit. Dinginkan 1 jam sebelum dipotong 16.",
		resep: [
			r("cokelat-dark", 300, "gram", { takaranKiraKira: "3 batang cokelat 100 g" }),
			r("butter", 250, "gram", { takaranKiraKira: "1¼ blok butter" }),
			r("gula-pasir", 250, "gram", { takaranKiraKira: "1¼ gelas gula" }),
			r("telur", 5, "butir", { takaranKiraKira: "5 butir telur" }),
			r("tepung-terigu", 150, "gram", { takaranKiraKira: "1¼ gelas tepung" }),
			r("bubuk-kakao", 40, "gram", { takaranKiraKira: "5 sdm kakao" }),
			r("ekstrak-vanila", 5, "ml", { takaranKiraKira: "1 sdt vanila" })
		]
	},
	{
		slug: "bolu-tape-keju",
		nama: "Bolu Tape Keju",
		deskripsi: "Bolu tape singkong dengan taburan keju cheddar. Manis fermentasi tape berpadu gurih keju.",
		kategori: "Kue Panggang",
		harga: 22e3,
		satuan: "potong",
		minOrder: 6,
		porsiDasar: 12,
		porsiPerSatuan: 1,
		prepMenit: 35,
		prosesLabel: "Panggang",
		prosesMenit: 45,
		packingMenit: 20,
		biayaKemasan: 1e3,
		biayaOperasional: 800,
		stok: 20,
		imageUrl: null,
		aktif: true,
		instruksiDapur: "Haluskan tape, kocok telur + gula, masukkan tepung, butter leleh, dan tape. Panggang 170°C 40 menit, oles susu kental manis, taburi keju parut, panggang 5 menit lagi.",
		resep: [
			r("tepung-terigu", 250, "gram", { takaranKiraKira: "2 gelas tepung" }),
			r("tape-singkong", 300, "gram", { takaranKiraKira: "2 centong tape halus" }),
			r("gula-pasir", 200, "gram", { takaranKiraKira: "1 gelas gula" }),
			r("telur", 6, "butir", { takaranKiraKira: "6 butir telur" }),
			r("butter", 200, "gram", { takaranKiraKira: "1 blok butter" }),
			r("keju-cheddar", 100, "gram", { takaranKiraKira: "1 genggam penuh keju parut" }),
			r("susu-kental", 100, "gram", { takaranKiraKira: "6 sdm susu kental manis" }),
			r("ekstrak-vanila", 5, "ml", { takaranKiraKira: "1 sdt vanila" })
		]
	},
	{
		slug: "paket-coffee-break-box",
		nama: "Paket Coffee Break Box",
		deskripsi: "Satu box berisi es kopi susu, croissant butter, dan brownies fudgy. Rapi untuk rapat atau seminar.",
		kategori: "Paket Snack Box",
		harga: 48e3,
		satuan: "box",
		minOrder: 5,
		porsiDasar: 10,
		porsiPerSatuan: 1,
		prepMenit: 40,
		prosesLabel: "Seduh & panggang ulang",
		prosesMenit: 30,
		packingMenit: 30,
		biayaKemasan: 3e3,
		biayaOperasional: 1500,
		stok: 20,
		imageUrl: null,
		aktif: true,
		instruksiDapur: "Susun box per porsi: 1 cup es kopi susu, 1 croissant, 1 potong brownies. Seduh kopi batch pagi, panggang ulang croissant 5 menit, potong brownies, lalu packing berurutan agar tetap rapi.",
		resep: [
			r("kopi-arabika", 6, "shot", { takaranKiraKira: "6 shot espresso (±180 ml)" }),
			r("susu-uht", 2e3, "ml", { takaranKiraKira: "8 gelas susu" }),
			r("gula-pasir", 120, "gram", { takaranKiraKira: "9 sdm gula" }),
			r("es-batu", 1500, "gram", { takaranKiraKira: "7 genggam es batu" }),
			r("croissant-siap", 10, "pcs", { takaranKiraKira: "1 croissant per box" }),
			r("brownies-siap", 10, "pcs", { takaranKiraKira: "1 potong brownies per box" }),
			r("gula-aren", 50, "ml", { takaranKiraKira: "3 sdm gula aren cair" })
		]
	},
	{
		slug: "matcha-latte-botolan",
		nama: "Matcha Latte Botolan",
		deskripsi: "Matcha dengan susu segar dalam botol 250 ml. Tanpa gula berlebih, cocok untuk pesanan harian.",
		kategori: "Kopi & Minuman",
		harga: 28e3,
		satuan: "botol",
		minOrder: 3,
		porsiDasar: 6,
		porsiPerSatuan: 1,
		prepMenit: 15,
		prosesLabel: "Whisk & botolkan",
		prosesMenit: 10,
		packingMenit: 10,
		biayaKemasan: 1500,
		biayaOperasional: 500,
		stok: 20,
		imageUrl: null,
		aktif: true,
		instruksiDapur: "Ayak matcha, whisk dengan air 80°C hingga berbusa, tambahkan gula dan susu dingin. Botolkan 250 ml, simpan dingin, kocok sebelum diserahkan.",
		resep: [
			r("matcha", 60, "gram", { takaranKiraKira: "12 sdt matcha" }),
			r("air-ekstraksi", 600, "ml", { takaranKiraKira: "2½ gelas air 80°C" }),
			r("susu-uht", 1200, "ml", { takaranKiraKira: "5 gelas susu" }),
			r("gula-pasir", 60, "gram", { takaranKiraKira: "5 sdm gula" }),
			r("gula-aren", 60, "ml", { takaranKiraKira: "4 sdm gula aren cair" }),
			r("es-batu", 300, "gram", { takaranKiraKira: "1½ genggam es batu" })
		]
	}
].map((menu) => ({
	...menu,
	minOrder: 1,
	kalori: menu.kalori ?? KALORI[menu.slug] ?? null,
	resep: menu.resep.map((baris) => rinci(baris, menu.porsiDasar))
}));
/** Lengkapi baris resep dengan angka gramasi siap-tampil. */
function rinci(baris, porsiDasar) {
	const bahan = bahanLengkap(baris.bahan) ?? {};
	const konversi = konversiTakaran(baris.jumlah, baris.satuan, bahan);
	const isi = Number(bahan.isiPerSatuan ?? 1e3) || 1e3;
	const gram = konversi.gram ?? 0;
	return {
		...baris,
		takaranKiraKira: baris.takaranKiraKira ?? `${baris.jumlah} ${baris.satuan}`,
		satuanDasar: bahan.satuanBeli ?? "kg",
		jumlahSatuan: Math.round(gram / isi * 1e3) / 1e3,
		gramPerPorsi: Math.round(gram / porsiDasar * 10) / 10,
		hargaPerKg: bahan.hargaSatuan ?? 0,
		substitusiSaran: bahan.substitusi ?? null
	};
}
/** Bahan lengkap (harga, densitas, substitusi) untuk satu baris resep. */
function bahanLengkap(slug) {
	return BAHAN.find((b) => b.slug === slug) ?? null;
}
// src/lib/repo.js
var repo_exports = /* @__PURE__ */ __exportAll({
	ambilPesanan: () => ambilPesanan,
	ambilProduk: () => ambilProduk,
	buatPesanan: () => buatPesanan,
	buatProduk: () => buatProduk,
	daftarBahan: () => daftarBahan,
	daftarPesanan: () => daftarPesanan,
	daftarProduk: () => daftarProduk,
	hapusProduk: () => hapusProduk,
	modeData: () => modeData,
	potongStok: () => potongStok,
	terapkanInflasi: () => terapkanInflasi,
	ubahProduk: () => ubahProduk,
	ubahStatusBayar: () => ubahStatusBayar,
	ubahStatusPesanan: () => ubahStatusPesanan
});
var isMemory = !adaDatabase || !db;
var _bahan = BAHAN.map((b, i) => ({
	id: i + 1,
	slug: b.slug,
	nama: b.nama,
	satuanBeli: b.satuanBeli ?? "kg",
	isiPerSatuan: b.isiPerSatuan ?? 1e3,
	hargaSatuan: b.hargaSatuan ?? 0,
	kategori: b.kategori ?? "utama",
	densitas: b.densitas ?? 1,
	gramPerSatuan: b.gramPerSatuan ?? null,
	substitusi: b.substitusi ?? null
}));
var _produk = MENU.map((m, i) => ({
	id: i + 1,
	slug: m.slug,
	nama: m.nama,
	deskripsi: m.deskripsi ?? "",
	kategori: m.kategori ?? "",
	harga: m.harga ?? 0,
	satuan: m.satuan ?? "pcs",
	minOrder: m.minOrder ?? m.min_order ?? 1,
	porsiDasar: m.porsiDasar ?? m.porsi_dasar ?? 1,
	porsiPerSatuan: m.porsiPerSatuan ?? m.porsi_per_satuan ?? 1,
	prepMenit: m.prepMenit ?? m.prep_menit ?? 0,
	prosesLabel: m.prosesLabel ?? m.proses_label ?? "Proses",
	prosesMenit: m.prosesMenit ?? m.proses_menit ?? 0,
	packingMenit: m.packingMenit ?? m.packing_menit ?? 0,
	biayaKemasan: m.biayaKemasan ?? m.biaya_kemasan ?? 0,
	biayaOperasional: m.biayaOperasional ?? m.biaya_operasional ?? 0,
	stok: m.stok ?? 20,
	kalori: m.kalori ?? null,
	instruksiDapur: m.instruksiDapur ?? m.instruksi_dapur ?? null,
	imageUrl: m.imageUrl ?? m.image_url ?? null,
	aktif: m.aktif ?? true,
	dibuatPada: (/* @__PURE__ */ new Date()).toISOString(),
	resep: (m.resep ?? []).map((r) => ({ ...r }))
}));
var _orders = [];
var _nextOrderId = 1;
var _nextProductId = _produk.length + 1;
function modeData() {
	return isMemory ? "seed lokal (demo)" : "neon";
}
var err = (message, status = 400) => Object.assign(new Error(message), { status });
function komposisiUntukPublik(resep = []) {
	return resep.map((r) => {
		const b = _bahan.find((x) => x.slug === (r.bahan ?? r.slug)) ?? {};
		return {
			slug: r.bahan ?? r.slug,
			nama: b.nama ?? r.nama ?? r.bahan ?? r.slug,
			jumlah: Number(r.jumlah),
			satuan: r.satuan,
			takaranKiraKira: r.takaranKiraKira,
			kategori: b.kategori ?? "utama",
			satuanBeli: b.satuanBeli ?? "kg",
			isiPerSatuan: b.isiPerSatuan ?? 1e3,
			densitas: b.densitas ?? 1,
			gramPerSatuan: b.gramPerSatuan ?? null
		};
	});
}
function produkPublik(p) {
	const { resep, biayaKemasan, biayaOperasional, prepMenit, prosesLabel, prosesMenit, packingMenit, instruksiDapur, dibuatPada, ...pub } = p;
	return {
		...pub,
		komposisi: komposisiUntukPublik(resep)
	};
}
async function daftarProduk(opts = {}) {
	const list = _produk.map((p) => ({
		...p,
		resep: (p.resep ?? []).map((r) => ({ ...r }))
	}));
	if (opts.publik) return list.map(produkPublik);
	return list;
}
async function ambilProduk(id) {
	const p = _produk.find((x) => String(x.id) === String(id) || x.slug === String(id));
	if (!p) throw err("Produk tidak ditemukan.", 404);
	return {
		...p,
		resep: (p.resep ?? []).map((r) => ({ ...r }))
	};
}
async function buatProduk(body) {
	const p = {
		id: _nextProductId++,
		slug: body.slug ?? `produk-${Date.now()}`,
		nama: body.nama ?? "Produk",
		deskripsi: body.deskripsi ?? "",
		kategori: body.kategori ?? "Kopi & Minuman",
		harga: Number(body.harga) || 0,
		satuan: body.satuan ?? "pcs",
		minOrder: Number(body.minOrder ?? body.min_order ?? 1),
		porsiDasar: Number(body.porsiDasar ?? body.porsi_dasar ?? 1),
		porsiPerSatuan: Number(body.porsiPerSatuan ?? body.porsi_per_satuan ?? 1),
		prepMenit: Number(body.prepMenit ?? body.prep_menit ?? 0),
		prosesLabel: body.prosesLabel ?? body.proses_label ?? "Proses",
		prosesMenit: Number(body.prosesMenit ?? body.proses_menit ?? 0),
		packingMenit: Number(body.packingMenit ?? body.packing_menit ?? 0),
		biayaKemasan: Number(body.biayaKemasan ?? body.biaya_kemasan ?? 0),
		biayaOperasional: Number(body.biayaOperasional ?? body.biaya_operasional ?? 0),
		stok: Number(body.stok ?? 0),
		kalori: body.kalori == null || body.kalori === "" ? null : Number(body.kalori),
		instruksiDapur: body.instruksiDapur ?? body.instruksi_dapur ?? null,
		imageUrl: body.imageUrl ?? body.image_url ?? null,
		aktif: body.aktif ?? true,
		dibuatPada: (/* @__PURE__ */ new Date()).toISOString(),
		resep: Array.isArray(body.resep) ? body.resep : []
	};
	_produk.push(p);
	return { ...p };
}
async function ubahProduk(id, body) {
	const idx = _produk.findIndex((x) => String(x.id) === String(id));
	if (idx === -1) throw err("Produk tidak ditemukan.", 404);
	_produk[idx] = {
		..._produk[idx],
		...body,
		id: _produk[idx].id
	};
	return { ..._produk[idx] };
}
async function hapusProduk(id) {
	const idx = _produk.findIndex((x) => String(x.id) === String(id));
	if (idx === -1) throw err("Produk tidak ditemukan.", 404);
	const [hapus] = _produk.splice(idx, 1);
	return {
		id: hapus.id,
		terhapus: true
	};
}
async function daftarBahan() {
	return _bahan.map((b) => ({ ...b }));
}
async function terapkanInflasi({ slugBahan, persen }) {
	const bahan = _bahan.find((b) => b.slug === slugBahan);
	if (!bahan) throw err("Bahan tidak ditemukan.", 404);
	const faktor = 1 + Number(persen || 0) / 100;
	bahan.hargaSatuan = Math.round(Number(bahan.hargaSatuan || 0) * faktor);
	return { ...bahan };
}
function todayStr() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
var ONGKIR_KIRIM = 15e3;
async function buatPesanan(body) {
	const mode = body.mode === "ambil" ? "ambil" : "kirim";
	const mentah = Array.isArray(body.items) && body.items.length ? body.items : [{
		productId: body.productId ?? body.product_id,
		jumlah: body.jumlahPorsi ?? body.jumlah_porsi ?? body.jumlah ?? 1
	}];
	const gabung = /* @__PURE__ */ new Map();
	for (const it of mentah) {
		const id = String(it.productId ?? it.product_id ?? "");
		const jumlah = Number(it.jumlah);
		if (!Number.isInteger(jumlah) || jumlah < 1) throw err("Jumlah item tidak valid.");
		gabung.set(id, (gabung.get(id) ?? 0) + jumlah);
	}
	const items = [];
	for (const [id, jumlah] of gabung) {
		const p = _produk.find((x) => String(x.id) === id);
		if (!p || p.aktif === false) throw err("Menu tidak ditemukan.", 404);
		if (Number(p.stok) < jumlah) throw err(`Stok ${p.nama} tersisa ${p.stok}.`);
		items.push({
			productId: p.id,
			namaMenu: p.nama,
			satuan: p.satuan,
			jumlah,
			harga: p.harga
		});
	}
	const subtotal = items.reduce((t, i) => t + i.harga * i.jumlah, 0);
	const ongkir = mode === "kirim" ? ONGKIR_KIRIM : 0;
	const ringkas = items.map((i) => `${i.namaMenu} ×${i.jumlah}`).join(", ");
	const pesanan = {
		id: _nextOrderId++,
		productId: items[0].productId,
		items,
		namaMenu: ringkas,
		jumlahPorsi: items.reduce((t, i) => t + i.jumlah, 0),
		jamKirim: body.jamKirim ?? body.jam_kirim ?? "",
		tanggalKirim: body.tanggalKirim ?? body.tanggal_kirim ?? body.tanggal ?? todayStr(),
		mode,
		subtotal,
		ongkir,
		totalHarga: subtotal + ongkir,
		catatan: body.catatan ?? null,
		namaPemesan: body.namaPemesan ?? body.nama_pemesan ?? body.nama ?? null,
		status: "Menunggu",
		paymentStatus: "pending",
		dibuatPada: (/* @__PURE__ */ new Date()).toISOString(),
		userId: body.userId ?? body.user_id ?? null
	};
	_orders.push(pesanan);
	return { ...pesanan };
}
async function daftarPesanan(opts = {}) {
	let list = _orders.map((o) => ({ ...o }));
	if (opts.hariIni) {
		const t = todayStr();
		list = list.filter((o) => (o.tanggalKirim || "").slice(0, 10) === t);
	}
	return list;
}
async function ambilPesanan(id) {
	const p = _orders.find((x) => String(x.id) === String(id));
	if (!p) throw err("Pesanan tidak ditemukan.", 404);
	return { ...p };
}
async function ubahStatusPesanan(id, status) {
	if (![
		"Menunggu",
		"Diproses",
		"Siap",
		"Selesai",
		"Dibatalkan"
	].includes(status)) throw err("Status pesanan tidak dikenal.", 400);
	const p = _orders.find((x) => String(x.id) === String(id));
	if (!p) throw err("Pesanan tidak ditemukan.", 404);
	p.status = status;
	return { ...p };
}
async function ubahStatusBayar(id, paymentStatus) {
	const p = _orders.find((x) => String(x.id) === String(id));
	if (!p) throw err("Pesanan tidak ditemukan.", 404);
	p.paymentStatus = paymentStatus;
	return { ...p };
}
async function potongStok(productId, jumlah) {
	const j = Number(jumlah);
	if (!(j > 0)) throw err("Jumlah potong harus lebih dari 0.", 400);
	const p = _produk.find((x) => String(x.id) === String(productId));
	if (!p) throw err("Produk tidak ditemukan.", 404);
	if (Number(p.stok) < j) throw err("Stok tidak cukup.", 400);
	p.stok = Number(p.stok) - j;
	return { ...p };
}
export { validasiStok as C, validasiPesanan as S, hargaPerPorsi as _, daftarBahan as a, marginPersen as b, hapusProduk as c, repo_exports as d, terapkanInflasi as f, formatRupiah as g, ubahStatusPesanan as h, buatProduk as i, modeData as l, ubahStatusBayar as m, ambilProduk as n, daftarPesanan as o, ubahProduk as p, buatPesanan as r, daftarProduk as s, ambilPesanan as t, potongStok as u, hitungHpp as v, statusMargin as x, konversiTakaran as y };
