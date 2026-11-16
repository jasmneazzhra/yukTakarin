import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { c as hapusProduk, n as ambilProduk, p as ubahProduk } from "./repo_CAXlixrm.mjs";
import { c as tolakTanpaSesi, s as sesiDariRequest } from "./auth_Dgd1wHJE.mjs";
// src/pages/api/products/[id].js
var _id__exports = /* @__PURE__ */ __exportAll({
	DELETE: () => DELETE,
	GET: () => GET,
	PUT: () => PUT
});
var json = (data, status = 200) => new Response(JSON.stringify(data), {
	status,
	headers: {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store"
	}
});
var idValid = (id) => /^\d+$/.test(String(id ?? ""));
async function GET({ params, request }) {
	if (!sesiDariRequest(request)) return tolakTanpaSesi();
	if (!idValid(params.id)) return json({ error: "ID menu tidak valid." }, 400);
	try {
		return json({ data: await ambilProduk(params.id) });
	} catch (error) {
		return json({ error: error.message }, error.status ?? 500);
	}
}
async function PUT({ params, request }) {
	if (!sesiDariRequest(request)) return tolakTanpaSesi();
	if (!idValid(params.id)) return json({ error: "ID menu tidak valid." }, 400);
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: "Body harus JSON yang valid." }, 400);
	}
	try {
		return json({ data: await ubahProduk(params.id, body) });
	} catch (error) {
		return json({ error: error.message }, error.status ?? 500);
	}
}
async function DELETE({ params, request }) {
	if (!sesiDariRequest(request)) return tolakTanpaSesi();
	if (!idValid(params.id)) return json({ error: "ID menu tidak valid." }, 400);
	try {
		return json({ data: await hapusProduk(params.id) });
	} catch (error) {
		return json({ error: error.message }, error.status ?? 500);
	}
}
// \0virtual:astro:page:src/pages/api/products/[id]@_@js
var page = () => _id__exports;
export { page };
