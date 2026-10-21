import { generateIntelligentChatReply } from "@/lib/llmService";
import type { SupportedLanguage } from "@/lib/i18n";

import { cleanSpokenText, localVoiceBriefing } from "@/lib/speechText";
export { cleanSpokenText, localVoiceBriefing } from "@/lib/speechText";

export async function createVoiceBriefing(text: string, language: SupportedLanguage, customApiKey?: string) {
  const source = text.split(/\n\n---\n/)[0].slice(0, 16000);
  const answer = await generateIntelligentChatReply({ query: "Explain this answer as a friendly spoken briefing in the requested language, around 60 to 100 words. Lead with what matters, explain its practical meaning, and finish with the next action. Preserve important conditions, exclusions, numbers and uncertainty. Do not recite headings, citations, links or every bullet. Do not add new facts.",
    language, customApiKey, forceDocumentContext: true,
    documentContext: { docType: "land_record", extractedTextSnippet: source } });
  return { text: answer.aiStatus?.state === "cloud" ? cleanSpokenText(answer.text).slice(0, 2400) : localVoiceBriefing(source), aiStatus: answer.aiStatus };
}
