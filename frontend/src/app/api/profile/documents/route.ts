import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { dbQuery, withTransaction } from "@/lib/db";
import { ensureProfileStorage } from "@/lib/profileStorage";
import { analyzeImageIntelligently } from "@/lib/visionLlm";
import { documentChatContext } from "@/lib/documentChatContext";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  const auth = await requireUser(request); if (auth instanceof NextResponse) return auth;
  try {
    await ensureProfileStorage();
    const documents = await dbQuery<any[]>(`SELECT id,file_name,created_at,length(analysis->>'extractedTextSnippet') AS characters FROM profile_documents WHERE user_id=$1 ORDER BY created_at DESC`, [auth.dbId]);
    return NextResponse.json({ documents }, { headers });
  } catch { return NextResponse.json({ message: "Saved documents could not load." }, { status: 503 }); }
}
export async function POST(request: Request) {
  const auth = await requireUser(request); if (auth instanceof NextResponse) return auth;
  try {
    const b = await request.json();
    if (typeof b.data !== "string" || b.data.length > 11500000 || !/^data:(?:application\/pdf|application\/msword|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|image\/(?:jpeg|png|webp)|text\/plain);base64,[A-Za-z0-9+/=\r\n]+$/.test(b.data)) return NextResponse.json({ message: "Upload a PDF, Word document, text file, JPG, PNG or WebP up to 8 MB." }, { status: 400 });
    const name = typeof b.name === "string" ? b.name.replace(/[\r\n\\/]/g, "_").slice(0, 180) : "saved-document";
    const type = b.data.match(/^data:([^;]+)/)![1];
    await ensureProfileStorage();
    const existing = await dbQuery<any[]>("SELECT id FROM profile_documents WHERE user_id=$1", [auth.dbId]);
    if (existing.length >= 10) return NextResponse.json({ message: "You can save up to 10 documents. Remove one first." }, { status: 400 });
    const reading = await analyzeImageIntelligently({ fileBase64: b.data, fileName: name, fileType: type });
    if (reading.scopeStatus === "out_of_scope") return NextResponse.json({ message: "Please save an agriculture, identity, land or government welfare document." }, { status: 400 });
    const analysis = documentChatContext(reading);
    if (!analysis.extractedTextSnippet.trim()) return NextResponse.json({ message: "No readable text was retained. Please upload a clearer original before saving." }, { status: 422 });
    const id = randomUUID();
    await withTransaction(async c => {
      await c.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [auth.dbId]);
      const count = await c.query("SELECT id FROM profile_documents WHERE user_id=$1", [auth.dbId]);
      if (count.rows.length >= 10) throw new Error("limit");
      await c.query("INSERT INTO profile_documents(id,user_id,file_name,file_type,file_data,analysis) VALUES($1,$2,$3,$4,$5,$6::jsonb)", [id,auth.dbId,name,type,b.data,JSON.stringify(analysis)]);
    });
    return NextResponse.json({ id, message: "Document saved privately. The assistant can use its readable text for your guidance.", modelReport: reading.modelReport }, { headers });
  } catch { return NextResponse.json({ message: "The document could not be saved. Please retry." }, { status: 503 }); }
}
