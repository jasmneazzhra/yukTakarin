import { checkMidtransStatus, idPesananDariOrderId, statusBayarDariMidtrans } from '../../../lib/midtrans.service.js';
import { ubahStatusBayar } from '../../../lib/repo.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export async function GET({ url }) {
  try {
    const orderId = url.searchParams.get('order_id');
    const idPesanan = idPesananDariOrderId(orderId);
    if (!idPesanan) return json({ error: 'order_id tidak valid.' }, 400);

    const data = await checkMidtransStatus(orderId);
    const status = statusBayarDariMidtrans(data);
    await ubahStatusBayar(idPesanan, status);

    return json({
      data: {
        order_id: data.order_id,
        status,
        transaction_status: data.transaction_status,
        gross_amount: data.gross_amount,
        payment_type: data.payment_type,
        transaction_time: data.transaction_time,
      },
    });
  } catch (error) {
    console.error('[payment/status]', error.message);
    return json({ error: error.message || 'Gagal cek status pembayaran.' }, error.status ?? 500);
  }
}