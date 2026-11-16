import { gt as defineMiddleware, t as sequence } from "./chunks/sequence_ne2iXGz0.mjs";
import { c as tolakTanpaSesi, l as verifikasiToken, t as NAMA_COOKIE } from "./chunks/auth_Dgd1wHJE.mjs";
// src/middleware.js
/** Endpoint yang hanya boleh disentuh Pemilik Warung yang sudah login. */
var MUTASI = [/^\/api\/upload\/?$/, /^\/api\/apply-inflation\/?$/];
var onRequest$1 = defineMiddleware(async (context, next) => {
	const jalur = context.url.pathname;
	const metode = context.request.method.toUpperCase();
	const sesi = verifikasiToken(context.cookies.get(NAMA_COOKIE)?.value);
	if (jalur === "/login" && sesi) return context.redirect("/dapur");
	if (jalur === "/dapur" || jalur.startsWith("/dapur/")) {
		if (!sesi) return context.redirect("/login?arah=/dapur");
		return next();
	}
	if ((MUTASI.some((pola) => pola.test(jalur)) || /^\/api\/products(\/[^/]+)?\/?$/.test(jalur) && metode !== "GET" || jalur === "/api/orders" && metode !== "POST" || /^\/api\/orders\/[^/]+\/?$/.test(jalur) && metode !== "POST") && !sesi) {
		if (jalur.startsWith("/api/")) return tolakTanpaSesi();
		return context.redirect("/login");
	}
	return next();
});
// \0virtual:astro:middleware
var onRequest = sequence(onRequest$1);
export { onRequest };
