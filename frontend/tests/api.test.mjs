// End-to-end API tests for authentication, chat persistence and isolation.
//
//   1. Start the app:      npm run build && npm start      (or npm run dev)
//   2. In another shell:   npm run test:api
//
// Uses BASE_URL (default http://localhost:3000) and the DB_* variables from
// .env.local to inspect MySQL directly. It creates test users with phone numbers
// 7xxxxxxxxx and removes them (and their data) at the end.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { loadEnv, dbConfig } from "../scripts/_env.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv(path.resolve(here, ".."));
const BASE = process.env.BASE_URL || "http://localhost:3000";
const RUN = Date.now().toString().slice(-6);
const phoneFor = (n) => `7${RUN}${String(n).padStart(3, "0")}`; // 10 digits, starts with 7
const PASSWORD = "Kisan2024ok";

let db;
const createdPhones = new Set();

class Client {
  constructor() {
    this.cookie = null;
  }
  async req(method, url, body, headers = {}) {
    const res = await fetch(BASE + url, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(this.cookie ? { Cookie: this.cookie } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      redirect: "manual",
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie && setCookie.startsWith("janmitra_session=")) {
      const value = setCookie.split(";")[0];
      this.cookie = value === "janmitra_session=" ? null : value;
      this.lastSetCookie = setCookie;
    }
    let data = null;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data, headers: res.headers };
  }
  get(u, h) { return this.req("GET", u, undefined, h); }
  post(u, b, h) { return this.req("POST", u, b ?? {}, h); }
  del(u, h) { return this.req("DELETE", u, undefined, h); }
}

const cmid = () => "t_" + crypto.randomBytes(9).toString("hex");

async function signup(client, n, extra = {}) {
  const phone = phoneFor(n);
  createdPhones.add(phone);
  return client.post("/api/auth/signup", {
    name: `Test Farmer ${n}`,
    phone,
    password: PASSWORD,
    confirmPassword: PASSWORD,
    ...extra,
  });
}

before(async () => {
  db = await mysql.createConnection(dbConfig());
});

after(async () => {
  if (createdPhones.size) {
    await db.query("DELETE FROM users WHERE phone IN (?)", [[...createdPhones]]);
  }
  await db.end();
});

/* ------------------------------------------------------------------ */

test("protected endpoints reject unauthenticated requests", async () => {
  const anon = new Client();
  const uuid = crypto.randomUUID();
  const checks = [
    await anon.post("/api/chat", { text: "hello", clientMessageId: cmid() }),
    await anon.get("/api/conversations"),
    await anon.get(`/api/conversations/${uuid}`),
    await anon.del(`/api/conversations/${uuid}`),
    await anon.post("/api/ocr/analyze", { fileBase64: "data:text/plain;base64,aGVsbG8=" }),
    await anon.post("/api/verify-doc", { userId: 1, title: "x" }),
    await anon.get("/api/tts?text=hello&lang=en"),
    await anon.get("/api/auth/me"),
  ];
  for (const r of checks) assert.equal(r.status, 401, JSON.stringify(r.data));
  assert.equal(checks[0].data.code, "AUTH_REQUIRED");

  // A forged / random cookie is not accepted either.
  const forged = new Client();
  forged.cookie = "janmitra_session=" + crypto.randomBytes(32).toString("base64url");
  assert.equal((await forged.post("/api/chat", { text: "hi", clientMessageId: cmid() })).status, 401);
});

test("public pages and data stay available without signing in", async () => {
  const anon = new Client();
  const home = await fetch(BASE + "/");
  assert.equal(home.status, 200);
  const schemes = await anon.get("/api/schemes");
  assert.equal(schemes.status, 200);
  assert.ok(schemes.data.schemes.length >= 5);
  const status = await anon.get("/api/db-status");
  assert.deepEqual(Object.keys(status.data), ["connected"], "db-status must not leak config");
  const post = await anon.post("/api/db-status", { password: "x" });
  assert.equal(post.status, 405, "DB password endpoint must be gone");
});

