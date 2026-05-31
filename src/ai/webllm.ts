export const DEFAULT_LOCAL_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

export type LocalAiProgress = {
  progress: number | null;
  text: string;
};

export type LocalAiOptions = {
  modelId?: string;
  onProgress?: (progress: LocalAiProgress) => void;
};

let enginePromise: Promise<any> | null = null;
let loadedModelId: string | null = null;

function hasWebGpu(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

function progressText(value: unknown): LocalAiProgress {
  const item = value as { progress?: number; text?: string; timeElapsed?: number };
  const pct = typeof item?.progress === "number" ? Math.max(0, Math.min(1, item.progress)) : null;
  const percent = pct === null ? "" : `${Math.round(pct * 100)}% `;
  return {
    progress: pct,
    text: `${percent}${item?.text ?? "initializing local model"}`.trim(),
  };
}

async function getEngine(modelId: string, onProgress?: LocalAiOptions["onProgress"]) {
  if (!hasWebGpu()) {
    throw new Error("WebGPU is not available in this browser. Use Chrome/Edge desktop or another WebGPU-enabled browser.");
  }

  if (!enginePromise || loadedModelId !== modelId) {
    loadedModelId = modelId;
    onProgress?.({ progress: 0, text: `loading ${modelId}` });
    const webllm = await import("@mlc-ai/web-llm");
    const createEngine = (webllm as any).CreateMLCEngine;
    enginePromise = createEngine(modelId, {
      initProgressCallback: (p: unknown) => onProgress?.(progressText(p)),
    });
  }

  return enginePromise;
}

export async function explainWithLocalAi(prompt: string, options: LocalAiOptions = {}): Promise<string> {
  const modelId = options.modelId ?? DEFAULT_LOCAL_MODEL;
  const engine = await getEngine(modelId, options.onProgress);

  options.onProgress?.({ progress: 1, text: "model ready; generating explanation" });

  const response = await engine.chat.completions.create({
    messages: [
      {
        role: "system",
        content: [
          "You are a careful quantum circuit reviewer.",
          "Use only the structured analyzer output provided by the user.",
          "Do not invent probabilities, execution results, gates, or algorithm names.",
          "Keep heuristic pattern labels explicitly uncertain.",
          "Return a concise technical report with: summary, warnings, likely intent, optimization candidates, and limitations.",
        ].join(" "),
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 850,
  });

  return response?.choices?.[0]?.message?.content?.trim() || "Local AI returned an empty response.";
}

export function resetLocalAiEngine() {
  enginePromise = null;
  loadedModelId = null;
}
