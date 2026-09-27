"use client";

import { Check } from "lucide-react";
import type { MissionStep } from "@/types/v2";
import { Spinner } from "./ui";

interface Props {
  steps: MissionStep[];
  logs: { at: string; text: string; kind: "log" | "intervention" | "error" }[];
  elapsed: number;
  done?: boolean;
}

/** 진행 — 전체 진행률 한 줄 + 단계 목록. 기록은 접어 둔다 */
export default function MissionStepper({ steps, logs, elapsed, done }: Props) {
  const weight = (s: MissionStep) => (s.status === "done" || s.status === "skipped" ? 1 : s.status === "running" ? (s.total ? (s.done ?? 0) / s.total : 0.3) : 0);
  const ratio = steps.reduce((a, s) => a + weight(s), 0) / steps.length;
  const running = steps.filter((s) => s.status === "running");
  const current = running.length
    ? running.map((s) => `${s.label}${s.total ? ` ${s.done}/${s.total}` : ""}`).join(", ")
    : done ? "완료" : "준비 중";
  const warn = logs.filter((l) => l.kind !== "log");

  return (
    <section className="surface px-4 py-3.5" aria-labelledby="progress-title" aria-live="polite">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 id="progress-title" className="m-0 text-[15px] font-semibold">{done ? "찾기 완료" : "찾는 중…"}</h2>
        <span className="text-[13px] text-[var(--ink-2)]">{current}</span>
        <span className="ml-auto text-[12.5px] text-[var(--dim)] tabular">{Math.round(ratio * 100)}% · {Math.round(elapsed)}초</span>
      </div>
      <div className="mt-2.5 h-[4px] rounded-full bg-[var(--soft)] overflow-hidden" role="progressbar" aria-label="전체 진행률"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)}>
        <div className="h-full bg-[var(--accent)] transition-[width] duration-300" style={{ width: `${ratio * 100}%` }} />
      </div>
      <ol className="mt-3 mb-0 p-0 list-none flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px]">
        {steps.map((s) => (
          <li key={s.key} className={`inline-flex items-center gap-1.5 ${s.status === "waiting" ? "text-[var(--dim)]" : ""}`}>
            <span aria-hidden className="w-[12px] inline-flex justify-center">
              {s.status === "done" ? <Check size={13} className="text-[var(--pass)]" /> : s.status === "running" ? <Spinner /> : <span className="w-[5px] h-[5px] rounded-full bg-[var(--border-strong)]" />}
            </span>
            {s.label}
            {s.status === "skipped" && <span className="text-[var(--dim)]">(해당 없음)</span>}
          </li>
        ))}
      </ol>
      {warn.length > 0 && (
        <p className="m-0 mt-3 text-[12.5px] text-[var(--ink-2)]">
          <span className="text-[var(--unknown)] font-medium">감독관</span> {warn[warn.length - 1].text.replace(/^감독관 · /, "")}
        </p>
      )}
      {logs.length > 0 && (
        <details className="mt-2 text-[12.5px]">
          <summary className="cursor-pointer text-[var(--dim)]">진행 기록 {logs.length}건</summary>
          <ol className="mt-1.5 mb-0 pl-0 list-none space-y-0.5">
            {logs.map((l, i) => <li key={i}><span className="text-[var(--dim)] tabular mr-2">{l.at}</span>{l.text}</li>)}
          </ol>
        </details>
      )}
    </section>
  );
}
