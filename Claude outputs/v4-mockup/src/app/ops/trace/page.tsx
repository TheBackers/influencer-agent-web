"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Search } from "lucide-react";
import { tbl } from "@/components/v2/ui";
import { Pill, Tabs, ToneDot, hhmm, usd } from "@/components/v4/bits";
import TraceSearch from "@/components/ops/trace-search";
import { getIngestTrace, getPersonPaths } from "@/lib/api-v4";
import type { IngestTraceRun, PersonPath, Tone, TraceJob } from "@/types/v4";

type Tab = "search" | "ingest";

/** 추적 (v4 · B7 · 설계서 13-5) — [검색 · 적재] 탭. 검색은 인물 한 명의 길까지, 적재는 실행 → 노드 → 작업 → 호출까지 */
export default function TracePage() {
  return <Suspense fallback={<p className="text-[var(--dim)]">불러오는 중…</p>}><Trace /></Suspense>;
}

function Trace() {
  const q = useSearchParams();
  const router = useRouter();
  const tab = (q.get("tab") as Tab) || "search";
  const [text, setText] = useState("");
  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[240px]">
          <Tabs tabs={[{ k: "search", label: "검색" }, { k: "ingest", label: "적재" }]} value={tab} onChange={(k) => router.replace(`/ops/trace?tab=${k}`)} label="추적" />
        </div>
        <form className="relative w-full sm:w-[300px]" onSubmit={(e) => { e.preventDefault(); router.replace(`/ops/trace?tab=${text.startsWith("ing_") || text.startsWith("@cafe") || text.startsWith("p_") ? "ingest" : "search"}`); }}>
          <label htmlFor="trace-q" className="sr-only">인물 이름 · 아이디 · 실행 id</label>
          <Search size={14} aria-hidden className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--dim)]" />
          <input id="trace-q" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="인물 이름 · 아이디 · 실행 id(m_… · ing_…)"
            className="w-full h-[32px] pl-8 pr-2.5 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[13px]" />
        </form>
      </div>
      {tab === "search" ? (
        <>
          <PersonPathPanel />
          <TraceSearch />
        </>
      ) : <IngestTrace />}
    </>
  );
}

const STATE: Record<PersonPath["nodes"][number]["state"], { tone: Tone; label: string }> = {
  pass: { tone: "pass", label: "지남" }, reuse: { tone: "pass", label: "재사용" }, drop: { tone: "fail", label: "여기서 탈락" }, skip: { tone: "none", label: "안 감" },
};
const V_TONE = { pass: "pass", fail: "fail", unknown: "warn" } as const;
const V_KO = { pass: "충족", fail: "미충족", unknown: "확인 못 함" } as const;

