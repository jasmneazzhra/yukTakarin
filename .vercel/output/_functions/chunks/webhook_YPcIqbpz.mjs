import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { a as idPesananDariOrderId, o as signatureValid, s as statusBayarDariMidtrans } from "./midtrans.service_D7C7HHwW.mjs";
import { m as ubahStatusBayar } from "./repo_CAXlixrm.mjs";
// src/pages/api/payments/webhook.js
var webhook_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST
});
var json = (data, status = 200) => new Response(JSON.stringify(data), {
	status,
	headers: { "content-type": "application/json; charset=utf-8" }
});
async function POST({ request }) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: "Body tidak valid." }, 400);
	}
	if (!signatureValid(body)) return json({ error: "Signature tidak valid." }, 403);
	const idPesanan = idPesananDariOrderId(body.order_id);
	if (!idPesanan) return json({ status: "ignored" });
	try {
		await ubahStatusBayar(idPesanan, statusBayarDariMidtrans(body));
		return json({ status: "ok" });
	} catch (error) {
		if (error.status === 404) return json({ status: "ignored" });
		console.error("[payment/webhook]", error.message);
		return json({ error: "Gagal memproses." }, 500);
	}
}
async function GET() {
	return json({ status: "webhook alive" });
}
// \0virtual:astro:page:src/pages/api/payments/webhook@_@js
var page = () => webhook_exports;
export { page };
