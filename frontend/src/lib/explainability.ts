import { retrieveDocumentEvidence } from "@/lib/documentEvidence";
/** Leave-one-term-out sensitivity of retrieval. This explains ranking, not LLM internals. */
export function explainRetrieval(query: string, source: string) {
  const baseline = retrieveDocumentEvidence(query, source, 3);
  const score = baseline[0]?.score || 0;
  const terms = Array.from(new Set(query.toLowerCase().match(/[a-z]{3,}/g) || [])).filter(t => !/^(the|this|that|what|which|how|please|tell|about|document)$/.test(t)).slice(0, 14);
  const contributions = terms.map(term => {
    const ablated = query.replace(new RegExp(`\\b${term}\\b`, "gi"), " ");
    const without = retrieveDocumentEvidence(ablated, source, 1)[0]?.score || 0;
    return { term, scoreDrop: Number((score - without).toFixed(4)) };
  }).sort((a, b) => b.scoreDrop - a.scoreDrop);
  return { method: "Leave-one-term-out retrieval sensitivity", baselineScore: score, contributions,
    limitation: "These values explain passage ranking, not a causal explanation of the language model or a probability of correctness.",
    passages: baseline.map(p => ({ id: p.id, page: p.page, text: p.text.slice(0, 500) })) };
}
