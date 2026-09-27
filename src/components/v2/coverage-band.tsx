"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { MissionResult } from "@/types/v2";
import { tbl } from "./ui";

/**
 * 조건 확인률 — 예외만 보여준다. 확인률 80% 미만인 조건만 한 줄씩,
 * 전체 표는 눌렀을 때만 연다.
 */
export default function CoverageBand({ result }: { result: MissionResult }) {
  const [open, setOpen] = useState(false);
  const total = result.dossiers.length;
  const weak = result.coverage.filter((c) => c.unknown / total > 0.2);

  return (
    <section aria-labelledby="cov-title" className="text-[13px]">
      <h2 id="cov-title" className="sr-only">조건 확인률</h2>
      {weak.length > 0 ? (
        <div className="flex gap-2.5 items-start px-3.5 py-2.5 rounded-md border border-[var(--border)] bg-[var(--unknown-bg)]">
          <AlertTriangle aria-hidden size={15} className="mt-[2px] shrink-0 text-[var(--unknown)]" />
          <div className="flex flex-col gap-0.5">
            {weak.map((c) => (
              <p key={c.id} className="m-0">
                <b className="font-semibold">{c.label}</b> 조건은 {total}명 중 {c.unknown}명을 확인하지 못했습니다
                {c.reasons[0] ? ` (${c.reasons[0].label})` : ""}.
                {c.suggestion && <span className="text-[var(--ink-2)]"> {c.suggestion.replace(/^확인률 \d+% — /, "")}</span>}
              </p>
            ))}
          </div>
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="ml-auto shrink-0 text-[12.5px] text-[var(--accent)] hover:underline">
            {open ? "접기" : "조건별 확인률"}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="text-[12.5px] text-[var(--accent)] hover:underline">
          조건별 확인률 {open ? "접기" : "보기"}
        </button>
      )}

      {open && (
        <div className="surface mt-2 relative overflow-x-auto">
          <table className="w-full border-collapse tabular">
            <thead>
              <tr>{["조건", "통과", "실패", "확인 못 함", "주된 사유"].map((h) => <th key={h} scope="col" className={tbl.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {result.coverage.map((c) => (
                <tr key={c.id}>
                  <td className={tbl.td}>{c.label}</td>
                  <td className={tbl.td}>{c.pass}</td>
                  <td className={tbl.td}>{c.fail}</td>
                  <td className={`${tbl.td} ${c.unknown / total > 0.2 ? "text-[var(--unknown)] font-medium" : ""}`}>{c.unknown}</td>
                  <td className={`${tbl.td} text-[var(--dim)]`}>{c.reasons[0]?.label ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
