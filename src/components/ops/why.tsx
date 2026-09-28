"use client";

/**
 * '왜' 부품 — 검색 추적에서 탈락 사유와 오류 원인을 한 사람 · 한 원인씩 보여 준다.
 *   RejectedList  누가 어느 단계에서 무슨 이유로 떨어졌나 (+ 세부 근거 · 근거 링크)
 *   ErrorGroups   오류를 원인별로 묶어 '왜 났나 · 할 일 · 원문' — 우리 쪽 고장(설정 · 코드)이 위, 대상 계정 문제가 아래
 */
import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { OpsErrorGroup, OpsRejected } from "@/types/v2";

const KIND_STYLE: Record<string, { label: string; color: string }> = {
  설정: { label: "설정 문제", color: "var(--fail)" },
  코드: { label: "코드 문제", color: "var(--fail)" },
  한도: { label: "한도", color: "var(--unknown)" },
  네트워크: { label: "일시적", color: "var(--dim)" },
  계정: { label: "대상 계정 문제", color: "var(--dim)" },
  기타: { label: "기타", color: "var(--unknown)" },
};

const reasonKey = (r: string) => r.split("(")[0].split("—")[0].trim() || "기타";

export function RejectedList({ rows, onPick }: { rows: OpsRejected[]; onPick?: (handle: string) => void }) {
  const [f, setF] = useState<string>("");
  const groups = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(reasonKey(r.reason), (m.get(reasonKey(r.reason)) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);
  if (!rows.length) return <p className="m-0 text-[13px] text-[var(--dim)]">탈락한 후보가 없습니다.</p>;
  const shown = f ? rows.filter((r) => reasonKey(r.reason) === f) : rows;
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2" role="group" aria-label="사유로 거르기">
        <button type="button" onClick={() => setF("")} aria-pressed={!f}
          className={`h-[26px] px-2 rounded-full border text-[12px] ${!f ? "border-[var(--foreground)] font-medium" : "border-[var(--border-strong)] text-[var(--dim)]"}`}>
          전체 {rows.length}
        </button>
        {groups.map(([k, n]) => (
          <button key={k} type="button" onClick={() => setF(f === k ? "" : k)} aria-pressed={f === k}
            className={`h-[26px] px-2 rounded-full border text-[12px] ${f === k ? "border-[var(--foreground)] font-medium" : "border-[var(--border-strong)] text-[var(--dim)]"}`}>
            {k} {n}
          </button>
        ))}
      </div>
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px] min-w-[720px]">
          <thead>
            <tr className="text-left text-[11.5px] text-[var(--dim)] bg-[var(--soft)]">
              {["후보", "어디서", "사유", "세부 근거"].map((h) => <th key={h} scope="col" className="px-3 py-1.5 font-semibold whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.handle + r.stage} className="border-t border-[var(--border)] align-top">
                <td className="px-3 py-2 whitespace-nowrap">
                  {onPick ? <button type="button" onClick={() => onPick(r.handle)} className="font-medium text-[var(--accent)] hover:underline" translate="no">{r.handle}</button>
                    : <span className="font-medium" translate="no">{r.handle}</span>}
                  {r.name && r.name !== r.handle && <div className="text-[11px] text-[var(--dim)] truncate max-w-[180px]">{r.name}</div>}
                </td>
                <td className={`px-3 py-2 whitespace-nowrap ${r.review ? "text-[var(--unknown)] font-medium" : "text-[var(--ink-2)]"}`}>{r.stage_ko}</td>
                <td className="px-3 py-2 min-w-[200px]">{r.reason}</td>
                <td className="px-3 py-2 min-w-[240px] text-[var(--ink-2)]">
                  {r.detail || <span className="text-[var(--dim)]">—</span>}
                  {r.source_url && (
                    <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="ml-1.5 inline-flex items-center gap-0.5 text-[11.5px] whitespace-nowrap">
                      근거<ExternalLink size={11} aria-hidden /></a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ErrorGroups({ groups, agentLabel, onEvents }: {
  groups: OpsErrorGroup[]; agentLabel: (a: string) => string; onEvents: (g: OpsErrorGroup) => void;
}) {
  if (!groups.length) return <p className="m-0 text-[13px] text-[var(--dim)]">이 검색에서 난 오류가 없습니다.</p>;
  return (
    <ul className="m-0 p-0 list-none divide-y divide-[var(--border)]">
      {groups.map((g) => {
        const k = KIND_STYLE[g.kind] ?? KIND_STYLE["기타"];
        return (
          <li key={g.tool + g.key} className="py-2.5 first:pt-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-[11.5px] font-semibold px-1.5 rounded" style={{ color: k.color, border: `1px solid ${k.color}` }}>{k.label}</span>
              <span className="text-[13.5px] font-semibold">{g.title}</span>
              <span className="text-[12.5px] text-[var(--dim)]">
                {g.count}회 · <span translate="no">{g.tool || "—"}</span> · {agentLabel(g.agent)}
                {g.candidates.length > 0 && <> · 후보 {g.candidates.length}명</>}
              </span>
              <button type="button" onClick={() => onEvents(g)} className="ml-auto text-[12px] text-[var(--accent)] hover:underline">기록 보기</button>
            </div>
            <p className="m-0 mt-1 text-[12.5px]"><b className="font-medium">왜</b> {g.why}</p>
            <p className="m-0 mt-0.5 text-[12.5px]"><b className="font-medium">할 일</b> {g.fix}</p>
            <details className="mt-1">
              <summary className="cursor-pointer text-[12px] text-[var(--dim)]">원문 {g.samples.length}개{g.candidates.length ? ` · 후보 ${g.candidates.slice(0, 6).join(", ")}${g.candidates.length > 6 ? " …" : ""}` : ""}</summary>
              <ul className="m-0 mt-1 pl-4 text-[12px] text-[var(--ink-2)]">
                {g.samples.map((s, i) => <li key={i} className="break-words" translate="no">{s}</li>)}
              </ul>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
