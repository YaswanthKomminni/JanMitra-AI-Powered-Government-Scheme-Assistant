#!/usr/bin/env node
// Administrator tool: set (or reset) the password of an existing account.
//
//   npm run user:set-password -- 9876543210
//
// Use it for farmer records created before real authentication existed: the
// data transfer clears their old plaintext "1234" password, so they cannot sign in
// until a password is set here. The password is read from the terminal without
// echo (or from stdin when piped) and stored only as a bcrypt hash. All existing
// sessions of that user are signed out.
import readline from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import bcrypt from "bcryptjs";
import { loadEnv, databaseUrl } from "./_env.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv(path.resolve(here, ".."));

function normalizePhone(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

function ask(question, hidden) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
    if (hidden && process.stdin.isTTY) {
      rl._writeToOutput = (s) => {
        if (s.includes(question)) rl.output.write(s);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden && process.stdin.isTTY) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function readPiped() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8").split(/\r?\n/);
}

async function main() {
  const phone = normalizePhone(process.argv[2]);
  if (!phone) {
    console.error("Usage: npm run user:set-password -- <10-digit mobile number>");
    process.exit(1);
  }

  let pw1, pw2;
  if (process.stdin.isTTY) {
    pw1 = await ask("New password (min 8 characters): ", true);
    pw2 = await ask("Repeat password: ", true);
  } else {
    [pw1 = "", pw2 = ""] = await readPiped();
  }
  if (pw1.length < 8 || pw1.length > 72) {
    console.error("Password must be 8-72 characters.");
    process.exit(1);
  }
  if (pw1 !== pw2) {
    console.error("Passwords do not match.");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: databaseUrl() });
  await client.connect();
  try {
    const found = await client.query("SELECT id, name FROM users WHERE phone = $1 LIMIT 1", [phone]);
    if (!found.rows.length) {
      console.error(`No account found for ${phone}.`);
      process.exitCode = 1;
      return;
    }
    const user = found.rows[0];
    const hash = await bcrypt.hash(pw1, 12);
    await client.query("BEGIN");
    await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, user.id]);
    await client.query("DELETE FROM user_sessions WHERE user_id = $1", [user.id]);
    await client.query("COMMIT");
    console.log(`Password updated for ${user.name} (${phone}). Existing sessions were signed out.`);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
