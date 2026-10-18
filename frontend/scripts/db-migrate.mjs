#!/usr/bin/env node
// Usage (from frontend/):
//   npm run db:migrate          -> apply database/migrations/*.sql to DB_NAME
//   npm run db:setup            -> run ../JanMithra_setup.sql, then the migrations
//
// Both commands are non-destructive and safe to re-run. Credentials come from
// frontend/.env.local (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { loadEnv, dbConfig } from "./_env.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
loadEnv(path.resolve(here, ".."));

const runSetup = process.argv.includes("--setup");

async function runFile(conn, file) {
  const sql = fs.readFileSync(file, "utf8");
  const [results] = await conn.query(sql);
  // Surface any warning rows the migration selects.
  const sets = Array.isArray(results) ? results : [results];
  for (const r of sets) {
    if (Array.isArray(r)) {
      for (const row of r) {
        if (row && (row.migration_warning || row.status)) console.log("   ", row);
      }
    }
  }
}

async function main() {
  if (runSetup) {
    const setupFile = path.join(repoRoot, "JanMithra_setup.sql");
    const conn = await mysql.createConnection(dbConfig({ withDatabase: false }));
    console.log(`> Running ${path.relative(repoRoot, setupFile)}`);
    await runFile(conn, setupFile);
    await conn.end();
  }

  const migrationsDir = path.join(repoRoot, "database", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const conn = await mysql.createConnection(dbConfig());
  for (const f of files) {
    console.log(`> Applying ${f}`);
    await runFile(conn, path.join(migrationsDir, f));
  }
  await conn.end();
  console.log("Database is up to date.");
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
