import { kredensialPemilik, cocokKredensial, buatToken, cookieSesi, tolakTanpaSesi } from '../../../lib/auth.js';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username dan password wajib diisi.' }), {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }

    if (!cocokKredensial(username, password)) {
      return new Response(JSON.stringify({ error: 'Username atau password salah.' }), {
        status: 401,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        },
      });
    }

    const token = buatToken(username);
    const setCookie = cookieSesi(token);

    return new Response(JSON.stringify({ data: { username } }), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'set-cookie': setCookie,
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Gagal proses login.' }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
}