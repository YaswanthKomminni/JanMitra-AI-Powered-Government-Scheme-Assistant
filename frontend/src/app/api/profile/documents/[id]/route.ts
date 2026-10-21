import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { ensureProfileStorage } from "@/lib/profileStorage";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser(request); if (auth instanceof NextResponse) return auth;
  if (!/^[a-f0-9-]{36}$/i.test(params.id)) return NextResponse.json({ message: "Invalid document." }, { status: 400 });
  try {
    await ensureProfileStorage();
    const rows = await dbQuery<any[]>("SELECT file_data,file_name,file_type FROM profile_documents WHERE id=$1 AND user_id=$2", [params.id,auth.dbId]);
    if (!rows.length) return NextResponse.json({ message: "Document not found." }, { status: 404 });
    const row = rows[0];
    return new Response(Buffer.from(row.file_data.split(",")[1], "base64"), { headers: {
      "Content-Type": row.file_type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(row.file_name)}` } });
  } catch { return NextResponse.json({ message: "Document unavailable." }, { status: 503 }); }
}
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser(request); if (auth instanceof NextResponse) return auth;
  if (!/^[a-f0-9-]{36}$/i.test(params.id)) return NextResponse.json({ message: "Invalid document." }, { status: 400 });
  try {
    await ensureProfileStorage();
    const rows = await dbQuery<any[]>("DELETE FROM profile_documents WHERE id=$1 AND user_id=$2 RETURNING id", [params.id,auth.dbId]);
    return NextResponse.json({ success: rows.length > 0 }, { status: rows.length ? 200 : 404, headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ message: "Document could not be removed." }, { status: 503 }); }
}
