import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL must be set in .env file');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

export const db = drizzle(pool, { schema });

// Volitelně: test připojení při startu
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Připojení k PostgreSQL bylo úspěšné');
  } catch (error) {
    console.error('❌ Chyba při připojování k databázi:', error);
    process.exit(1);
  }
})();