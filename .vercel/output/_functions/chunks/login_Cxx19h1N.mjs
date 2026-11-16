import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import { C as renderComponent, O as renderTemplate, k as maybeRenderHead } from "./sequence_ne2iXGz0.mjs";
import { t as createAstro } from "./compiler_DXCFmxuo.mjs";
import { n as createComponent, t as $$Base } from "./Base_DgT9nmK4.mjs";
import { o as attr, s as escape_html } from "./dev_CJZ64T7G.mjs";
import { o as kredensialPemilik } from "./auth_Dgd1wHJE.mjs";
// src/components/LoginForm.svelte
function LoginForm($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { modeDev = false, galat = false } = $$props;
		let username = "";
		let password = "";
		let sibuk = false;
		let pesan = galat ? "Username atau password salah. Coba lagi." : "";
		$$renderer.push(`<section class="card panel"><p class="eyebrow svelte-o8qrqj">Khusus pemilik warung</p> <h1 class="svelte-o8qrqj">Masuk ke Dapur</h1> <p class="muted">Katalog tetap terbuka untuk pelanggan. Halaman dapur, kelola menu, dan perubahan pesanan hanya bisa
    diakses setelah masuk.</p> `);
		if (pesan) $$renderer.push(`<!--[0--><p class="notif notif--galat svelte-o8qrqj" role="alert">${escape_html(pesan)}</p>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (modeDev) $$renderer.push(`<!--[0--><p class="notif svelte-o8qrqj"><strong>Mode dev.</strong> <code>OWNER_PASSWORD</code> belum diisi, jadi kredensial cadangan lokal
      dipakai. Isi <code>.env</code> sebelum dipakai di warung sungguhan.</p>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <form class="form svelte-o8qrqj"><div class="field"><label for="username">Username pemilik</label> <input id="username" class="input" name="username" type="text" autocomplete="username"${attr("value", username)} required=""/></div> <div class="field"><label for="password">Password</label> <input id="password" class="input" name="password" type="password" autocomplete="current-password"${attr("value", password)} required=""/></div> <button class="btn btn--primary btn--block" type="submit"${attr("disabled", sibuk, true)}>${escape_html("Masuk ke dapur")}</button></form> <p class="muted kecil svelte-o8qrqj">Sesi berlaku 12 jam dan disimpan sebagai cookie HttpOnly.</p></section>`);
	});
}
// src/pages/login.astro
var login_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Login,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Login = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Login;
	const modeDev = kredensialPemilik().modeDev;
	const galat = Astro.url.searchParams.get("galat") === "1";
	return renderTemplate`${renderComponent($$result, "Base", $$Base, {
		"judul": "Masuk Pemilik Warung — yukTakarin!",
		"deskripsi": "Halaman masuk khusus Pemilik Warung yukTakarin!.",
		"data-astro-cid-sjqh5bze": true
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<main class="wrap masuk" data-astro-cid-sjqh5bze><a class="kembali" href="/" data-astro-cid-sjqh5bze>← Kembali ke katalog</a>${renderComponent($$result, "LoginForm", LoginForm, {
		"client:load": true,
		"modeDev": modeDev,
		"galat": galat,
		"data-astro-cid-sjqh5bze": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/Users/jasmi/pawonboga-lab/src/components/LoginForm.svelte",
		"client:component-export": "default"
	})}</main>` })}`;
}, "C:/Users/jasmi/pawonboga-lab/src/pages/login.astro", void 0);
var $$file = "C:/Users/jasmi/pawonboga-lab/src/pages/login.astro";
var $$url = "/login";
// \0virtual:astro:page:src/pages/login@_@astro
var page = () => login_exports;
export { page };
