import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

/** Supabase pooler/direct TLS can fail strict Node verification on some networks. */
function supabaseSsl(): { rejectUnauthorized: boolean } | undefined {
  if (!connectionString) return undefined;
  return /supabase\.(com|co)/i.test(connectionString)
    ? { rejectUnauthorized: false }
    : undefined;
}

const pool = new pg.Pool({
  connectionString,
  ssl: supabaseSsl(),
});

export const db = drizzle(pool, { schema });
