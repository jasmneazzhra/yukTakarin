import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { a as cookieSesi, n as buatToken, r as cocokKredensial } from "./auth_Dgd1wHJE.mjs";
// src/pages/api/auth/login.js
var login_exports = /* @__PURE__ */ __exportAll({ POST: () => POST });
async function POST({ request }) {
	try {
		const { username, password } = await request.json();
		if (!username || !password) return new Response(JSON.stringify({ error: "Username dan password wajib diisi." }), {
			status: 400,
			headers: { "content-type": "application/json; charset=utf-8" }
		});
		if (!cocokKredensial(username, password)) return new Response(JSON.stringify({ error: "Username atau password salah." }), {
			status: 401,
			headers: {
				"content-type": "application/json; charset=utf-8",
				"cache-control": "no-store"
			}
		});
		const token = buatToken(username);
		const setCookie = cookieSesi(token);
		return new Response(JSON.stringify({ data: { username } }), {
			status: 200,
			headers: {
				"content-type": "application/json; charset=utf-8",
				"set-cookie": setCookie,
				"cache-control": "no-store"
			}
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: "Gagal proses login." }), {
			status: 500,
			headers: { "content-type": "application/json; charset=utf-8" }
		});
	}
}
// \0virtual:astro:page:src/pages/api/auth/login@_@js
var page = () => login_exports;
export { page };
