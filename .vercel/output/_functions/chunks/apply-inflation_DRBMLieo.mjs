import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { f as terapkanInflasi } from "./repo_CAXlixrm.mjs";
import { c as tolakTanpaSesi, s as sesiDariRequest } from "./auth_Dgd1wHJE.mjs";
// src/pages/api/apply-inflation.js
var apply_inflation_exports = /* @__PURE__ */ __exportAll({ POST: () => POST });
async function POST({ request }) {
	if (!sesiDariRequest(request)) return tolakTanpaSesi();
	try {
		const body = await request.json();
		const data = await terapkanInflasi({
			slugBahan: body.slugBahan,
			persen: body.persen
		});
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
// \0virtual:astro:page:src/pages/api/apply-inflation@_@js
var page = () => apply_inflation_exports;
export { page };
