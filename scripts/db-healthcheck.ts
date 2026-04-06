/**
 * pgvector DB health check.
 * Runs before `next dev` to surface connection or extension issues early.
 */

import { config } from "dotenv";
import { resolve } from "path";
import { Client } from "pg";

// Load .env.local first (Next.js convention), fallback to .env
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });
config({ path: resolve(process.cwd(), ".env"), quiet: true });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error(
    "[db-health] ✖  DATABASE_URL is not set. Check your .env.local file.",
  );
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });

async function run() {
  try {
    await client.connect();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[db-health] ✖  Cannot connect to database: ${message}`);
    process.exit(1);
  }

  try {
    // Basic connectivity check
    await client.query("SELECT 1");

    // pgvector extension check
    const { rows } = await client.query<{ extname: string }>(
      "SELECT extname FROM pg_extension WHERE extname = 'vector'",
    );

    if (rows.length === 0) {
      console.error(
        "[db-health] ✖  pgvector extension is not installed. Run: CREATE EXTENSION IF NOT EXISTS vector;",
      );
      process.exit(1);
    }

    console.log(
      "[db-health] ✔  Database reachable. pgvector extension present.",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[db-health] ✖  Health check query failed: ${message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
