/**
 * Baca variabel lingkungan dari server (process.env) atau Vite (import.meta.env).
 * Tidak ada nilai rahasia yang ditulis di kode.
 */
export function bacaEnv(kunci) {
  const dariProses = typeof process !== 'undefined' ? process.env?.[kunci] : undefined;
  if (dariProses) return dariProses;
  const dariVite = typeof import.meta !== 'undefined' ? import.meta.env?.[kunci] : undefined;
  return dariVite || '';
}
