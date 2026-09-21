"use client";

import { useState, useCallback, useRef } from "react";
import StatusBadges from "@/components/status-badges";
import SearchForm from "@/components/search-form";
import PlanReview from "@/components/plan-review";
import ProgressLog from "@/components/progress-log";
import ResultCard from "@/components/result-card";
import { startRun, resumeJob, getJob, streamUrl } from "@/lib/api";
import type { Plan, RunResult, SSEEvent, HintsData } from "@/types/api";

type Status = "idle" | "running" | "paused" | "done" | "error";

interface LogEntry {
  time?: string;
  text: string;
}

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [statusText, setStatusText] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [hints, setHints] = useState<HintsData | null>(null);
  const [revisions, setRevisions] = useState<string[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [planBusy, setPlanBusy] = useState("");
  const [jobId, setJobId] = useState("");
  const esRef = useRef<EventSource | null>(null);
  const seenRef = useRef(-1);

  const log = useCallback((text: string, time?: string) => {
    setLogs((prev) => [...prev, { time, text }]);
  }, []);

  const follow = useCallback(
    (id: string) => {
      if (esRef.current) esRef.current.close();
      seenRef.current = -1;
      const es = new EventSource(streamUrl(id));
      esRef.current = es;

      es.onmessage = (ev) => {
        const d: SSEEvent = JSON.parse(ev.data);
        if (typeof d.i === "number") {
          if (d.i <= seenRef.current) return;
          seenRef.current = d.i;
        }
        switch (d.t) {
          case "plan":
            if (d.plan) setPlan(d.plan);
            log("조건 분해 완료", d.at);
            break;
          case "confirm":
            log("사람 확인 대기 — 조건을 검토하세요", d.at);
            if (d.plan) setPlan(d.plan);
            if (d.hints) setHints(d.hints);
            if (d.revisions) setRevisions(d.revisions);
            setPlanBusy("");
            setStatus("paused");
            setStatusText("조건을 확인해 주세요");
            break;
          case "node":
            log(`[${d.node}] ${d.text}`, d.at);
            setPlanBusy("");
            setStatus("running");
            setStatusText("리서치 중");
            break;
          case "error":
            log("실패: " + d.message, d.at);
            setPlanBusy("");
            setStatus("error");
            setStatusText("실패");
            break;
          case "done":
            log("완료", d.at);
            setPlanBusy("");
            getJob(id).then((j) => {
              if (j.result) {
                setResult(j.result);
                if (j.result.revisions) setRevisions(j.result.revisions);
              }
              setStatus("done");
              setStatusText("완료");
            });
            break;
          case "end":
            es.close();
            esRef.current = null;
            break;
        }
      };

      es.onerror = () => {
        setStatusText("연결이 끊겼습니다 — 결과는 out/ 에 저장됩니다");
        es.close();
        esRef.current = null;
      };
    },
    [log]
  );

  const handleSubmit = async (request: string, filters: Record<string, unknown>) => {
    setStatus("running");
    setStatusText("조건을 읽는 중");
    setLogs([]);
    setPlan(null);
    setHints(null);
    setRevisions([]);
    setResult(null);
    setPlanBusy("");
    try {
      const { job_id } = await startRun(request, filters, null, true);
      setJobId(job_id);
      follow(job_id);
    } catch (e) {
      setStatus("error");
      setStatusText("오류: " + (e as Error).message);
    }
  };

  const doResume = async (action: string, opts: Record<string, unknown> = {}) => {
    if (!jobId) return;
    const msg =
      action === "approve" ? "발굴을 시작합니다"
      : action === "revise" ? "조건을 고치는 중… (몇 초 걸립니다)"
      : "조건을 바꾸는 중…";
    setStatus("running");
    setStatusText(msg);
    setPlanBusy(msg);
    try {
      await resumeJob({ job_id: jobId, action, ...opts });
      follow(jobId);
    } catch (e) {
      setPlanBusy("");
      setStatusText("오류: " + (e as Error).message);
    }
  };

  const handleApprove = () => doResume("approve");
  const handleRevise = (instruction: string) => {
    log("조건 고치기: " + instruction);
    doResume("revise", { instruction });
  };
  const handleDrop = (ids: string[]) => {
    log("조건 제외: " + ids.join(", "));
    doResume("drop", { ids });
  };
  const handleToggleWeight = (id: string, to: "must" | "nice") => {
    log(`${id} → ${to === "nice" ? "참고" : "필수"}`);
    doResume("weight", { ids: [id], to });
  };
  const handleAddCondition = (text: string, weight: "must" | "nice", kind: "require" | "exclude") => {
    log(`조건 추가: ${text}${weight === "must" ? " (필수)" : ""}${kind === "exclude" ? " (배제)" : ""}`);
    doResume("add", { text, to: weight, kind });
  };

  return (
    <div className="max-w-[920px] mx-auto px-4 py-5 pb-16">
      <header className="flex items-center gap-3 flex-wrap mb-4">
        <h1 className="text-[17px] font-semibold tracking-tight m-0">influencer-agent</h1>
        <div className="ml-auto">
          <StatusBadges />
        </div>
      </header>

      <div className="space-y-3.5">
        <SearchForm
          onSubmit={handleSubmit}
          disabled={status === "running" || status === "paused"}
          statusText={statusText}
        />

        {plan && (
          <PlanReview
            plan={plan}
            hints={hints ?? undefined}
            revisions={revisions}
            onApprove={handleApprove}
            onRevise={handleRevise}
            onDrop={handleDrop}
            onToggleWeight={handleToggleWeight}
            onAddCondition={handleAddCondition}
            disabled={status !== "paused"}
            busy={planBusy}
          />
        )}

        <ProgressLog logs={logs} status={status} />

        {result && (
          <div>
            {result.passed.map((p, i) => (
              <ResultCard
                key={p.handle}
                profile={p}
                conditions={result.plan?.soft || []}
                rank={i + 1}
              />
            ))}

            {result.rejected.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[12px] text-[var(--dim)]">
                  탈락 {result.rejected.length}명
                </summary>
                <table className="w-full border-collapse text-[12.5px] mt-1">
                  <thead>
                    <tr>
                      <th className="text-left p-1.5 border-t border-[var(--border)] text-[var(--dim)] font-semibold text-[11px]">이름</th>
                      <th className="text-left p-1.5 border-t border-[var(--border)] text-[var(--dim)] font-semibold text-[11px]">핸들</th>
                      <th className="text-left p-1.5 border-t border-[var(--border)] text-[var(--dim)] font-semibold text-[11px]">플랫폼</th>
                      <th className="text-right p-1.5 border-t border-[var(--border)] text-[var(--dim)] font-semibold text-[11px]">팔로워</th>
                      <th className="text-left p-1.5 border-t border-[var(--border)] text-[var(--dim)] font-semibold text-[11px]">사유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rejected.map((r, i) => (
                      <tr key={i}>
                        <td className="p-1.5 border-t border-[var(--border)]">{r.name}</td>
                        <td className="p-1.5 border-t border-[var(--border)]">{r.handle}</td>
                        <td className="p-1.5 border-t border-[var(--border)]">{r.platform}</td>
                        <td className="p-1.5 border-t border-[var(--border)] text-right tabular-nums">{(r.followers ?? 0).toLocaleString()}</td>
                        <td className="p-1.5 border-t border-[var(--border)]">{r._reject}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
