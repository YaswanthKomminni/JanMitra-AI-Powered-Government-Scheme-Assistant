import { AsyncLocalStorage } from "node:async_hooks";
import type { ModelRun, ModelReport } from "@/lib/modelReport";
const traces = new AsyncLocalStorage<ModelRun[]>();
export function recordModelRun(run: ModelRun) { traces.getStore()?.push(run); }
export async function captureModels<T>(task: () => Promise<T>): Promise<{ result: T; modelReport: ModelReport }> {
  const runs: ModelRun[] = [];
  const result = await traces.run(runs, task);
  return { result, modelReport: { runs } };
}
/** Safe metadata only: never record prompts, credentials, document text or raw errors. */
export async function modelFetch(url: string, init: RequestInit): Promise<Response> {
  const started = Date.now();
  // Inspect the serialized envelope without duplicating large base64 image payloads.
  const body = typeof init.body === "string" ? init.body : "";
  const model = decodeURIComponent(url.match(/models\/([^/:]+)/)?.[1] || body.match(/"model"\s*:\s*"([^"]+)"/)?.[1] || "unknown provider model");
  const task = body.includes('"google_search"') ? "Official-source search" : /tts/i.test(model) ? "Speech synthesis" : /inlineData|image_url|input_image/.test(body) ? "Vision reasoning" : "Language reasoning";
  try {
    const response = await fetch(url, init);
    let data: any = {};
    if (response.ok && !/tts/i.test(model)) { try { data = await response.clone().json(); } catch { /* incomplete response is reported by caller */ } }
    const usage = data.usageMetadata || data.usage || {};
    recordModelRun({ model, task, status: response.ok ? "completed" : "failed", latencyMs: Date.now() - started,
      inputTokens: usage.promptTokenCount ?? usage.prompt_tokens, outputTokens: usage.candidatesTokenCount ?? usage.completion_tokens,
      detail: response.ok ? "Provider response received; factual validation is a separate step." : `HTTP ${response.status}` });
    return response;
  } catch (error) {
    recordModelRun({ model, task, status: "failed", latencyMs: Date.now() - started, detail: /abort|timeout/i.test((error as Error).name) ? "Timed out" : "Connection failed" });
    throw error;
  }
}
