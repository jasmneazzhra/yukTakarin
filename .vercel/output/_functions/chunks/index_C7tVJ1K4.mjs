import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
import "./compiler_DXCFmxuo.mjs";
import { n as createComponent, t as $$Base } from "./Base_DgT9nmK4.mjs";
import { C as renderComponent, O as renderTemplate, j as createRenderInstruction, k as maybeRenderHead } from "./sequence_ne2iXGz0.mjs";
// node_modules/@astrojs/runtime/dist/internal/server/render/script.js
/**
* Relies on the `renderScript: true` compiler option
* @experimental
*/
async function renderScript(result, id) {
	const inlined = result.inlinedScripts.get(id);
	let content = "";
	if (inlined != null) {
		if (inlined) content = `<script type="module">${inlined}<\/script>`;
	} else {
		const resolved = await result.resolve(id);
		content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"><\/script>`;
	}
	return createRenderInstruction({
		type: "script",
		id,
		content
	});
}
// src/pages/index.astro
var pages_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => ""
});
var $$Index = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "Base", $$Base, {
		"judul": "yukTakarin!",
		"deskripsi": "yukTakarin! — Katalog Coffee & Kue Rumahan",
		"data-astro-cid-lcdefpme": true
	}, { "default": ($$result) => renderTemplate`<script>document.documentElement.classList.add('js');<\/script>${maybeRenderHead($$result)}<header class="wrap topbar" data-astro-cid-lcdefpme><p class="wordmark" data-astro-cid-lcdefpme>yukTakarin!</p><a class="btn btn--quiet btn--sm" href="/login" data-astro-cid-lcdefpme>Masuk Pemilik</a></header><main class="wrap beranda" data-astro-cid-lcdefpme><section class="hero" data-astro-cid-lcdefpme><span class="blob blob--1" aria-hidden="true" data-astro-cid-lcdefpme></span><span class="blob blob--2" aria-hidden="true" data-astro-cid-lcdefpme></span><span class="blob blob--3" aria-hidden="true" data-astro-cid-lcdefpme></span><div class="hero__teks" data-astro-cid-lcdefpme><p class="eyebrow anim" style="--i: 0" data-astro-cid-lcdefpme>Katering harian &amp; acara</p><h1 class="anim" style="--i: 1" data-astro-cid-lcdefpme>Kopi, pastry, dan kue rumahan.</h1><p class="sub anim" style="--i: 2" data-astro-cid-lcdefpme>Untuk rapat kantor dan acara. Pilih menu, atur jumlah dan jadwal, lalu bayar online.</p><div class="aksi anim" style="--i: 3" data-astro-cid-lcdefpme><a href="/menu" class="btn btn--primary denyut" data-astro-cid-lcdefpme>Lihat Katalog →</a></div></div><div class="hero__cangkir anim anim--pop" style="--i: 2" aria-hidden="true" data-astro-cid-lcdefpme><svg viewBox="0 0 240 220" width="100%" height="100%" data-astro-cid-lcdefpme><g class="uap" fill="none" stroke="#1f1b16" stroke-width="5" stroke-linecap="round" data-astro-cid-lcdefpme><path class="uap__1" d="M90 70 C75 55, 105 45, 90 28" data-astro-cid-lcdefpme></path><path class="uap__2" d="M125 72 C110 55, 140 42, 125 22" data-astro-cid-lcdefpme></path><path class="uap__3" d="M160 70 C145 55, 175 45, 160 30" data-astro-cid-lcdefpme></path></g><rect x="50" y="86" width="130" height="100" rx="14" fill="#f6f2e9" stroke="#1f1b16" stroke-width="5" data-astro-cid-lcdefpme></rect><path d="M180 108h16a24 24 0 0 1 0 48h-16" fill="none" stroke="#1f1b16" stroke-width="5" data-astro-cid-lcdefpme></path><circle cx="115" cy="136" r="26" fill="#ffd23f" stroke="#1f1b16" stroke-width="5" data-astro-cid-lcdefpme></circle><rect x="30" y="196" width="170" height="10" rx="5" fill="#1f1b16" data-astro-cid-lcdefpme></rect></svg></div></section><section data-astro-cid-lcdefpme><h2 class="judul reveal" data-astro-cid-lcdefpme>Menu Populer</h2><p class="muted" data-astro-cid-lcdefpme>Kunjungi katalog untuk melihat menu yang tersedia.</p><a class="btn btn--quiet btn--sm" href="/menu" data-astro-cid-lcdefpme>Lihat katalog</a></section></main><footer class="wrap footer reveal" data-astro-cid-lcdefpme><p data-astro-cid-lcdefpme><strong data-astro-cid-lcdefpme>yukTakarin!</strong> · Coffee &amp; Kue rumahan</p><p class="muted" data-astro-cid-lcdefpme>Buka 07.00–21.00 WIB</p></footer>` })}${renderScript($$result, "C:/Users/jasmi/pawonboga-lab/src/pages/index.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/jasmi/pawonboga-lab/src/pages/index.astro", void 0);
var $$file = "C:/Users/jasmi/pawonboga-lab/src/pages/index.astro";
// \0virtual:astro:page:src/pages/index@_@astro
var page = () => pages_exports;
export { page };
