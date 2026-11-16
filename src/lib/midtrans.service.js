import { createHash, timingSafeEqual } from 'node:crypto';
import { bacaEnv } from './env.js';

const produksi = () => bacaEnv('MIDTRANS_IS_PRODUCTION') === 'true';
const urlSnap = () =>
  produksi() ? 'https://app.midtrans.com/snap/v1/transactions' : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
const urlApi = () => (produksi() ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com');

function headerAuth() {
  const serverKey = bacaEnv('MIDTRANS_SERVER_KEY');
  if (!serverKey) throw new Error('MIDTRANS_SERVER_KEY tidak di-set di .env');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`,
  };
}

/** order_id Midtrans harus unik per percobaan bayar. */
export const buatOrderIdMidtrans = (idPesanan) => `YT-${idPesanan}-${Date.now()}`;

export function idPesananDariOrderId(orderId) {
  const cocok = /^YT-(\d+)-\d+$/.exec(String(orderId ?? ''));
  return cocok ? Number(cocok[1]) : null;
}

export function buildMidtransParams({ orderId, amount, namaItem = 'Pesanan Warung', buyer = {} }) {
  if (!orderId) throw new Error('orderId wajib diisi');
  const gross = Math.round(Number(amount));
  if (!Number.isFinite(gross) || gross <= 0) throw new Error('amount harus > 0');

  const params = {
    transaction_details: { order_id: String(orderId), gross_amount: gross },
    item_details: [{ id: String(orderId), price: gross, quantity: 1, name: String(namaItem).slice(0, 50) }],
  };
  if (buyer.name || buyer.email) {
    params.customer_details = {
      ...(buyer.name && { first_name: buyer.name }),
      ...(buyer.email && { email: buyer.email }),
    };
  }
  return params;
}

async function panggil(url, opsi) {
  const response = await fetch(url, opsi);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const pesan = data?.error_messages?.join?.(', ') || data?.status_message || data?.message || 'Galat tidak dikenal';
    const error = new Error(`Midtrans ${response.status}: ${pesan}`);
    error.status = response.status === 404 ? 404 : 502;
    throw error;
  }
  return data;
}

export const createMidtransTransaction = (params) =>
  panggil(urlSnap(), { method: 'POST', headers: headerAuth(), body: JSON.stringify(params) });

export const checkMidtransStatus = (orderId) =>
  panggil(`${urlApi()}/v2/${encodeURIComponent(orderId)}/status`, { method: 'GET', headers: headerAuth() });

/** signature_key = SHA512(order_id + status_code + gross_amount + serverKey) */
export function signatureValid({ order_id, status_code, gross_amount, signature_key }) {
  const serverKey = bacaEnv('MIDTRANS_SERVER_KEY');
  if (!serverKey || !signature_key) return false;
  const harapan = createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest('hex');
  const a = Buffer.from(harapan);
  const b = Buffer.from(String(signature_key));
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Petakan transaction_status Midtrans ke payment_status internal. */
export function statusBayarDariMidtrans({ transaction_status, fraud_status } = {}) {
  switch (transaction_status) {
    case 'capture':
      return fraud_status === 'challenge' ? 'pending' : 'paid';
    case 'settlement':
      return 'paid';
    case 'deny':
    case 'cancel':
    case 'expire':
    case 'failure':
      return 'failed';
    case 'refund':
    case 'partial_refund':
      return 'refunded';
    default:
      return 'pending';
  }
}

export default { buildMidtransParams, createMidtransTransaction, checkMidtransStatus, signatureValid };