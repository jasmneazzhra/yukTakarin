export async function GET({ params, request }) {
  if (!sesiDariRequest(request)) return tolakTanpaSesi();
  if (!idValid(params.id)) return json({ error: 'ID menu tidak valid.' }, 400);
  try {
    return json({ data: await ambilProduk(params.id) });
  } catch (error) {
    return json({ error: error.message }, error.status ?? 500);
  }
}