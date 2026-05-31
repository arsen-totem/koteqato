import type { Circuit, Operation } from "../qasm/types";

export type Warning = {
  level: "info" | "warning" | "critical";
  title: string;
  detail: string;
  line?: number;
};

export type Pattern = {
  name: string;
  confidence: "low" | "medium" | "high";
  detail: string;
};

export type Optimization = {
  title: string;
  detail: string;
  lines: number[];
};

export type Layer = {
  index: number;
  operations: Operation[];
};

export type Analysis = {
  circuit: Circuit;
  metrics: {
    qubits: number;
    classicalBits: number;
    operations: number;
    gateOperations: number;
    measurements: number;
    resets: number;
    barriers: number;
    unsupported: number;
    twoQubitGates: number;
    parameterizedGates: number;
    depth: number;
    statevectorAmplitudes: string;
  };
  gateHistogram: Record<string, number>;
  layers: Layer[];
  warnings: Warning[];
  patterns: Pattern[];
  optimizations: Optimization[];
};
