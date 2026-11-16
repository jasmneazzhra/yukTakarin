import { cookieHapus } from '../../../lib/auth.js';

export async function POST({ request, cookies }) {
  try {
    const setCookie = cookieHapus();
    return new Response(JSON.stringify({ data: { loggedOut: true } }), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'set-cookie': setCookie,
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Gagal logout.' }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
}