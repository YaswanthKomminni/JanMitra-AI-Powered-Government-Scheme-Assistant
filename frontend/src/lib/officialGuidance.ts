import { retrieveDocumentEvidence, type EvidencePassage } from "@/lib/documentEvidence";

// Fixed official URLs only: no user-controlled URL, redirects, credentials or arbitrary crawling.
const sources = [
  { terms: /pm[ -]?kisan|kisan samman|पीएम किसान|పీఎం కిసాన్/i, url: "https://pmkisan.gov.in/" },
  { terms: /pmfby|crop insurance|फसल बीमा|పంట బీమా/i, url: "https://pmfby.gov.in/" },
  { terms: /kusum|solar.*pump|कुसुम|సౌర పంపు/i, url: "https://pmkusum.mnre.gov.in/landing-faq.html" },
  { terms: /andhra pradesh[\s\S]*drip|drip[\s\S]*andhra pradesh|\bAPMIP\b/i, url: "https://kurnool.ap.gov.in/apmip/" },
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
  // A comparison can mention multiple schemes; a passage from one home page
  // must never be presented as evidence for the other scheme.
  const matching = sources.filter(s => s.terms.test(query));
  if (matching.length !== 1) return [];
  const source = matching[0];
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
  const passages = retrieveDocumentEvidence(query, text, 4);
  if (/\b(?:deadline|last date|closing date|application window|when.*apply)\b|अंतिम तिथि|చివరి తేదీ/i.test(query)) {
    // A page update, installment announcement, or unrelated news date is not
    // proof of this farmer's current application deadline.
    return passages.filter(p => /\b(?:application|registration|enrolment)\b.{0,100}\b(?:deadline|last date|closing date|window)\b|\b(?:deadline|last date|closing date|window)\b.{0,100}\b(?:application|registration|enrolment)\b/i.test(p.text))
      .map(p => ({ ...p, id: p.id.replace(/^D/, "O"), url: source.url }));
  }
  return passages.map(p => ({ ...p, id: p.id.replace(/^D/, "O"), url: source.url }));
}
