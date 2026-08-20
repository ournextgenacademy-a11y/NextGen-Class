import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const { Pool } = pg;

// Connection Pool Configuration
const connectionString = process.env.DATABASE_URL;

let dbInstance: any = null;

export function getDb() {
  if (!dbInstance) {
    if (connectionString && !connectionString.includes('localhost:5432/nextgen_class')) {
      const pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      });
      dbInstance = drizzle(pool, { schema });
    } else {
      // In development / container fallback mode without active PG instance,
      // provide mock/proxy or fallback database client
      dbInstance = null;
    }
  }
  return dbInstance;
}

export const db = getDb();
