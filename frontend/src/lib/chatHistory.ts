import "server-only";
import crypto from "node:crypto";
import type { PoolClient } from "pg";
import { dbExec, dbQuery, withTransaction } from "@/lib/db";
import type { ChatMessage, ConversationSummary } from "@/lib/chatEngine";

export type { ConversationSummary };

/**
 * Persistence for conversations (table `conversations`) and their messages
 * (table `chat_logs`).
 *
 * EVERY function takes the authenticated user's id and filters by it, so a
 * conversation id taken from a request can never reach another user's data.
 */


const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isConversationId(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

const CLIENT_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
export function isClientMessageId(v: unknown): v is string {
  return typeof v === "string" && CLIENT_ID_RE.test(v);
}

const iso = (d: any) => (d ? new Date(d).toISOString() : new Date().toISOString());

function parseMeta(raw: any): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function mapMessageRow(row: any): ChatMessage {
  const meta = parseMeta(row.metadata);
  const created = iso(row.created_at);
  return {
    id: `m_${row.id}`,
    sender: row.sender === "ai" ? "ai" : "user",
    text: row.message_text,
    timestamp: created,
    createdAt: created,
    clientMessageId: row.sender === "user" ? row.client_message_id || undefined : undefined,
    fileName: meta.fileName || undefined,
    fileType: meta.fileType || undefined,
    clarificationChips: Array.isArray(meta.chips) ? meta.chips : undefined,
    docDetection: meta.docDetection || undefined,
    aiStatus: meta.aiStatus?.state === "cloud" || meta.aiStatus?.state === "fallback" ? meta.aiStatus : undefined,
    searchSuggestionsHtml: typeof meta.searchSuggestionsHtml === "string" ? meta.searchSuggestionsHtml.slice(0, 30000) : undefined,
    status: row.sender === "user" ? "saved" : undefined,
  };
}

function mapConversationRow(row: any): ConversationSummary {
  const last = String(row.last_message || "").replace(/\s+/g, " ").trim();
  return {
    id: row.id,
    title: row.title,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    messageCount: Number(row.message_count) || 0,
    lastMessage: last.length > 90 ? last.slice(0, 87) + "…" : last,
  };
}

const SUMMARY_SQL = `
  SELECT c.id, c.title, c.created_at, c.updated_at,
         (SELECT COUNT(*) FROM chat_logs m WHERE m.conversation_id = c.id) AS message_count,
         (SELECT m2.message_text FROM chat_logs m2 WHERE m2.conversation_id = c.id ORDER BY m2.id DESC LIMIT 1) AS last_message
    FROM conversations c`;

export async function listConversations(userId: number, limit = 100): Promise<ConversationSummary[]> {
  const rows = await dbQuery<any[]>(`${SUMMARY_SQL} WHERE c.user_id = $1 ORDER BY c.updated_at DESC, c.id LIMIT $2`, [
    userId,
    limit,
  ]);
  return rows.map(mapConversationRow);
}

export async function getConversationSummary(userId: number, conversationId: string) {
  const rows = await dbQuery<any[]>(`${SUMMARY_SQL} WHERE c.id = $1 AND c.user_id = $2 LIMIT 1`, [
    conversationId,
    userId,
  ]);
  return rows.length ? mapConversationRow(rows[0]) : null;
}

/** Messages of a conversation in order, or null when it does not exist / is not owned by the user. */
export async function getConversationMessages(userId: number, conversationId: string) {
  const owned = await dbQuery<any[]>("SELECT id FROM conversations WHERE id = $1 AND user_id = $2 LIMIT 1", [
    conversationId,
    userId,
  ]);
  if (!owned.length) return null;
  const rows = await dbQuery<any[]>(
    `SELECT id, sender, message_text, metadata, client_message_id, created_at
       FROM chat_logs WHERE conversation_id = $1 AND user_id = $2 ORDER BY id ASC`,
    [conversationId, userId]
  );
  return rows.map(mapMessageRow);
}

/** Returns true when a row was deleted (i.e. it existed AND belonged to the user). */
export async function deleteConversation(userId: number, conversationId: string): Promise<boolean> {
  const result = await dbExec("DELETE FROM conversations WHERE id = $1 AND user_id = $2", [conversationId, userId]);
  return result.rowCount > 0;
}

export function makeTitle(text: string, fileName?: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (fileName && (!clean || /inspect|analy[sz]e|పరిశీలించ|विश्लेषण|ஆய்வு|ಪರಿಶೀಲಿಸಿ|পরীক্ষা/i.test(clean))) {
    return `📄 ${fileName}`.slice(0, 160);
  }
  if (!clean) return "New conversation";
  return clean.length > 60 ? clean.slice(0, 57).trimEnd() + "…" : clean;
}

/** Look up a user message previously stored with this client id (retry de-duplication). */
export async function findUserMessageByClientId(userId: number, clientMessageId: string) {
  const rows = await dbQuery<any[]>(
    `SELECT l.id, l.sender, l.message_text, l.metadata, l.client_message_id, l.created_at, l.conversation_id, l.language
       FROM chat_logs l
       JOIN conversations c ON c.id = l.conversation_id AND c.user_id = $1
      WHERE l.user_id = $2 AND l.client_message_id = $3 LIMIT 1`,
    [userId, userId, clientMessageId]
  );
  return rows[0] || null;
}

export async function findReplyFor(userId: number, clientMessageId: string) {
  const rows = await dbQuery<any[]>(
    `SELECT id, sender, message_text, metadata, client_message_id, created_at
       FROM chat_logs WHERE user_id = $1 AND client_message_id = $2 LIMIT 1`,
    [userId, `${clientMessageId}:ai`]
  );
  return rows[0] || null;
}

const MESSAGE_COLUMNS = "id, sender, message_text, metadata, client_message_id, created_at";

/**
 * Store the user's message, creating the conversation if needed, atomically.
 * Returns null if `conversationId` was given but is not owned by the user.
 */
export async function saveUserMessage(opts: {
  userId: number;
  conversationId: string | null;
  clientMessageId: string;
  text: string;
  language: string;
  metadata: Record<string, any>;
  title: string;
}) {
  return withTransaction(async (client: PoolClient) => {
    let conversationId = opts.conversationId;
    if (conversationId) {
      const owned = await client.query(
        "SELECT id FROM conversations WHERE id = $1 AND user_id = $2 FOR UPDATE",
        [conversationId, opts.userId]
      );
      if (!owned.rows.length) return null;
    } else {
      conversationId = crypto.randomUUID();
      await client.query("INSERT INTO conversations (id, user_id, title, language) VALUES ($1, $2, $3, $4)", [
        conversationId,
        opts.userId,
        opts.title,
        opts.language,
      ]);
    }
    const ins = await client.query(
      `INSERT INTO chat_logs (user_id, conversation_id, client_message_id, sender, message_text, language, metadata)
       VALUES ($1, $2, $3, 'user', $4, $5, $6::jsonb)
       RETURNING ${MESSAGE_COLUMNS}`,
      [
        opts.userId,
        conversationId,
        opts.clientMessageId,
        opts.text,
        opts.language,
        JSON.stringify(opts.metadata),
      ]
    );
    await client.query("UPDATE conversations SET updated_at = now() WHERE id = $1 AND user_id = $2", [
      conversationId,
      opts.userId,
    ]);
    return { conversationId: conversationId as string, row: ins.rows[0] };
  });
}

export async function saveAiMessage(opts: {
  userId: number;
  conversationId: string;
  clientMessageId: string;
  text: string;
  language: string;
  metadata: Record<string, any>;
}) {
  return withTransaction(async (client: PoolClient) => {
    const ins = await client.query(
      `INSERT INTO chat_logs (user_id, conversation_id, client_message_id, sender, message_text, language, metadata)
       VALUES ($1, $2, $3, 'ai', $4, $5, $6::jsonb)
       RETURNING ${MESSAGE_COLUMNS}`,
      [
        opts.userId,
        opts.conversationId,
        `${opts.clientMessageId}:ai`,
        opts.text,
        opts.language,
        JSON.stringify(opts.metadata),
      ]
    );
    await client.query("UPDATE conversations SET updated_at = now() WHERE id = $1 AND user_id = $2", [
      opts.conversationId,
      opts.userId,
    ]);
    return ins.rows[0];
  });
}
