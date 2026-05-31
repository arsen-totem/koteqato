import { useEffect, useMemo, useState } from "react";
import { Cpu, Download, Link2, Play, Sparkles, RotateCcw } from "lucide-react";
import { parseQasm } from "./qasm/parseQasm";
import { analyzeCircuit } from "./analyzer/analyze";
import { analysisToMarkdown, downloadText } from "./analyzer/report";
import { encodeQasmToHash, decodeQasmFromHash } from "./utils/permalink";
import { buildAiPrompt } from "./ai/prompt";
import { DEFAULT_LOCAL_MODEL, explainWithLocalAi, resetLocalAiEngine } from "./ai/webllm";
import { TerminalBox } from "./components/TerminalBox";
import { QasmInput } from "./components/QasmInput";
import { MetricsPanel } from "./components/MetricsPanel";
import { WarningsPanel } from "./components/WarningsPanel";
import { Timeline } from "./components/Timeline";
import { GateHistogram } from "./components/GateHistogram";
import { ReportView } from "./components/ReportView";

const SAMPLE = `// ============================================================================
// Example: Quantum Superposition Demonstration (100 Qubits)
// -----------------------------------------------------------------------------
// This example is a *conceptual* demonstration of how quantum computers can
// explore many possible states in parallel, a principle used in algorithms
// like Shor's (for factoring) and Grover's (for search).
//
// In theory, large-scale quantum computers could use Shor's algorithm to
// break classical public-key cryptography (e.g., RSA, ECDSA). Bitcoin uses
// ECDSA for transaction signatures, so a sufficiently powerful quantum
// computer could, in principle, derive private keys from public keys.
// 
// This circuit does NOT break Bitcoin or any cryptosystem — it simply
// prepares a uniform superposition over 2^100 states to illustrate the
// exponential parallelism that underlies such algorithms.
// ============================================================================

OPENQASM 2.0;
include "qelib1.inc";

// Declare 100 qubits and 100 classical bits
qreg q[100];
creg c[100];

// Apply Hadamard to all qubits to create uniform superposition
h q[0];
h q[1];
h q[2];
h q[3];
h q[4];
h q[5];
h q[6];
h q[7];
h q[8];
h q[9];
h q[10];
h q[11];
h q[12];
h q[13];
h q[14];
h q[15];
h q[16];
h q[17];
h q[18];
h q[19];
h q[20];
h q[21];
h q[22];
h q[23];
h q[24];
h q[25];
h q[26];
h q[27];
h q[28];
h q[29];
h q[30];
h q[31];
h q[32];
h q[33];
h q[34];
h q[35];
h q[36];
h q[37];
h q[38];
h q[39];
h q[40];
h q[41];
h q[42];
h q[43];
h q[44];
h q[45];
h q[46];
h q[47];
h q[48];
h q[49];
h q[50];
h q[51];
h q[52];
h q[53];
h q[54];
h q[55];
h q[56];
h q[57];
h q[58];
h q[59];
h q[60];
h q[61];
h q[62];
h q[63];
h q[64];
h q[65];
h q[66];
h q[67];
h q[68];
h q[69];
h q[70];
h q[71];
h q[72];
h q[73];
h q[74];
h q[75];
h q[76];
h q[77];
h q[78];
h q[79];
h q[80];
h q[81];
h q[82];
h q[83];
h q[84];
h q[85];
h q[86];
h q[87];
h q[88];
h q[89];
h q[90];
h q[91];
h q[92];
h q[93];
h q[94];
h q[95];
h q[96];
h q[97];
h q[98];
h q[99];

// Measure all qubits
measure q -> c;
`;

export default function App() {
  const [qasm, setQasm] = useState(SAMPLE);
  const [aiText, setAiText] = useState("");
  const [aiStatus, setAiStatus] = useState("local-ai idle");
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    const fromHash = decodeQasmFromHash();
    if (fromHash) setQasm(fromHash);
  }, []);

  const analysis = useMemo(() => analyzeCircuit(parseQasm(qasm)), [qasm]);
  const markdown = useMemo(() => analysisToMarkdown(analysis), [analysis]);

  async function handleAi() {
    setAiBusy(true);
    setAiText(`> WebLLM model: ${DEFAULT_LOCAL_MODEL}\n> first run downloads model assets into browser cache\n`);
    setAiStatus("local-ai booting");
    try {
      const result = await explainWithLocalAi(buildAiPrompt(analysis), {
        onProgress: (p) => {
          setAiStatus(p.text);
          setAiText((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ${p.text}`);
        },
      });
      setAiText(result);
      setAiStatus("local-ai ready");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setAiText([
        "LOCAL AI ERROR",
        "--------------",
        message,
        "",
        "This app still works in deterministic static-analysis mode.",
        "For local AI, use a WebGPU-enabled browser and allow the first model download.",
      ].join("\n"));
      setAiStatus("local-ai unavailable");
    } finally {
      setAiBusy(false);
    }
  }

  function resetAi() {
    resetLocalAiEngine();
    setAiText("");
    setAiStatus("local-ai reset");
  }

  function copyPermalink() {
    const hash = encodeQasmToHash(qasm);
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    navigator.clipboard.writeText(url);
    window.history.replaceState(null, "", hash);
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="kicker">QASM://TERMINAL_ANALYZER v0.4.1</p>
          <h1>KOTEQATO, NYA!</h1>
          <p className="subtitle">Browser-only Quantum Circuit inspection. Deterministic facts first, AI explanation on demand.</p>
          <p className="credits">Educational project by Arsen Serhieiev and ChatGPT/Llama.</p>
        </div>
        <div className="status">
          <Cpu size={18} /> {aiStatus}
        </div>
      </header>

      <div className="toolbar">
        {/* <button className="button" onClick={() => setQasm(SAMPLE)}><Play size={16} /> sample</button>
         */}
        <button className="button accent" onClick={handleAi} disabled={aiBusy}><Sparkles size={16} /> {aiBusy ? "explaining..." : "AI, NYA!"}</button>
        
        <button className="button" onClick={copyPermalink}><Link2 size={16} /> permalink</button>
        <button className="button" onClick={() => downloadText("qasm-analysis.md", markdown, "text/markdown")}><Download size={16} /> markdown</button>
        <button className="button" onClick={() => downloadText("qasm-analysis.json", JSON.stringify(analysis, null, 2), "application/json")}><Download size={16} /> json</button>
        <button className="button" onClick={resetAi}><RotateCcw size={16} /> reset ai</button>
      </div>

      <section className="grid two">
        <TerminalBox title="INPUT / OPENQASM">
          <QasmInput value={qasm} onChange={setQasm} />
        </TerminalBox>
        <TerminalBox title="METRICS">
          <MetricsPanel analysis={analysis} />
        </TerminalBox>
      </section>

      <section className="grid two">
        <TerminalBox title="GATE HISTOGRAM">
          <GateHistogram analysis={analysis} />
        </TerminalBox>
        <TerminalBox title="WARNINGS">
          <WarningsPanel analysis={analysis} />
        </TerminalBox>
      </section>

      <TerminalBox title="ASCII CIRCUIT TIMELINE">
        <Timeline analysis={analysis} />
      </TerminalBox>

      <section className="grid two">
        <TerminalBox title="REPORT">
          <ReportView analysis={analysis} />
        </TerminalBox>
        <TerminalBox title={`LOCAL AI OUTPUT / ${DEFAULT_LOCAL_MODEL}`}>
          <pre className="ai-output">{aiText || "press [AI EXPLAIN] to load WebLLM and generate an on-device report"}</pre>
        </TerminalBox>
      </section>
    </main>
  );
}
