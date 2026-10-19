import "server-only";
import { Pool, type PoolClient } from "pg";

/**
 * PostgreSQL connection pool for JanMithra.
 *
 * The connection string comes ONLY from the server-side DATABASE_URL
 * environment variable (frontend/.env.local in development). It is never sent
 * to the browser and never hardcoded. The pool is created lazily, so a missing
 * or wrong DATABASE_URL surfaces as a DatabaseError on the first query (the
 * routes turn that into a 503) instead of crashing at import / build time.
 */

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly constraint?: string
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

/** SQLSTATE codes the app reacts to. */
export const PG_UNIQUE_VIOLATION = "23505";

/** True when `err` is a unique-constraint violation (optionally on a specific constraint). */
export function isUniqueViolation(err: unknown, constraint?: string): boolean {
  const e = err as { code?: string; constraint?: string } | null;
  return e?.code === PG_UNIQUE_VIOLATION && (!constraint || e.constraint === constraint);
}

function toDatabaseError(err: any): DatabaseError {
  if (err instanceof DatabaseError) return err;
  return new DatabaseError(err?.message || "Database error", err?.code, err?.constraint);
}

function createDbPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new DatabaseError("DATABASE_URL is not set. Copy .env.example to .env.local and set it.", "NO_DATABASE_URL");
  }
  const pool = new Pool({
    connectionString,
    max: Number(process.env.DB_POOL_SIZE) || 10,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 30_000,
  });
  // An idle client can error (e.g. the server restarts). Without a listener,
  // Node would treat it as an unhandled 'error' event and crash the process.
  pool.on("error", (err) => {
    console.warn("[PostgreSQL JanMithra Notice]: idle client error:", err.message);
  });
  return pool;
}

// Reuse one pool across Next.js hot reloads in development.
const globalForDb = globalThis as unknown as { __janmitraPool?: Pool };

function getPool(): Pool {
  if (!globalForDb.__janmitraPool) globalForDb.__janmitraPool = createDbPool();
  return globalForDb.__janmitraPool;
}

/**
 * Run a parameterized query ($1, $2, ...) and return the rows. THROWS a
 * DatabaseError on failure. Use this anywhere a silent failure would be wrong
 * (auth, chat history).
 */
export async function dbQuery<T = any>(sql: string, params: any[] = []): Promise<T> {
  try {
    const result = await getPool().query(sql, params);
    return result.rows as unknown as T;
  } catch (err) {
    throw toDatabaseError(err);
  }
}

/** Like dbQuery, but also returns how many rows the statement affected (DELETE/UPDATE). */
export async function dbExec<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
  try {
    const result = await getPool().query(sql, params);
    return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
  } catch (err) {
    throw toDatabaseError(err);
  }
}

/** Run several statements atomically on one connection (BEGIN / COMMIT / ROLLBACK). */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  let client: PoolClient;
  try {
    client = await getPool().connect();
  } catch (err) {
    throw toDatabaseError(err);
  }
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err: any) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore rollback errors */
    }
    // Errors raised by the database keep their SQLSTATE code; anything else is the caller's own.
    if (err instanceof DatabaseError || typeof err?.code !== "string" || typeof err?.severity !== "string") throw err;
    throw toDatabaseError(err);
  } finally {
    client.release();
  }
}

/** Lightweight health check. Never returns credentials or row counts. */
export async function testConnection(): Promise<{ connected: boolean }> {
  try {
    await getPool().query("SELECT 1");
    return { connected: true };
  } catch {
    return { connected: false };
  }
}

/**
 * Helper for read-only public endpoints (schemes, peers) that fall back to
 * bundled data when PostgreSQL is unavailable.
 */
export async function queryDatabase<T = any>(
  sql: string,
  params: any[] = []
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const result = await getPool().query(sql, params);
    return { success: true, data: result.rows as unknown as T };
  } catch (err: any) {
    console.warn(`[PostgreSQL JanMithra Notice]: ${err.message}`);
    return { success: false, error: err.message };
  }
}
