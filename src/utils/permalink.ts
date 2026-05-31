import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

export function encodeQasmToHash(qasm: string): string {
  return `#qasm=${compressToEncodedURIComponent(qasm)}`;
}

export function decodeQasmFromHash(): string | null {
  const hash = window.location.hash;
  if (!hash.startsWith("#qasm=")) return null;
  const decoded = decompressFromEncodedURIComponent(hash.slice(6));
  return decoded || null;
}
