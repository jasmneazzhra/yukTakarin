import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { t as bacaEnv } from "./env_Bf19XHEq.mjs";
import { c as tolakTanpaSesi, s as sesiDariRequest } from "./auth_Dgd1wHJE.mjs";
import { t as placeholderMenu } from "./placeholder_C0fw62bR.mjs";
import { createHash } from "node:crypto";
// src/lib/cloudinary.js
function cloudinarySiap() {
	return Boolean(bacaEnv("CLOUDINARY_CLOUD_NAME") && bacaEnv("CLOUDINARY_API_KEY") && bacaEnv("CLOUDINARY_API_SECRET"));
}
/**
* Unggah foto menu ke Cloudinary dengan signature server-side.
* Tanpa kredensial: `{ url: null, fallback: true }` (pemanggil memakai placeholder).
*/
async function unggahKeCloudinary(file) {
	const cloud = bacaEnv("CLOUDINARY_CLOUD_NAME");
	const apiKey = bacaEnv("CLOUDINARY_API_KEY");
	const apiSecret = bacaEnv("CLOUDINARY_API_SECRET");
	if (!cloud || !apiKey || !apiSecret) return {
		url: null,
		fallback: true
	};
	const timestamp = Math.floor(Date.now() / 1e3);
	const folder = "yuktakarin";
	const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
	const body = new FormData();
	body.append("file", file);
	body.append("api_key", apiKey);
	body.append("timestamp", String(timestamp));
	body.append("folder", folder);
	body.append("signature", signature);
	const respons = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
		method: "POST",
		body
	});
	const hasil = await respons.json().catch(() => ({}));
	if (!respons.ok) throw new Error(hasil?.error?.message ?? `Cloudinary menolak unggahan (${respons.status}).`);
	return {
		url: hasil.secure_url,
		fallback: false
	};
}
// src/pages/api/upload.js
var upload_exports = /* @__PURE__ */ __exportAll({ POST: () => POST });
var json = (data, status = 200) => new Response(JSON.stringify(data), {
	status,
	headers: {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store"
	}
});
var MAKS_BYTE = 5242880;
async function POST({ request }) {
	if (!sesiDariRequest(request)) return tolakTanpaSesi();
	let form;
	try {
		form = await request.formData();
	} catch {
		return json({ error: "Gunakan multipart/form-data dengan field \"file\"." }, 400);
	}
	const file = form.get("file");
	const nama = String(form.get("nama") ?? "Menu");
	const kategori = String(form.get("kategori") ?? "Kopi & Minuman");
	if (!file || typeof file === "string" || !file.size) return json({ error: "File foto wajib diunggah." }, 400);
	if (!String(file.type ?? "").startsWith("image/")) return json({ error: "Berkas harus berupa gambar." }, 400);
	if (file.size > MAKS_BYTE) return json({ error: "Ukuran gambar maksimal 5 MB." }, 400);
	if (!cloudinarySiap()) return json({ data: {
		url: placeholderMenu(nama, kategori),
		fallback: true,
		pesan: "Cloudinary belum dikonfigurasi—memakai placeholder lokal."
	} });
	try {
		return json({ data: {
			...await unggahKeCloudinary(file),
			pesan: "Foto terunggah ke Cloudinary."
		} });
	} catch (error) {
		return json({ error: error.message }, 502);
	}
}
// \0virtual:astro:page:src/pages/api/upload@_@js
var page = () => upload_exports;
export { page };
