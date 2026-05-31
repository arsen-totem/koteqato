import type { Analysis } from "./types";

export function analysisToMarkdown(a: Analysis): string {
  const m = a.metrics;
  const gates = Object.entries(a.gateHistogram).map(([k, v]) => `- ${k}: ${v}`).join("\n") || "- none";
  const warnings = a.warnings.map((w) => `- [${w.level}] ${w.title}: ${w.detail}${w.line ? ` (line ${w.line})` : ""}`).join("\n") || "- none";
  const patterns = a.patterns.map((p) => `- ${p.name} (${p.confidence}): ${p.detail}`).join("\n") || "- none";
  const opts = a.optimizations.map((o) => `- ${o.title}: ${o.detail} Lines: ${o.lines.join(", ")}`).join("\n") || "- none";

  return `# QASM Circuit Analysis\n\n## Metrics\n\n- Qubits: ${m.qubits}\n- Classical bits: ${m.classicalBits}\n- Operations: ${m.operations}\n- Gate operations: ${m.gateOperations}\n- Measurements: ${m.measurements}\n- Two-qubit gates: ${m.twoQubitGates}\n- Parameterized gates: ${m.parameterizedGates}\n- Depth: ${m.depth}\n- Statevector amplitudes: ${m.statevectorAmplitudes}\n\n## Gate Histogram\n\n${gates}\n\n## Warnings\n\n${warnings}\n\n## Detected Patterns\n\n${patterns}\n\n## Optimization Candidates\n\n${opts}\n`;
}

export function downloadText(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
