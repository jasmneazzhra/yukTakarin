import { cloudinarySiap, unggahKeCloudinary } from '../../lib/cloudinary.js';
import { sesiDariRequest, tolakTanpaSesi } from '../../lib/auth.js';
import { placeholderMenu } from '../../lib/placeholder.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const MAKS_BYTE = 5 * 1024 * 1024;

export async function POST({ request }) {
  if (!sesiDariRequest(request)) return tolakTanpaSesi();

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Gunakan multipart/form-data dengan field "file".' }, 400);
  }

  const file = form.get('file');
  const nama = String(form.get('nama') ?? 'Menu');
  const kategori = String(form.get('kategori') ?? 'Kopi & Minuman');

  if (!file || typeof file === 'string' || !file.size) {
    return json({ error: 'File foto wajib diunggah.' }, 400);
  }
  if (!String(file.type ?? '').startsWith('image/')) {
    return json({ error: 'Berkas harus berupa gambar.' }, 400);
  }
  if (file.size > MAKS_BYTE) {
    return json({ error: 'Ukuran gambar maksimal 5 MB.' }, 400);
  }

  if (!cloudinarySiap()) {
    return json({
      data: {
        url: placeholderMenu(nama, kategori),
        fallback: true,
        pesan: 'Cloudinary belum dikonfigurasi—memakai placeholder lokal.',
      },
    });
  }

  try {
    const hasil = await unggahKeCloudinary(file);
    return json({ data: { ...hasil, pesan: 'Foto terunggah ke Cloudinary.' } });
  } catch (error) {
    return json({ error: error.message }, 502);
  }
}
