import type { Circuit, Operation, ParseDiagnostic, Register } from "./types";

const BUILTIN_TWO_QUBIT = new Set(["cx", "cz", "cy", "ch", "swap", "crx", "cry", "crz", "cu1", "cu3", "rxx", "ryy", "rzz"]);

function stripComment(line: string): string {
  return line.replace(/\/\/.*$/g, "").trim();
}

function expandRegister(name: string, size: number): string[] {
  return Array.from({ length: size }, (_, i) => `${name}[${i}]`);
}

function splitArgs(input: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of input) {
    if (char === "(" || char === "[") depth++;
    if (char === ")" || char === "]") depth--;
    if (char === "," && depth === 0) {
      args.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

function normalizeGateLine(line: string): { name: string; params: string[]; args: string[] } | null {
  const match = line.match(/^([a-zA-Z_][\w]*)\s*(?:\((.*)\))?\s+(.+);$/);
  if (!match) return null;
  const [, name, rawParams, rawArgs] = match;
  return {
    name: name.toLowerCase(),
    params: rawParams ? splitArgs(rawParams) : [],
    args: splitArgs(rawArgs),
  };
}

export function parseQasm(source: string): Circuit {
  const registers: Register[] = [];
  const includes: string[] = [];
  const customGateNames: string[] = [];
  const diagnostics: ParseDiagnostic[] = [];
  const operations: Operation[] = [];
  let version: Circuit["version"] = "unknown";

  const lines = source.split(/\r?\n/);

  for (let index = 0; index < lines.length; index++) {
    const lineNumber = index + 1;
    const raw = lines[index];
    const line = stripComment(raw);
    if (!line) continue;

    const versionMatch = line.match(/^OPENQASM\s+([\d.]+)\s*;$/i);
    if (versionMatch) {
      version = versionMatch[1].startsWith("2") ? "2.0" : "3.0-ish";
      continue;
    }

    const includeMatch = line.match(/^include\s+"([^"]+)"\s*;$/i);
    if (includeMatch) {
      includes.push(includeMatch[1]);
      continue;
    }

    const regMatch = line.match(/^(qreg|creg)\s+([a-zA-Z_]\w*)\[(\d+)\]\s*;$/i);
    if (regMatch) {
      registers.push({ kind: regMatch[1].toLowerCase() as Register["kind"], name: regMatch[2], size: Number(regMatch[3]) });
      continue;
    }

    const gateDecl = line.match(/^gate\s+([a-zA-Z_]\w*)\b/);
    if (gateDecl) {
      customGateNames.push(gateDecl[1].toLowerCase());
      diagnostics.push({ level: "info", line: lineNumber, message: `Custom gate declaration detected: ${gateDecl[1]}`, raw });
      continue;
    }

    if (/^opaque\b/i.test(line)) {
      operations.push({ name: "opaque", targets: [], controls: [], params: [], classicalTargets: [], raw, line: lineNumber, kind: "opaque" });
      continue;
    }

    const measureMatch = line.match(/^measure\s+(.+)\s*->\s*(.+)\s*;$/i);
    if (measureMatch) {
      operations.push({
        name: "measure",
        targets: [measureMatch[1].trim()],
        controls: [],
        params: [],
        classicalTargets: [measureMatch[2].trim()],
        raw,
        line: lineNumber,
        kind: "measure",
      });
      continue;
    }

    const barrierMatch = line.match(/^barrier\s+(.+)\s*;$/i);
    if (barrierMatch) {
      operations.push({ name: "barrier", targets: splitArgs(barrierMatch[1]), controls: [], params: [], classicalTargets: [], raw, line: lineNumber, kind: "barrier" });
      continue;
    }

    const resetMatch = line.match(/^reset\s+(.+)\s*;$/i);
    if (resetMatch) {
      operations.push({ name: "reset", targets: [resetMatch[1].trim()], controls: [], params: [], classicalTargets: [], raw, line: lineNumber, kind: "reset" });
      continue;
    }

    const gate = normalizeGateLine(line);
    if (gate) {
      const controls = BUILTIN_TWO_QUBIT.has(gate.name) && gate.args.length >= 2 && gate.name !== "swap" ? [gate.args[0]] : [];
      const targets = controls.length ? gate.args.slice(1) : gate.args;
      operations.push({ name: gate.name, targets, controls, params: gate.params, classicalTargets: [], raw, line: lineNumber, kind: "gate" });
      continue;
    }

    diagnostics.push({ level: "warning", line: lineNumber, message: "Unsupported or unparsed QASM statement", raw });
    operations.push({ name: "unsupported", targets: [], controls: [], params: [], classicalTargets: [], raw, line: lineNumber, kind: "unsupported" });
  }

  const qubits = registers.filter((r) => r.kind === "qreg").flatMap((r) => expandRegister(r.name, r.size));
  const cbits = registers.filter((r) => r.kind === "creg").flatMap((r) => expandRegister(r.name, r.size));

  if (version === "unknown") diagnostics.push({ level: "warning", line: 1, message: "Missing OPENQASM version header" });

  return { version, registers, qubits, cbits, operations, includes, customGateNames, diagnostics, source };
}
