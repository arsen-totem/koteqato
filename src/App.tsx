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

const SAMPLE = `OPENQASM 2.0;
include "qelib1.inc";

qreg q[3];
creg c[3];

h q[0];
cx q[0],q[1];
cx q[0],q[2];
barrier q;
measure q[0] -> c[0];
measure q[1] -> c[1];
measure q[2] -> c[2];`;

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
          <h1>Quantum Circuit Static Analyzer</h1>
          <p className="subtitle">Browser-only OpenQASM inspection. No backend. No Qiskit runtime. Deterministic facts first, WebLLM local AI explanation on demand.</p>
          <p className="credits">Educational project by ChatGPT / GPT-5.5 Thinking and Arsen Serhieiev.</p>
        </div>
        <div className="status">
          <Cpu size={18} /> {aiStatus}
        </div>
      </header>

      <div className="toolbar">
        <button className="button" onClick={() => setQasm(SAMPLE)}><Play size={16} /> sample</button>
        <button className="button" onClick={copyPermalink}><Link2 size={16} /> permalink</button>
        <button className="button" onClick={() => downloadText("qasm-analysis.md", markdown, "text/markdown")}><Download size={16} /> md</button>
        <button className="button" onClick={() => downloadText("qasm-analysis.json", JSON.stringify(analysis, null, 2), "application/json")}><Download size={16} /> json</button>
        <button className="button accent" onClick={handleAi} disabled={aiBusy}><Sparkles size={16} /> {aiBusy ? "explaining..." : "explain local"}</button>
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
          <pre className="ai-output">{aiText || "press [EXPLAIN LOCAL] to load WebLLM and generate an on-device report"}</pre>
        </TerminalBox>
      </section>
    </main>
  );
}
