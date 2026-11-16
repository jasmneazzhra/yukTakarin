import { h as InvalidComponentArgs, q as AstroError } from "./errors-data_D8O-YH_F.mjs";
import { A as renderHead, N as addAttribute, O as renderTemplate, T as renderSlot } from "./sequence_ne2iXGz0.mjs";
import { t as createAstro } from "./compiler_DXCFmxuo.mjs";
// node_modules/@astrojs/runtime/dist/internal/server/astro-component.js
function validateArgs(args) {
	if (args.length !== 3) return false;
	if (!args[0] || typeof args[0] !== "object") return false;
	return true;
}
function baseCreateComponent(cb, moduleId, propagation) {
	const name = moduleId?.split("/").pop()?.replace(".astro", "") ?? "";
	const fn = (...args) => {
		if (!validateArgs(args)) throw new AstroError({
			...InvalidComponentArgs,
			message: InvalidComponentArgs.message(name)
		});
		return cb(...args);
	};
	Object.defineProperty(fn, "name", {
		value: name,
		writable: false
	});
	fn.isAstroComponentFactory = true;
	fn.moduleId = moduleId;
	fn.propagation = propagation;
	return fn;
}
function createComponentWithOptions(opts) {
	return baseCreateComponent(opts.factory, opts.moduleId, opts.propagation);
}
function createComponent(arg1, moduleId, propagation) {
	if (typeof arg1 === "function") return baseCreateComponent(arg1, moduleId, propagation);
	else return createComponentWithOptions(arg1);
}
// src/layouts/Base.astro
createAstro("https://astro.build");
var $$Base = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Base;
	const { judul = "yukTakarin!", deskripsi = "Katalog menu coffee & kue rumahan." } = Astro.props;
	return renderTemplate`<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description"${addAttribute(deskripsi, "content")}><meta name="theme-color" content="#F6F2E9"><title>${judul}</title>${renderHead($$result)}</head><body>${renderSlot($$result, $$slots["default"])}</body></html>`;
}, "C:/Users/jasmi/pawonboga-lab/src/layouts/Base.astro", void 0);
export { createComponent as n, $$Base as t };
