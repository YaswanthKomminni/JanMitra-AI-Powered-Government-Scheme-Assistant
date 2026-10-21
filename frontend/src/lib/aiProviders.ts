export type AiProvider = "gemini" | "groq" | "openai";

export function providerKeys(customKey?: string): Array<{ provider: AiProvider; key: string }> {
  const keys: Array<{ provider: AiProvider; key: string }> = [];
  const custom = customKey?.trim();
  if (custom) {
    const provider = /^(?:AIza|AQ\.)/.test(custom) ? "gemini" : custom.startsWith("gsk_") ? "groq" : custom.startsWith("sk-") ? "openai" : null;
    if (provider) keys.push({ provider, key: custom });
  }
  for (const [provider, key] of [
    ["gemini", process.env.GEMINI_API_KEY],
    ["gemini", process.env.GOOGLE_API_KEY],
    ["gemini", process.env.GOOGLE_GENERATIVE_AI_API_KEY],
    ["gemini", process.env.VISION_API_KEY],
    ["gemini", process.env["API-Key"]],
    ["gemini", process.env["API KEY"]],
    ["groq", process.env.GROQ_API_KEY],
    ["openai", process.env.OPENAI_API_KEY],
  ] as const) {
    if (key?.trim() && !keys.some((entry) => entry.key === key.trim())) keys.push({ provider, key: key.trim() });
  }
  return keys;
}

// Defaults verified against provider catalogs; overrides allow account-specific models.
export function providerModels(provider: AiProvider, vision = false): string[] {
  const defaults = provider === "gemini" ? ["gemini-3.8-flash", "gemini-3.5-flash-lite"]
    : provider === "groq" ? (vision ? ["qwen/qwen3.8-27b"] : ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"])
    : ["gpt-4.1", "gpt-4.1-mini"];
  const override = process.env[`${provider.toUpperCase()}_${vision ? "VISION_" : ""}MODEL`];
  return override?.trim() ? [override.trim()] : defaults;
}

/** Recover from retired model IDs using the authenticated provider's actual catalog. */
export async function discoverProviderModels(provider: AiProvider, key: string, vision: boolean, signal: AbortSignal): Promise<string[]> {
  try {
    const google = provider === "gemini";
    const response = await fetch(google ? "https://generativelanguage.googleapis.com/v1beta/models"
      : `https://api.${provider === "groq" ? "groq.com/openai" : "openai.com"}/v1/models`, {
      headers: google ? { "x-goog-api-key": key } : { Authorization: `Bearer ${key}` },
      signal: AbortSignal.any([signal, AbortSignal.timeout(2000)]),
    });
    if (!response.ok) return [];
    const data = await response.json();
    const rows = google ? data.models : data.data;
    if (!Array.isArray(rows)) return [];
    const ids: string[] = rows.filter((item: any) => !google || item.supportedGenerationMethods?.includes("generateContent"))
      .map((item: any) => String(google ? item.name : item.id).replace(/^models\//, ""));
    const candidates = ids.filter((id) => provider === "gemini" ? /^gemini-(?:[2-9][.\d-]*).*(?:flash|pro|argon)/i.test(id) && !/image|live|tts|transcribe|robotics|computer-use/i.test(id)
      : provider === "groq" ? (vision ? /qwen.*3\.[58]|llama-4.*(scout|maverick)/i.test(id) : /llama|qwen|gpt-oss|gemma/i.test(id) && !/guard/i.test(id))
      : /gpt-4o|gpt-4\.1/i.test(id) && !/audio|realtime|transcribe|tts|search/i.test(id));
    return [...providerModels(provider, vision).filter((id) => ids.includes(id)), ...candidates].filter((id, index, all) => all.indexOf(id) === index).slice(0, 6);
  } catch { return []; }
}

/** Gemini 3+ rejects legacy sampling parameters; reserve output for the actual answer. */
export function geminiGenerationConfig(model: string, maxOutputTokens: number, json = false) {
  const modern = /^gemini-[3-9]/.test(model);
  return { maxOutputTokens, ...(json ? { responseMimeType: "application/json" } : {}),
    ...(modern ? { thinkingConfig: { thinkingLevel: "low" } } : { temperature: 0.2,
      ...(/^gemini-2\.5-flash/.test(model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}) }) };
}
