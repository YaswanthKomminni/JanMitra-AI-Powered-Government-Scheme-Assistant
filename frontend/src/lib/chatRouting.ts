import { buildConversationMemory, isContextualFollowup, resolveConversationQuery, type HistoryTurn } from "@/lib/conversationMemory";
export type { HistoryTurn } from "@/lib/conversationMemory";

export const isShortFollowup = isContextualFollowup;

export function queryWithHistory(query: string, history: HistoryTurn[] = []): string {
  return resolveConversationQuery(query, buildConversationMemory(history, query));
}

export function shouldUseDocument(query: string, context: any, latestTopic = true, force = false): boolean {
  if (!context) return false;
  if (force) return true;
  if (/\b(this|that|these|uploaded|attached|above)\b.*\b(document|image|photo|file|table|notice|scheme|record)\b|\b(in|from|on) (?:this|the) (?:document|image|photo|table)|inspect|survey number|land extent|vendor|vendee|పత్రం|దస్తావేజు|दस्तावेज़|ஆவணம்|ದಾಖಲೆ|নথি/i.test(query)) return true;
  return latestTopic && (isShortFollowup(query) || /summari[sz]e|\b(owner|buyer|seller|applicant|beneficiary)\b|^(survey|when|where)\??$/i.test(query.trim()));
}
