/** Sesi Pemilik Warung: cookie HttpOnly bertanda tangan HMAC-SHA256.
 * Kredensial dibaca dari env; fallback hanya untuk dev/uji saat .env kosong.
 */
import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { bacaEnv } from './env.js';

export const NAMA_COOKIE = 'yt_sesi';
const UMUR_JAM = 12;

const produksi = () => bacaEnv('NODE_ENV') === 'production';

export function kredensialPemilik() {
  const password = bacaEnv('OWNER_PASSWORD');
  const secret = bacaEnv('SESSION_SECRET');
  if (produksi() && (!password || !secret)) {
    throw new Error('OWNER_PASSWORD dan SESSION_SECRET wajib diisi di production.');
  }
  return {
    username: bacaEnv('OWNER_USERNAME') || 'pemilik',
    password: password || 'dapur-lokal',
    secret: secret || 'rahasia-dev-yuktakarin',
    modeDev: !password,
  };
}

const b64 = (nilai) => Buffer.from(nilai).toString('base64url');
const hash = (nilai) => createHash('sha256').update(String(nilai)).digest();

function tandaTangan(data, secret) {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

// Di-hash dulu supaya panjangnya sama dan tidak bocor lewat perbedaan panjang.
function samakan(a, b) {
  return timingSafeEqual(hash(a), hash(b));
}

export function cocokKredensial(username, password) {
  const k = kredensialPemilik();
  const cocokUser = samakan(username ?? '', k.username);
  const cocokPass = samakan(password ?? '', k.password);
  return cocokUser && cocokPass;
}

export function buatToken(username) {
  const isi = b64(JSON.stringify({ u: username, exp: Date.now() + UMUR_JAM * 3_600_000 }));
  return `${isi}.${tandaTangan(isi, kredensialPemilik().secret)}`;
}

export function verifikasiToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [isi, tanda] = token.split('.');
  if (!isi || !tanda) return null;

  const harapan = tandaTangan(isi, kredensialPemilik().secret);
  if (!samakan(tanda, harapan)) return null;

  try {
    const data = JSON.parse(Buffer.from(isi, 'base64url').toString('utf8'));
    if (!data?.u || !(Number(data.exp) > Date.now())) return null;
    return { username: data.u };
  } catch {
    return null;
  }
}

const secure = () => (produksi() ? '; Secure' : '');

export function cookieSesi(token) {
  return `${NAMA_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${UMUR_JAM * 3600}${secure()}`;
}

export function cookieHapus() {
  return `${NAMA_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure()}`;
}

export function ambilCookie(header, nama = NAMA_COOKIE) {
  const baris = String(header ?? '').split(';');
  for (const potong of baris) {
    const [kunci, ...sisa] = potong.trim().split('=');
    if (kunci === nama) return sisa.join('=') || null;
  }
  return null;
}

export function sesiDariRequest(request) {
  return verifikasiToken(ambilCookie(request?.headers?.get?.('cookie')));
}

export function tolakTanpaSesi() {
  return new Response(JSON.stringify({ error: 'Butuh login Pemilik Warung.' }), {
    status: 401,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}