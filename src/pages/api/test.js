import { sesiDariRequest } from '../../lib/auth.js';

export async function GET() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}