import "server-only";
import { dbQuery } from "@/lib/db";
import { retrieveDocumentEvidence } from "@/lib/documentEvidence";
let ready: Promise<unknown> | undefined;
/** Additive schema bootstrap also supports existing Render services without a migration hook. */
export function ensureProfileStorage() {
  if (!ready) ready = dbQuery(`CREATE TABLE IF NOT EXISTS farmer_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    share_contact BOOLEAN NOT NULL DEFAULT false
  ); CREATE TABLE IF NOT EXISTS profile_documents (
    id UUID PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(180) NOT NULL, file_type VARCHAR(120) NOT NULL,
    file_data TEXT NOT NULL, analysis JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  ); CREATE INDEX IF NOT EXISTS idx_profile_documents_owner ON profile_documents(user_id, created_at DESC)`)
    .catch(e => { ready = undefined; throw e; });
  return ready;
}
export async function savedProfileContext(userId: number, query: string, selectedId?: string) {
  await ensureProfileStorage();
  const rows = await dbQuery<any[]>(`SELECT id, file_name, analysis FROM profile_documents WHERE user_id=$1
    ${selectedId ? "AND id=$2" : ""} ORDER BY created_at DESC LIMIT 10`, selectedId ? [userId, selectedId] : [userId]);
  if (!rows.length) return undefined;
  if (selectedId) return { ...rows[0].analysis, savedDocumentName: rows[0].file_name };
  // Keep original sources, with boundaries. The conversational retriever selects relevant passages later.
  return { docType: "land_record", savedProfileDocuments: true,
    extractedTextSnippet: rows.map(r => `[Saved profile document: ${r.file_name}]\n${retrieveDocumentEvidence(query, r.analysis.extractedTextSnippet || "", 6).map(p => p.text).join("\n\n").slice(0, 90000)}`).join("\n\n").slice(0, 1000000),
    detectionSummary: "Private documents saved by this signed-in user. They do not establish current ownership, identity or eligibility." };
}
