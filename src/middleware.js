import { defineMiddleware } from 'astro:middleware';
import { NAMA_COOKIE, tolakTanpaSesi, verifikasiToken } from './lib/auth.js';

/** Endpoint yang hanya boleh disentuh Pemilik Warung yang sudah login. */
const MUTASI = [/^\/api\/upload\/?$/, /^\/api\/apply-inflation\/?$/];

export const onRequest = defineMiddleware(async (context, next) => {
  const jalur = context.url.pathname;
  const metode = context.request.method.toUpperCase();
  const sesi = verifikasiToken(context.cookies.get(NAMA_COOKIE)?.value);

  if (jalur === '/login' && sesi) return context.redirect('/dapur');

  if (jalur === '/dapur' || jalur.startsWith('/dapur/')) {
    if (!sesi) return context.redirect('/login?arah=/dapur');
    return next();
  }

  const mutasi =
    MUTASI.some((pola) => pola.test(jalur)) ||
    (/^\/api\/products(\/[^/]+)?\/?$/.test(jalur) && metode !== 'GET') ||
    (jalur === '/api/orders' && metode !== 'POST') ||
    (/^\/api\/orders\/[^/]+\/?$/.test(jalur) && metode !== 'POST');

  if (mutasi && !sesi) {
    if (jalur.startsWith('/api/')) return tolakTanpaSesi();
    return context.redirect('/login');
  }

  return next();
});