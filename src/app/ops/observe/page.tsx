"use client";

import { useEffect, useState } from "react";
import { MChip, fmt, fmtTarget, pct } from "@/components/ops/measure";
import { usd } from "@/components/ops/live";
import { getOpsMeasure } from "@/lib/api-v2";
import type { OpsMeasure } from "@/types/v2";

const AGENT_KO: Record<string, string> = {
  "query-planner": "조건 설계", scout: "발굴", "web-researcher": "웹 조사", "account-linker": "계정 연결",
  "yt-researcher": "유튜브", "ig-researcher": "인스타", verifier: "조건 판정", profiler: "정리",
};
const th = "px-3 py-1.5 font-semibold whitespace-nowrap";
const td = "px-3 py-2 align-top";

/** 관측 — PRD 11장 SLO 10개 + 에이전트 지연 · 모델 · 검색 공급사 + 단계별 품질(발굴 · 계정 연결 · 확인률 예측 · 비용 추정) */
export default function ObservePage() {
  const [mock, setMock] = useState<"auto" | "1" | "0">("auto");
  const [data, setData] = useState<{ key: string; m?: OpsMeasure; err?: string } | null>(null);
  useEffect(() => {
    getOpsMeasure(mock).then((m) => setData({ key: mock, m })).catch((e) => setData({ key: mock, err: String(e?.message || e) }));
  }, [mock]);
  const m = data?.key === mock ? data.m : undefined;
  if (data?.err) return <p className="m-0 text-[13px] text-[var(--fail)]">불러오지 못했습니다: {data.err}</p>;
  if (!m) return <p className="m-0 text-[13px] text-[var(--dim)]">재는 중…</p>;
  const o = m.observe;
  const st = o.stages;
  const fails = o.slo.filter((s) => s.status === "fail").length;

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
        <span className="text-[var(--dim)]">측정 범위: <b className="text-[var(--foreground)] font-medium">{m.window}</b></span>
        <label className="ml-auto inline-flex items-center gap-1.5 text-[var(--dim)]">
          <input type="checkbox" checked={mock === "1"} onChange={(e) => setMock(e.target.checked ? "1" : "auto")} /> 모의 실행 포함
        </label>
      </div>

      <section className="surface" aria-labelledby="slo-title">
        <div className="flex flex-wrap items-baseline gap-x-3 px-4 pt-3.5 pb-2">
          <h2 id="slo-title" className="m-0 text-[14px] font-semibold">SLO 충족표</h2>
          <span className="text-[12.5px] text-[var(--dim)]">{o.slo.length}개 중 미달 {fails}개 · 모든 수치는 이벤트에서 집계(추정 없음)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px] tabular min-w-[760px]">
            <thead><tr className="text-left text-[11.5px] text-[var(--dim)] bg-[var(--soft)]">
              {["지표", "현재", "기준", "상태", "재는 법 · 세부"].map((h) => <th key={h} scope="col" className={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {o.slo.map((s) => (
                <tr key={s.key} className="border-t border-[var(--border)]">
                  <td className={`${td} font-medium whitespace-nowrap`}>{s.label}</td>
                  <td className={`${td} whitespace-nowrap font-semibold`}>{fmt(s.value, s.format)}</td>
                  <td className={`${td} whitespace-nowrap text-[var(--dim)]`}>{fmtTarget(s)}</td>
                  <td className={td}><MChip s={s.status} /></td>
                  <td className={`${td} text-[12px]`}>
                    <span className="text-[var(--dim)]">{s.rule}</span>
                    {s.detail && <div>{s.detail}</div>}
                    {s.note && <div className="text-[var(--accent)]">※ {s.note}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="stage-title">
        <h2 id="stage-title" className="m-0 mb-2 text-[14px] font-semibold">단계별 품질 <span className="font-normal text-[12.5px] text-[var(--dim)]">SLO 에는 없지만 원인을 좁히는 숫자</span></h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card title="발굴" rows={[
            ["검색당 라운드", st.discover.rounds_avg == null ? "—" : `${st.discover.rounds_avg}회`],
            ["발굴 → 선별", `${st.discover.discovered} → ${st.discover.screened}명 (${pct(st.discover.screen_rate)})`],
            ["인스타 조회 안 됨", pct(st.discover.ig_unreadable_rate)],
            ["새 후보 0명 라운드가 있던 검색", `${st.discover.empty_searches}건`],
            ["요청 인원 채움", pct(st.discover.fill_rate)],
          ]} foot={Object.keys(st.discover.dropped_why).length
            ? `버린 후보 ${st.discover.dropped}명: ${Object.entries(st.discover.dropped_why).map(([k, v]) => `${k} ${v}`).join(" · ")}`
            : "버린 후보 이유는 새 버전부터 기록됩니다"} />
          <Card title="계정 연결" rows={[
            ["연결한 계정", `${st.link.linked}개`],
            ["평균 확신도", st.link.avg_conf == null ? "—" : st.link.avg_conf.toFixed(2)],
            ["확인 필요 (0.6 미만)", `${st.link.low}개 (${pct(st.link.low_rate)})`],
            ["버린 아이디", `${st.link.rejected}개`],
          ]} foot="정답 쌍 평가(재현율 · 오연결)는 품질 평가 화면" />
          <Card title="조건 확인률 예측" rows={[
            ["예측과 실제 일치", `${pct(st.coverage.match_rate)} (기준 ≥ ${pct(st.coverage.target)})`],
            ["잰 조건", `${st.coverage.conditions}개`],
            ["평균 결정률 (탈락자 포함)", pct(st.coverage.avg_known)],
          ]} foot={st.coverage.note} warn={st.coverage.match_rate != null && st.coverage.match_rate < st.coverage.target} />
          <Card title="비용 추정 정확도" rows={[
            ["실제 ÷ 추정", st.estimate.ratio == null ? "—" : `${st.estimate.ratio}배`],
            ["실제가 '최대' 안에 든 비율", pct(st.estimate.within_high_rate)],
            ["잰 검색", `${st.estimate.searches}건`],
          ]} foot={st.estimate.searches ? st.estimate.note : "새 버전부터 실행 전 추정을 기록해 대조합니다"}
            warn={st.estimate.ratio != null && (st.estimate.ratio > 1.5 || st.estimate.ratio < 0.5)} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface" aria-labelledby="ag-title">
          <h2 id="ag-title" className="m-0 px-4 pt-3.5 pb-2 text-[14px] font-semibold">에이전트 지연 <span className="font-normal text-[12.5px] text-[var(--dim)]">p95 vs 명세 slo.p95_s</span></h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px] tabular">
              <thead><tr className="text-left text-[11.5px] text-[var(--dim)] bg-[var(--soft)]">
                {["에이전트", "실행", "p50", "p95", "목표", "상태"].map((h) => <th key={h} scope="col" className={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {o.agents.map((a) => (
                  <tr key={a.agent} className="border-t border-[var(--border)]">
                    <td className={td}>{AGENT_KO[a.agent] ?? a.agent}</td>
                    <td className={td}>{a.runs}</td>
                    <td className={td}>{a.p50_s}초</td>
                    <td className={`${td} font-semibold`}>{a.p95_s}초</td>
                    <td className={`${td} text-[var(--dim)]`}>{a.target_s ? `${a.target_s}초` : "—"}</td>
                    <td className={td}><MChip s={a.status} /></td>
                  </tr>
                ))}
                {!o.agents.length && <tr><td colSpan={6} className={`${td} text-[var(--dim)]`}>작업 기록이 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface" aria-labelledby="md-title">
          <h2 id="md-title" className="m-0 px-4 pt-3.5 pb-2 text-[14px] font-semibold">모델별 토큰 · 비용 <span className="font-normal text-[12.5px] text-[var(--dim)]">호출마다 그 모델 단가</span></h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px] tabular">
              <thead><tr className="text-left text-[11.5px] text-[var(--dim)] bg-[var(--soft)]">
                {["모델", "호출", "입력", "출력", "비용"].map((h) => <th key={h} scope="col" className={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {o.models.map((x) => (
                  <tr key={x.model} className="border-t border-[var(--border)]">
                    <td className={td} translate="no">{x.model}</td>
                    <td className={td}>{x.calls}</td>
                    <td className={td}>{x.tokens_in.toLocaleString()}</td>
                    <td className={td}>{x.tokens_out.toLocaleString()}</td>
                    <td className={`${td} font-semibold`}>{usd(x.usd)}</td>
                  </tr>
                ))}
                {!o.models.length && <tr><td colSpan={5} className={`${td} text-[var(--dim)]`}>LLM 호출 기록이 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="m-0 px-4 py-2.5 text-[12px] text-[var(--dim)] border-t border-[var(--border)]">
            검색 공급사: {o.providers.length ? o.providers.map((p) => `${p.provider} ${p.calls}회`).join(" · ") : "기록 없음"}
            {o.providers.length === 1 && " — 한 곳만 쓰였습니다. 다른 공급사 키가 빠졌는지 진단을 보세요"}
          </p>
        </section>
      </div>
    </>
  );
}

function Card({ title, rows, foot, warn }: { title: string; rows: [string, string][]; foot?: string; warn?: boolean }) {
  return (
    <div className="surface px-4 py-3 min-w-0" style={warn ? { borderColor: "var(--unknown)" } : undefined}>
      <h3 className="m-0 mb-1.5 text-[13.5px] font-semibold">{title}{warn && <span className="ml-1.5 text-[12px] font-normal text-[var(--unknown)]">확인 필요</span>}</h3>
      <dl className="m-0 space-y-1 text-[12.5px] tabular">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3"><dt className="text-[var(--dim)]">{k}</dt><dd className="m-0 text-right font-medium">{v}</dd></div>
        ))}
      </dl>
      {foot && <p className="m-0 mt-2 text-[11.5px] text-[var(--dim)] break-words">{foot}</p>}
    </div>
  );
}
