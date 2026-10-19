#!/usr/bin/env node
// One-off, READ-ONLY-on-MySQL data transfer: copies users, sessions,
// conversations, messages, schemes, document verifications and peer stories
// from an existing JanMithra MySQL database into PostgreSQL.
//
// The app itself no longer depends on MySQL. This script needs the mysql2
// driver only while you run it, so install it without touching package.json:
//
//   npm install --no-save mysql2
//
// Steps (from frontend/):
//   1. npm run db:setup                         # create the PostgreSQL schema first
//   2. set MYSQL_URL (see below) and DATABASE_URL (frontend/.env.local or shell)
//   3. node scripts/migrate-mysql-data.mjs      # DRY RUN: does everything, then rolls back
//   4. node scripts/migrate-mysql-data.mjs --execute
//
//   MYSQL_URL=mysql://readonly_user:password@127.0.0.1:3306/JanMithra
//
// Safety
//   * MySQL is only ever read (SELECT). Nothing is deleted or altered there.
//   * Everything is written to PostgreSQL in ONE transaction: all or nothing.
//   * It refuses to run if PostgreSQL already has users, conversations or
//     messages, so it can never overwrite or duplicate live data.
//   * Ids are preserved, so every relationship (user -> conversation ->
//     message) stays intact. Identity sequences are advanced afterwards.
//   * Passwords that are not bcrypt hashes (the old demo accounts stored
//     plaintext "1234") are NOT copied; those users keep their account but must
//     get a password via `npm run user:set-password -- <mobile>`.
//   * Sessions that already expired are not copied. Live ones are, so users stay
//     signed in.
//   * Messages that cannot be attributed to a user (user_id NULL) are skipped and
//     counted. Messages from before conversations existed are grouped into one
//     "Earlier messages (imported)" conversation per user.
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { loadEnv, databaseUrl } from "./_env.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv(path.resolve(here, ".."));

const EXECUTE = process.argv.includes("--execute");
const BCRYPT_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const report = {
  users: { source: 0, copied: 0, passwordsCleared: 0, emailsDropped: 0 },
  user_sessions: { source: 0, copied: 0, skippedExpired: 0 },
  conversations: { source: 0, copied: 0, skipped: 0 },
  chat_logs: { source: 0, copied: 0, skippedNoUser: 0, skippedMismatch: 0, groupedIntoImported: 0 },
  schemes: { source: 0, copied: 0 },
  document_verifications: { source: 0, copied: 0, skipped: 0 },
  peer_success_stories: { source: 0, copied: 0 },
};

async function loadMysql() {
  let mod;
  try {
    mod = await import("mysql2/promise");
  } catch {
    throw new Error("The mysql2 package is needed for this one-off transfer. Run: npm install --no-save mysql2");
  }
  const url = process.env.MYSQL_URL;
  if (!url) throw new Error("MYSQL_URL is not set (e.g. mysql://user:password@127.0.0.1:3306/JanMithra).");
  const conn = await (mod.default ?? mod).createConnection({ uri: url, timezone: "Z", charset: "utf8mb4" });
  await conn.query("SET time_zone = '+00:00'");
  await conn.query("SET SESSION TRANSACTION READ ONLY");
  return conn;
}

const asJson = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    try {
      return JSON.stringify(JSON.parse(v));
    } catch {
      return null;
    }
  }
  return JSON.stringify(v);
};

async function select(my, table) {
  const [rows] = await my.query(`SELECT * FROM \`${table}\``);
  return rows;
}

async function tableExists(my, table) {
  const [rows] = await my.query(
    "SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
    [table]
  );
  return Number(rows[0].n) > 0;
}

async function resetIdentity(pgc, table, column) {
  await pgc.query(
    `SELECT setval(pg_get_serial_sequence($1, $2), GREATEST((SELECT COALESCE(MAX(${column}), 0) FROM ${table}), 1), (SELECT COUNT(*) > 0 FROM ${table}))`,
    [table, column]
  );
}

