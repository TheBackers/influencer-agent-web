"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TrendPanels } from "@/components/ops/trend";
import { GateCard } from "@/components/ops/measure";
import { OctagonAlert } from "lucide-react";
import { SeverityChip, StatusChip, secs, usd } from "@/components/ops/live";
import { getOpsAgents, getOpsHealth, getOpsMeasure, getOpsTrend, listOpsMissions } from "@/lib/api-v2";
import type { OpsCatalog, OpsHealth, OpsMeasure, OpsMissionRow, OpsTrendRow } from "@/types/v2";

const MSTATUS: Record<string, string> = { ok: "ok", partial: "partial", failed: "failed", running: "running", compile: "waiting" };
const when = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return iso;
  }
};

/** AgentOps 개요 — 지금 막힌 것 · 최근 검색(문제 있는 것이 눈에 띄게) · 에이전트 상태 */
export default function OpsOverviewPage() {
  const [rows, setRows] = useState<OpsMissionRow[] | null>(null);
  const [health, setHealth] = useState<OpsHealth | null>(null);
  const [cat, setCat] = useState<OpsCatalog | null>(null);
  const [err, setErr] = useState("");
  const [trend, setTrend] = useState<OpsTrendRow[] | null>(null);
  const [trendErr, setTrendErr] = useState("");
  const [withMock, setWithMock] = useState<boolean | null>(null);
  const [measure, setMeasure] = useState<OpsMeasure | null>(null);
  const router = useRouter();

  useEffect(() => {
    listOpsMissions().then(setRows).catch((e) => setErr(String(e?.message || e)));
    getOpsHealth().then(setHealth).catch(() => setHealth({ checks: [], blocked: [] }));
    getOpsAgents().then(setCat).catch(() => null);
    getOpsMeasure().then(setMeasure).catch(() => null);
    getOpsTrend(40).then(setTrend).catch((e) => setTrendErr(String(e?.message || e)));
  }, []);
  const hasReal = !!trend?.some((r) => r.mode !== "mock");
  const showMock = withMock ?? !hasReal; // 실제 실행이 있으면 모의 실행은 기본으로 뺀다
  const trendRows = useMemo(() => (trend ?? []).filter((r) => r.status !== "running" && (showMock || r.mode !== "mock")), [trend, showMock]);

  const reds = health?.checks.filter((c) => c.status === "red" && ["H1", "H2", "H3", "H10"].includes(c.id)) ?? []; // 막힘(키 · 연결 · 쿼터 · 기록)만 — 품질 · SLO 빨강은 배포 판정 카드에

  return (
    <>
      {(health?.blocked.length || reds.length) ? (
        <section role="alert" className="rounded-lg border px-4 py-3 flex flex-col gap-1.5" style={{ borderColor: "var(--fail)", background: "var(--fail-bg)" }}>
          <h2 className="m-0 flex items-center gap-2 text-[14px] font-semibold" style={{ color: "var(--fail)" }}>
            <OctagonAlert aria-hidden size={16} /> 지금 막혀 있는 것
          </h2>
          {health?.blocked.map((b) => (
            <p key={b.tool} className="m-0 text-[13px]"><b translate="no">{b.tool}</b> — {b.impact} <span className="text-[var(--dim)]">({b.reason})</span></p>
          ))}
          {reds.map((c) => (
            <p key={c.id} className="m-0 text-[13px]"><b>{c.id} {c.label}</b> — {c.value}{c.action && <> · {c.action}</>}</p>
          ))}
          <Link href="/ops/diagnose" className="text-[12.5px]">진단 전체 보기</Link>
        </section>
      ) : null}

      {measure && <GateCard g={measure.gate} version={measure.version} window={measure.window} />}

      <section className="surface px-4 py-3" aria-labelledby="tr-title">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
          <h2 id="tr-title" className="m-0 text-[14px] font-semibold">검색 추이</h2>
          <span className="text-[12.5px] text-[var(--dim)]">최근 {trendRows.length}건 · 배포 뒤 비용이 늘거나 결과 · 평가가 나빠졌는지 봅니다</span>
          <label className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] text-[var(--dim)]">
            <input type="checkbox" checked={showMock} onChange={(e) => setWithMock(e.target.checked)} /> 모의 실행 포함
          </label>
        </div>
        {trendErr && <p className="m-0 text-[13px] text-[var(--fail)]">추이를 불러오지 못했습니다: {trendErr}</p>}
        {!trend && !trendErr && <p className="m-0 text-[13px] text-[var(--dim)]">불러오는 중…</p>}
        {trend && <TrendPanels rows={trendRows} onPick={(mid) => router.push(`/ops/trace?m=${mid}`)} />}
      </section>

      <section className="surface" aria-labelledby="m-title">
        <div className="flex items-baseline gap-2 px-4 pt-3.5 pb-2">
          <h2 id="m-title" className="m-0 text-[14px] font-semibold">최근 검색</h2>
          <span className="text-[12.5px] text-[var(--dim)]">줄을 누르면 그 검색이 어떻게 돌았는지 봅니다</span>
        </div>
        {err && <p className="m-0 px-4 pb-3 text-[13px] text-[var(--fail)]">기록을 불러오지 못했습니다: {err}</p>}
        {rows && !rows.length && <p className="m-0 px-4 pb-3 text-[13px] text-[var(--dim)]">아직 기록이 없습니다. 검색을 한 번 실행하세요.</p>}
        {rows && rows.length > 0 && (
          <div className="relative overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px] tabular min-w-[760px]">
              <thead>
                <tr className="text-left text-[11.5px] text-[var(--dim)] bg-[var(--soft)]">
                  {["시각", "요청", "상태", "결과", "시간", "비용", "문제"].map((h) => <th key={h} scope="col" className="px-3 py-1.5 font-semibold whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const crit = r.critical ?? r.errors + r.failed_tasks;
                  const warn = r.warning ?? r.interventions;
                  return (
                    <tr key={r.mission_id} className="border-t border-[var(--border)] hover:bg-[var(--soft)]">
                      <td className="px-3 py-2 whitespace-nowrap text-[var(--dim)]">{when(r.started_at)}</td>
                      <td className="px-3 py-2 max-w-[380px]">
                        <Link href={`/ops/trace?m=${r.mission_id}`} className="block truncate no-underline text-[var(--foreground)] hover:text-[var(--accent)]" title={r.request ?? ""}>
                          {r.request || <span className="text-[var(--dim)]">(요청문 없음)</span>}
                        </Link>
                        <span className="text-[11px] text-[var(--dim)]" translate="no">{r.mission_id}</span>
                      </td>
                      <td className="px-3 py-2"><StatusChip s={MSTATUS[r.status] ?? "partial"} /></td>
                      <td className={`px-3 py-2 whitespace-nowrap ${r.requested && (r.returned ?? 0) < r.requested ? "text-[var(--unknown)] font-semibold" : ""}`}>
                        {r.returned ?? "—"}/{r.requested ?? "—"}명
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{secs(r.latency_ms)}</td>
                      <td className="px-3 py-2">{r.cost_usd != null ? usd(r.cost_usd) : "—"}</td>
                      <td className="px-3 py-2">
                        <span className="flex flex-wrap gap-1">
                          {crit > 0 && <span className="inline-flex items-center gap-1"><SeverityChip s="critical" /><span className="tabular">{crit}</span></span>}
                          {warn > 0 && <span className="inline-flex items-center gap-1"><SeverityChip s="warning" /><span className="tabular">{warn}</span></span>}
                          {!crit && !warn && <span className="text-[var(--dim)]">없음</span>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!rows && !err && <p className="m-0 px-4 pb-3 text-[13px] text-[var(--dim)]">불러오는 중…</p>}
      </section>

      {cat && (
        <section className="surface" aria-labelledby="a-title">
          <div className="flex items-baseline gap-2 px-4 pt-3.5 pb-2">
            <h2 id="a-title" className="m-0 text-[14px] font-semibold">에이전트 상태</h2>
            <span className="text-[12.5px] text-[var(--dim)]">최근 검색 {cat.recent_missions}건 기준</span>
            <Link href="/ops/agents" className="ml-auto text-[12.5px]">구성 · 명세 보기</Link>
          </div>
          <div className="relative overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px] tabular min-w-[640px]">
              <thead>
                <tr className="text-left text-[11.5px] text-[var(--dim)] bg-[var(--soft)]">
                  {["에이전트", "툴은 누가 고르나", "실행", "성공률", "p95", "평균 LLM · 툴", "1회 평균 비용"].map((h) => <th key={h} scope="col" className="px-3 py-1.5 font-semibold whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {cat.agents.filter((a) => a.status !== "disabled").map((a) => {
                  const r = a.recent;
                  const rate = r?.success_rate;
                  return (
                    <tr key={a.name} className="border-t border-[var(--border)]">
                      <td className="px-3 py-1.5"><span className="font-medium">{a.label}</span> <span className="text-[11px] text-[var(--dim)]" translate="no">{a.name}</span></td>
                      <td className="px-3 py-1.5">{a.tool_choice}</td>
                      <td className="px-3 py-1.5">{r ? `${r.runs}회` : "—"}</td>
                      <td className={`px-3 py-1.5 font-semibold ${rate == null ? "" : rate < 0.8 ? "text-[var(--fail)]" : rate < 0.95 ? "text-[var(--unknown)]" : "text-[var(--pass)]"}`}>
                        {rate == null ? <span className="font-normal text-[var(--dim)]">—</span> : `${Math.round(rate * 100)}%`}
                        {r && r.failed > 0 && <span className="ml-1 font-normal text-[var(--dim)]">실패 {r.failed}</span>}
                      </td>
                      <td className="px-3 py-1.5">{r ? secs(r.p95_ms) : "—"}</td>
                      <td className="px-3 py-1.5 text-[var(--dim)]">{r ? `${r.avg_llm_calls} · ${r.avg_tool_calls}` : "—"}</td>
                      <td className="px-3 py-1.5">{r?.avg_usd != null ? usd(r.avg_usd) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