test("sign-up validates required fields", async () => {
  const c = new Client();
  const base = { name: "Valid Name", phone: phoneFor(900), password: PASSWORD, confirmPassword: PASSWORD };
  const cases = [
    [{ ...base, name: "" }, "name"],
    [{ ...base, phone: "12345" }, "phone"],
    [{ ...base, phone: "5123456789" }, "phone"],
    [{ ...base, email: "not-an-email" }, "email"],
    [{ ...base, password: "short1", confirmPassword: "short1" }, "password"],
    [{ ...base, password: "onlyletters", confirmPassword: "onlyletters" }, "password"],
    [{ ...base, confirmPassword: "Different123" }, "confirmPassword"],
    [{ ...base, landSizeAcres: "-3" }, "landSizeAcres"],
    [{ ...base, soilType: "lava" }, "soilType"],
  ];
  for (const [body, field] of cases) {
    const r = await c.post("/api/auth/signup", body);
    assert.equal(r.status, 400, `${field}: ${JSON.stringify(r.data)}`);
    assert.equal(r.data.field, field);
  }
  const [rows] = await db.query("SELECT COUNT(*) n FROM users WHERE phone = ?", [phoneFor(900)]);
  assert.equal(rows[0].n, 0, "invalid sign-ups must not create users");
});

