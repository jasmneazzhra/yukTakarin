import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { i as buatProduk, l as modeData, s as daftarProduk } from "./repo_CAXlixrm.mjs";
import { c as tolakTanpaSesi, s as sesiDariRequest } from "./auth_Dgd1wHJE.mjs";
// src/pages/api/products/index.js
var products_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST
});
var json = (data, status = 200) => new Response(JSON.stringify(data), {
	status,
	headers: {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store"
	}
});
async function GET({ url, request }) {
	const publik = url.searchParams.get("publik") === "1";
	if (!publik && !sesiDariRequest(request)) return tolakTanpaSesi();
	try {
		return json({
			data: await daftarProduk({ publik }),
			sumber: modeData()
		});
	} catch (error) {
		return json({ error: error.message }, error.status ?? 500);
	}
}
async function POST({ request }) {
	if (!sesiDariRequest(request)) return tolakTanpaSesi();
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: "Body harus JSON yang valid." }, 400);
	}
	try {
		return json({ data: await buatProduk(body) }, 201);
	} catch (error) {
		return json({ error: error.message }, error.status ?? 500);
	}
}
// \0virtual:astro:page:src/pages/api/products/index@_@js
var page = () => products_exports;
export { page };
