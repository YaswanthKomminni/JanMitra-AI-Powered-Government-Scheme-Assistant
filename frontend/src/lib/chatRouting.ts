export type HistoryTurn = { role: "user" | "assistant"; content: string };

export function isShortFollowup(query: string): boolean {
  return /^(?:and\s+)?(?:how (?:do i |can i |to )?apply\??|what documents.*|documents\??|eligibility\??|am i eligible\??|what about.*|tell me more.*|why\??|how much\??|suggestions?\??|give me suggestions.*|next steps?\??|అర్హత.*|ఎలా దరఖాస్తు.*|कैसे आवेदन.*|और बताओ.*)$/i.test(query.trim());
}

export function queryWithHistory(query: string, history: HistoryTurn[] = []): string {
  const details = query.length < 140 && /\b(cotton|paddy|rice|maize|chilli|wheat|tomato|groundnut|black soil|red soil|days? old|weeks? old)\b/i.test(query) && !/\b(how|what|why|when|which|explain)\b/i.test(query);
  if (!isShortFollowup(query) && !details) return query;
  const topic = history.slice().reverse().find((turn) => turn.role === "user" && !isShortFollowup(turn.content));
  return topic ? `${topic.content.slice(0, 1200)}\nFollow-up question: ${query}` : query;
}

export function shouldUseDocument(query: string, context: any, latestTopic = true, force = false): boolean {
  if (!context) return false;
  if (force) return true;
  if (/\b(this|that|these|uploaded|attached|above)\b.*\b(document|image|photo|file|table|notice|scheme|record)\b|\b(in|from|on) (?:this|the) (?:document|image|photo|table)|inspect|survey number|land extent|vendor|vendee|పత్రం|దస్తావేజు|दस्तावेज़|ஆவணம்|ದಾಖಲೆ|নথি/i.test(query)) return true;
  return latestTopic && (isShortFollowup(query) || /summari[sz]e|\b(owner|buyer|seller|applicant|beneficiary)\b|^(survey|when|where)\??$/i.test(query.trim()));
}