test("sign-up creates a hashed account, signs in, and rejects duplicates", async () => {
  const a = new Client();
  const email = `farmer${RUN}@Example.com`;
  const r = await signup(a, 1, {
    email,
    state: "Andhra Pradesh",
    village: "Tenali",
    landSizeAcres: "2.5",
    soilType: "red_soil",
    primaryCrops: "Paddy, Cotton",
    preferredLanguage: "te",
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  assert.equal(r.data.user.name, "Test Farmer 1");
  assert.equal(r.data.user.email, email.toLowerCase());
  assert.deepEqual(r.data.user.primaryCrops, ["Paddy", "Cotton"]);
  assert.ok(!JSON.stringify(r.data).match(/password|hash/i), "no password data in response");

  const sc = a.lastSetCookie.toLowerCase();
  assert.ok(sc.includes("httponly"), "cookie must be HttpOnly");
  assert.ok(sc.includes("samesite=lax"), "cookie must be SameSite=Lax");
  assert.ok(sc.includes("path=/"));

  const [rows] = await db.query("SELECT password_hash, email FROM users WHERE phone = ?", [phoneFor(1)]);
  assert.match(rows[0].password_hash, /^\$2[aby]\$12\$/, "bcrypt cost 12");
  assert.notEqual(rows[0].password_hash, PASSWORD);

  const me = await a.get("/api/auth/me");
  assert.equal(me.status, 200);
  assert.equal(me.data.user.phone, phoneFor(1));

  const dupPhone = await new Client().post("/api/auth/signup", {
    name: "Someone Else", phone: phoneFor(1), password: PASSWORD, confirmPassword: PASSWORD,
  });
  assert.equal(dupPhone.status, 409);
  assert.equal(dupPhone.data.field, "phone");

  createdPhones.add(phoneFor(2));
  const dupEmail = await new Client().post("/api/auth/signup", {
    name: "Someone Else", phone: phoneFor(2), email: email.toUpperCase(), password: PASSWORD, confirmPassword: PASSWORD,
  });
  assert.equal(dupEmail.status, 409);
  assert.equal(dupEmail.data.field, "email");
});

test("login accepts correct credentials and rejects wrong ones", async () => {
  const c = new Client();
  const wrong = await c.post("/api/auth/login", { phone: phoneFor(1), password: "WrongPass99" });
  assert.equal(wrong.status, 401);
  const unknown = await c.post("/api/auth/login", { phone: phoneFor(999), password: PASSWORD });
  assert.equal(unknown.status, 401);
  assert.equal(wrong.data.message, unknown.data.message, "same message for unknown user and wrong password");
  assert.equal(c.cookie, null);

  const missing = await c.post("/api/auth/login", { phone: phoneFor(1) });
  assert.equal(missing.status, 400);

  const ok = await c.post("/api/auth/login", { phone: "+91 " + phoneFor(1), password: PASSWORD });
  assert.equal(ok.status, 200, JSON.stringify(ok.data));
  assert.ok(c.cookie);
  assert.equal((await c.get("/api/auth/me")).data.user.phone, phoneFor(1));
});

test("legacy accounts without a real password cannot sign in", async () => {
  const phone = phoneFor(50);
  createdPhones.add(phone);
  await db.query("INSERT INTO users (name, phone, password_hash) VALUES ('Legacy Farmer', ?, NULL)", [phone]);
  for (const pw of ["1234", "", PASSWORD]) {
    const r = await new Client().post("/api/auth/login", { phone, password: pw || "x" });
    assert.equal(r.status, 401);
  }
  const r = await new Client().post("/api/auth/login", { phone, password: "1234" });
  assert.equal(r.data.code, "PASSWORD_NOT_SET");
});

test("logout invalidates the session on the server (cookie replay fails)", async () => {
  const c = new Client();
  await c.post("/api/auth/login", { phone: phoneFor(1), password: PASSWORD });
  const stolenCookie = c.cookie;
  assert.equal((await c.get("/api/auth/me")).status, 200);

  const out = await c.post("/api/auth/logout");
  assert.equal(out.status, 200);
  assert.match(c.lastSetCookie, /Max-Age=0/i, "cookie cleared in browser");

  const replay = new Client();
  replay.cookie = stolenCookie;
  assert.equal((await replay.get("/api/auth/me")).status, 401, "old token must be dead");
  assert.equal((await replay.post("/api/chat", { text: "hi", clientMessageId: cmid() })).status, 401);
});

test("chat messages and replies are saved per conversation, in order", async () => {
  const a = new Client();
  await a.post("/api/auth/login", { phone: phoneFor(1), password: PASSWORD });

  const r1 = await a.post("/api/chat", {
    conversationId: null, clientMessageId: cmid(), text: "How do I apply for PM-KUSUM solar pump?", language: "en",
  });
  assert.equal(r1.status, 200, JSON.stringify(r1.data));
  const conv1 = r1.data.conversation;
  assert.match(conv1.id, /^[0-9a-f-]{36}$/);
  assert.equal(conv1.title, "How do I apply for PM-KUSUM solar pump?");
  assert.equal(r1.data.userMessage.status, "saved");
  assert.equal(r1.data.aiMessage.sender, "ai");
  assert.ok(r1.data.aiMessage.text.length > 20);
  assert.ok(Array.isArray(r1.data.aiMessage.clarificationChips));

  await new Promise((r) => setTimeout(r, 20));
  const r2 = await a.post("/api/chat", {
    conversationId: conv1.id, clientMessageId: cmid(), text: "What about PM-KISAN installment?", language: "en",
  });
  assert.equal(r2.status, 200);
  assert.equal(r2.data.conversation.id, conv1.id);
  assert.equal(r2.data.conversation.messageCount, 4);
  assert.ok(r2.data.conversation.updatedAt > conv1.updatedAt, "updated_at advances");

  const r3 = await a.post("/api/chat", { clientMessageId: cmid(), text: "Weather this week?", language: "en" });
  assert.equal(r3.status, 200);
  assert.notEqual(r3.data.conversation.id, conv1.id, "null conversationId starts a new conversation");

  const list = await a.get("/api/conversations");
  assert.equal(list.status, 200);
  assert.equal(list.data.conversations.length, 2);
  assert.equal(list.data.conversations[0].id, r3.data.conversation.id, "most recent first");

  const conv = await a.get(`/api/conversations/${conv1.id}`);
  assert.equal(conv.status, 200);
  assert.deepEqual(
    conv.data.messages.map((m) => m.sender),
    ["user", "ai", "user", "ai"]
  );
  assert.equal(conv.data.messages[0].text, "How do I apply for PM-KUSUM solar pump?");
  assert.equal(conv.data.messages[2].text, "What about PM-KISAN installment?");
});

test("history survives logout and a fresh login", async () => {
  const a = new Client();
  await a.post("/api/auth/login", { phone: phoneFor(1), password: PASSWORD });
  const before = (await a.get("/api/conversations")).data.conversations;
  await a.post("/api/auth/logout");

  const again = new Client();
  await again.post("/api/auth/login", { phone: phoneFor(1), password: PASSWORD });
  const afterList = (await again.get("/api/conversations")).data.conversations;
  assert.deepEqual(afterList.map((c) => c.id), before.map((c) => c.id));
  const oldest = afterList[afterList.length - 1];
  const msgs = (await again.get(`/api/conversations/${oldest.id}`)).data.messages;
  assert.equal(msgs.length, 4);

  // continue the earlier conversation
  const cont = await again.post("/api/chat", {
    conversationId: oldest.id, clientMessageId: cmid(), text: "Tell me about soil testing", language: "en",
  });
  assert.equal(cont.status, 200);
  assert.equal(cont.data.conversation.messageCount, 6);
});

test("retrying the same message never creates duplicates", async () => {
  const a = new Client();
  await a.post("/api/auth/login", { phone: phoneFor(1), password: PASSWORD });
  const id = cmid();
  const body = { clientMessageId: id, text: "Duplicate check about KCC loan", language: "en" };
  const first = await a.post("/api/chat", body);
  const second = await a.post("/api/chat", body);
  const third = await a.post("/api/chat", { ...body, conversationId: first.data.conversation.id });
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.data.deduplicated, true);
  assert.equal(second.data.userMessage.id, first.data.userMessage.id);
  assert.equal(second.data.aiMessage.id, first.data.aiMessage.id);
  assert.equal(third.data.aiMessage.id, first.data.aiMessage.id);
  const [rows] = await db.query("SELECT COUNT(*) n FROM chat_logs WHERE client_message_id IN (?, ?)", [id, `${id}:ai`]);
  assert.equal(rows[0].n, 2);
});

test("users are fully isolated (no access to another user's conversations)", async () => {
  const a = new Client();
  await a.post("/api/auth/login", { phone: phoneFor(1), password: PASSWORD });
  const aConv = (await a.get("/api/conversations")).data.conversations[0];
  const [[{ n: aCountBefore }]] = await db.query("SELECT COUNT(*) n FROM chat_logs WHERE conversation_id = ?", [aConv.id]);

  const b = new Client();
  const s = await signup(b, 3);
  assert.equal(s.status, 201);
  assert.equal((await b.get("/api/conversations")).data.conversations.length, 0, "B starts with nothing");

  // Manually edited requests with A's conversation id
  assert.equal((await b.get(`/api/conversations/${aConv.id}`)).status, 404);
  assert.equal((await b.del(`/api/conversations/${aConv.id}`)).status, 404);
  const inject = await b.post("/api/chat", { conversationId: aConv.id, clientMessageId: cmid(), text: "inject", language: "en" });
  assert.equal(inject.status, 404);

  const [[{ n: aCountAfter }]] = await db.query("SELECT COUNT(*) n FROM chat_logs WHERE conversation_id = ?", [aConv.id]);
  assert.equal(aCountAfter, aCountBefore, "A's conversation untouched");
  assert.equal((await a.get(`/api/conversations/${aConv.id}`)).status, 200, "A still has it");

  // B's own chat, B sees only B's
  const bMsg = await b.post("/api/chat", { clientMessageId: cmid(), text: "Namaste", language: "hi" });
  assert.equal(bMsg.status, 200);
  const bList = (await b.get("/api/conversations")).data.conversations;
  assert.equal(bList.length, 1);
  assert.ok(!(await a.get("/api/conversations")).data.conversations.some((c) => c.id === bList[0].id));
  assert.equal((await a.get(`/api/conversations/${bList[0].id}`)).status, 404);
  assert.equal((await b.get("/api/auth/me")).data.user.phone, phoneFor(3));
});

test("document analysis is recorded for the session user, ignoring a spoofed userId", async () => {
  const b = new Client();
  await b.post("/api/auth/login", { phone: phoneFor(3), password: PASSWORD });
  const [[{ id: bId }]] = await db.query("SELECT id FROM users WHERE phone = ?", [phoneFor(3)]);
  const [[{ id: aId }]] = await db.query("SELECT id FROM users WHERE phone = ?", [phoneFor(1)]);
  const doc = "data:text/plain;base64," + Buffer.from("Soil Health Card pH 7.2 Nitrogen 240 Phosphorus 18 Potassium 310").toString("base64");

  const r = await b.post("/api/ocr/analyze", { fileBase64: doc, fileName: "soil_card.txt", fileType: "text/plain", userId: aId });
  assert.equal(r.status, 200, JSON.stringify(r.data).slice(0, 300));
  const [[{ n: forA }]] = await db.query("SELECT COUNT(*) n FROM document_verifications WHERE user_id = ?", [aId]);
  const [[{ n: forB }]] = await db.query("SELECT COUNT(*) n FROM document_verifications WHERE user_id = ?", [bId]);
  assert.equal(forA, 0);
  assert.equal(forB, 1);

  // Same through chat with an attachment
  const chat = await b.post("/api/chat", {
    clientMessageId: cmid(), text: "Please analyze this attached government document: soil_card.txt", language: "en",
    attachment: { data: doc, fileName: "soil_card.txt", fileType: "text/plain" },
  });
  assert.equal(chat.status, 200, JSON.stringify(chat.data).slice(0, 300));
  assert.equal(chat.data.userMessage.fileName, "soil_card.txt");
  assert.ok(chat.data.aiMessage.docDetection, "document analysis reply");
  assert.equal(chat.data.aiMessage.docDetection.previewUrl, undefined, "no base64 stored in metadata");
});

test("users can delete their own conversation (messages removed too)", async () => {
  const b = new Client();
  await b.post("/api/auth/login", { phone: phoneFor(3), password: PASSWORD });
  const conv = (await b.get("/api/conversations")).data.conversations[0];
  const del = await b.del(`/api/conversations/${conv.id}`);
  assert.equal(del.status, 200);
  assert.equal((await b.get(`/api/conversations/${conv.id}`)).status, 404);
  const [[{ n }]] = await db.query("SELECT COUNT(*) n FROM chat_logs WHERE conversation_id = ?", [conv.id]);
  assert.equal(n, 0);
});

test("input validation and cross-site protection on chat", async () => {
  const a = new Client();
  await a.post("/api/auth/login", { phone: phoneFor(1), password: PASSWORD });
  assert.equal((await a.post("/api/chat", { clientMessageId: cmid(), text: "   " })).status, 400);
  assert.equal((await a.post("/api/chat", { clientMessageId: "x", text: "hi" })).status, 400);
  assert.equal((await a.post("/api/chat", { clientMessageId: cmid(), text: "x".repeat(4001) })).status, 400);
  assert.equal((await a.post("/api/chat", { conversationId: "1 OR 1=1", clientMessageId: cmid(), text: "hi" })).status, 400);
  assert.equal((await a.get("/api/conversations/' OR '1'='1")).status, 404);
  const csrf = await a.post("/api/chat", { clientMessageId: cmid(), text: "hi" }, { Origin: "https://evil.example" });
  assert.equal(csrf.status, 403);
  const sqlish = await a.post("/api/chat", { clientMessageId: cmid(), text: "'); DROP TABLE users; --", language: "en" });
  assert.equal(sqlish.status, 200, "stored safely as text");
  const [[{ n }]] = await db.query("SELECT COUNT(*) n FROM users");
  assert.ok(n > 0);
});

test("repeated wrong passwords are rate limited", async () => {
  const c = new Client();
  const phone = phoneFor(1);
  let last;
  for (let i = 0; i < 9; i++) {
    last = await c.post("/api/auth/login", { phone, password: "Wrong" + i + "pass" }, { "X-Forwarded-For": "203.0.113.77" });
  }
  assert.equal(last.status, 429);
});
