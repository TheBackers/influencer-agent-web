"use client";

import { useEffect, useState } from "react";
import { RunGraph, secs, usd } from "@/components/ops/live";
import { getOpsAgents } from "@/lib/api-v2";
import type { OpsCatalog, OpsGraphNode } from "@/types/v2";

const STEP_KO: Record<string, string> = {
  "research.web": "웹 조사", "research.link": "계정 연결", "research.youtube": "유튜브", "research.instagram": "인스타",
  "verify.conditions": "조건 판정", "profile.assemble": "정리", "discover.candidates": "발굴", "retrieve.catalog": "DB 거르기",
};
/** 쪽마다 몇 개 — '검색 5 · 검색 · 모자랄 때 4 · 적재 5 · 다음 단계(꺼짐) 4' */
const groupLine = (agents: OpsCatalog["agents"]) => {
  const n: Record<string, number> = {};
  agents.forEach((a) => { const g = a.group || "기타"; n[g] = (n[g] ?? 0) + 1; });
  return Object.entries(n).map(([g, k]) => `${g} ${k}`).join(" · ");
};
const STATUS_KO: Record<string, string> = { active: "사용 중", canary: "일부(20%)", shadow: "그림자", disabled: "꺼짐", retired: "은퇴" };

/** 에이전트 — 그래프 구성(노드 · 엣지 · 조사 순서)과 에이전트 명세. 코드(agent.yaml · graph.py · search.yaml)가 정본이다 */
export default function AgentsPage() {
  const [cat, setCat] = useState<OpsCatalog | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { getOpsAgents().then(setCat).catch((e) => setErr(String(e?.message || e))); }, []);
  if (err) return <p className="m-0 text-[13px] text-[var(--fail)]">불러오지 못했습니다: {err}</p>;
  if (!cat) return <p className="m-0 text-[13px] text-[var(--dim)]">불러오는 중…</p>;

  const nodes: OpsGraphNode[] = cat.graph.nodes.map((n) => ({ ...n, runs: 0, status: "waiting", detail: "" }));
  const edges = cat.graph.edges.map((e) => ({ ...e, kind: e.kind as "normal" | "fanout" | "loop", count: 0, taken: false }));
  const byCap = Object.fromEntries(cat.agents.flatMap((a) => a.capabilities.map((c) => [c, a])));
  const steps = cat.research.map((c) => ({ agent: byCap[c]?.name ?? c, label: STEP_KO[c] ?? c }));

  return (
    <>
      <section className="surface px-4 py-3" aria-labelledby="g-title">
        <div className="flex flex-wrap items-baseline gap-x-3 mb-2">
          <h2 id="g-title" className="m-0 text-[14px] font-semibold">그래프 구성</h2>
          <span className="text-[12.5px] text-[var(--dim)]">검색 그래프 노드 {cat.graph.nodes.length}개 · 점선 상자 안은 후보 한 명마다 이 순서로 부르는 워커 (missions/search.yaml)</span>
        </div>
        <RunGraph nodes={nodes} edges={edges} steps={steps} live={false} />
        <ul className="m-0 mt-2 pl-4 text-[12.5px] text-[var(--ink-2)] grid gap-0.5">
          <li>다음 할 일은 코드가 정한다 — LLM 은 워커 안에서만 쓴다. 조건 승인은 그래프 밖(API)에서 끝난다.</li>
          <li>DB 쪽이 먼저 돈다 — DB에서 거르기(SQL) → 코드로 재기 → DB 후보마다 판정(이전 판정 재사용). 확실한 사람이 모자라면 실시간 쪽(발굴 → 후보마다 조사)이 채우고, 찾은 사람은 DB에 넣는다(D42).</li>
          <li>근거 검토에서 필수 조건을 확인 못 하면 실시간 후보만 그 조건을 재조사한다(DB 후보는 읽을 글이 이미 다 들어가 있어 그대로 확정).</li>
          <li>적재 그래프(1시간마다 · 적재 워커 5개)는 따로 돈다 — 적재 현황 화면.</li>
        </ul>
      </section>

      <section className="surface" aria-labelledby="a-title">
        <div className="flex flex-wrap items-baseline gap-x-3 px-4 pt-3.5 pb-2">
          <h2 id="a-title" className="m-0 text-[14px] font-semibold">에이전트 {cat.agents.length}개</h2>
          <span className="text-[12.5px] text-[var(--dim)]">{groupLine(cat.agents)} · 최근 검색 {cat.recent_missions}건 성적 · 명세는 agent/agents/*/agent.yaml</span>
        </div>
        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px] tabular min-w-[900px]">
            <thead>
              <tr className="text-left text-[11.5px] text-[var(--dim)] bg-[var(--soft)]">
                {["에이전트", "하는 일", "툴 선택", "툴", "상태", "예산 (LLM · 툴 · 시간)", "최근 실행", "성공률", "p95", "1회 평균 비용"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-1.5 font-semibold whitespace-nowrap">{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {cat.agents.map((a) => {
                const r = a.recent;
                const off = a.status === "disabled";
                return (
                  <tr key={a.name} className={`border-t border-[var(--border)] align-top ${off ? "text-[var(--dim)]" : ""}`}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="font-medium">{a.label}{a.group && <span className="ml-1.5 text-[11px] font-normal text-[var(--dim)]">{a.group}</span>}</div>
                      <div className="text-[11px] text-[var(--dim)]" translate="no">{a.name} · v{a.version}</div>
                      <div className="text-[11px] text-[var(--dim)]" translate="no">{a.capabilities.join(", ")}</div>
                    </td>
                    <td className="px-3 py-2 min-w-[220px]">{a.description}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{off ? "—" : a.tool_choice}</td>
                    <td className="px-3 py-2"><span translate="no" className="text-[11.5px]">{a.tools.join(", ") || "—"}</span></td>
                    <td className="px-3 py-2 whitespace-nowrap">{STATUS_KO[a.status] ?? a.status}{a.in_template && !off && <div className="text-[11px] text-[var(--dim)]">기본 단계</div>}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-[var(--dim)]">{off ? "—" : `${a.budget.llm_calls ?? "∞"} · ${a.budget.tool_calls ?? "∞"} · ${a.budget.timeout_s}s`}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r ? `${r.runs}회` : "—"}</td>
                    <td className={`px-3 py-2 whitespace-nowrap font-semibold ${r?.success_rate == null ? "" : r.success_rate < 0.8 ? "text-[var(--fail)]" : r.success_rate < 0.95 ? "text-[var(--unknown)]" : "text-[var(--pass)]"}`}>
                      {r?.success_rate == null ? <span className="font-normal text-[var(--dim)]">—</span> : `${Math.round(r.success_rate * 100)}%`}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{r ? secs(r.p95_ms) : "—"}{a.slo?.p95_s ? <div className="text-[11px] text-[var(--dim)]">목표 {a.slo.p95_s}초</div> : null}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r?.avg_usd != null ? usd(r.avg_usd) : "—"}{r?.usd != null && <div className="text-[11px] text-[var(--dim)]">합계 {usd(r.usd)}</div>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
