export async function GET({ url, request }) {
  const publik = url.searchParams.get('publik') === '1';
  if (!publik && !sesiDariRequest(request)) return tolakTanpaSesi();
  try {
    return json({ data: await daftarProduk({ publik }), sumber: modeData() });
  } catch (error) {
    return json({ error: error.message }, error.status ?? 500);
  }
}