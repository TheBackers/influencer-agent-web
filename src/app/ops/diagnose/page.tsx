"use client";

import { useEffect, useState } from "react";
import { HealthDot, tbl } from "@/components/v2/ui";
import { getOpsHealth } from "@/lib/api-v2";
import type { OpsHealth } from "@/types/v2";

const ORDER = { red: 0, yellow: 1, green: 2 } as const;

/** 진단 — 키 · 연결 · 기록 무결성. 문제 있는 항목이 위로. 실제 API 를 부르지 않는 점검이다 (`python -m agentops diagnose --live` 는 PC 에서) */
export default function DiagnosePage() {
  const [h, setH] = useState<OpsHealth | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { getOpsHealth().then(setH).catch((e) => setErr(String(e?.message || e))); }, []);
  if (err) return <p className="m-0 text-[13px] text-[var(--fail)]">불러오지 못했습니다: {err}</p>;
  if (!h) return <p className="m-0 text-[13px] text-[var(--dim)]">불러오는 중…</p>;
  const sorted = [...h.checks].sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  return (
    <>
      {h.blocked.length > 0 && (
        <section className="surface px-4 py-3" aria-labelledby="b-title">
          <h2 id="b-title" className="m-0 mb-1 text-[14px] font-semibold">지금 막혀 있는 툴</h2>
          <ul className="m-0 pl-4 text-[13px]">
            {h.blocked.map((b) => <li key={b.tool}><b translate="no">{b.tool}</b> — {b.impact} <span className="text-[var(--dim)]">({b.reason})</span></li>)}
          </ul>
        </section>
      )}
      <div className="surface relative overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>{["항목", "상태", "현재", "기준", "할 일"].map((x) => <th key={x} scope="col" className={tbl.th}>{x}</th>)}</tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id}>
                <td className={`${tbl.td} whitespace-nowrap font-medium`}>{c.id} {c.label}</td>
                <td className={tbl.td}><HealthDot h={c.status} withLabel /></td>
                <td className={`${tbl.td} tabular`}>{c.value}</td>
                <td className={`${tbl.td} text-[var(--dim)] text-[12.5px]`}>{c.rule}</td>
                <td className={`${tbl.td} text-[12.5px]`}>{c.action || <span className="text-[var(--dim)]">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
