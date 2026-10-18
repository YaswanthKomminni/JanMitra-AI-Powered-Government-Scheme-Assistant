import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

let currentPassword = process.env.DB_PASSWORD || "";

function createDbPool(passwordToUse?: string) {
  return mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: passwordToUse !== undefined ? passwordToUse : currentPassword,
    database: process.env.DB_NAME || "JanMithra",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

let pool = createDbPool();

export function setDbPassword(newPassword: string) {
  currentPassword = newPassword;
  process.env.DB_PASSWORD = newPassword;
  pool = createDbPool(newPassword);

  // Also persist to .env.local
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const content = `# JanMithra MySQL Configuration\nDB_HOST=127.0.0.1\nDB_PORT=3306\nDB_USER=root\nDB_PASSWORD=${newPassword}\nDB_NAME=JanMithra\n`;
    fs.writeFileSync(envPath, content, "utf-8");
  } catch (e) {
    console.warn("Could not write .env.local:", e);
  }
}

/**
 * Test connectivity to MySQL JanMithra with optional candidate password
 */
export async function testConnection(candidatePassword?: string): Promise<{
  connected: boolean;
  userCount?: number;
  schemeCount?: number;
  error?: string;
}> {
  const testPool = candidatePassword !== undefined ? createDbPool(candidatePassword) : pool;
  try {
    const [userRows]: any = await testPool.query("SELECT COUNT(*) as count FROM users");
    const [schemeRows]: any = await testPool.query("SELECT COUNT(*) as count FROM schemes");
    return {
      connected: true,
      userCount: userRows[0]?.count || 0,
      schemeCount: schemeRows[0]?.count || 0,
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message,
    };
  }
}

/**
 * Execute a query against the JanMithra MySQL database.
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
