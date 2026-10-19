// Minimal .env loader + connection helper for the standalone database scripts.
// Next.js loads .env.local for the app itself; these scripts run outside Next,
// so they read the same files here. Existing process.env values win.
import fs from "node:fs";
import path from "node:path";

export function loadEnv(cwd = process.cwd()) {
  for (const file of [".env.local", ".env"]) {
    const full = path.join(cwd, file);
    if (!fs.existsSync(full)) continue;
    for (const raw of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

/** The PostgreSQL connection string, from DATABASE_URL (never hardcoded). */
export function databaseUrl(envName = "DATABASE_URL") {
  const url = process.env[envName];
  if (!url) {
    throw new Error(`${envName} is not set. Copy .env.example to .env.local and fill it in.`);
  }
  return url;
}

/** Same URL, pointed at another database on the same server (e.g. "postgres"). */
export function withDatabaseName(url, dbName) {
  const u = new URL(url);
  u.pathname = "/" + encodeURIComponent(dbName);
  return u.toString();
}

/** Database name from a connection string. */
export function databaseName(url) {
  return decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
}
