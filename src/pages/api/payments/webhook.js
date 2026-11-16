import { idPesananDariOrderId, signatureValid, statusBayarDariMidtrans } from '../../../lib/midtrans.service.js';
import { ubahStatusBayar } from '../../../lib/repo.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body tidak valid.' }, 400);
  }

  if (!signatureValid(body)) return json({ error: 'Signature tidak valid.' }, 403);

  const idPesanan = idPesananDariOrderId(body.order_id);
  if (!idPesanan) return json({ status: 'ignored' }); // bukan order kita

  try {
    await ubahStatusBayar(idPesanan, statusBayarDariMidtrans(body));
    return json({ status: 'ok' });
  } catch (error) {
    if (error.status === 404) return json({ status: 'ignored' });
    console.error('[payment/webhook]', error.message);
    return json({ error: 'Gagal memproses.' }, 500); // 5xx supaya Midtrans mengirim ulang
  }
}

export async function GET() {
  return json({ status: 'webhook alive' });
}