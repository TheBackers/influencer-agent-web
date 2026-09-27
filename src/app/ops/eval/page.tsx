"use client";

import { useEffect, useState } from "react";
import { TrendLine } from "@/components/ops/charts";
import { getScores } from "@/lib/api-v2";
import type { EvaluatorScore, ExperimentRow } from "@/types/v2";

type Data = Awaited<ReturnType<typeof getScores>>;
const passes = (e: EvaluatorScore) => e.score >= e.threshold - 1e-9;

/** 평가 — 종합점수 추세 · 평가자 24개 점수표(대상별) · 실험 목록 */
export default function EvalPage() {
  const [d, setD] = useState<Data | null>(null);
  const [onlyFail, setOnlyFail] = useState(false);
  useEffect(() => { getScores().then(setD); }, []);
  if (!d) return <p className="text-[var(--dim)]">불러오는 중</p>;

  const e2e = d.evaluators.filter((e) => e.target === "E2E");
  const w = e2e.reduce((a, e) => a + (e.weight ?? 0), 0);
  const comp = e2e.reduce((a, e) => a + (e.weight ?? 0) * e.score, 0) / w;
  const base = e2e.reduce((a, e) => a + (e.weight ?? 0) * (e.baseline ?? e.score), 0) / w;
  const critFail = d.evaluators.filter((e) => e.critical && !passes(e));
  const badAgents = d.agents.filter((a) => a.health === "red" && a.status !== "disabled");
  const targets = Array.from(new Set(d.evaluators.map((e) => e.target)));
  const shown = onlyFail ? d.evaluators.filter((e) => !passes(e)) : d.evaluators;

  return (
    <>
      <div className="grid gap-4 [&>*]:min-w-0 lg:grid-cols-[1.2fr_1fr]">
        <section className="panel" aria-labelledby="tr-title">
          <h2 id="tr-title" className="m-0 mb-1 text-[14.5px] font-semibold">종합점수 추세 (ia-golden, 최근 14일)</h2>
          <TrendLine points={d.trend} threshold={0.8} />
        </section>
        <section className="panel flex flex-col gap-2" aria-labelledby="pass-title">
          <h2 id="pass-title" className="m-0 text-[14.5px] font-semibold">통과 조건</h2>
          <Rule ok={comp >= 0.8} text={`종합 ${comp.toFixed(3)} ≥ 0.80`} />
          <Rule ok={critFail.length === 0} text={`치명 평가자 전부 통과 — 미달 ${critFail.length}개${critFail.length ? ` (${critFail.map((e) => e.key).join(", ")})` : ""}`} />
          <Rule ok={comp - base >= -0.03} text={`baseline ${base.toFixed(3)} 대비 Δ ${(comp - base).toFixed(3)} ≥ −0.03`} />
          <Rule ok={badAgents.length === 0} text={`기준 미달 에이전트 ${badAgents.length}개${badAgents.length ? ` (${badAgents.map((a) => a.agent).join(", ")})` : ""}`} />
          <p className="m-0 text-[12px] text-[var(--dim)]">종합 = E2E 평가자 8개의 가중 평균. baseline = 마지막 DEPLOY 버전의 같은 데이터셋 실험.</p>
        </section>
      </div>

      <section className="panel !p-0 overflow-hidden" aria-labelledby="sc-title">
        <div className="flex flex-wrap items-center gap-3 px-4 pt-3 pb-2">
          <h2 id="sc-title" className="m-0 text-[14.5px] font-semibold">평가자 {d.evaluators.length}개</h2>
          <label className="text-[12.5px] inline-flex items-center gap-1.5 ml-auto">
            <input type="checkbox" checked={onlyFail} onChange={(e) => setOnlyFail(e.target.checked)} className="accent-[var(--accent)]" />
            미달만 보기
          </label>
        </div>
        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px] tabular">
            <thead className="bg-[var(--soft)]">
              <tr className="text-left text-[11.5px] text-[var(--dim)]">
                {["대상", "평가자", "방식", "점수", "기준", "baseline", "Δ", "가중", "치명", "결과"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-1.5 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {targets.flatMap((t) => shown.filter((e) => e.target === t).map((e, i) => {
                const ok = passes(e);
                const delta = e.baseline !== undefined ? e.score - e.baseline : 0;
                return (
                  <tr key={e.key} className={`border-t border-[var(--border)] ${!ok && e.critical ? "bg-[var(--fail-bg)]" : ""}`}>
                    <td className="px-3 py-1.5 whitespace-nowrap text-[var(--dim)]">{i === 0 ? t : ""}</td>
                    <td className="px-3 py-1.5"><span className="font-mono text-[11.5px]">{e.key}</span><div className="text-[11.5px] text-[var(--dim)]">{e.label}</div></td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{e.method}</td>
                    <td className={`px-3 py-1.5 font-semibold ${ok ? "" : "text-[var(--fail)]"}`}>{e.score.toFixed(2)}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{e.op === "=" ? "=" : "≥"} {e.threshold.toFixed(2)}</td>
                    <td className="px-3 py-1.5">{e.baseline?.toFixed(2) ?? "—"}</td>
                    <td className={`px-3 py-1.5 ${delta < -0.03 ? "text-[var(--fail)]" : delta < 0 ? "text-[var(--unknown)]" : ""}`}>{delta >= 0 ? "+" : ""}{delta.toFixed(2)}</td>
                    <td className="px-3 py-1.5">{e.weight?.toFixed(2) ?? "—"}</td>
                    <td className="px-3 py-1.5">{e.critical ? "치명" : ""}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{ok ? <span className="text-[var(--pass)]">통과</span> : <b className="text-[var(--fail)]">미달</b>}</td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel !p-0 overflow-hidden" aria-labelledby="ex-title">
        <h2 id="ex-title" className="m-0 px-4 pt-3 pb-2 text-[14.5px] font-semibold">실험 (LangSmith Experiments)</h2>
        <ExperimentTable rows={d.experiments} />
      </section>
    </>
  );
}

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className="m-0 text-[13px] flex items-start gap-2">
      <span className={`font-bold w-[36px] shrink-0 ${ok ? "text-[var(--pass)]" : "text-[var(--fail)]"}`}>{ok ? "통과" : "미달"}</span>
      <span className="tabular">{text}</span>
    </p>
  );
}

function ExperimentTable({ rows }: { rows: ExperimentRow[] }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px] tabular">
        <thead className="bg-[var(--soft)]">
          <tr className="text-left text-[11.5px] text-[var(--dim)]">
            {["시각", "버전", "데이터셋", "종합", "치명 미달", "비용", ""].map((h, i) => (
              <th key={i} scope="col" className="px-3 py-1.5 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-[var(--border)]">
              <td className="px-3 py-1.5">{r.at}</td>
              <td className="px-3 py-1.5">{r.version}</td>
              <td className="px-3 py-1.5">{r.dataset}</td>
              <td className={`px-3 py-1.5 font-semibold ${r.composite < 0.8 ? "text-[var(--fail)]" : ""}`}>{r.composite.toFixed(2)}</td>
              <td className="px-3 py-1.5">{r.critical_failed}</td>
              <td className="px-3 py-1.5">${r.cost_usd.toFixed(2)}</td>
              <td className="px-3 py-1.5"><a href={r.url} target="_blank" rel="noopener noreferrer">비교 뷰</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
