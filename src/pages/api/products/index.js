import { buatProduk, daftarProduk, modeData } from '../../../lib/repo.js';
import { sesiDariRequest, tolakTanpaSesi } from '../../../lib/auth.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export async function GET({ url, request }) {
  const publik = url.searchParams.get('publik') === '1';
  // Data lengkap (resep, biaya) hanya untuk pemilik.
  if (!publik && !sesiDariRequest(request)) return tolakTanpaSesi();
  try {
    return json({ data: await daftarProduk({ publik }), sumber: modeData() });
  } catch (error) {
    return json({ error: error.message }, error.status ?? 500);
  }
}

export async function POST({ request }) {
  if (!sesiDariRequest(request)) return tolakTanpaSesi();

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body harus JSON yang valid.' }, 400);
  }

  try {
    return json({ data: await buatProduk(body) }, 201);
  } catch (error) {
    return json({ error: error.message }, error.status ?? 500);
  }
}