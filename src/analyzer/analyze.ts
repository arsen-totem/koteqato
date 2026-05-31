import type { Circuit, Operation } from "../qasm/types";
import { computeLayers } from "./depth";
import type { Analysis, Optimization, Pattern, Warning } from "./types";

const SELF_INVERSE = new Set(["h", "x", "y", "z", "cx", "cz", "swap"]);
const TWO_QUBIT = new Set(["cx", "cz", "cy", "ch", "swap", "crx", "cry", "crz", "cu1", "cu3", "rxx", "ryy", "rzz"]);

function opAllQubits(op: Operation): string[] {
  return [...op.controls, ...op.targets].filter(Boolean);
}

function sameWires(a: Operation, b: Operation): boolean {
  return JSON.stringify(opAllQubits(a)) === JSON.stringify(opAllQubits(b));
}

function isTwoQubit(op: Operation): boolean {
  return op.kind === "gate" && (TWO_QUBIT.has(op.name) || opAllQubits(op).length === 2);
}

function bigPow2(n: number): string {
  if (n <= 53) return String(2 ** n);
  return `2^${n}`;
}

function histogram(ops: Operation[]): Record<string, number> {
  return ops.reduce<Record<string, number>>((acc, op) => {
    acc[op.name] = (acc[op.name] ?? 0) + 1;
    return acc;
  }, {});
}

function findOptimizations(ops: Operation[]): Optimization[] {
  const result: Optimization[] = [];
  for (let i = 0; i < ops.length - 1; i++) {
    const a = ops[i];
    const b = ops[i + 1];
    if (a.kind !== "gate" || b.kind !== "gate") continue;
    if (a.name === b.name && SELF_INVERSE.has(a.name) && sameWires(a, b)) {
      result.push({
        title: `Adjacent ${a.name.toUpperCase()} cancellation`,
        detail: `Two consecutive self-inverse gates act on the same wire set and may cancel if no classical condition is involved.`,
        lines: [a.line, b.line],
      });
    }
  }
  return result;
}

function findPatterns(ops: Operation[]): Pattern[] {
  const patterns: Pattern[] = [];
  for (let i = 0; i < ops.length - 1; i++) {
    const first = ops[i];
    const second = ops[i + 1];
    if (first.name === "h" && second.name === "cx" && second.controls.includes(first.targets[0])) {
      patterns.push({ name: "Bell-pair seed", confidence: "high", detail: `H followed by CX from the same qubit near lines ${first.line}-${second.line}.` });
      break;
    }
  }
  const cxs = ops.filter((op) => op.name === "cx");
  if (cxs.length >= 2) {
    const sameRoot = cxs[0]?.controls[0] && cxs.every((op) => op.controls[0] === cxs[0].controls[0]);
    if (sameRoot) patterns.push({ name: "GHZ/star entanglement candidate", confidence: "medium", detail: "Multiple CX gates share the same control qubit." });
  }
  if (ops.some((op) => ["rz", "rx", "ry", "u1", "u2", "u3", "p"].includes(op.name)) && cxs.length > 0) {
    patterns.push({ name: "Variational ansatz candidate", confidence: "low", detail: "Parameterized rotations mixed with entangling gates." });
  }
  return patterns;
}

function findWarnings(circuit: Circuit, optimizations: Optimization[]): Warning[] {
  const warnings: Warning[] = [...circuit.diagnostics.map((d) => ({ level: d.level === "error" ? "critical" : d.level, title: "Parser diagnostic", detail: d.message, line: d.line } as Warning))];
  const ops = circuit.operations;
  const usedQubits = new Set(ops.flatMap(opAllQubits));
  const unused = circuit.qubits.filter((q) => !usedQubits.has(q));
  if (unused.length) warnings.push({ level: "info", title: "Unused qubits", detail: `${unused.join(", ")} are declared but not used.` });

  const firstMeasureIndex = ops.findIndex((op) => op.kind === "measure");
  if (firstMeasureIndex >= 0 && ops.slice(firstMeasureIndex + 1).some((op) => op.kind === "gate" || op.kind === "reset")) {
    warnings.push({ level: "warning", title: "Mid-circuit measurement", detail: "There are unitary/reset operations after a measurement. Check whether this is intentional." });
  }

  if (!ops.some((op) => op.kind === "measure")) warnings.push({ level: "warning", title: "No measurements", detail: "The circuit has no measurement statements, so it may only prepare a state." });
  if (ops.some((op) => op.kind === "barrier")) warnings.push({ level: "info", title: "Barriers present", detail: "Barriers may prevent transpiler optimizations." });
  if (ops.some((op) => op.kind === "unsupported")) warnings.push({ level: "warning", title: "Unsupported statements", detail: "Some QASM statements were not parsed and are excluded from metrics." });

  const twoQ = ops.filter(isTwoQubit).length;
  const gates = ops.filter((op) => op.kind === "gate").length;
  if (gates > 0 && twoQ / gates > 0.35) warnings.push({ level: "warning", title: "High two-qubit gate density", detail: `${twoQ}/${gates} gate operations are two-qubit gates. This is costly on NISQ hardware.` });
  if (circuit.qubits.length > 20) warnings.push({ level: "warning", title: "Large statevector", detail: `Exact statevector simulation would require ${bigPow2(circuit.qubits.length)} amplitudes.` });
  if (optimizations.length) warnings.push({ level: "info", title: "Local simplifications found", detail: `${optimizations.length} candidate cancellation(s) detected.` });
  return warnings;
}

export function analyzeCircuit(circuit: Circuit): Analysis {
  const ops = circuit.operations;
  const gateOps = ops.filter((op) => op.kind === "gate");
  const layers = computeLayers(circuit);
  const optimizations = findOptimizations(ops);
  const twoQubitGates = gateOps.filter(isTwoQubit).length;

  return {
    circuit,
    metrics: {
      qubits: circuit.qubits.length,
      classicalBits: circuit.cbits.length,
      operations: ops.length,
      gateOperations: gateOps.length,
      measurements: ops.filter((op) => op.kind === "measure").length,
      resets: ops.filter((op) => op.kind === "reset").length,
      barriers: ops.filter((op) => op.kind === "barrier").length,
      unsupported: ops.filter((op) => op.kind === "unsupported").length,
      twoQubitGates,
      parameterizedGates: gateOps.filter((op) => op.params.length > 0).length,
      depth: layers.length,
      statevectorAmplitudes: bigPow2(circuit.qubits.length),
    },
    gateHistogram: histogram(gateOps),
    layers,
    warnings: findWarnings(circuit, optimizations),
    patterns: findPatterns(ops),
    optimizations,
  };
}
