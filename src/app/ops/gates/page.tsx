"use client";

import { useEffect, useState } from "react";
import { GateBadge } from "@/components/v2/ui";
import { listGates } from "@/lib/api-v2";
import type { GateDecision } from "@/types/v2";

/** 게이트 이력 — 모든 판정과 사유. DEPLOY 된 버전이 다음 baseline 이 된다 */
export default function GatesPage() {
  const [list, setList] = useState<GateDecision[]>([]);
  const [open, setOpen] = useState<string>("");
  useEffect(() => { listGates().then((g) => { setList(g); setOpen(g[0]?.id ?? ""); }); }, []);

  return (
    <section className="panel !p-0 overflow-hidden" aria-labelledby="gh-title">
      <div className="px-4 pt-3 pb-2">
        <h2 id="gh-title" className="m-0 text-[14.5px] font-semibold">게이트 이력</h2>
        <p className="m-0 text-[12px] text-[var(--dim)]">배포 스크립트는 최신 판정이 DEPLOY 가 아니면 운영 배포를 거부합니다 (exit 0 = DEPLOY · 1 = DEBUG · 2 = IMPROVE).</p>
      </div>
      <ul className="m-0 p-0 list-none">
        {list.map((g) => (
          <li key={g.id} className="border-t border-[var(--border)]">
            <button type="button" onClick={() => setOpen(open === g.id ? "" : g.id)} aria-expanded={open === g.id}
              className="w-full text-left px-4 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] tabular hover:bg-[var(--soft)]">
              <GateBadge v={g.verdict} />
              <span>{g.at}</span>
              <span className="text-[var(--dim)]">버전 {g.version}</span>
              {g.composite > 0 && <span>종합 {g.composite.toFixed(2)} / baseline {g.baseline.toFixed(2)}</span>}
              <span className="text-[var(--dim)] truncate max-w-[420px]">{g.reasons[0] ?? g.notes[0] ?? ""}</span>
            </button>
            {open === g.id && (
              <div className="px-4 pb-3 pl-[88px] text-[13px] space-y-1.5">
                {g.reasons.length > 0 && <div><b>사유</b><ul className="m-0 pl-5">{g.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul></div>}
                {g.focus_agents.length > 0 && <div><b>원인 에이전트</b> · {g.focus_agents.join(", ")}</div>}
                {g.notes.length > 0 && <div><b>기록</b> · {g.notes.join(" · ")}</div>}
                {g.actions.length > 0 && <div><b>권장 조치</b><ol className="m-0 pl-5">{g.actions.map((a, i) => <li key={i}>{a}</li>)}</ol></div>}
                {g.verdict === "DEPLOY" && <div className="text-[var(--pass)]">이 버전이 배포되고 baseline 이 되었습니다.</div>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
