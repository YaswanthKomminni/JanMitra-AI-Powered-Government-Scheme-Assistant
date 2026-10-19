#!/usr/bin/env node
// Usage (from frontend/):
//   npm run db:migrate   -> apply database/postgres/migrations/*.sql to DATABASE_URL
//   npm run db:setup     -> create the database first if it does not exist, then migrate
//
// Both commands are non-destructive and safe to re-run. Each migration file runs
// in its own transaction and is recorded in schema_migrations, so an applied file
// is never run twice. If an applied file is later edited, the script stops and
// tells you (add a new numbered migration instead of editing an applied one).
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { loadEnv, databaseUrl, databaseName, withDatabaseName } from "./_env.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
loadEnv(path.resolve(here, ".."));

const runSetup = process.argv.includes("--setup");
const MIGRATION_LOCK_ID = 727_001; // arbitrary app-wide advisory lock key

async function ensureDatabase(url) {
  const dbName = databaseName(url);
  const admin = new pg.Client({ connectionString: withDatabaseName(url, "postgres") });
  await admin.connect();
  try {
    const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (exists.rowCount) {
      console.log(`> Database "${dbName}" already exists`);
      return;
    }
    // Identifiers cannot be bound as parameters; quote it safely instead.
    await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    console.log(`> Created database "${dbName}"`);
  } finally {
    await admin.end();
  }
}

async function migrate(url) {
  const dir = path.join(repoRoot, "database", "postgres", "migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version    VARCHAR(64) PRIMARY KEY,
      checksum   CHAR(64)    NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    const done = new Map(
      (await client.query("SELECT version, checksum FROM schema_migrations")).rows.map((r) => [r.version, r.checksum])
    );
    for (const f of files) {
      const version = f.replace(/\.sql$/, "");
      const sql = fs.readFileSync(path.join(dir, f), "utf8");
      const checksum = crypto.createHash("sha256").update(sql).digest("hex");
      if (done.has(version)) {
        if (done.get(version) !== checksum) {
          throw new Error(`Migration ${f} was already applied but its contents have changed. Add a new migration instead.`);
        }
        console.log(`> ${f} already applied`);
        continue;
      }
      console.log(`> Applying ${f}`);
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)", [version, checksum]);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw err;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]).catch(() => undefined);
    await client.end();
  }
}

async function main() {
  const url = databaseUrl();
  if (runSetup) await ensureDatabase(url);
  await migrate(url);
  console.log("Database is up to date.");
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
