import { retrieveDocumentEvidence, type EvidencePassage } from "@/lib/documentEvidence";

// Fixed official URLs only: no user-controlled URL, redirects, credentials or arbitrary crawling.
const sources = [
  { terms: /pm[ -]?kisan|kisan samman/i, url: "https://pmkisan.gov.in/" },
  { terms: /pmfby|crop insurance/i, url: "https://pmfby.gov.in/" },
  { terms: /kusum|solar.*pump/i, url: "https://pmkusum.mnre.gov.in/" },
];
const cache = new Map<string, { expires: number; text: string }>();

export function readableOfficialHtml(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|nav|footer|header)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(?:p|div|li|tr|h[1-6])>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/[ \t]+/g, " ")
    .split("\n").map(s => s.trim()).filter(s => s.length > 10).join("\n").slice(0, 40000);
}

/** Bounded retrieval from a small official allowlist. Failure never becomes evidence. */
export async function retrieveOfficialGuidance(query: string): Promise<EvidencePassage[]> {
  if (process.env.JANMITRA_FETCH_OFFICIAL_SOURCES === "0") return [];
  const source = sources.find(s => s.terms.test(query));
  if (!source) return [];
  let text = cache.get(source.url)?.expires! > Date.now() ? cache.get(source.url)!.text : "";
  if (!text) {
    try {
      const response = await fetch(source.url, { signal: AbortSignal.timeout(2500), redirect: "error", headers: { Accept: "text/html" } });
      if (!response.ok || !response.headers.get("content-type")?.includes("text/html") || !response.body) return [];
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 500_000) return [];
          chunks.push(value);
        }
      } finally { await reader.cancel().catch(() => {}); }
      text = readableOfficialHtml(Buffer.concat(chunks).toString("utf8"));
      if (text.length < 80) return [];
      cache.set(source.url, { text, expires: Date.now() + 15 * 60_000 });
    } catch { return []; }
  }
  return retrieveDocumentEvidence(query, text, 4).map(p => ({ ...p, id: p.id.replace(/^D/, "O"), url: source.url }));
}
