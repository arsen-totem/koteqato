import type { Analysis } from "../analyzer/types";

export function buildAiPrompt(a: Analysis): string {
  return `You are a quantum circuit reviewer. Explain this circuit based only on the provided structured analysis. Do not invent gates, measurements, probabilities, or algorithm names. Mark heuristic pattern detection as uncertain.\n\n${JSON.stringify({
    metrics: a.metrics,
    gateHistogram: a.gateHistogram,
    warnings: a.warnings,
    patterns: a.patterns,
    optimizations: a.optimizations,
  }, null, 2)}`;
}
