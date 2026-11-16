// src/lib/env.js
/**
* Baca variabel lingkungan dari server (process.env) atau Vite (import.meta.env).
* Tidak ada nilai rahasia yang ditulis di kode.
*/
function bacaEnv(kunci) {
	const dariProses = typeof process !== "undefined" ? process.env?.[kunci] : void 0;
	if (dariProses) return dariProses;
	return (typeof import.meta !== "undefined" ? Object.assign({
		"ASSETS_PREFIX": void 0,
		"BASE_URL": "/",
		"DEV": false,
		"MODE": "production",
		"PROD": true,
		"SITE": void 0,
		"SSR": true
	}, {})?.[kunci] : void 0) || "";
}
export { bacaEnv as t };
