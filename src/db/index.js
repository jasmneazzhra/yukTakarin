import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { bacaEnv } from '../lib/env.js';

export const databaseUrl = bacaEnv('DATABASE_URL');
export const adaDatabase = /^postgres(ql)?:\/\//.test(databaseUrl);
export const db = adaDatabase ? drizzle(neon(databaseUrl)) : null;