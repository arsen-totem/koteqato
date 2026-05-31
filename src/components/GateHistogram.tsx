import type { Analysis } from "../analyzer/types";

export function GateHistogram({ analysis }: { analysis: Analysis }) {
  const entries = Object.entries(analysis.gateHistogram).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return <pre>no gate operations</pre>;
  const max = Math.max(...entries.map(([, v]) => v));
  return (
    <pre className="histogram">
      {entries.map(([gate, count]) => `${gate.padEnd(10)} ${"█".repeat(Math.max(1, Math.round((count / max) * 24)))} ${count}`).join("\n")}
    </pre>
  );
}