/** 인물 한 명의 길 — 검색 하나에서 그 사람이 거친 노드 · 조건별 판정 · 근거 · LLM 호출(D59 · D60) */
function PersonPathPanel() {
  const [paths, setPaths] = useState<PersonPath[]>([]);
  const [sel, setSel] = useState(0);
  useEffect(() => { getPersonPaths("m_mock_short").then(setPaths); }, []);
  const p = paths[sel];
  if (!p) return null;
  return (
    <section className="surface px-4 py-3 flex flex-col gap-3" aria-label="인물 한 명의 길">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="m-0 text-[14px] font-semibold">인물 한 명의 길</h2>
        <span className="text-[12.5px] text-[var(--dim)]" translate="no">검색 m_mock_short · 홈카페 10명</span>
        <label htmlFor="pp-sel" className="sr-only">인물</label>
        <select id="pp-sel" value={sel} onChange={(e) => setSel(Number(e.target.value))} className="ml-auto h-[32px] px-2 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[13px]">
          {paths.map((x, i) => <option key={x.handle} value={i}>{x.name} {x.handle}</option>)}
        </select>
      </div>
      <p className="m-0 text-[13px]"><b>{p.outcome}</b></p>
      <ol className="m-0 p-0 list-none flex flex-wrap items-stretch gap-1.5" aria-label="거친 노드">
        {p.nodes.map((n, i) => (
          <li key={n.id} className="flex items-center gap-1.5">
            <div className="rounded-md border px-2.5 py-1.5 min-w-[128px] max-w-[190px]"
              style={{ borderColor: STATE[n.state].tone === "fail" ? "var(--fail)" : n.state === "skip" ? "var(--border)" : "var(--border-strong)", opacity: n.state === "skip" ? 0.55 : 1 }}>
              <p className="m-0 text-[12.5px] font-semibold flex items-center gap-1.5"><ToneDot tone={STATE[n.state].tone} />{n.ko}</p>
              <p className="m-0 text-[11.5px] text-[var(--dim)]">{STATE[n.state].label}</p>
              {n.note && <p className="m-0 text-[11.5px] text-[var(--ink-2)]">{n.note}</p>}
            </div>
            {i < p.nodes.length - 1 && <span aria-hidden className="text-[var(--dim)]">→</span>}
          </li>
        ))}
      </ol>
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px] min-w-[640px]">
          <thead><tr>{["조건", "판정", "누가 쟀나", "근거", "호출"].map((h) => <th key={h} scope="col" className={tbl.th}>{h}</th>)}</tr></thead>
          <tbody>
            {p.checks.map((c) => (
              <tr key={c.phrase}>
                <td className={tbl.td}>{c.phrase}</td>
                <td className={`${tbl.td} whitespace-nowrap`}><Pill tone={V_TONE[c.verdict]}>{V_KO[c.verdict]}</Pill></td>
                <td className={`${tbl.td} whitespace-nowrap`}>{c.how}</td>
                <td className={tbl.td}>{c.evidence}</td>
                <td className={tbl.td}>
                  {c.trace_url ? <a href={c.trace_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">{c.call ?? "트레이스"}<ExternalLink size={11} aria-hidden /></a> : <span className="text-[var(--dim)]">LLM 없음</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const R_TONE: Record<TraceJob["result"], Tone> = { done: "pass", retry: "warn", failed: "fail", later: "none" };
const R_KO: Record<TraceJob["result"], string> = { done: "끝", retry: "다시", failed: "실패", later: "나중에" };

/** 추적 › 적재 — 실행 하나 = 적재 그래프 위 노드별 숫자 → 노드 → 작업 → 호출 시간순 */
function IngestTrace() {
  const [run, setRun] = useState<IngestTraceRun | null>(null);
  const [node, setNode] = useState("all");
  const [job, setJob] = useState<string>("");
  useEffect(() => { getIngestTrace("ing_231").then((r) => { setRun(r); setJob(r.jobs[0]?.id ?? ""); }); }, []);
  const jobs = useMemo(() => (run ? run.jobs.filter((j) => node === "all" || j.node === node) : []), [run, node]);
  if (!run) return <p className="m-0 text-[13px] text-[var(--dim)]">불러오는 중…</p>;
  const cur = run.jobs.find((j) => j.id === job) ?? jobs[0];
  return (
    <>
      <section className="surface px-4 py-3 flex flex-col gap-3" aria-label={`적재 실행 ${run.id}`}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="m-0 text-[14px] font-semibold" translate="no">적재 실행 {run.id}</h2>
          <span className="text-[12.5px] text-[var(--dim)] tabular">{hhmm(run.started_at)} · {run.minutes}분 · 새 인물 {run.new_people} · AI {usd(run.usd, 3)} · 멈춘 까닭 {run.stopped} · 빌드 <span translate="no">{run.build}</span></span>
          <a href="https://smith.langchain.com/" target="_blank" rel="noopener noreferrer" className="ml-auto text-[12.5px] inline-flex items-center gap-1">이 실행의 LangSmith 트레이스<ExternalLink size={11} aria-hidden /></a>
        </div>
        <ol className="m-0 p-0 list-none flex flex-wrap items-center gap-1.5" aria-label="적재 그래프 노드">
          {run.nodes.map((n, i) => (
            <li key={n.id} className="flex items-center gap-1.5">
              <button type="button" onClick={() => setNode(node === n.id ? "all" : n.id)} aria-pressed={node === n.id}
                className={`rounded-md border px-2.5 py-1.5 text-left min-w-[104px] bg-[var(--panel)] ${node === n.id ? "border-[var(--accent)]" : "border-[var(--border-strong)]"}`}>
                <span className="block text-[12.5px] font-semibold">{n.ko}</span>
                <span className="block text-[11.5px] tabular text-[var(--dim)]">끝 {n.done}{n.later ? ` · 나중에 ${n.later}` : ""}</span>
                <span className="block text-[11.5px] tabular" style={{ color: n.failed ? "var(--fail)" : "var(--dim)" }}>실패 {n.failed}</span>
              </button>
              {i < run.nodes.length - 1 && <span aria-hidden className="text-[var(--dim)]">→</span>}
            </li>
          ))}
        </ol>
        <p className="m-0 text-[12px] text-[var(--dim)]">노드를 누르면 그 노드의 작업만 봅니다. 작업마다 요약 1줄이 30일 남고, 실패 · ‘다시’인 작업은 호출까지 전부 남습니다(D59).</p>
      </section>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4">
        <section className="surface min-w-0" aria-label="작업">
          <p className="m-0 px-4 pt-3 pb-2 text-[13px] font-semibold">작업 {jobs.length}{node !== "all" ? ` · ${run.nodes.find((n) => n.id === node)?.ko}` : " (문제 있는 것 먼저)"}</p>
          <ul className="m-0 p-0 list-none">
            {jobs.map((j) => (
              <li key={j.id}>
                <button type="button" onClick={() => setJob(j.id)} aria-pressed={cur?.id === j.id}
                  className={`w-full text-left px-4 py-2 border-0 border-t border-[var(--border)] ${cur?.id === j.id ? "bg-[var(--accent-bg)]" : "bg-transparent hover:bg-[var(--soft)]"}`}>
                  <span className="flex items-center gap-2 text-[12.5px]"><Pill tone={R_TONE[j.result]}>{R_KO[j.result]}</Pill><b translate="no">{j.kind}</b><span className="text-[var(--dim)] truncate" translate="no">{j.person ?? j.key}</span></span>
                  <span className="block mt-0.5 text-[12px] text-[var(--ink-2)]">{j.note}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        {cur && (
          <section className="surface min-w-0" aria-label="호출">
            <div className="px-4 pt-3 pb-2 flex flex-wrap items-baseline gap-x-2">
              <p className="m-0 text-[13px] font-semibold" translate="no">{cur.kind} · {cur.person ?? cur.key}</p>
              <span className="text-[12px] text-[var(--dim)] tabular">{(cur.ms / 1000).toFixed(1)}초 · 작업 <span translate="no">{cur.id}</span></span>
              <a href={cur.trace_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-[12px] inline-flex items-center gap-1">LangSmith<ExternalLink size={11} aria-hidden /></a>
            </div>
            <div className="relative overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px] min-w-[520px]">
                <thead><tr>{["시각", "누가", "툴", "인자", "결과", "ms"].map((h) => <th key={h} scope="col" className={tbl.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {cur.calls.map((c, i) => (
                    <tr key={i}>
                      <td className={`${tbl.td} tabular`}>{c.at}</td>
                      <td className={tbl.td} translate="no">{c.who}</td>
                      <td className={tbl.td} translate="no">{c.tool}</td>
                      <td className={`${tbl.td} break-all`}>{c.args}</td>
                      <td className={tbl.td} style={{ color: /^[45]\d\d/.test(c.status) ? "var(--fail)" : undefined }}>{c.status}{c.note ? <span className="block text-[11.5px] text-[var(--dim)]">{c.note}</span> : null}</td>
                      <td className={`${tbl.td} tabular`}>{c.ms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
