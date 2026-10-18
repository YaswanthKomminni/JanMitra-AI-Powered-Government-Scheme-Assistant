import mysql from "mysql2/promise";

/**
 * MySQL connection pool for JanMithra.
 *
 * Credentials come ONLY from environment variables (frontend/.env.local in
 * development). The old browser-facing "enter MySQL root password" flow, which
 * let any visitor rewrite .env.local, has been removed on purpose.
 */
function createDbPool() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "JanMithra",
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE) || 10,
    queueLimit: 0,
    charset: "utf8mb4",
    timezone: "Z",
    connectTimeout: 8000,
  });
  // Keep TIMESTAMP values in UTC so the API always returns correct ISO times.
  pool.on("connection", (conn) => {
    conn.query("SET time_zone = '+00:00'");
  });
  return pool;
}

// Reuse one pool across Next.js hot reloads in development.
const globalForDb = globalThis as unknown as { __janmitraPool?: mysql.Pool };
const pool: mysql.Pool = globalForDb.__janmitraPool ?? createDbPool();
if (process.env.NODE_ENV !== "production") globalForDb.__janmitraPool = pool;

export class DatabaseError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

/**
 * Run a placeholder-parameterized query and THROW on failure.
 * Use this anywhere a silent failure would be wrong (auth, chat history).
 */
export async function dbQuery<T = any>(sql: string, params: any[] = []): Promise<T> {
  try {
    const [rows] = await pool.query(sql, params);
    return rows as T;
  } catch (err: any) {
    throw new DatabaseError(err?.message || "Database error", err?.code);
  }
}

/** Run several statements atomically on one connection. */
export async function withTransaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  let conn: mysql.PoolConnection;
  try {
    conn = await pool.getConnection();
  } catch (err: any) {
    throw new DatabaseError(err?.message || "Database unavailable", err?.code);
  }
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err: any) {
    try {
      await conn.rollback();
    } catch {
      /* ignore rollback errors */
    }
    if (err instanceof DatabaseError) throw err;
    if (err?.code && typeof err.code === "string" && err.sqlMessage !== undefined) {
      throw new DatabaseError(err.message, err.code);
    }
    throw err;
  } finally {
    conn.release();
  }
}

/** Lightweight health check. Never returns credentials or row counts. */
export async function testConnection(): Promise<{ connected: boolean }> {
  try {
    await pool.query("SELECT 1");
    return { connected: true };
  } catch {
    return { connected: false };
  }
}

/**
 * Legacy helper kept for read-only public endpoints (schemes, peers) that fall
 * back to bundled data when MySQL is unavailable.
 */
export async function queryDatabase<T = any>(
  sql: string,
  params: any[] = []
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const [rows] = await pool.query(sql, params);
    return { success: true, data: rows as T };
  } catch (err: any) {
    console.warn(`[MySQL JanMithra Notice]: ${err.message}`);
    return { success: false, error: err.message };
  }
}

export default pool;