async function main() {
  const my = await loadMysql();
  const pgc = new pg.Client({ connectionString: databaseUrl() });
  await pgc.connect();

  try {
    // ---- Preconditions -------------------------------------------------
    for (const t of ["users", "conversations", "chat_logs", "user_sessions", "schemes", "document_verifications", "peer_success_stories"]) {
      const r = await pgc.query("SELECT to_regclass($1) AS t", [t]);
      if (!r.rows[0].t) throw new Error(`PostgreSQL table "${t}" is missing. Run "npm run db:setup" first.`);
    }
    for (const t of ["users", "conversations", "chat_logs"]) {
      const r = await pgc.query(`SELECT COUNT(*)::int AS n FROM ${t}`);
      if (r.rows[0].n > 0) {
        throw new Error(
          `PostgreSQL table "${t}" already contains ${r.rows[0].n} row(s). This transfer only runs into empty user/chat tables so it cannot duplicate or overwrite data.`
        );
      }
    }

    await pgc.query("BEGIN");

    // ---- users ---------------------------------------------------------
    const users = await select(my, "users");
    report.users.source = users.length;
    const seenEmails = new Set();
    const userIds = new Set();
    for (const u of users) {
      let email = u.email ? String(u.email).trim().toLowerCase() : null;
      if (email === "") email = null;
      if (email && seenEmails.has(email)) {
        email = null; // legacy duplicate; keep the first owner only
        report.users.emailsDropped++;
      }
      if (email) seenEmails.add(email);
      let hash = u.password_hash ?? null;
      if (hash !== null && !BCRYPT_RE.test(hash)) {
        hash = null;
        report.users.passwordsCleared++;
      }
      await pgc.query(
        `INSERT INTO users (id, name, phone, email, password_hash, role, state, district, village,
                            land_size_acres, soil_type, irrigation_type, primary_crops, annual_income_slab,
                            preferred_language, verified_docs_count, avatar_url, last_login_at, created_at, updated_at)
         OVERRIDING SYSTEM VALUE
         VALUES ($1,$2,$3,$4,$5,COALESCE($6,'farmer'),$7,$8,$9,$10,$11,$12,$13,$14,$15,COALESCE($16,0),$17,$18,COALESCE($19,now()),COALESCE($20,now()))`,
        [
          u.id, u.name, u.phone, email, hash, u.role, u.state, u.district, u.village,
          u.land_size_acres, u.soil_type, u.irrigation_type, u.primary_crops, u.annual_income_slab,
          u.preferred_language, u.verified_docs_count, u.avatar_url, u.last_login_at ?? null, u.created_at, u.updated_at,
        ]
      );
      userIds.add(Number(u.id));
      report.users.copied++;
    }

    // ---- user_sessions (only unexpired) ---------------------------------
    if (await tableExists(my, "user_sessions")) {
      const sessions = await select(my, "user_sessions");
      report.user_sessions.source = sessions.length;
      const now = Date.now();
      for (const s of sessions) {
        if (!userIds.has(Number(s.user_id)) || new Date(s.expires_at).getTime() <= now || !/^[0-9a-f]{64}$/.test(String(s.token_hash))) {
          report.user_sessions.skippedExpired++;
          continue;
        }
        await pgc.query(
          `INSERT INTO user_sessions (id, user_id, token_hash, user_agent, created_at, last_seen_at, expires_at)
           OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [s.id, s.user_id, s.token_hash, s.user_agent, s.created_at, s.last_seen_at, s.expires_at]
        );
        report.user_sessions.copied++;
      }
    }

    // ---- conversations --------------------------------------------------
    const convOwner = new Map(); // conversation id -> user id
    if (await tableExists(my, "conversations")) {
      const convs = await select(my, "conversations");
      report.conversations.source = convs.length;
      for (const c of convs) {
        if (!userIds.has(Number(c.user_id)) || !UUID_RE.test(String(c.id))) {
          report.conversations.skipped++;
          continue;
        }
        await pgc.query(
          `INSERT INTO conversations (id, user_id, title, language, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6)`,
          [c.id, c.user_id, c.title || "New conversation", c.language, c.created_at, c.updated_at]
        );
        convOwner.set(String(c.id).toLowerCase(), Number(c.user_id));
        report.conversations.copied++;
      }
    }

    // ---- chat_logs (messages) -------------------------------------------
    const logs = await select(my, "chat_logs");
    report.chat_logs.source = logs.length;
    const importedConv = new Map(); // user id -> conversation id for pre-conversation messages
    for (const m of logs) {
      const uid = m.user_id == null ? null : Number(m.user_id);
      if (uid === null || !userIds.has(uid)) {
        report.chat_logs.skippedNoUser++;
        continue;
      }
      let convId = m.conversation_id ? String(m.conversation_id).toLowerCase() : null;
      if (convId) {
        if (convOwner.get(convId) !== uid) {
          report.chat_logs.skippedMismatch++; // unknown conversation, or owned by someone else
          continue;
        }
      } else {
        if (!importedConv.has(uid)) {
          const id = crypto.randomUUID();
          await pgc.query(
            `INSERT INTO conversations (id, user_id, title, language, created_at, updated_at) VALUES ($1,$2,'Earlier messages (imported)','en',$3,$3)`,
            [id, uid, m.created_at]
          );
          importedConv.set(uid, id);
        }
        convId = importedConv.get(uid);
        report.chat_logs.groupedIntoImported++;
      }
      await pgc.query(
        `INSERT INTO chat_logs (id, user_id, conversation_id, client_message_id, sender, message_text, language, metadata, created_at)
         OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)`,
        [m.id, uid, convId, m.client_message_id ?? null, m.sender, m.message_text, m.language, asJson(m.metadata), m.created_at]
      );
      report.chat_logs.copied++;
    }
    // Keep each conversation's updated_at at least as new as its newest message.
    await pgc.query(
      `UPDATE conversations c SET updated_at = GREATEST(c.updated_at, m.last_at)
         FROM (SELECT conversation_id, MAX(created_at) AS last_at FROM chat_logs GROUP BY conversation_id) m
        WHERE m.conversation_id = c.id`
    );

    // ---- schemes / peers (leave rows already seeded by migration 002) -----
    const schemes = await select(my, "schemes");
    report.schemes.source = schemes.length;
    for (const s of schemes) {
      const r = await pgc.query(
        `INSERT INTO schemes (id, code, name, category, category_name, match_score, subsidy_amount, description, benefits,
                              eligibility_summary, documents_required, department, tag_color, application_mode, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15) ON CONFLICT (id) DO NOTHING`,
        [s.id, s.code, s.name, s.category, s.category_name, s.match_score, s.subsidy_amount, s.description, s.benefits,
         s.eligibility_summary, asJson(s.documents_required) ?? "[]", s.department, s.tag_color, s.application_mode, s.created_at]
      );
      report.schemes.copied += r.rowCount;
    }
    const peers = await select(my, "peer_success_stories");
    report.peer_success_stories.source = peers.length;
    for (const p of peers) {
      const r = await pgc.query(
        `INSERT INTO peer_success_stories (id, farmer_name, distance_km, village, land_type, crops_grown, scheme_id, scheme_name,
                                          outcome_summary, yield_increase_pct, subsidy_received, implementation_date,
                                          contact_allowed, contact_phone, avatar_url, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ON CONFLICT (id) DO NOTHING`,
        [p.id, p.farmer_name, p.distance_km, p.village, p.land_type, p.crops_grown, p.scheme_id, p.scheme_name,
         p.outcome_summary, p.yield_increase_pct, p.subsidy_received, p.implementation_date, Boolean(p.contact_allowed),
         p.contact_phone, p.avatar_url, p.created_at]
      );
      report.peer_success_stories.copied += r.rowCount;
    }

    // ---- document_verifications -------------------------------------------
    const docs = await select(my, "document_verifications");
    report.document_verifications.source = docs.length;
    for (const d of docs) {
      if (!userIds.has(Number(d.user_id))) {
        report.document_verifications.skipped++;
        continue;
      }
      await pgc.query(
        `INSERT INTO document_verifications (id, user_id, doc_type, title, confidence_score, extracted_data, preview_url, status, verified_at)
         OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9)
         ON CONFLICT (id) DO NOTHING`,
        [d.id, d.user_id, d.doc_type, d.title, d.confidence_score, asJson(d.extracted_data) ?? "{}", d.preview_url, d.status, d.verified_at]
      );
      report.document_verifications.copied++;
    }

    // ---- sequences ---------------------------------------------------------
    await resetIdentity(pgc, "users", "id");
    await resetIdentity(pgc, "user_sessions", "id");
    await resetIdentity(pgc, "chat_logs", "id");
    await resetIdentity(pgc, "document_verifications", "id");

    // ---- verification: counts in PostgreSQL must match what was copied ---------
    for (const [table, key] of [["users", "users"], ["user_sessions", "user_sessions"], ["conversations", "conversations"], ["chat_logs", "chat_logs"], ["document_verifications", "document_verifications"]]) {
      const r = await pgc.query(`SELECT COUNT(*)::int AS n FROM ${table}`);
      if (r.rows[0].n < report[key].copied) throw new Error(`Verification failed for ${table}: expected at least ${report[key].copied}, found ${r.rows[0].n}.`);
    }

    if (EXECUTE) {
      await pgc.query("COMMIT");
      console.log("COMMITTED. Data was copied to PostgreSQL.\n");
    } else {
      await pgc.query("ROLLBACK");
      console.log("DRY RUN: everything above succeeded and was rolled back. Nothing was written.\nRe-run with --execute to apply.\n");
    }
    console.table(report);
    if (report.users.passwordsCleared) {
      console.log(`${report.users.passwordsCleared} user(s) had a non-bcrypt password. They keep their account; set one with: npm run user:set-password -- <mobile>`);
    }
    if (report.chat_logs.skippedNoUser || report.chat_logs.skippedMismatch) {
      console.log("Some messages could not be attributed to a user/conversation and were skipped (see the table above). The MySQL data was not touched.");
    }
  } catch (err) {
    await pgc.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    await pgc.end();
    await my.end();
  }
}

main().catch((err) => {
  console.error("Transfer failed (nothing was written):", err.message);
  process.exit(1);
});
