import type { ReactNode } from "react";

export function TerminalBox({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`terminal-box ${className}`}>
      <div className="terminal-title">┌─[ {title} ]</div>
      <div className="terminal-content">{children}</div>
      <div className="terminal-bottom">└────────────────────────────────────────</div>
    </section>
  );
}
