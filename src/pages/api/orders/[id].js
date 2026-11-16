import { ambilPesanan, ubahStatusPesanan, potongStok } from '../../../lib/repo.js';
import { sesiDariRequest, tolakTanpaSesi } from '../../../lib/auth.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

export async function PATCH({ params, request }) {
  if (!sesiDariRequest(request)) return tolakTanpaSesi();
  try {
    const body = await request.json();
    if (!body.status) return json({ error: 'Status wajib diisi.' }, 400);

    const pesanan = await ambilPesanan(params.id);
    if (body.potongStok && body.productId) {
      await potongStok(body.productId, body.jumlahPorsi ?? body.jumlah ?? pesanan.jumlahPorsi ?? 1);
    }
    return json({ data: await ubahStatusPesanan(pesanan.id, body.status) });
  } catch (error) {
    return json({ error: error.message }, error.status ?? 500);
  }
}