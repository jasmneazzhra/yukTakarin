import { terapkanInflasi } from '../../lib/repo.js';
import { sesiDariRequest, tolakTanpaSesi } from '../../lib/auth.js';

export async function POST({ request }) {
  if (!sesiDariRequest(request)) return tolakTanpaSesi();
  try {
    const body = await request.json();
    const data = await terapkanInflasi({ slugBahan: body.slugBahan, persen: body.persen });
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
