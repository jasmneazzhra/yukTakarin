import { ambilProduk, hapusProduk, ubahProduk } from '../../../lib/repo.js';
import { sesiDariRequest, tolakTanpaSesi } from '../../../lib/auth.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const idValid = (id) => /^\d+$/.test(String(id ?? ''));

export async function GET({ params, request }) {
  if (!sesiDariRequest(request)) return tolakTanpaSesi();
  if (!idValid(params.id)) return json({ error: 'ID menu tidak valid.' }, 400);
  try {
    return json({ data: await ambilProduk(params.id) });
  } catch (error) {
    return json({ error: error.message }, error.status ?? 500);
  }
}

export async function PUT({ params, request }) {
  if (!sesiDariRequest(request)) return tolakTanpaSesi();
  if (!idValid(params.id)) return json({ error: 'ID menu tidak valid.' }, 400);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body harus JSON yang valid.' }, 400);
  }

  try {
    return json({ data: await ubahProduk(params.id, body) });
  } catch (error) {
    return json({ error: error.message }, error.status ?? 500);
  }
}

export async function DELETE({ params, request }) {
  if (!sesiDariRequest(request)) return tolakTanpaSesi();
  if (!idValid(params.id)) return json({ error: 'ID menu tidak valid.' }, 400);
  try {
    return json({ data: await hapusProduk(params.id) });
  } catch (error) {
    return json({ error: error.message }, error.status ?? 500);
  }
}