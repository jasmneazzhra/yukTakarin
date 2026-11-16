import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { h as ubahStatusPesanan, t as ambilPesanan, u as potongStok } from "./repo_CAXlixrm.mjs";
import { c as tolakTanpaSesi, s as sesiDariRequest } from "./auth_Dgd1wHJE.mjs";
// src/pages/api/orders/[id].js
var _id__exports = /* @__PURE__ */ __exportAll({ PATCH: () => PATCH });
var json = (data, status = 200) => new Response(JSON.stringify(data), {
	status,
	headers: { "content-type": "application/json; charset=utf-8" }
});
async function PATCH({ params, request }) {
	if (!sesiDariRequest(request)) return tolakTanpaSesi();
	try {
		const body = await request.json();
		if (!body.status) return json({ error: "Status wajib diisi." }, 400);
		const pesanan = await ambilPesanan(params.id);
		if (body.potongStok && body.productId) await potongStok(body.productId, body.jumlahPorsi ?? body.jumlah ?? pesanan.jumlahPorsi ?? 1);
		return json({ data: await ubahStatusPesanan(pesanan.id, body.status) });
	} catch (error) {
		return json({ error: error.message }, error.status ?? 500);
	}
}
// \0virtual:astro:page:src/pages/api/orders/[id]@_@js
var page = () => _id__exports;
export { page };
