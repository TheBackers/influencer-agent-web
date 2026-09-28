"use client";

import { useEffect, useState } from "react";
import { BarList } from "@/components/ops/charts";
import { getObserve, getScores } from "@/lib/api-v2";
import type { ObserveSeries, SLOItem, AgentScore } from "@/types/v2";

/** 관측 — SLO 충족표 · 에이전트별 지연 · 비용 · 토큰 (모두 이벤트 usage 에서 집계, 추정 없음) */
export default function ObservePage() {
  const [slo, setSlo] = useState<SLOItem[]>([]);
  const [series, setSeries] = useState<ObserveSeries[]>([]);
  const [agents, setAgents] = useState<AgentScore[]>([]);
  useEffect(() => {
    getObserve().then((o) => { setSlo(o.slo); setSeries(o.series); });
    getScores().then((s) => setAgents(s.agents));
  }, []);
  const target = (a: string) => agents.find((x) => x.agent === a)?.slo_p95_s;

  return (
    <>
      <section className="panel !p-0 overflow-hidden" aria-labelledby="slo-title">
        <h2 id="slo-title" className="m-0 px-4 pt-3 pb-2 text-[14.5px] font-semibold">SLO (지난 24시간)</h2>
        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse text-[13px] tabular">
            <thead className="bg-[var(--soft)]">
              <tr className="text-left text-[11.5px] text-[var(--dim)]">
                {["지표", "현재", "목표", "결과"].map((h) => <th key={h} scope="col" className="px-3 py-1.5 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {slo.map((s) => (
                <tr key={s.key} className="border-t border-[var(--border)]">
                  <td className="px-3 py-1.5">{s.label}</td>
                  <td className="px-3 py-1.5 font-semibold">{s.unit === "$" ? `$${s.value}` : `${s.value}${s.unit}`}</td>
                  <td className="px-3 py-1.5">{s.op === "<=" ? "≤" : "≥"} {s.unit === "$" ? `$${s.target}` : `${s.target}${s.unit}`}</td>
                  <td className="px-3 py-1.5">{s.pass ? <span className="text-[var(--pass)]">충족</span> : <b className="text-[var(--fail)]">미달</b>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 [&>*]:min-w-0 lg:grid-cols-2">
        <section className="panel" aria-labelledby="lat-title">
          <h2 id="lat-title" className="m-0 mb-2 text-[14.5px] font-semibold">에이전트별 p95 지연</h2>
          <BarList unit="s" rows={series.map((s) => ({ label: s.agent, value: s.p95_s, target: target(s.agent), sub: `p50 ${s.p50_s}s · p99 ${s.p99_s}s` }))} />
        </section>
        <section className="panel" aria-labelledby="cost-title">
          <h2 id="cost-title" className="m-0 mb-2 text-[14.5px] font-semibold">에이전트별 비용 / 검색</h2>
          <BarList unit="" format={(v) => `$${v.toFixed(3)}`} rows={series.map((s) => ({ label: s.agent, value: s.cost_usd, sub: `토큰 ${s.tokens_in.toLocaleString()} / ${s.tokens_out.toLocaleString()}` }))} />
          <p className="m-0 mt-1 text-[12px] text-[var(--dim)]">인스타·유튜브·도시에 에이전트는 코드만 돌아 LLM 비용이 0입니다.</p>
        </section>
      </div>

      <section className="panel !p-0 overflow-hidden" aria-labelledby="tok-title">
        <h2 id="tok-title" className="m-0 px-4 pt-3 pb-2 text-[14.5px] font-semibold">에이전트별 상세 (검색 평균)</h2>
        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px] tabular">
            <thead className="bg-[var(--soft)]">
              <tr className="text-left text-[11.5px] text-[var(--dim)]">
                {["에이전트", "p50", "p95", "p99", "입력 토큰", "출력 토큰", "비용", "오류율", "재시도율", "캐시 적중"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-1.5 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.agent} className="border-t border-[var(--border)]">
                  <td className="px-3 py-1.5 whitespace-nowrap">{s.agent}</td>
                  <td className="px-3 py-1.5">{s.p50_s}s</td>
                  <td className="px-3 py-1.5">{s.p95_s}s</td>
                  <td className="px-3 py-1.5">{s.p99_s}s</td>
                  <td className="px-3 py-1.5">{s.tokens_in.toLocaleString()}</td>
                  <td className="px-3 py-1.5">{s.tokens_out.toLocaleString()}</td>
                  <td className="px-3 py-1.5">${s.cost_usd.toFixed(3)}</td>
                  <td className="px-3 py-1.5">{s.error_rate}%</td>
                  <td className={`px-3 py-1.5 ${s.retry_rate > 9 ? "text-[var(--unknown)]" : ""}`}>{s.retry_rate}%</td>
                  <td className="px-3 py-1.5">{s.cache_hit}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
