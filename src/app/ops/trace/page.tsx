"use client";

import { useEffect, useState } from "react";
import { MissionTimeline } from "@/components/ops/charts";
import { getRunEvents, listRuns } from "@/lib/api-v2";
import type { MissionRunSummary, TraceEvent } from "@/types/v2";

/** 추적 — 임무 목록 → 임무 1건의 이벤트(21종) 타임라인과 목록. 모든 행은 LangSmith run 으로 이어진다 */
export default function TracePage() {
  const [runs, setRuns] = useState<MissionRunSummary[]>([]);
  const [sel, setSel] = useState<string>("");
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [picked, setPicked] = useState<TraceEvent | null>(null);

  useEffect(() => {
    listRuns().then((r) => {
      setRuns(r);
      setSel(r[0]?.mission_id ?? "");
    });
  }, []);
  useEffect(() => {
    if (sel) getRunEvents(sel).then(setEvents);
  }, [sel]);

  const run = runs.find((r) => r.mission_id === sel);

  return (
    <>
      <section className="panel !p-0 overflow-hidden" aria-labelledby="runs-title">
        <h2 id="runs-title" className="m-0 px-4 pt-3 pb-2 text-[14.5px] font-semibold">임무 {runs.length}건 (최근순)</h2>
        <div className="relative overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full border-collapse text-[12.5px] tabular">
            <thead className="sticky top-0 bg-[var(--soft)]">
              <tr className="text-left text-[11.5px] text-[var(--dim)]">
                {["시각", "요청", "버전", "반환/요청", "시간", "비용", "확인률", "👍", "개입", "상태"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-1.5 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.mission_id} onClick={() => setSel(r.mission_id)}
                  className={`border-t border-[var(--border)] cursor-pointer ${sel === r.mission_id ? "bg-[var(--accent-bg)]" : "hover:bg-[var(--soft)]"}`}>
                  <td className="px-3 py-1.5 whitespace-nowrap">{r.at}</td>
                  <td className="px-3 py-1.5 max-w-[340px] truncate" title={r.request}>
                    <button type="button" className="text-left truncate max-w-full" onClick={(e) => { e.stopPropagation(); setSel(r.mission_id); }}>{r.request}</button>
                  </td>
                  <td className="px-3 py-1.5">{r.version}</td>
                  <td className={`px-3 py-1.5 ${r.returned < r.count ? "text-[var(--unknown)]" : ""}`}>{r.returned}/{r.count}</td>
                  <td className="px-3 py-1.5">{r.latency_s}s</td>
                  <td className="px-3 py-1.5">${r.cost_usd.toFixed(2)}</td>
                  <td className={`px-3 py-1.5 ${r.known_rate < 0.7 ? "text-[var(--fail)]" : ""}`}>{Math.round(r.known_rate * 100)}%</td>
                  <td className="px-3 py-1.5">{r.thumbs_up_rate === null ? "—" : `${Math.round(r.thumbs_up_rate * 100)}%`}</td>
                  <td className={`px-3 py-1.5 ${r.interventions > 2 ? "text-[var(--unknown)] font-semibold" : ""}`}>{r.interventions}</td>
                  <td className="px-3 py-1.5">{r.status === "ok" ? "정상" : r.status === "partial" ? "부분" : "실패"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {run && (
        <section className="panel" aria-labelledby="tl-title">
          <div className="flex flex-wrap items-baseline gap-x-3 mb-2">
            <h2 id="tl-title" className="m-0 text-[14.5px] font-semibold">임무 {run.mission_id} 타임라인</h2>
            <span className="text-[12.5px] text-[var(--dim)] truncate max-w-[560px]">{run.request}</span>
            <a href={run.trace_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-[12.5px]">LangSmith에서 열기</a>
          </div>
          <MissionTimeline events={events} onPick={setPicked} />
          {picked && (
            <p className="m-0 mt-2 text-[12.5px] rounded-md bg-[var(--soft)] px-3 py-2">
              <b>{picked.type}</b> · {picked.agent} · {picked.label}{" "}
              <a href={picked.run_url} target="_blank" rel="noopener noreferrer">이 run 열기</a>
            </p>
          )}
        </section>
      )}

      <section className="panel !p-0 overflow-hidden" aria-labelledby="ev-title">
        <h2 id="ev-title" className="m-0 px-4 pt-3 pb-2 text-[14.5px] font-semibold">이벤트 {events.length}개</h2>
        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px] tabular">
            <thead className="bg-[var(--soft)]">
              <tr className="text-left text-[11.5px] text-[var(--dim)]">
                {["시작", "길이", "type", "에이전트", "내용", "토큰 in/out", "비용", ""].map((h, i) => (
                  <th key={i} scope="col" className="px-3 py-1.5 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.event_id} className="border-t border-[var(--border)]">
                  <td className="px-3 py-1.5">{e.ts.toFixed(1)}s</td>
                  <td className="px-3 py-1.5">{e.dur ? `${e.dur.toFixed(1)}s` : "—"}</td>
                  <td className="px-3 py-1.5 font-mono text-[11.5px] whitespace-nowrap">{e.type}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">{e.agent}</td>
                  <td className={`px-3 py-1.5 ${e.status === "partial" ? "text-[var(--unknown)]" : ""}`}>{e.label}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">{e.tokens_in ? `${e.tokens_in.toLocaleString()} / ${e.tokens_out?.toLocaleString()}` : "—"}</td>
                  <td className="px-3 py-1.5">{e.cost_usd ? `$${e.cost_usd.toFixed(3)}` : "—"}</td>
                  <td className="px-3 py-1.5"><a href={e.run_url} target="_blank" rel="noopener noreferrer">run</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
