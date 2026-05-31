import type { Analysis } from "../analyzer/types";

export function WarningsPanel({ analysis }: { analysis: Analysis }) {
  if (!analysis.warnings.length) return <pre className="ok">[OK] no warnings</pre>;
  return (
    <div className="stack">
      {analysis.warnings.map((w, i) => (
        <div key={i} className={`warning ${w.level}`}>
          <div>{w.level.toUpperCase()} :: {w.title}{w.line ? ` @ line ${w.line}` : ""}</div>
          <p>{w.detail}</p>
        </div>
      ))}
    </div>
  );
}
