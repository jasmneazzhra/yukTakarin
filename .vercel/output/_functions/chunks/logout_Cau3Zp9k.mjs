import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { i as cookieHapus } from "./auth_Dgd1wHJE.mjs";
// src/pages/api/auth/logout.js
var logout_exports = /* @__PURE__ */ __exportAll({ POST: () => POST });
async function POST({ request, cookies }) {
	try {
		const setCookie = cookieHapus();
		return new Response(JSON.stringify({ data: { loggedOut: true } }), {
			status: 200,
			headers: {
				"content-type": "application/json; charset=utf-8",
				"set-cookie": setCookie,
				"cache-control": "no-store"
			}
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: "Gagal logout." }), {
			status: 500,
			headers: { "content-type": "application/json; charset=utf-8" }
		});
	}
}
// \0virtual:astro:page:src/pages/api/auth/logout@_@js
var page = () => logout_exports;
export { page };
