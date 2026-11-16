import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { bacaEnv } from '../lib/env.js';

/**
 * Koneksi Neon opsional. Tanpa DATABASE_URL, aplikasi memakai seed lokal
 * (`src/db/seed-data.js`) supaya bisa dijalankan & diuji tanpa kredensial.
 */
export const databaseUrl = bacaEnv('DATABASE_URL');

export const adaDatabase = /^postgres(ql)?:\/\//.test(databaseUrl);

export const db = adaDatabase ? drizzle(neon(databaseUrl)) : null;