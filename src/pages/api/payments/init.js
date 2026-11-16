import { ambilPesanan } from '../../../lib/repo.js';
import { buatOrderIdMidtrans, buildMidtransParams, createMidtransTransaction } from '../../../lib/midtrans.service.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export async function POST({ request }) {
  try {
    const { order_id } = await request.json().catch(() => ({}));
    if (!order_id) return json({ error: 'order_id wajib diisi.' }, 400);

    const pesanan = await ambilPesanan(order_id);
    if (pesanan.payment_status === 'paid') return json({ error: 'Pesanan sudah dibayar.' }, 409);
    if (!(pesanan.totalHarga > 0)) return json({ error: 'Total pesanan tidak valid.' }, 400);

    const midtransOrderId = buatOrderIdMidtrans(pesanan.id);
    const hasil = await createMidtransTransaction(
      buildMidtransParams({
        orderId: midtransOrderId,
        amount: pesanan.totalHarga,
        namaItem: pesanan.namaMenu,
        buyer: { name: pesanan.namaPemesan },
      }),
    );

    return json({
      data: {
        payment_url: hasil.redirect_url ?? '',
        token: hasil.token,
        order_id: midtransOrderId,
        gross_amount: pesanan.totalHarga,
        currency: 'IDR',
      },
    });
  } catch (error) {
    console.error('[payment/init]', error.message);
    return json({ error: error.message || 'Gagal inisialisasi pembayaran.' }, error.status ?? 500);
  }
}