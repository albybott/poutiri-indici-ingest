import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  max: 10,
  ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { logger: false });
