export interface ModelRun {
  model: string; task: string; status: "completed" | "failed"; latencyMs: number;
  inputTokens?: number; outputTokens?: number; score?: number; detail?: string;
}
export interface ModelReport { runs: ModelRun[]; explanation?: { method: string; evidence: string[] }; }
