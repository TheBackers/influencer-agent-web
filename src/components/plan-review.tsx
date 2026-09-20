"use client";

import { useState, useCallback } from "react";
import type { Plan, SoftCondition, ConditionHint } from "@/types/api";
import ReviseModal from "./revise-modal";

interface PlanReviewProps {
  plan: Plan;
  hints?: { global?: ConditionHint[]; by_id?: Record<string, ConditionHint[]> };
  revisions?: string[];
  onApprove: () => void;
  onRevise: (instruction: string) => void;
  onDrop: (ids: string[]) => void;
  onToggleWeight: (id: string, to: "must" | "nice") => void;
  onAddCondition: (text: string, weight: "must" | "nice", kind: "require" | "exclude") => void;
  disabled?: boolean;
  busy?: string;
}

const n = (v: number) => (v ?? 0).toLocaleString();

export default function PlanReview({
  plan,
  hints,
  revisions,
  onApprove,
  onRevise,
  onDrop,
  onToggleWeight,
  onAddCondition,
  disabled,
  busy,
}: PlanReviewProps) {
  const [dropped, setDropped] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState("");
  const [addText, setAddText] = useState("");
  const [addMust, setAddMust] = useState(false);
  const [addExclude, setAddExclude] = useState(false);

  const toggleDrop = useCallback((id: string) => {
    setDropped((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const applyDrops = () => {
    onDrop([...dropped]);
    setDropped(new Set());
  };

  const handleAdd = () => {
    const t = addText.trim();
    if (!t) return;
    onAddCondition(t, addMust ? "must" : "nice", addExclude ? "exclude" : "require");
    setAddText("");
    setAddMust(false);
    setAddExclude(false);
  };

  const h = plan.hard;
  const rng = h.follower_max ? `${n(h.follower_min)}~${n(h.follower_max)}` : `${n(h.follower_min)} 이상`;

  return (
    <div className="panel">
      <h2 className="text-[13px] font-semibold text-[var(--dim)] mb-3">
        {disabled ? "이렇게 읽었습니다" : "이 조건이 맞습니까?"}
      </h2>

      {busy && (
        <p className="text-[12px] text-[var(--dim)] mb-2.5">
          <span className="inline-block w-[11px] h-[11px] border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mr-1 align-middle" />
          {busy}
        </p>
      )}

      <p className="text-sm m-0 mb-2.5">{plan.interpretation}</p>

      {/* 기계 조건 테이블 */}
      <table className="w-full border-collapse text-[12.5px] mb-3">
        <tbody>
          <tr>
            <th className="text-left p-1.5 border-t border-[var(--border)] text-[var(--dim)] font-semibold text-[11px] align-top">분야</th>
            <td className="p-1.5 border-t border-[var(--border)]">{plan.topic}</td>
          </tr>
          <tr>
            <th className="text-left p-1.5 border-t border-[var(--border)] text-[var(--dim)] font-semibold text-[11px] align-top">검색 각도</th>
            <td className="p-1.5 border-t border-[var(--border)]">{(plan.query_angles || []).join(" · ")}</td>
          </tr>
          <tr>
            <th className="text-left p-1.5 border-t border-[var(--border)] text-[var(--dim)] font-semibold text-[11px] align-top">
              기계 조건<br /><span className="font-normal">코드가 판정</span>
            </th>
            <td className="p-1.5 border-t border-[var(--border)]">
              팔로워 {rng} · 참여율 {h.engagement_min ? `${h.engagement_min}% 이상` : "탈락 기준 아님"} · 최근 {h.active_within_days}일 · {h.count}명
            </td>
          </tr>
          <tr>
            <th className="text-left p-1.5 border-t border-[var(--border)] text-[var(--dim)] font-semibold text-[11px] align-top">규모</th>
            <td className="p-1.5 border-t border-[var(--border)]">
              후보 {h.candidate_target}명까지 발굴 → 팔로워·주제로 걸러낸 뒤 <b>최대 {h.screen_keep}명</b>만 조건 확인
              <span className="text-[var(--dim)] text-[12px]"> (발굴 수는 목표값입니다 — 검색에서 나온 만큼만 모입니다)</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 판단 조건 */}
      <h2 className="text-[13px] font-semibold text-[var(--dim)] mt-3.5 mb-1.5">
        판단 조건 <span className="font-normal text-[var(--dim)]">— LLM이 툴로 근거를 찾아 판정</span>
      </h2>

      <div className="space-y-0">
        {plan.soft.map((c: SoftCondition) => {
          const gate = c.id === "c0" || c.id === "cb";
          const isDropped = dropped.has(c.id);
          const condHints = hints?.by_id?.[c.id] || [];

          return (
            <div
              key={c.id}
              className={`flex gap-2 items-start py-[5px] border-t border-[var(--border)] first:border-t-0 group ${
                isDropped ? "opacity-40 line-through" : ""
              }`}
            >
              <span className={`text-[10px] font-bold px-1.5 py-[1px] rounded border border-current shrink-0 ${
                c.weight === "must" ? "text-[var(--accent)]" : "text-[var(--dim)]"
              }`}>
                {c.weight === "must" ? "필수" : "참고"}
              </span>
              {c.kind === "exclude" && (
                <span className="text-[10px] font-bold px-1.5 py-[1px] rounded border border-current text-[var(--dim)] shrink-0">
                  배제
                </span>
              )}
              <span className="text-[12px] text-[var(--dim)] shrink-0">{c.id}</span>
              <span className="flex-1 min-w-0 text-sm">
                {c.text}
                {c.source_phrase && (
                  <span className="text-[12px] text-[var(--dim)]"> ← &quot;{c.source_phrase}&quot;</span>
                )}
                {condHints.length > 0 && (
                  <span className="flex flex-wrap gap-1 mt-1">
                    {condHints.map((ch, i) => (
                      <span
                        key={i}
                        className={`text-[11px] inline-flex gap-[3px] items-center px-[7px] py-[1px] rounded-full border border-current cursor-help whitespace-nowrap ${
                          ch.level === "warn" ? "text-[var(--unknown)]"
                          : ch.level === "good" ? "text-[var(--pass)]"
                          : "text-[var(--dim)]"
                        }`}
                        title={ch.text}
                      >
                        <span className="font-bold shrink-0">
                          {ch.level === "warn" ? "!" : ch.level === "good" ? "✓" : "·"}
                        </span>
                        {ch.short || ch.text}
                      </span>
                    ))}
                  </span>
                )}
              </span>

              {gate ? (
                <span className="text-[12px] text-[var(--dim)] shrink-0" title="분야·사람 확인은 코드가 붙이는 전제라 뺄 수 없습니다">
                  고정
                </span>
              ) : !disabled && (
                <span className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => { setModalTarget(c.text.split("\n")[0]); setModalOpen(true); }}
                    className="h-[22px] px-2 text-[11px] rounded-[5px] border border-[var(--border)] bg-[var(--panel)] cursor-pointer leading-5"
                  >
                    고치기
                  </button>
                  <button
                    onClick={() => onToggleWeight(c.id, c.weight === "must" ? "nice" : "must")}
                    className="h-[22px] px-2 text-[11px] rounded-[5px] border border-[var(--border)] bg-[var(--panel)] cursor-pointer leading-5"
                  >
                    {c.weight === "must" ? "참고로" : "필수로"}
                  </button>
                  <button
                    onClick={() => toggleDrop(c.id)}
                    className="h-[22px] px-2 text-[11px] rounded-[5px] border border-[var(--border)] bg-[var(--panel)] text-[var(--fail)] cursor-pointer leading-5"
                  >
                    {isDropped ? "되살리기" : "빼기"}
                  </button>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 조건 추가 */}
      {!disabled && (
        <div className="flex gap-1.5 items-center flex-wrap mt-2.5">
          <input
            type="text"
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
            placeholder="조건 추가 — 예) 내돈내산 리뷰를 올리는"
            maxLength={60}
            className="flex-1 min-w-[200px] h-[38px] px-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm"
          />
          <label className="text-[11.5px] text-[var(--dim)] inline-flex gap-1 items-center">
            <input type="checkbox" checked={addMust} onChange={(e) => setAddMust(e.target.checked)} /> 필수
          </label>
          <label className="text-[11.5px] text-[var(--dim)] inline-flex gap-1 items-center">
            <input type="checkbox" checked={addExclude} onChange={(e) => setAddExclude(e.target.checked)} /> 배제(없어야 함)
          </label>
          <button
            onClick={handleAdd}
            className="h-[22px] px-2 text-[11px] rounded-[5px] bg-[var(--accent)] text-white font-semibold border-0 cursor-pointer leading-5"
          >
            추가
          </button>
        </div>
      )}

      {/* 글로벌 힌트 */}
      {hints?.global && hints.global.length > 0 && (
        <div className="mt-2.5 space-y-0.5">
          {hints.global.map((h, i) => (
            <span
              key={i}
              className={`text-[11px] inline-flex gap-[3px] items-center px-[7px] py-[1px] rounded-full border border-current cursor-help whitespace-nowrap mr-1 ${
                h.level === "warn" ? "text-[var(--unknown)]"
                : h.level === "good" ? "text-[var(--pass)]"
                : "text-[var(--dim)]"
              }`}
            >
              <span className="font-bold">{h.level === "warn" ? "!" : h.level === "good" ? "✓" : "·"}</span>
              {h.text}
            </span>
          ))}
        </div>
      )}

      {/* pending drops */}
      {dropped.size > 0 && (
        <div className="flex gap-2.5 items-center flex-wrap mt-3 p-2.5 rounded-lg bg-[var(--unknown-bg)] text-[var(--unknown)] text-[12.5px] font-semibold">
          조건 {dropped.size}개를 뺍니다
          <button onClick={applyDrops} className="h-[22px] px-2 text-[11px] rounded-[5px] bg-[var(--accent)] text-white font-semibold border-0 cursor-pointer leading-5">
            변경 적용
          </button>
          <button onClick={() => setDropped(new Set())} className="h-[22px] px-2 text-[11px] rounded-[5px] border border-[var(--border)] bg-[var(--panel)] cursor-pointer leading-5">
            취소
          </button>
        </div>
      )}

      {/* 확인 버튼 + 수정 이력 */}
      {!disabled && (
        <>
          <div className="flex gap-2.5 mt-3.5 flex-wrap items-end">
            <button
              onClick={onApprove}
              className="h-[38px] px-[18px] bg-[var(--accent)] text-white font-semibold rounded-lg border-0 cursor-pointer"
            >
              이 조건으로 찾기
            </button>
            <button
              onClick={() => { setModalTarget(""); setModalOpen(true); }}
              className="h-[38px] px-4 rounded-lg border border-[var(--border)] bg-[var(--panel)] cursor-pointer"
            >
              조건 고치기
            </button>
            <span className="text-[12px] text-[var(--dim)] pb-2.5">
              조건 줄을 눌러도 바로 고칠 수 있습니다
            </span>
          </div>

          {revisions && revisions.length > 0 && (
            <p className="text-[12px] text-[var(--dim)] mt-1">
              지금까지 고친 것: {revisions.join(" → ")}
            </p>
          )}
        </>
      )}

      <ReviseModal
        open={modalOpen}
        target={modalTarget}
        revisions={revisions}
        onApply={onRevise}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
