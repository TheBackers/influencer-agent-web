"use client";

import { useEffect, useState } from "react";
import { HealthDot, tbl } from "@/components/v2/ui";
import { getHealth } from "@/lib/api-v2";
import type { HealthCheck } from "@/types/v2";

const ORDER = { red: 0, yellow: 1, green: 2 } as const;

/** 진단 — 10개 항목을 표 한 장으로. 문제 있는 항목이 위로 */
export default function DiagnosePage() {
  const [list, setList] = useState<HealthCheck[]>([]);
  useEffect(() => { getHealth().then(setList); }, []);
  const sorted = [...list].sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  return (
    <>
      <p className="m-0 text-[13px] text-[var(--ink-2)]">운영 항목이 위험이면 “디버그 필요”, 품질 항목이 위험이면 “개선 필요” 판정이 납니다. 주의는 기록만 합니다.</p>
      <div className="surface relative overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>{["항목", "종류", "상태", "현재", "기준", "원인과 조치"].map((h) => <th key={h} scope="col" className={tbl.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {sorted.map((h) => (
              <tr key={h.id}>
                <td className={`${tbl.td} whitespace-nowrap font-medium`}>{h.label}</td>
                <td className={`${tbl.td} text-[var(--dim)]`}>{h.kind}</td>
                <td className={tbl.td}><HealthDot h={h.status} withLabel /></td>
                <td className={`${tbl.td} tabular`}>{h.value}</td>
                <td className={`${tbl.td} text-[var(--dim)] text-[12.5px]`}>{h.rule}</td>
                <td className={`${tbl.td} text-[12.5px]`}>
                  {h.cause_agent && <div>원인: <span translate="no">{h.cause_agent}</span></div>}
                  {h.action && <div className="text-[var(--ink-2)]">{h.action}</div>}
                  {h.traces && (
                    <div className="text-[var(--dim)]">예시 {h.traces.map((t, i) => (
                      <a key={t} href="https://smith.langchain.com/" target="_blank" rel="noopener noreferrer" className="ml-1">{i + 1}</a>
                    ))}</div>
                  )}
                  {!h.cause_agent && !h.action && <span className="text-[var(--dim)]">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
