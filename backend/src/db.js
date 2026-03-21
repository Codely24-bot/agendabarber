import pg from "pg";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getDatabaseUrl } from "./config.js";

dotenv.config();

const { Pool } = pg;
const connectionString = getDatabaseUrl();
const requireSsl =
  process.env.DATABASE_SSL === "true" ||
  process.env.DATABASE_REQUIRE_SSL === "true" ||
  connectionString?.includes("supabase.co");

export const pool = new Pool({
  connectionString,
  max: Number(process.env.DATABASE_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS || 30000),
  connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS || 15000),
  ssl: requireSsl
    ? {
        rejectUnauthorized: false
      }
    : false
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, "./sql/schema.sql");
let initialized = false;
let databaseReady = false;
let lastDatabaseError = null;

export async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export function getDatabaseStatus() {
  return {
    ready: databaseReady,
    initialized,
    hasConnectionString: Boolean(connectionString),
    ssl: Boolean(requireSsl),
    error: lastDatabaseError
  };
}

export async function initializeDatabase() {
  if (initialized) {
    return getDatabaseStatus();
  }

  if (!connectionString) {
    lastDatabaseError = "DATABASE_URL nao configurada";
    throw new Error(lastDatabaseError);
  }

  const sql = await fs.readFile(schemaPath, "utf8");

  try {
    await pool.query("SELECT 1");
    await pool.query(sql);
    initialized = true;
    databaseReady = true;
    lastDatabaseError = null;
    return getDatabaseStatus();
  } catch (error) {
    databaseReady = false;
    lastDatabaseError = error.message;
    throw error;
  }
}

export async function checkDatabaseConnection() {
  try {
    await pool.query("SELECT 1");
    databaseReady = true;
    lastDatabaseError = null;
  } catch (error) {
    databaseReady = false;
    lastDatabaseError = error.message;
    throw error;
  }

  return getDatabaseStatus();
}
