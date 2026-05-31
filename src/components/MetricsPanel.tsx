import type { Analysis } from "../analyzer/types";

export function MetricsPanel({ analysis }: { analysis: Analysis }) {
  const m = analysis.metrics;
  const rows: Array<[string, string | number]> = [
    ["qubits", m.qubits],
    ["classical_bits", m.classicalBits],
    ["operations", m.operations],
    ["gate_ops", m.gateOperations],
    ["measurements", m.measurements],
    ["two_qubit", m.twoQubitGates],
    ["param_gates", m.parameterizedGates],
    ["depth", m.depth],
    ["statevector", m.statevectorAmplitudes],
  ];
  return <pre className="ascii-table">{rows.map(([k, v]) => `${k.padEnd(16)} : ${v}`).join("\n")}</pre>;
}
