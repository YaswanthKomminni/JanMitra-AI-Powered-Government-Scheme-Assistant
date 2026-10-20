export type AiProvider = "gemini" | "groq" | "openai";

export function providerKeys(customKey?: string): Array<{ provider: AiProvider; key: string }> {
  const keys: Array<{ provider: AiProvider; key: string }> = [];
  const custom = customKey?.trim();
  if (custom) {
    const provider = custom.startsWith("AIza") ? "gemini" : custom.startsWith("gsk_") ? "groq" : custom.startsWith("sk-") ? "openai" : null;
    if (provider) keys.push({ provider, key: custom });
  }
  for (const [provider, key] of [
    ["gemini", process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VISION_API_KEY],
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
    : provider === "groq" ? (vision ? ["qwen/qwen3.8-27b"] : ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"])
    : ["gpt-4o-mini", "gpt-4o"];
  const override = process.env[`${provider.toUpperCase()}_${vision ? "VISION_" : ""}MODEL`];
  return override?.trim() ? [override.trim()] : defaults;
}
