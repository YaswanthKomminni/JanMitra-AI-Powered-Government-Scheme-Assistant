import { generateIntelligentChatReply } from "@/lib/llmService";
import { documentChatContext } from "@/lib/documentChatContext";

export async function explainDocument(options: Omit<Parameters<typeof generateIntelligentChatReply>[0], "forceDocumentContext">) {
  return generateIntelligentChatReply({ ...options, documentContext: documentChatContext(options.documentContext), forceDocumentContext: true });
}
