import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { t as ambilPesanan } from "./repo_CAXlixrm.mjs";
import { i as createMidtransTransaction, n as buildMidtransParams, t as buatOrderIdMidtrans } from "./midtrans.service_D7C7HHwW.mjs";
// src/pages/api/payments/init.js
var init_exports = /* @__PURE__ */ __exportAll({ POST: () => POST });
var json = (data, status = 200) => new Response(JSON.stringify(data), {
	status,
	headers: {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store"
	}
});
async function POST({ request }) {
	try {
		const { order_id } = await request.json().catch(() => ({}));
		if (!order_id) return json({ error: "order_id wajib diisi." }, 400);
		const pesanan = await ambilPesanan(order_id);
		if (pesanan.payment_status === "paid") return json({ error: "Pesanan sudah dibayar." }, 409);
		if (!(pesanan.totalHarga > 0)) return json({ error: "Total pesanan tidak valid." }, 400);
		const midtransOrderId = buatOrderIdMidtrans(pesanan.id);
		const hasil = await createMidtransTransaction(buildMidtransParams({
			orderId: midtransOrderId,
			amount: pesanan.totalHarga,
			namaItem: pesanan.namaMenu,
			items: [...(pesanan.items ?? []).map((i) => ({
				id: `P${i.productId}`,
				price: i.harga,
				quantity: i.jumlah,
				name: i.namaMenu
			})), ...pesanan.ongkir > 0 ? [{
				id: "ONGKIR",
				price: pesanan.ongkir,
				quantity: 1,
				name: "Ongkos kirim"
			}] : []],
			buyer: { name: pesanan.namaPemesan }
		}));
		return json({ data: {
			payment_url: hasil.redirect_url ?? "",
			token: hasil.token,
			order_id: midtransOrderId,
			gross_amount: pesanan.totalHarga,
			currency: "IDR"
		} });
	} catch (error) {
		console.error("[payment/init]", error.message);
		return json({ error: error.message || "Gagal inisialisasi pembayaran." }, error.status ?? 500);
	}
}
// \0virtual:astro:page:src/pages/api/payments/init@_@js
var page = () => init_exports;
export { page };
