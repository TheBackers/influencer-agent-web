"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

interface Props {
  value?: 0 | 1;
  onSubmit: (score: 0 | 1, comment: string) => Promise<void>;
}

/** 적합/부적합 → LangSmith feedback(influencer_fit). 부적합은 검토 대기열로 간다 */
export default function FeedbackBar({ value, onSubmit }: Props) {
  const [pick, setPick] = useState<0 | 1 | undefined>(value);
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState(value !== undefined);

  const save = async (score: 0 | 1) => {
    setPick(score);
    setSaved(false);
    await onSubmit(score, comment);
    setSaved(true);
  };

  const base = "inline-flex items-center gap-1.5 h-[32px] px-3 rounded-md border text-[13px]";
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[13px] mr-1">캠페인에 맞나요?</span>
        <button type="button" onClick={() => save(1)} aria-pressed={pick === 1}
          className={`${base} ${pick === 1 ? "border-[var(--pass)] text-[var(--pass)] bg-[var(--pass-bg)]" : "border-[var(--border-strong)] hover:bg-[var(--soft)]"}`}>
          <ThumbsUp size={14} aria-hidden />맞음
        </button>
        <button type="button" onClick={() => save(0)} aria-pressed={pick === 0}
          className={`${base} ${pick === 0 ? "border-[var(--fail)] text-[var(--fail)] bg-[var(--fail-bg)]" : "border-[var(--border-strong)] hover:bg-[var(--soft)]"}`}>
          <ThumbsDown size={14} aria-hidden />안 맞음
        </button>
        <span className="ml-auto text-[12px] text-[var(--dim)]" role="status" aria-live="polite">{saved ? "저장됨" : pick !== undefined ? "저장 중…" : ""}</span>
      </div>
      {pick === 0 && (
        <input aria-label="안 맞는 이유" name="feedback-comment" autoComplete="off" value={comment}
          onChange={(e) => setComment(e.target.value)} onBlur={() => comment && save(0)}
          placeholder="이유를 적어 주시면 개선에 씁니다 (선택)…"
          className="w-full h-[32px] px-2.5 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[13px]" />
      )}
    </div>
  );
}
