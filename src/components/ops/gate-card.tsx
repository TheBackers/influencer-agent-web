"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import type { GateDecision } from "@/types/v2";
import { btn, gateStyle, Spinner } from "@/components/v2/ui";

/** 현재 버전의 배포 판정 — 결론 한 줄 + 이유 + 할 일 */
export default function GateCard({ g, onRerun }: { g: GateDecision; onRerun?: () => Promise<void> }) {
  const st = gateStyle(g.verdict);
  const [running, setRunning] = useState(false);
  return (
    <section aria-labelledby="gate-title" className="surface overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5" style={{ background: st.bg }}>
        <div>
          <h2 id="gate-title" className="m-0 text-[16px] font-semibold" style={{ color: st.color }}>{st.label}</h2>
          <p className="m-0 text-[13px] text-[var(--ink-2)]">{st.desc}</p>
        </div>
        <span className="ml-auto text-[12.5px] text-[var(--dim)] tabular">
          버전 {g.version}, {g.at}{g.composite > 0 && `, 종합 ${g.composite.toFixed(2)} (기준 0.80)`}
        </span>
        {onRerun && (
          <button type="button" disabled={running} onClick={async () => { setRunning(true); await onRerun(); setRunning(false); }} className={btn.secondary}>
            {running ? <Spinner /> : <RotateCw size={14} aria-hidden />}다시 판정
          </button>
        )}
      </div>
      {(g.reasons.length > 0 || g.actions.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2 px-4 py-3.5 text-[13px]">
          {g.reasons.length > 0 && (
            <div>
              <h3 className="m-0 mb-1 text-[12.5px] font-medium text-[var(--dim)]">이유{g.focus_agents.length > 0 && ` (원인: ${g.focus_agents.join(", ")})`}</h3>
              <ul className="m-0 pl-4 space-y-0.5">{g.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}
          {g.actions.length > 0 && (
            <div>
              <h3 className="m-0 mb-1 text-[12.5px] font-medium text-[var(--dim)]">할 일</h3>
              <ol className="m-0 pl-4 space-y-0.5">{g.actions.map((a, i) => <li key={i}>{a}</li>)}</ol>
            </div>
          )}
        </div>
      )}
      {g.notes.length > 0 && (
        <p className="m-0 px-4 pb-3.5 text-[12.5px] text-[var(--dim)]">참고 (배포를 막지는 않음): {g.notes.join(", ")}</p>
      )}
    </section>
  );
}
