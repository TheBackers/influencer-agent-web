"use client";

import type { Plan, SoftCondition } from "@/types/api";

interface PlanReviewProps {
  plan: Plan;
  hints?: { level: string; text: string }[];
  onApprove: () => void;
  onRevise: (instruction: string) => void;
  onDrop: (ids: string[]) => void;
  onToggleWeight: (id: string, to: "must" | "nice") => void;
  disabled?: boolean;
}

export default function PlanReview({
  plan,
  hints,
  onApprove,
  onRevise,
  onDrop,
  onToggleWeight,
  disabled,
}: PlanReviewProps) {
  return (
    <div className="bg-panel border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-dim">조건 검토</h2>
        <p className="text-xs text-dim">{plan.interpretation}</p>
      </div>

      <div className="mb-3">
        <span className="text-xs text-dim">분야:</span>{" "}
        <span className="font-medium">{plan.topic}</span>
      </div>

      <div className="space-y-1.5 mb-4">
        {plan.soft.map((c: SoftCondition) => (
          <div key={c.id} className="flex items-center gap-2 text-sm">
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                c.weight === "must" ? "text-accent font-semibold" : "text-dim"
              }`}
            >
              {c.weight}
            </span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                c.kind === "exclude" ? "text-fail" : ""
              }`}
            >
              {c.kind === "exclude" ? "배제" : ""}
            </span>
            <span className="flex-1">{c.text}</span>
            {!["c0", "cb"].includes(c.id) && (
              <div className="flex gap-1">
                <button
                  onClick={() =>
                    onToggleWeight(c.id, c.weight === "must" ? "nice" : "must")
                  }
                  disabled={disabled}
                  className="text-xs px-2 py-0.5 border border-border rounded hover:bg-background disabled:opacity-50"
                >
                  {c.weight === "must" ? "참고로" : "필수로"}
                </button>
                <button
                  onClick={() => onDrop([c.id])}
                  disabled={disabled}
                  className="text-xs px-2 py-0.5 border border-border rounded text-fail hover:bg-fail-bg disabled:opacity-50"
                >
                  빼기
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {hints && hints.length > 0 && (
        <div className="mb-4 space-y-1">
          {hints.map((h, i) => (
            <p
              key={i}
              className={`text-xs ${
                h.level === "warn"
                  ? "text-unknown"
                  : h.level === "good"
                    ? "text-pass"
                    : "text-dim"
              }`}
            >
              {h.level === "warn" ? "⚠ " : h.level === "good" ? "✓ " : "· "}
              {h.text}
            </p>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onApprove}
          disabled={disabled}
          className="h-9 px-5 bg-accent text-white font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
        >
          이대로 검색
        </button>
        <button
          onClick={() => {
            const instruction = prompt("어떻게 고칠까요?");
            if (instruction?.trim()) onRevise(instruction.trim());
          }}
          disabled={disabled}
          className="h-9 px-4 border border-border rounded-lg hover:bg-background disabled:opacity-50 cursor-pointer"
        >
          조건 고치기
        </button>
      </div>
    </div>
  );
}
