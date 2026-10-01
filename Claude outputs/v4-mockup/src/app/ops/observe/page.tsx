"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { num, tbl } from "@/components/v2/ui";
import { Meter } from "@/components/catalog/bits";
import { Tabs, usd } from "@/components/v4/bits";
import ObserveSlo from "@/components/ops/observe-slo";
import DiagnosePage from "@/app/ops/diagnose/page";
import { getCost } from "@/lib/api-v4";
import type { CostV4 } from "@/types/v4";

type Tab = "slo" | "cost" | "diagnose";
const TABS: { k: Tab; label: string }[] = [{ k: "slo", label: "SLO" }, { k: "cost", label: "비용" }, { k: "diagnose", label: "진단" }];

/** 관측 (v4 · B8) — 옛 관측(SLO) · 진단을 탭으로 합치고 비용(모델 · CI · LangSmith)을 더한다 */
export default function ObservePage() {
  return <Suspense fallback={<p className="text-[var(--dim)]">불러오는 중…</p>}><Observe /></Suspense>;
}

function Observe() {
  const q = useSearchParams();
  const router = useRouter();
  const tab = (q.get("tab") as Tab) || "slo";
  return (
    <>
      <Tabs tabs={TABS} value={tab} onChange={(k) => router.replace(`/ops/observe?tab=${k}`)} label="관측" />
      {tab === "slo" && (
        <>
          <LlmopsSlo />
          <ObserveSlo />
        </>
      )}
      {tab === "cost" && <Cost />}
      {tab === "diagnose" && <DiagnosePage />}
    </>
  );
}

/** v4에서 더하는 SLO — 적재 · LLMOps(설계서 13-6) */
function LlmopsSlo() {
  const rows: [string, string, string, boolean][] = [
    ["적재", "하루 새 인물 7일 평균", "186 (≥ 180)", true],
    ["적재", "7일 안 갱신(활동 중 크리에이터)", "94% (≥ 90%)", true],
    ["적재", "한 분야 비중(7일 새 인물)", "최대 7.1% (≤ 25%)", true],
    ["적재", "적재 오류율", "0.2% (≤ 5%)", true],
    ["적재", "24시간 넘게 밀린 작업", "0", true],
    ["LLMOps", "CI 채점을 거친 배포", "3/3 (eval-skip 1 · 이유 기록)", true],
    ["LLMOps", "배포 뒤 빨강 → 사람 확인", "5시간째 미확인 (≤ 24시간)", false],
    ["LLMOps", "CI 비용(이번 달)", "$0.21 (≤ $10)", true],
  ];
  return (
    <section className="surface" aria-label="적재 · LLMOps SLO">
      <p className="m-0 px-4 pt-3 pb-2 text-[13px] font-semibold">적재 · LLMOps SLO <span className="font-normal text-[12.5px] text-[var(--dim)]">— v4에서 더함 · 검색 SLO는 아래</span></p>
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-[13px] min-w-[560px]">
          <thead><tr>{["쪽", "지표", "지금 (기준)", ""].map((h, i) => <th key={i} scope="col" className={tbl.th}>{h}</th>)}</tr></thead>
          <tbody>{rows.map(([s, k, v, ok]) => (
            <tr key={k}><td className={tbl.td}>{s}</td><td className={tbl.td}>{k}</td><td className={`${tbl.td} tabular`}>{v}</td>
              <td className={tbl.td}><span className="text-[12px] font-medium" style={{ color: ok ? "var(--pass)" : "var(--unknown)" }}>{ok ? "충족" : "지켜보는 중"}</span></td></tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}

function Cost() {
  const [c, setC] = useState<CostV4 | null>(null);
  useEffect(() => { getCost().then(setC); }, []);
  if (!c) return <p className="m-0 text-[13px] text-[var(--dim)]">불러오는 중…</p>;
  const total = c.month.reduce((a, m) => a + m.usd, 0);
  return (
    <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4">
      <section className="surface" aria-label="이번 달 비용">
        <p className="m-0 px-4 pt-3 pb-2 text-[13px] font-semibold">이번 달 AI 비용 <span className="tabular">{usd(total)}</span></p>
        <table className="w-full border-collapse text-[13px]">
          <tbody>
            {c.month.map((m) => (
              <tr key={m.k}>
                <td className={tbl.td}>{m.k}<br /><span className="text-[12px] text-[var(--dim)]">{m.note}</span></td>
                <td className={`${tbl.td} tabular text-right whitespace-nowrap`}>{usd(m.usd)}{m.cap ? <span className="text-[var(--dim)]"> / ${m.cap}</span> : null}</td>
                <td className={`${tbl.td} w-[120px]`}>{m.cap ? <Meter value={m.usd} max={m.cap} /> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="m-0 px-4 py-2 text-[12px] text-[var(--dim)]">서버 · DB 요금(Railway · Supabase)은 여기에 없습니다 — 각 콘솔에서.</p>
      </section>
      <div className="flex flex-col gap-4 min-w-0">
        <section className="surface px-4 py-3 flex flex-col gap-2" aria-label="LangSmith">
          <p className="m-0 text-[13px] font-semibold">LangSmith 트레이스 (이번 달)</p>
          <p className="m-0 text-[20px] font-semibold tabular">{num(c.langsmith.traces)} <span className="text-[13px] font-normal text-[var(--dim)]">/ 무료 {num(c.langsmith.cap)}</span></p>
          <Meter value={c.langsmith.traces} max={c.langsmith.cap} />
          <p className="m-0 text-[12px] text-[var(--dim)]">{c.langsmith.by.map((b) => `${b.k} ${b.n}`).join(" · ")} — 14일 보관. 오래 볼 기록은 agentops(30일 · 문제 180일)</p>
        </section>
        <section className="surface px-4 py-3 flex flex-col gap-2" aria-label="CI 채점">
          <p className="m-0 text-[13px] font-semibold">CI 채점 (이번 달)</p>
          <p className="m-0 text-[20px] font-semibold tabular">{usd(c.ci.usd)} <span className="text-[13px] font-normal text-[var(--dim)]">/ ${c.ci.cap} · {c.ci.runs}회</span></p>
          <Meter value={c.ci.usd} max={c.ci.cap} />
          <p className="m-0 text-[12px] text-[var(--dim)]">한 번 $1 · 월 $10을 넘으면 채점하지 않고 ‘측정 부족’(D56) · eval-skip {c.ci.skipped}회</p>
        </section>
      </div>
    </div>
  );
}
