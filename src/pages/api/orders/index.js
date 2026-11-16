import { buatPesanan, daftarPesanan } from '../../../lib/repo.js';
import { sesiDariRequest, tolakTanpaSesi } from '../../../lib/auth.js';

export async function GET({ url, request }) {
  if (!sesiDariRequest(request)) return tolakTanpaSesi();
  try {
    const hariIni = url.searchParams.get('hariIni') === '1';
    const data = await daftarPesanan({ hariIni });
    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.status ?? 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const data = await buatPesanan(body);
    return new Response(JSON.stringify({ data }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.status ?? 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
