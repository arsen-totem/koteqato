import type { Analysis } from "../analyzer/types";

export function Timeline({ analysis }: { analysis: Analysis }) {
  const qubits = analysis.circuit.qubits;
  const width = Math.max(analysis.layers.length, 1);
  const grid = qubits.map((q) => Array.from({ length: width }, () => "───"));

  analysis.layers.forEach((layer, col) => {
    layer.operations.forEach((op) => {
      const label = op.name.toUpperCase().slice(0, 3).padEnd(3, " ");
      for (const q of [...op.controls, ...op.targets]) {
        const row = qubits.indexOf(q);
        if (row >= 0) grid[row][col] = label;
      }
    });
  });

  return (
    <pre className="timeline">
      {qubits.map((q, i) => `${q.padEnd(8)} | ${grid[i].join("-")}`).join("\n") || "no qubits"}
    </pre>
  );
}
