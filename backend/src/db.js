import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
const requireSsl =
  process.env.DATABASE_SSL === "true" ||
  process.env.DATABASE_REQUIRE_SSL === "true" ||
  connectionString?.includes("supabase.co");

export const pool = new Pool({
  connectionString,
  ssl: requireSsl
    ? {
        rejectUnauthorized: false
      }
    : false
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
