"use client";

import { useState, useCallback, useRef } from "react";
import StatusBadges from "@/components/status-badges";
import SearchForm from "@/components/search-form";
import PlanReview from "@/components/plan-review";
import ProgressLog from "@/components/progress-log";
import ResultCard from "@/components/result-card";
import { startRun, resumeJob, getJob, streamUrl } from "@/lib/api";
import type { Plan, RunResult, SSEEvent } from "@/types/api";

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
  const [hints, setHints] = useState<{ level: string; text: string }[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);
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
            setStatus("paused");
            setStatusText("");
            break;
          case "node":
            log(`[${d.node}] ${d.text}`, d.at);
            setStatus("running");
            setStatusText("리서치 중");
            break;
          case "error":
            log("실패: " + d.message, d.at);
            setStatus("error");
            setStatusText("오류 발생");
            break;
          case "done":
            log("완료", d.at);
            getJob(id).then((j) => {
              if (j.result) setResult(j.result);
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
        setStatusText("연결이 끊겼습니다");
        es.close();
        esRef.current = null;
      };
    },
    [log]
  );

  const handleSubmit = async (request: string, filters: Record<string, unknown>) => {
    setStatus("running");
    setStatusText("조건을 분석하는 중…");
    setLogs([]);
    setPlan(null);
    setHints([]);
    setResult(null);
    try {
      const { job_id } = await startRun(request, filters, null, true);
      setJobId(job_id);
      follow(job_id);
    } catch (e) {
      setStatus("error");
      setStatusText("시작 실패: " + (e as Error).message);
    }
  };

  const handleApprove = async () => {
    if (!jobId) return;
    setStatus("running");
    setStatusText("발굴을 시작합니다");
    try {
      await resumeJob({ job_id: jobId, action: "approve" });
      follow(jobId);
    } catch (e) {
      setStatusText("오류: " + (e as Error).message);
    }
  };

  const handleRevise = async (instruction: string) => {
    if (!jobId) return;
    setStatus("running");
    setStatusText("조건을 고치는 중…");
    try {
      await resumeJob({ job_id: jobId, action: "revise", instruction });
      follow(jobId);
    } catch (e) {
      setStatusText("오류: " + (e as Error).message);
    }
  };

  const handleDrop = async (ids: string[]) => {
    if (!jobId) return;
    try {
      await resumeJob({ job_id: jobId, action: "drop", ids });
      follow(jobId);
    } catch (e) {
      setStatusText("오류: " + (e as Error).message);
    }
  };

  const handleToggleWeight = async (id: string, to: "must" | "nice") => {
    if (!jobId) return;
    try {
      await resumeJob({ job_id: jobId, action: "weight", ids: [id], to });
      follow(jobId);
    } catch (e) {
      setStatusText("오류: " + (e as Error).message);
    }
  };

  return (
    <div className="max-w-[920px] mx-auto px-4 py-5 pb-16">
      <header className="flex items-center gap-3 flex-wrap mb-4">
        <h1 className="text-lg font-semibold tracking-tight">influencer-agent</h1>
        <div className="ml-auto">
          <StatusBadges />
        </div>
      </header>

      <div className="space-y-3">
        <SearchForm
          onSubmit={handleSubmit}
          disabled={status === "running"}
        />

        {plan && status === "paused" && (
          <PlanReview
            plan={plan}
            hints={hints}
            onApprove={handleApprove}
            onRevise={handleRevise}
            onDrop={handleDrop}
            onToggleWeight={handleToggleWeight}
            disabled={status !== "paused"}
          />
        )}

        <ProgressLog logs={logs} status={status} statusText={statusText} />

        {result && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-dim">
              결과 — {result.passed.length}명 통과
              {result.rejected.length > 0 && ` · ${result.rejected.length}명 탈락`}
              {result.elapsed > 0 && ` · ${result.elapsed}초`}
            </h2>
            {result.passed.map((p, i) => (
              <ResultCard
                key={p.handle}
                profile={p}
                conditions={result.plan?.soft || []}
                rank={i + 1}
              />
            ))}

            {result.rejected.length > 0 && (
              <details>
                <summary className="text-xs text-dim cursor-pointer">
                  탈락 {result.rejected.length}명
                </summary>
                <div className="mt-2 space-y-1">
                  {result.rejected.map((r, i) => (
                    <p key={i} className="text-xs text-dim">
                      {r.name} ({r.handle}) — {r._reject}
                    </p>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
