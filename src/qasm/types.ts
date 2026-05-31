export type RegisterKind = "qreg" | "creg";

export type Register = {
  kind: RegisterKind;
  name: string;
  size: number;
};

export type Operation = {
  name: string;
  targets: string[];
  controls: string[];
  params: string[];
  classicalTargets: string[];
  raw: string;
  line: number;
  kind: "gate" | "measure" | "barrier" | "reset" | "opaque" | "unsupported";
};

export type Circuit = {
  version: "2.0" | "3.0-ish" | "unknown";
  registers: Register[];
  qubits: string[];
  cbits: string[];
  operations: Operation[];
  includes: string[];
  customGateNames: string[];
  diagnostics: ParseDiagnostic[];
  source: string;
};

export type ParseDiagnostic = {
  level: "info" | "warning" | "error";
  line: number;
  message: string;
  raw?: string;
};
