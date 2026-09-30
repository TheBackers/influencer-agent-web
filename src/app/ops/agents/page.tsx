"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AgentSystemMap, MEET } from "@/components/ops/agent-flow";
import { AgentCard, IngestMap, SearchMap } from "@/components/ops/agent-map";
import { getOpsAgents } from "@/lib/api-v2";
import type { OpsAgentSpec, OpsCatalog } from "@/types/v2";

type Tab = "structure" | "search" | "ingest";
const TABS: { k: Tab; label: string }[] = [
  { k: "structure", label: "전체 구조" },
  { k: "search", label: "검색 그래프" },
  { k: "ingest", label: "적재 그래프" },
];
const G_KO: Record<string, string> = { search: "검색", ingest: "적재" };

/** 에이전트 — 두 그래프(검색 · 적재)와 가운데 층(총괄 · 워커 부르기 · 감독관 · 게이트웨이), 워커마다 역할 지표. 코드가 정본이다 */
export default function AgentsPage() {
  const [cat, setCat] = useState<OpsCatalog | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<Tab>("structure");
  const [focus, setFocus] = useState("");
  useEffect(() => {
    getOpsAgents().then((c) => {
      setCat(c);
      const h = window.location.hash.slice(1);   // #search · #ingest 로 바로 열기
      if (h === "search" || h === "ingest" || h === "structure") setTab(h);
    }).catch((e) => setErr(String(e?.message || e)));
  }, []);
  useEffect(() => {   // 뒤로 가기 · 주소창에서 #search 등으로 바꿀 때
    const on = () => {
      const h = window.location.hash.slice(1);
      if (h === "search" || h === "ingest" || h === "structure") setTab(h);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const choose = useCallback((t: Tab) => {
    setTab(t);
    try { window.history.replaceState(null, "", `#${t}`); } catch { /* 주소를 못 바꿔도 탭은 바뀐다 */ }
  }, []);
  // 칩을 누르면 그 워커가 있는 탭으로 옮기고 카드로 내려간다
  const onPick = useCallback((name: string) => {
    const a = cat?.agents.find((x) => x.name === name);
    if (!a) return;
    const t: Tab = a.graph === "ingest" ? "ingest" : a.graph === "search" ? "search" : "structure";
    choose(t);
    setFocus(name);
    setTimeout(() => {
      const el = document.getElementById(`agent-${name}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      el?.focus({ preventScroll: true });
    }, 60);
  }, [cat, choose]);

  if (err) return <p className="m-0 text-[13px] text-[var(--fail)]">불러오지 못했습니다: {err}</p>;
  if (!cat) return <p className="m-0 text-[13px] text-[var(--dim)]">불러오는 중…</p>;

  const of = (pred: (a: OpsAgentSpec) => boolean) => cat.agents.filter(pred);
  const searchAlways = of((a) => a.group === "검색"), searchLive = of((a) => a.group === "검색 · 모자랄 때");
  const ingest = of((a) => a.graph === "ingest"), next = of((a) => a.graph === "next");
  const counts: Record<Tab, number> = { structure: cat.agents.length, search: searchAlways.length + searchLive.length, ingest: ingest.length };
  const sRecent = `최근 검색 ${cat.recent_missions}건`, iRecent = `최근 적재 ${cat.recent_ingest_runs ?? 0}회`;
  const iu = cat.graphs.ingest.usage;

  const cards = (title: string, sub: string, list: OpsAgentSpec[], recent: string) => (
    <section aria-label={title} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-2 px-0.5">
        <h2 className="m-0 text-[14px] font-semibold">{title} <span className="font-normal text-[var(--dim)] tabular">{list.length}</span></h2>
        <span className="text-[12.5px] text-[var(--dim)]">{sub}</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {list.map((a) => <AgentCard key={a.name} a={a} focused={focus === a.name} recentLabel={recent} />)}
      </div>
    </section>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="에이전트 화면 보기">
        {TABS.map((t) => (
          <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} onClick={() => choose(t.k)}
            className={`h-[32px] px-3 rounded-md border text-[13px] ${tab === t.k ? "border-[var(--foreground)] font-semibold" : "border-[var(--border-strong)] text-[var(--dim)] hover:bg-[var(--soft)]"}`}>
            {t.label} <span className="tabular font-normal text-[var(--dim)]">· 워커 {counts[t.k]}</span>
          </button>
        ))}
        <span className="text-[12px] text-[var(--dim)] ml-1">코드(agent.yaml · graph.py · rules/overseer.yaml)가 정본 · 워커 칩을 누르면 그 카드로 · <span className="text-[var(--fail)]">●</span> 쓰는 툴이 지금 막힘</span>
      </div>

      {tab === "structure" && (
        <>
          <section className="surface px-4 py-3" aria-labelledby="o-title">
            <div className="flex flex-wrap items-baseline gap-x-3 mb-2">
              <h2 id="o-title" className="m-0 text-[14px] font-semibold">에이전트 {cat.agents.length}개와 적재 · 검색이 맞물리는 곳</h2>
              <span className="text-[12.5px] text-[var(--dim)]">검은 테두리 = 총괄(순서를 정하는 코드) · 파란 칸 = 워커 에이전트(누르면 카드) · 파란 번호 = 적재와 검색이 만나는 곳</span>
            </div>
            <AgentSystemMap cat={cat} onPick={onPick} />
            <p className="m-0 mt-1 text-[11.5px] text-[var(--dim)] md:hidden">그림은 옆으로 밀어 봅니다</p>
            <ol className="m-0 mt-3 p-0 list-none grid gap-1.5 md:grid-cols-2 text-[12.5px]">
              {MEET.map((m) => (
                <li key={m.n} className="flex gap-2 min-w-0">
                  <span className="shrink-0 w-[20px] h-[20px] rounded-full grid place-items-center text-[11px] font-bold text-[var(--accent-ink)]"
                    style={{ background: m.n === "5" ? "var(--dim)" : "var(--accent)" }}>{m.n}</span>
                  <span className="min-w-0"><b className="font-semibold">{m.title}</b> <span className="text-[var(--ink-2)]">— {m.what}</span></span>
                </li>
              ))}
            </ol>
            <p className="m-0 mt-2 text-[12.5px] text-[var(--ink-2)]">
              <b className="font-semibold">워커끼리는 직접 부르지 않는다</b> — 다음 일은 검색은 총괄이, 적재는 작업 표가 정한다. 총괄이 워커를 부를 때마다 레지스트리가 능력 이름으로 워커를 고르고(agent.yaml) 예산(O1) · 마감(O6)을 씌운 뒤 결과를 총괄에게 돌려준다.
            </p>
            <details className="mt-3 text-[12.5px]">
              <summary className="cursor-pointer text-[var(--accent)]">새 워커 붙이기</summary>
              <ul className="m-0 mt-1.5 pl-4 text-[var(--ink-2)] grid gap-1">
                <li><span translate="no">agent/agents/&lt;이름&gt;/</span> 폴더 하나 — <span translate="no">agent.yaml</span>(능력 · 툴 · 예산 · 상태) + 코드.</li>
                <li>이미 있는 능력이면 총괄 코드는 그대로 — 레지스트리가 고른다(꺼짐 → 그림자 → 일부 20% → 사용 중).</li>
                <li>새 능력이면 그 능력을 부를 노드 한 곳에 <span translate="no">invoke(&quot;능력&quot;)</span> 한 줄과 이 화면의 노드 표(agentops/view.py)를 더한다.</li>
                <li>기록 · 예산 · 감독관 · 게이트웨이는 저절로 붙는다 — 검색 추적 · 관측에 바로 보인다.</li>
              </ul>
            </details>
          </section>

          <section className="surface" aria-labelledby="r-title">
            <div className="flex flex-wrap items-baseline gap-x-3 px-4 pt-3.5 pb-2">
              <h2 id="r-title" className="m-0 text-[14px] font-semibold">감독관 규칙 {cat.overseer.length}개</h2>
              <span className="text-[12.5px] text-[var(--dim)]">어디서 걸리나 · 어느 그래프에 쓰이나 (rules/overseer.yaml)</span>
            </div>
            <div className="relative overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px] min-w-[720px]">
                <thead>
                  <tr className="text-left text-[11.5px] text-[var(--dim)] bg-[var(--soft)]">
                    {["규칙", "걸리는 곳", "검색", "적재", "하는 일"].map((h) => <th key={h} scope="col" className="px-3 py-1.5 font-semibold whitespace-nowrap">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {cat.overseer.map((r) => (
                    <tr key={r.rule} className={`border-t border-[var(--border)] align-top ${r.graphs.length ? "" : "text-[var(--dim)]"}`}>
                      <td className="px-3 py-1.5 whitespace-nowrap"><b className="tabular">{r.rule}</b> {r.name}{r.severity && <span className="ml-1 text-[11px] text-[var(--dim)]">{r.severity}</span>}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">{r.where}</td>
                      {["search", "ingest"].map((g) => <td key={g} className="px-3 py-1.5">{r.graphs.includes(g) ? <span aria-label={`${G_KO[g]}에 쓰임`}>●</span> : <span className="text-[var(--dim)]" aria-label="안 쓰임">—</span>}</td>)}
                      <td className="px-3 py-1.5 min-w-[280px] text-[var(--ink-2)]">{r.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="surface px-4 py-3" aria-labelledby="n-title">
            <div className="flex flex-wrap items-baseline gap-x-3 mb-1.5">
              <h2 id="n-title" className="m-0 text-[14px] font-semibold">다음 단계 — 꺼짐 <span className="font-normal text-[var(--dim)] tabular">{next.length}</span></h2>
              <span className="text-[12.5px] text-[var(--dim)]">자리만 있는 워커 — 아직 어느 그래프에서도 부르지 않는다. 켜려면 부를 노드와 평가 세트가 먼저 필요하다</span>
            </div>
            <ul className="m-0 p-0 list-none grid gap-x-6 gap-y-1 sm:grid-cols-2 text-[12.5px]">
              {next.map((a) => (
                <li key={a.name} id={`agent-${a.name}`} className="min-w-0">
                  <b className="font-semibold">{a.label}</b> <span className="text-[11.5px] text-[var(--dim)]" translate="no">{a.name}</span>
                  <span className="text-[var(--ink-2)]"> — {a.description}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {tab === "search" && (
        <>
          <section className="surface px-4 py-3" aria-labelledby="s-title">
            <div className="flex flex-wrap items-baseline gap-x-3 mb-2">
              <h2 id="s-title" className="m-0 text-[14px] font-semibold">검색 그래프</h2>
              <span className="text-[12.5px] text-[var(--dim)]">노드 {cat.graphs.search.nodes.length}개 · 칩 = 그 노드가 부르는 워커 · 회색 노드 = 총괄 코드만{cat.graphs.search.usage?.searches ? ` · 파란 길 = ${sRecent} 중 탄 길` : ""}</span>
            </div>
            <SearchMap cat={cat} onPick={onPick} />
            <p className="m-0 mt-1 text-[11.5px] text-[var(--dim)] md:hidden">그림은 옆으로 밀어 봅니다</p>
            <ul className="m-0 mt-2 pl-4 text-[12.5px] text-[var(--ink-2)] grid gap-0.5">
              <li>DB 쪽이 먼저 돈다 — DB에서 거르기(SQL) → 코드로 재기 → DB 후보마다 판정(이전 판정 재사용 D35). DB 후보는 웹 조사를 다시 하지 않는다.</li>
              <li>확실한 사람이 모자라면 실시간 쪽(발굴 → 새 후보마다 조사)이 채우고, 찾은 사람은 DB에 넣는다(D42).</li>
              <li>근거 검토에서 필수 조건을 확인 못 하면 실시간 후보만 그 조건을 재조사한다. 재확인 · 저장은 결과로 낼 사람 중 정보가 오래된 사람만 유튜브 · 인스타를 다시 본다.</li>
            </ul>
          </section>
          {cards("검색 — 늘 돈다", `조건 설계는 그래프 밖(승인 전) · 역할 지표는 ${sRecent}의 기록에서`, searchAlways, sRecent)}
          {cards("검색 — 모자랄 때만", "DB로 인원을 못 채웠을 때 실시간으로 찾고 조사한다", searchLive, sRecent)}
        </>
      )}

      {tab === "ingest" && (
        <>
          <section className="surface px-4 py-3" aria-labelledby="i-title">
            <div className="flex flex-wrap items-baseline gap-x-3 mb-2">
              <h2 id="i-title" className="m-0 text-[14px] font-semibold">적재 그래프</h2>
              <span className="text-[12.5px] text-[var(--dim)]">노드 {cat.graphs.ingest.nodes.length}개 · {cat.graphs.ingest.trigger}</span>
            </div>
            {iu?.note ? <p className="m-0 mb-2 text-[12.5px] text-[var(--unknown)]">{iu.note}</p> : iu?.last_run && (
              <p className="m-0 mb-2 text-[12.5px] tabular text-[var(--ink-2)]">
                마지막 실행 {iu.last_run.started_at.slice(5, 16).replace("T", " ")} · 처리 {iu.last_run.processed} · 새 인물 {iu.last_run.added} · 실패 {iu.last_run.failed} · {usd(iu.last_run.usd)}
                {iu.last_run.stopped && <> · 멈춘 까닭: {iu.last_run.stopped}</>}
              </p>
            )}
            <IngestMap cat={cat} onPick={onPick} />
            <p className="m-0 mt-2 text-[12.5px]"><Link href="/catalog/ingest">적재 현황에서 지금 한 번 돌리기 →</Link> <span className="text-[var(--dim)]">스위치가 꺼져 있어도 시험으로 한 번 돈다</span></p>
            <p className="m-0 mt-1 text-[11.5px] text-[var(--dim)] md:hidden">그림은 옆으로 밀어 봅니다</p>
            <ul className="m-0 mt-2 pl-4 text-[12.5px] text-[var(--ink-2)] grid gap-0.5">
              <li>실행 사이의 상태(남은 일 · 실패 횟수 · 다음 갱신일)는 작업 표가 가진다 — 그래프는 한 번 실행 안의 순서만 맡는다.</li>
              <li>워커 결과는 DB 함수(저장 가드)로 넣고 작업 끝을 표시한다. 수집 노드는 수집 다음에 뽑기를 부른다(한 계정 = 한 작업).</li>
              <li>검색과 같은 워커 부르기 · 게이트웨이 · 감독관을 탄다 — 다른 점은 몫(인스타 시간 · 유튜브 하루 · 웹 하루 · AI 월 상한)을 여러 실행이 나눠 쓴다는 것.</li>
            </ul>
          </section>
          {cards("적재 워커", "역할 지표는 적재 현황(인플루언서 DB)의 24시간 숫자에서", ingest, iRecent)}
        </>
      )}
    </>
  );
}

const usd = (v: number) => (v === 0 ? "$0" : v < 0.01 ? "<$0.01" : `$${v.toFixed(2)}`);
