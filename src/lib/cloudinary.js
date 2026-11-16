import { createHash } from 'node:crypto';
import { bacaEnv } from './env.js';

export function cloudinarySiap() {
  return Boolean(
    bacaEnv('CLOUDINARY_CLOUD_NAME') && bacaEnv('CLOUDINARY_API_KEY') && bacaEnv('CLOUDINARY_API_SECRET'),
  );
}

/**
 * Unggah foto menu ke Cloudinary dengan signature server-side.
 * Tanpa kredensial: `{ url: null, fallback: true }` (pemanggil memakai placeholder).
 */
export async function unggahKeCloudinary(file) {
  const cloud = bacaEnv('CLOUDINARY_CLOUD_NAME');
  const apiKey = bacaEnv('CLOUDINARY_API_KEY');
  const apiSecret = bacaEnv('CLOUDINARY_API_SECRET');

  if (!cloud || !apiKey || !apiSecret) return { url: null, fallback: true };

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'yuktakarin';
  const signature = createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  const body = new FormData();
  body.append('file', file);
  body.append('api_key', apiKey);
  body.append('timestamp', String(timestamp));
  body.append('folder', folder);
  body.append('signature', signature);

  const respons = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: 'POST',
    body,
  });
  const hasil = await respons.json().catch(() => ({}));

  if (!respons.ok) {
    throw new Error(hasil?.error?.message ?? `Cloudinary menolak unggahan (${respons.status}).`);
  }

  return { url: hasil.secure_url, fallback: false };
}
