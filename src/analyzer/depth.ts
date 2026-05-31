import type { Circuit, Operation } from "../qasm/types";
import type { Layer } from "./types";

function opQubits(op: Operation): string[] {
  return [...op.controls, ...op.targets].filter((x) => x.includes("["));
}

export function computeLayers(circuit: Circuit): Layer[] {
  const occupiedUntil = new Map<string, number>();
  const layers: Layer[] = [];

  for (const op of circuit.operations) {
    if (op.kind === "unsupported" || op.kind === "opaque") continue;
    const qubits = opQubits(op);
    const nextLayer = qubits.length === 0 ? 0 : Math.max(...qubits.map((q) => occupiedUntil.get(q) ?? 0));
    if (!layers[nextLayer]) layers[nextLayer] = { index: nextLayer, operations: [] };
    layers[nextLayer].operations.push(op);
    for (const q of qubits) occupiedUntil.set(q, nextLayer + 1);
  }

  return layers.filter(Boolean).map((layer, i) => ({ ...layer, index: i }));
}
