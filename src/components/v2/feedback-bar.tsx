"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { ConditionSpec, FeedbackReason } from "@/types/v2";

export interface FeedbackInput { score: 0 | 1; reason?: FeedbackReason; condition_id?: string; comment?: string }

interface Props {
  value?: 0 | 1;
  conditions?: ConditionSpec[];
  onSubmit: (f: FeedbackInput) => Promise<void>;
}

/** 안 맞음 이유 — 서버(agentops/feedback.py REASONS)와 같은 키. 이유마다 Ops 에서 먼저 볼 에이전트가 정해진다 */
const REASONS: { key: FeedbackReason; label: string }[] = [
  { key: "wrong_person", label: "다른 사람 · 계정 오인" },
  { key: "wrong_condition", label: "조건 판정이 틀림" },
  { key: "not_fit", label: "조건은 맞지만 캠페인에 안 맞음" },
  { key: "wrong_info", label: "정보가 틀리거나 오래됨" },
  { key: "other", label: "기타" },
];

/** 맞음/안 맞음 + 이유 → Ops '사람 평가'(정답 데이터) · LangSmith feedback(influencer_fit) */
export default function FeedbackBar({ value, conditions = [], onSubmit }: Props) {
  const [pick, setPick] = useState<0 | 1 | undefined>(value);
  const [reason, setReason] = useState<FeedbackReason | undefined>();
  const [cond, setCond] = useState("");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"" | "saving" | "saved" | "error">(value !== undefined ? "saved" : "");

  const save = async (f: FeedbackInput) => {
    setState("saving");
    try {
      await onSubmit(f);
      setState("saved");
    } catch {
      setState("error");
    }
  };
  const up = () => { setPick(1); setReason(undefined); save({ score: 1 }); };
  const down = () => { setPick(0); if (reason) save({ score: 0, reason, condition_id: cond, comment }); else setState(""); };
  const choose = (r: FeedbackReason) => {
    setReason(r);
    const c = r === "wrong_condition" ? cond : "";
    if (r !== "wrong_condition") setCond("");
    save({ score: 0, reason: r, condition_id: c, comment });
  };

  const base = "inline-flex items-center gap-1.5 h-[32px] px-3 rounded-md border text-[13px]";
  const status = state === "saved" ? "저장됨" : state === "saving" ? "저장 중…" : state === "error" ? "저장 실패 — 다시 눌러 주세요"
    : pick === 0 ? "이유를 골라 주세요" : "";
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[13px] mr-1">캠페인에 맞나요?</span>
        <button type="button" onClick={up} aria-pressed={pick === 1}
          className={`${base} ${pick === 1 ? "border-[var(--pass)] text-[var(--pass)] bg-[var(--pass-bg)]" : "border-[var(--border-strong)] hover:bg-[var(--soft)]"}`}>
          <ThumbsUp size={14} aria-hidden />맞음
        </button>
        <button type="button" onClick={down} aria-pressed={pick === 0}
          className={`${base} ${pick === 0 ? "border-[var(--fail)] text-[var(--fail)] bg-[var(--fail-bg)]" : "border-[var(--border-strong)] hover:bg-[var(--soft)]"}`}>
          <ThumbsDown size={14} aria-hidden />안 맞음
        </button>
        <span className={`ml-auto text-[12px] ${state === "error" ? "text-[var(--fail)]" : "text-[var(--dim)]"}`} role="status" aria-live="polite">{status}</span>
      </div>
      {pick === 0 && (
        <fieldset className="m-0 p-0 border-0 space-y-2">
          <legend className="text-[12.5px] text-[var(--dim)] mb-1.5">왜 안 맞나요? 개선할 곳을 찾는 데 씁니다</legend>
          <div className="flex flex-wrap gap-1.5">
            {REASONS.map((r) => (
              <button key={r.key} type="button" onClick={() => choose(r.key)} aria-pressed={reason === r.key}
                className={`h-[28px] px-2.5 rounded-full border text-[12.5px] ${reason === r.key ? "border-[var(--foreground)] bg-[var(--soft)] font-medium" : "border-[var(--border-strong)] hover:bg-[var(--soft)]"}`}>
                {r.label}
              </button>
            ))}
          </div>
          {reason === "wrong_condition" && conditions.length > 0 && (
            <select aria-label="틀린 조건" value={cond}
              onChange={(e) => { setCond(e.target.value); save({ score: 0, reason, condition_id: e.target.value, comment }); }}
              className="w-full h-[32px] px-2 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[13px]">
              <option value="">어느 조건이 틀렸나요? (선택)</option>
              {conditions.map((c) => <option key={c.id} value={c.id}>{c.id} · {c.source_phrase || c.intent}</option>)}
            </select>
          )}
          {reason && (
            <input aria-label="메모" name="feedback-comment" autoComplete="off" value={comment}
              onChange={(e) => setComment(e.target.value)} onBlur={() => comment && save({ score: 0, reason, condition_id: cond, comment })}
              placeholder="무엇이 틀렸는지 한 줄 (선택)…"
              className="w-full h-[32px] px-2.5 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[13px]" />
          )}
        </fieldset>
      )}
    </div>
  );
}
