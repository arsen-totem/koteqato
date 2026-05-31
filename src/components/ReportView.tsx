import type { Analysis } from "../analyzer/types";

export function ReportView({ analysis }: { analysis: Analysis }) {
  return (
    <div className="report-lines">
      <p>&gt; version: {analysis.circuit.version}</p>
      <p>&gt; includes: {analysis.circuit.includes.join(", ") || "none"}</p>
      <p>&gt; patterns:</p>
      {analysis.patterns.length ? analysis.patterns.map((p, i) => <p key={i}>  - {p.name} [{p.confidence}] :: {p.detail}</p>) : <p>  - none</p>}
      <p>&gt; optimization candidates:</p>
      {analysis.optimizations.length ? analysis.optimizations.map((o, i) => <p key={i}>  - {o.title} :: lines {o.lines.join(", ")}</p>) : <p>  - none</p>}
    </div>
  );
}
