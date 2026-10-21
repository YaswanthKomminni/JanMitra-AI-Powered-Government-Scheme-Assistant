import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { explainImageOcclusion } from "@/lib/localImageModel";
import { captureModels } from "@/lib/modelTelemetry";
export const maxDuration = 40;
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    if (typeof body.image !== "string" || !body.image.startsWith("data:image/") || body.image.length > 12000000)
      return NextResponse.json({ message: "Select an image upload to explain." }, { status: 400 });
    const captured = await captureModels(() => explainImageOcclusion(Buffer.from(body.image.replace(/^data:[^;]+;base64,/, ""), "base64")));
    return NextResponse.json({ ...captured.result, modelReport: captured.modelReport }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ message: "Image explanation could not finish. The reading remains available." }, { status: 503 }); }
}
