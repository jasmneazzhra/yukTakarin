import { t as __exportAll } from "./rolldown-runtime_D8jQpDG7.mjs";
// src/pages/api/test.js
var test_exports = /* @__PURE__ */ __exportAll({ GET: () => GET });
async function GET() {
	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { "content-type": "application/json" }
	});
}
// \0virtual:astro:page:src/pages/api/test@_@js
var page = () => test_exports;
export { page };
