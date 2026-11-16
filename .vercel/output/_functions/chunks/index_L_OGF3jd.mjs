import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { o as daftarPesanan, r as buatPesanan } from "./repo_CAXlixrm.mjs";
import { c as tolakTanpaSesi, s as sesiDariRequest } from "./auth_Dgd1wHJE.mjs";
// src/pages/api/orders/index.js
var orders_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST
});
async function GET({ url, request }) {
	if (!sesiDariRequest(request)) return tolakTanpaSesi();
	try {
		const hariIni = url.searchParams.get("hariIni") === "1";
		const data = await daftarPesanan({ hariIni });
		return new Response(JSON.stringify({ data }), {
			status: 200,
			headers: { "content-type": "application/json" }
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: error.status ?? 500,
			headers: { "content-type": "application/json" }
		});
	}
}
async function POST({ request }) {
	try {
		const body = await request.json();
		const data = await buatPesanan(body);
		return new Response(JSON.stringify({ data }), {
			status: 201,
			headers: { "content-type": "application/json" }
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: error.status ?? 500,
			headers: { "content-type": "application/json" }
		});
	}
}
// \0virtual:astro:page:src/pages/api/orders/index@_@js
var page = () => orders_exports;
export { page };
