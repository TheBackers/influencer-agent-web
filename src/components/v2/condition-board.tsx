"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { CompiledPlan, ConditionPatch } from "@/types/v2";
import ConditionDetail from "./condition-card";
import { FeasibilityBadge, Switch, btn, pct, tbl, Spinner } from "./ui";

interface Props {
  plan: CompiledPlan;
  busy: string;
  locked: boolean;
  onPatch: (cid: string, patch: ConditionPatch) => void;
  onRevise: (instruction: string) => void;
  onApprove: () => void;
}

/**
 * 조건 승인 — 표 한 장. 한 줄에 조건 하나, 자세한 설정은 행을 눌렀을 때만(점진적 공개).
 * 확인 불가 조건은 기본으로 빠진 채 흐리게 보인다.
 */
export default function ConditionBoard({ plan, busy, locked, onPatch, onRevise, onApprove }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const active = plan.conditions.filter((c) => !c.dropped);
  const proxy = active.filter((c) => c.feasibility === "proxy").length;
  const dropped = plan.conditions.filter((c) => c.dropped).length;
  const e = plan.estimate;
  const disabled = !!busy || locked;

  return (
    <section aria-labelledby="board-title" className="surface">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-3.5 pb-3">
        <div className="min-w-0">
          <h2 id="board-title" className="m-0 text-[15px] font-semibold">조건 {active.length}개로 찾습니다</h2>
          <p className="m-0 mt-0.5 text-[12.5px] text-[var(--dim)]">
            {proxy > 0 && `${proxy}개는 대체 지표로 판단합니다. `}
            {dropped > 0 && `${dropped}개는 확인할 수 없어 뺐습니다. `}
            행을 누르면 측정 방법을 바꿀 수 있습니다.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[12.5px] text-[var(--dim)] tabular">예상 ${e.cost_usd.toFixed(2)}, 약 {e.minutes[0]}~{e.minutes[1]}분</span>
          <button type="button" onClick={onApprove} disabled={disabled} className={btn.primary}>
            {locked ? "찾는 중…" : "이 조건으로 찾기"}
          </button>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr>
              <th scope="col" className={`${tbl.th} w-[44%] border-t`}>조건</th>
              <th scope="col" className={`${tbl.th} border-t`}>판단 방식</th>
              <th scope="col" className={`${tbl.th} border-t`}>예상 확인률</th>
              <th scope="col" className={`${tbl.th} border-t`}>필수</th>
              <th scope="col" className={`${tbl.th} border-t w-[40px]`}><span className="sr-only">펼치기</span></th>
            </tr>
          </thead>
          <tbody>
            {plan.conditions.map((c) => {
              const isOpen = open === c.id;
              const low = !c.dropped && c.feasibility !== "infeasible" && c.expected_coverage < 0.5;
              return (
                <Fragment key={c.id}>
                  <tr className={`${c.dropped ? "text-[var(--dim)]" : ""} ${isOpen ? "bg-[var(--soft)]" : "hover:bg-[var(--soft)]"} cursor-pointer`}
                    onClick={() => setOpen(isOpen ? null : c.id)}>
                    <td className={tbl.td}>
                      <div className="font-medium">
                        {c.source_phrase}
                        {c.interpretation_group && <span className="font-normal text-[var(--dim)]"> ({c.intent.replace(/인$/, "")})</span>}
                        {c.dropped && <span className="ml-2 text-[12px] font-normal">제외됨</span>}
                      </div>
                      <div className="text-[12.5px] text-[var(--dim)] md:truncate md:max-w-[520px] min-w-[180px]">
                        {c.signals?.length ? `신호 ${c.signals.filter((s) => s.enabled).length}개 중 ${c.k}개 이상 충족` : c.how}
                      </div>
                    </td>
                    <td className={tbl.td}><FeasibilityBadge f={c.feasibility} /></td>
                    <td className={`${tbl.td} tabular ${low ? "text-[var(--unknown)]" : ""}`}>
                      {c.feasibility === "infeasible" ? "—" : pct(c.expected_coverage)}
                    </td>
                    <td className={tbl.td} onClick={(ev) => ev.stopPropagation()}>
                      <Switch id={`${c.id}-must`} label={`${c.source_phrase} 필수 여부`} checked={c.weight === "must" && !c.dropped}
                        disabled={disabled || !!c.dropped} onChange={(v) => onPatch(c.id, { weight: v ? "must" : "nice" })} />
                    </td>
                    <td className={tbl.td}>
                      <button type="button" aria-expanded={isOpen} aria-controls={`${c.id}-detail`} aria-label={`${c.source_phrase} 자세히`}
                        onClick={(ev) => { ev.stopPropagation(); setOpen(isOpen ? null : c.id); }}
                        className="p-1 rounded text-[var(--dim)] hover:bg-[var(--border)]">
                        {isOpen ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr id={`${c.id}-detail`}>
                      <td colSpan={5} className="px-4 py-4 border-b border-[var(--border)] bg-[var(--soft)]">
                        <ConditionDetail c={c} disabled={disabled} onPatch={onPatch} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <form className="flex flex-wrap items-center gap-2 px-4 py-3"
        onSubmit={(ev) => {
          ev.preventDefault();
          if (instruction.trim()) { onRevise(instruction.trim()); setInstruction(""); }
        }}>
        <label htmlFor="revise" className="text-[13px] text-[var(--ink-2)]">조건을 말로 고치기</label>
        <input id="revise" name="revise" value={instruction} onChange={(ev) => setInstruction(ev.target.value)} disabled={disabled}
          autoComplete="off" placeholder="예: 협찬은 최근 6개월로 좁혀줘…"
          className="flex-1 min-w-[220px] h-[34px] px-3 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[13px]" />
        <button type="submit" disabled={disabled || !instruction.trim()} className={btn.secondary}>
          {busy && <Spinner />}{busy ? "고치는 중…" : "고치기"}
        </button>
      </form>
    </section>
  );
}
