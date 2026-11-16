import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { a as idPesananDariOrderId, r as checkMidtransStatus, s as statusBayarDariMidtrans } from "./midtrans.service_D7C7HHwW.mjs";
import { m as ubahStatusBayar } from "./repo_CAXlixrm.mjs";
// src/pages/api/payments/status.js
var status_exports = /* @__PURE__ */ __exportAll({ GET: () => GET });
var json = (data, status = 200) => new Response(JSON.stringify(data), {
	status,
	headers: {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store"
	}
});
async function GET({ url }) {
	try {
		const orderId = url.searchParams.get("order_id");
		const idPesanan = idPesananDariOrderId(orderId);
		if (!idPesanan) return json({ error: "order_id tidak valid." }, 400);
		const data = await checkMidtransStatus(orderId);
		const status = statusBayarDariMidtrans(data);
		await ubahStatusBayar(idPesanan, status);
		return json({ data: {
			order_id: data.order_id,
			status,
			transaction_status: data.transaction_status,
			gross_amount: data.gross_amount,
			payment_type: data.payment_type,
			transaction_time: data.transaction_time
		} });
	} catch (error) {
		console.error("[payment/status]", error.message);
		return json({ error: error.message || "Gagal cek status pembayaran." }, error.status ?? 500);
	}
}
// \0virtual:astro:page:src/pages/api/payments/status@_@js
var page = () => status_exports;
export { page };
