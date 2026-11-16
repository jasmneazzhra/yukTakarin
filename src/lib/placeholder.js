/**
 * Placeholder SVG lokal (data URI) saat foto menu belum ada / Cloudinary belum diisi.
 * Palet mengikuti UI-SPEC: cream, mustard, coral, teal, sage, ink.
 */

const AKSEN = {
  'Kopi & Minuman': '#FFD23F',
  'Pastry & Roti': '#FF5C38',
  'Kue Panggang': '#2DD4BF',
  'Paket Snack Box': '#A8C3A0',
};

function amanTeks(teks) {
  return String(teks)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inisial(nama) {
  return String(nama)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((kata) => kata[0]?.toUpperCase() ?? '')
    .join('');
}

export function placeholderMenu(nama = 'Menu', kategori = 'Kopi & Minuman') {
  const aksen = AKSEN[kategori] ?? '#FFD23F';
  const label = amanTeks(kategori);
  const teks = amanTeks(inisial(nama) || 'YT');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300" role="img" aria-label="Ilustrasi ${amanTeks(nama)}">
  <rect width="400" height="300" fill="#EDE6D6"/>
  <circle cx="308" cy="66" r="54" fill="${aksen}"/>
  <rect x="72" y="92" width="176" height="132" rx="12" fill="#F6F2E9" stroke="#1F1B16" stroke-width="4"/>
  <path d="M248 128h18a26 26 0 0 1 0 52h-18" fill="none" stroke="#1F1B16" stroke-width="4"/>
  <path d="M96 112h128" stroke="#1F1B16" stroke-width="4"/>
  <circle cx="160" cy="158" r="30" fill="${aksen}" stroke="#1F1B16" stroke-width="4"/>
  <text x="160" y="166" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="800" fill="#1F1B16">${teks}</text>
  <text x="72" y="262" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#5C544A">${label}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
