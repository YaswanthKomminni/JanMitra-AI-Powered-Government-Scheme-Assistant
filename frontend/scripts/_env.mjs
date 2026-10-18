// Minimal .env loader for the standalone database scripts.
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

export function dbConfig({ withDatabase = true } = {}) {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    ...(withDatabase ? { database: process.env.DB_NAME || "JanMithra" } : {}),
    multipleStatements: true,
    charset: "utf8mb4",
  };
}
