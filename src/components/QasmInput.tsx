export function QasmInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  function loadFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  return (
    <div className="input-grid">
      <textarea
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="OpenQASM input"
      />
      <div className="file-row">
        <label className="button ghost">
          LOAD .QASM
          <input type="file" accept=".qasm,.txt" hidden onChange={(e) => loadFile(e.target.files?.[0])} />
        </label>
      </div>
    </div>
  );
}
