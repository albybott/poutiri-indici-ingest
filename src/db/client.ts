import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { logger: false });
