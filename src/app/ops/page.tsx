"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import GateCard from "@/components/ops/gate-card";
import AgentScoreboard from "@/components/ops/agent-scoreboard";
import { MissionTimeline } from "@/components/ops/charts";
import { getOverview, runGate } from "@/lib/api-v2";
import type { OpsOverview } from "@/types/v2";

export default function OpsOverviewPage() {
  const [o, setO] = useState<OpsOverview | null>(null);
  useEffect(() => { getOverview().then(setO); }, []);
  if (!o) return <p className="text-[var(--dim)]">불러오는 중…</p>;

  const reds = o.health.filter((h) => h.status === "red").length;
  const yellows = o.health.filter((h) => h.status === "yellow").length;
  const delta = o.eval.composite - o.eval.baseline;

  return (
    <>
      <GateCard g={o.gate} onRerun={async () => { const g = await runGate(o.version); setO({ ...o, gate: g }); }} />

      <dl className="surface m-0 grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[var(--border)]">
        <Metric href="/ops/eval" label="평가 점수" value={o.eval.composite.toFixed(2)} bad={o.eval.composite < 0.8}
          sub={`지난 배포 ${o.eval.baseline.toFixed(2)}에서 ${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`} />
        <Metric href="/ops/observe" label="응답 시간 p95" value={`${o.observe.p95_s}초`} sub={`검색당 $${o.observe.cost_per_mission.toFixed(2)}, 오류 ${o.observe.error_rate}%`} />
        <Metric href="/ops/diagnose" label="진단" value={reds ? `위험 ${reds}` : "정상"} bad={reds > 0} sub={`10개 중 주의 ${yellows}개`} />
        <Metric href="/ops/trace" label="최근 24시간" value={`${o.trace.missions_24h}건`} sub={`이벤트 ${o.trace.events_24h.toLocaleString("ko-KR")}개 기록`} />
      </dl>

      <section className="surface" aria-labelledby="ag-title">
        <h2 id="ag-title" className="m-0 px-4 pt-3.5 pb-2 text-[14px] font-semibold">에이전트</h2>
        <AgentScoreboard agents={o.agents} />
      </section>

      <section className="surface p-4" aria-labelledby="tl-title">
        <div className="flex items-baseline gap-2 mb-2">
          <h2 id="tl-title" className="m-0 text-[14px] font-semibold">최근 검색 한 건의 흐름</h2>
          <Link href="/ops/trace" className="text-[12.5px] ml-auto">추적에서 보기</Link>
        </div>
        <MissionTimeline events={o.latest_mission.events} />
      </section>
    </>
  );
}

function Metric({ href, label, value, sub, bad }: { href: string; label: string; value: string; sub: string; bad?: boolean }) {
  return (
    <Link href={href} className="block px-4 py-3.5 no-underline text-[var(--foreground)] hover:bg-[var(--soft)]">
      <dt className="text-[12.5px] text-[var(--dim)]">{label}</dt>
      <dd className="m-0 mt-0.5 text-[22px] font-semibold tabular">{bad ? <span className="text-[var(--fail)]">{value}</span> : value}</dd>
      <dd className="m-0 text-[12px] text-[var(--dim)] tabular">{sub}</dd>
    </Link>
  );
}
