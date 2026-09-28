"use client";

import { useEffect, useState } from "react";
import { MChip, pct } from "@/components/ops/measure";
import { getOpsMeasure } from "@/lib/api-v2";
import type { OpsEvaluator, OpsMeasure } from "@/types/v2";

const SRC: Record<OpsEvaluator["source"], string> = {
  online: "운영 기록", offline: "오프라인 평가", proxy: "대리 지표", guard: "코드 보장", none: "측정 안 함",
};
const th = "px-3 py-1.5 font-semibold whitespace-nowrap";
const td = "px-3 py-2 align-top";

/** 품질 평가 — PRD 10장 평가 9개(치명 4 · 점수 4 · 참고 1) + 단위 평가 2개.
 *  운영 기록으로 재는 것 · 대리 지표 · 코드가 보장해 결과엔 늘 0건인 것(측정값 아님) · 아직 못 재는 것을 구분한다 */
export default function EvalPage() {
  const [m, setM] = useState<OpsMeasure | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { getOpsMeasure().then(setM).catch((e) => setErr(String(e?.message || e))); }, []);
  if (err) return <p className="m-0 text-[13px] text-[var(--fail)]">불러오지 못했습니다: {err}</p>;
  if (!m) return <p className="m-0 text-[13px] text-[var(--dim)]">재는 중…</p>;
  const c = m.scorecard;
  const missing = c.evaluators.filter((e) => e.source === "none" || e.source === "proxy" || e.source === "guard");
  const nScore = c.evaluators.filter((e) => e.kind === "score").length;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile k="종합 점수 (점수 평가 평균)" v={c.composite == null ? "—" : c.composite.toFixed(2)}
          sub={`기준 ≥ ${c.composite_target.toFixed(2)} · ${nScore}개 중 ${c.composite_measured}개로 계산 (참고 · 코드 보장은 뺌)`}
          bad={c.composite != null && c.composite < c.composite_target} />
        <Tile k="치명 평가" v={c.critical_failed.length ? `미달 ${c.critical_failed.length}` : "통과"}
          sub={c.critical_failed.length ? `미달: ${c.critical_failed.join(" · ")}` : "잰 치명 평가는 모두 기준 충족"} bad={c.critical_failed.length > 0} />
        <Tile k="측정 범위" v={`${c.searches}건`} sub={`${m.window} · 사람 평가 ${c.rated}건`} />
      </div>

      <section className="surface" aria-labelledby="ev-title">
        <div className="flex flex-wrap items-baseline gap-x-3 px-4 pt-3.5 pb-2">
          <h2 id="ev-title" className="m-0 text-[14px] font-semibold">평가 9개</h2>
          <span className="text-[12.5px] text-[var(--dim)]">치명은 하나라도 미달이면 배포 금지 · 지연 · 비용 · 오류율은 관측(SLO)에서</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px] tabular min-w-[860px]">
            <thead><tr className="text-left text-[11.5px] text-[var(--dim)] bg-[var(--soft)]">
              {["평가", "종류", "방식 (PRD)", "기준", "현재", "상태", "어디서 쟀나", "근거 · 재는 법"].map((h) => <th key={h} scope="col" className={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {c.evaluators.map((e) => (
                <tr key={e.key} className="border-t border-[var(--border)]">
                  <td className={`${td} font-medium whitespace-nowrap`}>{e.no} {e.name}</td>
                  <td className={td}>{e.kind === "critical" ? <span className="text-[var(--fail)] font-medium">치명</span> : e.kind === "signal" ? <span className="text-[var(--dim)]">참고</span> : "점수"}</td>
                  <td className={`${td} text-[var(--dim)] whitespace-nowrap`}>{e.method}</td>
                  <td className={`${td} whitespace-nowrap text-[var(--dim)]`}>{e.kind === "critical" && e.threshold === 1 ? "= 1.00" : `≥ ${e.threshold.toFixed(2)}`}</td>
                  <td className={`${td} font-semibold whitespace-nowrap`}>{e.source === "guard" ? <span className="font-normal">결과 0건{e.caught ? <span className="text-[var(--dim)]"> · 막음 {e.caught}</span> : ""}</span> : e.value == null ? "—" : e.value.toFixed(2)}</td>
                  <td className={td}><MChip s={e.status} /></td>
                  <td className={`${td} whitespace-nowrap ${e.source === "none" || e.source === "guard" ? "text-[var(--dim)]" : e.source === "proxy" ? "text-[var(--unknown)]" : ""}`}>{SRC[e.source]}</td>
                  <td className={`${td} text-[12px] max-w-[360px]`}>
                    {e.basis && <div>{e.basis}</div>}
                    {e.how && <div className="text-[var(--dim)]">{e.how}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface" aria-labelledby="unit-title">
        <h2 id="unit-title" className="m-0 px-4 pt-3.5 pb-2 text-[14px] font-semibold">단위 평가 <span className="font-normal text-[12.5px] text-[var(--dim)]">프롬프트 · 모델을 바꿀 때마다 · 게이트 전</span></h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px] tabular min-w-[640px]">
            <thead><tr className="text-left text-[11.5px] text-[var(--dim)] bg-[var(--soft)]">
              {["평가", "기준", "마지막 점수", "상태", "언제 · 버전", "실행"].map((h) => <th key={h} scope="col" className={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {c.unit.map((u) => (
                <tr key={u.suite + u.evaluator} className="border-t border-[var(--border)]">
                  <td className={`${td} font-medium`}>{u.label}</td>
                  <td className={`${td} text-[var(--dim)]`}>≥ {pct(u.threshold)}</td>
                  <td className={`${td} font-semibold`}>{pct(u.value)}</td>
                  <td className={td}><MChip s={u.status} label={u.status === "none" ? "실행 안 함" : undefined} /></td>
                  <td className={`${td} text-[var(--dim)]`} translate="no">{u.at ? `${u.at} · ${u.version}` : "—"}</td>
                  <td className={`${td} text-[12px]`}><code translate="no">{u.how || "—"}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 px-4 py-2.5 text-[12px] text-[var(--dim)] border-t border-[var(--border)]">
          단위 평가는 PC 에서 돌리면 점수가 Ops 저장소에 남아 여기에 나옵니다 (예전엔 PC 의 파일에만 남았습니다).
        </p>
      </section>

      {missing.length > 0 && (
        <section className="surface px-4 py-3" aria-labelledby="miss-title">
          <h2 id="miss-title" className="m-0 mb-1.5 text-[14px] font-semibold">아직 제대로 못 재는 것 {missing.length}개</h2>
          <ul className="m-0 pl-5 space-y-1 text-[12.5px]">
            {missing.map((e) => (
              <li key={e.key}><b>{e.no} {e.name}</b> — {e.source === "proxy" ? "지금은 대리 지표로 봅니다. " : e.source === "guard" ? "결과는 코드가 막지만 정확도는 아닙니다. " : ""}{e.how}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Tile({ k, v, sub, bad }: { k: string; v: string; sub: string; bad?: boolean }) {
  return (
    <div className="surface px-4 py-3">
      <div className="text-[12px] text-[var(--dim)]">{k}</div>
      <div className={`text-[22px] font-semibold tabular ${bad ? "text-[var(--fail)]" : ""}`}>{v}</div>
      <div className="text-[12px] text-[var(--dim)] break-words">{sub}</div>
    </div>
  );
}
