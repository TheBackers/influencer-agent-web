"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/v2/app-header";
import RequestComposer from "@/components/v2/request-composer";
import ConditionBoard from "@/components/v2/condition-board";
import MissionStepper from "@/components/v2/mission-stepper";
import CoverageBand from "@/components/v2/coverage-band";
import ResultsToolbar from "@/components/v2/results-toolbar";
import DossierTable, { type SortKey } from "@/components/v2/dossier-table";
import DossierDrawer from "@/components/v2/dossier-drawer";
import type { FeedbackInput } from "@/components/v2/feedback-bar";
import { compilePlan, followMission, getMission, patchCondition, revisePlan, sendFeedback, startLiveMission, startMission, USE_MOCK } from "@/lib/api-v2";
import { DB_STEPS } from "@/mocks/mission";
import { unconfirmed } from "@/components/v2/ui";
import { DbResultSummary, Shortfall, UnconfirmedNote } from "@/components/catalog/search-db";
import type { CompiledPlan, ConditionPatch, Dossier, MissionResult, MissionStep } from "@/types/v2";

/** 진행 단계 틀 — v4: DB에서만 · 실시간은 버튼(D51). 백엔드 progress.py STEPS 와 같은 키 */
const STEPS0 = DB_STEPS;
const isUnconfirmed = (d: Dossier) => unconfirmed(d).n > 0;

type Phase = "idle" | "compiling" | "review" | "running" | "done" | "error";
type Log = { at: string; text: string; kind: "log" | "intervention" | "error" };

const sorters: Record<SortKey, (d: Dossier) => number> = {
  score: (d) => d.score.must_pass * 10 + d.score.nice_pass * 3 + (d.youtube?.trend?.ratio ?? 0),
  trend: (d) => d.youtube?.trend?.ratio ?? 0,
  ig: (d) => d.instagram?.followers ?? 0,
  yt: (d) => d.youtube?.followers ?? 0,
  sponsored: (d) => d.sponsored_count,
};

export default function SearchPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [plan, setPlan] = useState<CompiledPlan | null>(null);
  const [busy, setBusy] = useState("");
  const [steps, setSteps] = useState<MissionStep[]>(STEPS0);
  const [logs, setLogs] = useState<Log[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<MissionResult | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<Dossier | null>(null);
  const [sort, setSort] = useState<SortKey>("score");
  const [feedback, setFeedback] = useState<Record<string, 0 | 1>>({});
  const stopRef = useRef<() => void>(() => {});
  const missionRef = useRef("");
  const [liveBusy, setLiveBusy] = useState(false);

  /** '실시간으로 더 찾기'(D51) — 같은 조건 · 모자란 인원만. 끝나면 결과에 '실시간' 표시로 더해진다 */
  const runLive = async () => {
    if (!result || !plan) return;
    setLiveBusy(true);
    const { mission_id } = await startLiveMission(result.mission_id);
    let stop = () => {};
    stop = followMission(mission_id, async (ev) => {
      if (ev.t === "log" || ev.t === "intervention") setLogs((prev) => [...prev, { at: ev.at, text: ev.text ?? "", kind: ev.t === "log" ? "log" : "intervention" }]);
      if (ev.t === "done") { missionRef.current = mission_id; setResult(await getMission(mission_id, plan)); setLiveBusy(false); stop(); }
    });
  };
  const loadScenario = async (id: string) => {
    const p = plan ?? await compilePlan("", 30);
    setPlan(p);
    setResult(await getMission(id, p));
    setPhase("done");
    setOpen(null);
  };

  const compile = useCallback(async (request: string, count: number) => {
    setPhase("compiling");
    setError("");
    setResult(null);
    setOpen(null);
    try {
      setPlan(await compilePlan(request, count));
      setPhase("review");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }, []);

  const patch = async (cid: string, pch: ConditionPatch) => {
    if (!plan) return;
    try {
      setError("");
      setPlan(await patchCondition(plan, cid, pch));
    } catch (e) {
      setError((e as Error).message); // 검증기가 거부한 변경 (범위 밖 값 등) — 계획은 그대로 둔다
    }
  };

  const revise = async (instruction: string) => {
    if (!plan) return;
    setBusy("revise");
    try {
      setError("");
      setPlan(await revisePlan(plan, instruction));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const approve = useCallback(async (p: CompiledPlan | null = plan) => {
    if (!p) return;
    setPhase("running");
    setSteps(STEPS0.map((s) => ({ ...s })));
    setLogs([]);
    setElapsed(0);
    const { mission_id } = await startMission(p);
    missionRef.current = mission_id;
    const t0 = Date.now();
    const tick = setInterval(() => setElapsed((Date.now() - t0) / 1000), 500);
    const stop = followMission(mission_id, async (ev) => {
      if (ev.t === "step" && ev.step) {
        const st = ev.step;
        setSteps((prev) => prev.map((s) => (s.key === st.key ? { ...s, ...st } : s)));
      } else if (ev.t === "log" || ev.t === "intervention" || ev.t === "error") {
        if (ev.t === "error") clearInterval(tick); // 검색 실패 · 연결 끊김 — 시계를 멈추고 로그에 남긴다
        setLogs((prev) => [...prev, { at: ev.at, text: ev.text ?? "", kind: ev.t === "log" ? "log" : ev.t === "error" ? "error" : "intervention" }]);
      } else if (ev.t === "done") {
        clearInterval(tick);
        setResult(await getMission(mission_id, p));
        setPhase("done");
      }
    });
    stopRef.current = () => { clearInterval(tick); stop(); };
  }, [plan]);

  useEffect(() => () => stopRef.current(), []);

  // 목업 검토용 바로가기: /?demo=review | running | done(DB로 다 채움) | short(모자람 → 탐색 요청) | live(버튼으로 실시간) | detail
  useEffect(() => {
    if (!USE_MOCK) return;
    const demo = new URLSearchParams(window.location.search).get("demo");
    if (!demo) return;
    (async () => {
      const p = await compilePlan("", 30);
      setPlan(p);
      if (demo === "review") setPhase("review");
      if (demo === "running") approve(p);
      if (demo === "done" || demo === "detail" || demo === "short" || demo === "live") {
        const r = await getMission(demo === "short" ? "m_mock_short" : demo === "live" ? "m_mock_live" : "m_mock_db", p);
        setResult(r);
        setPhase("done");
        if (demo === "detail") setOpen(r.dossiers[0]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** DB 검색 요약(D42) — 있으면 필수 조건 확인 못 한 사람을 따로 보인다(D36). 예전 결과(저장된 v2)에는 없다 */
  const db = result?.catalog;
  const list = useMemo(() => {
    if (!result) return [];
    const pool = db ? result.dossiers.filter((d) => !isUnconfirmed(d)) : result.dossiers;
    return [...pool].sort((a, b) => sorters[sort](b) - sorters[sort](a)).slice(0, result.plan.estimate.count);
  }, [result, sort, db]);
  const unconfirmedList = useMemo(() => (db && result ? result.dossiers.filter(isUnconfirmed) : []), [result, db]);

  const giveFeedback = async (d: Dossier, f: FeedbackInput) => {
    await sendFeedback({ mission_id: missionRef.current || (result?.mission_id ?? ""), run_id: d.run_id, handle: d.handle, ...f });
    setFeedback((m) => ({ ...m, [d.handle]: f.score }));
  };

  const locked = phase === "running" || phase === "done";
  const activeConditions = plan?.conditions.filter((c) => !c.dropped) ?? [];

  return (
    <main className={`w-full min-w-0 max-w-[1120px] px-4 md:px-8 py-6 pb-20 flex flex-col gap-4`}>
      <PageHeader title="인플루언서 검색" description="원하는 조건을 말하면, 어떻게 판단할지 먼저 보여드리고 승인하신 뒤에 찾습니다." />

      <RequestComposer busy={phase === "compiling"} locked={phase === "running"} onCompile={compile} />

      {phase === "review" && error && (
        <p role="alert" className="m-0 text-[13px] text-[var(--fail)]">바꾸지 못했습니다: {error}</p>
      )}
      {phase === "error" && (
        <p role="alert" className="m-0 text-[13px] text-[var(--fail)]">조건을 만들지 못했습니다. {error}. 요청문을 조금 바꿔 다시 시도해 주세요.</p>
      )}

      {plan && phase === "review" && (
        <ConditionBoard plan={plan} busy={busy} locked={locked} onPatch={patch} onRevise={revise} onApprove={() => approve()} />
      )}

      {plan && locked && (
        <details className="text-[13px]">
          <summary className="cursor-pointer text-[var(--ink-2)]">승인한 조건 {activeConditions.length}개</summary>
          <ul className="mt-1.5 mb-0 pl-5 space-y-0.5 text-[var(--ink-2)]">
            {activeConditions.map((c) => <li key={c.id}>{c.source_phrase} <span className="text-[var(--dim)]">({c.weight === "must" ? "필수" : "참고"})</span></li>)}
          </ul>
        </details>
      )}

      {(phase === "running" || (phase === "done" && logs.length > 0)) && (
        <MissionStepper steps={steps} logs={logs} elapsed={elapsed} done={phase === "done"} />
      )}

      {phase === "done" && result && (
        <div className="flex flex-col gap-3 pt-2">
          {USE_MOCK && (
            <p className="m-0 flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--dim)]">
              목업 상황(B9):
              {([["m_mock_db", "DB로 다 채움"], ["m_mock_short", "모자람 → 탐색 요청"], ["m_mock_live", "버튼으로 실시간 더함"]] as const).map(([id, label]) => (
                <button key={id} type="button" onClick={() => loadScenario(id)} aria-pressed={result.mission_id === id}
                  className={`h-[26px] px-2.5 rounded-full border text-[12px] ${result.mission_id === id ? "border-[var(--accent)] text-[var(--accent)] font-medium bg-[var(--accent-bg)]" : "border-[var(--border-strong)] bg-[var(--panel)] text-[var(--ink-2)]"}`}>{label}</button>
              ))}
            </p>
          )}
          <ResultsToolbar result={result} list={list} />
          {db && <DbResultSummary info={db} />}
          {db?.shortfall && <Shortfall key={result.mission_id} sf={db.shortfall} liveBusy={liveBusy} onLive={runLive} />}
          <CoverageBand result={result} />
          <DossierTable list={list} sort={sort} onSort={setSort} onOpen={setOpen} selected={open?.handle} />
          {unconfirmedList.length > 0 && (
            <section className="flex flex-col gap-2 pt-2" aria-label="필수 조건 확인 못 함">
              <h2 className="m-0 text-[14px] font-semibold">필수 조건 확인 못 함 {unconfirmedList.length}명</h2>
              <UnconfirmedNote n={unconfirmedList.length} />
              <DossierTable list={unconfirmedList} sort={sort} onSort={setSort} onOpen={setOpen} selected={open?.handle} />
            </section>
          )}
          {!!result.needs_review?.length && (
            <details className="text-[13px] surface px-3.5 py-2.5" open={list.length === 0}>
              <summary className="cursor-pointer">
                <span className="font-medium">팔로워 확인 필요 {result.needs_review.length}명</span>
                <span className="text-[var(--dim)]"> — 인스타 API 로 조회가 안 됐습니다(개인 계정이거나 없는 계정). 눌러서 직접 확인하세요</span>
              </summary>
              <ul className="mt-2 mb-0 pl-0 list-none space-y-1.5">
                {result.needs_review.map((r) => (
                  <li key={r.handle} className="flex flex-wrap items-baseline gap-x-2">
                    {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" translate="no" className="font-medium">{r.handle}</a>
                      : <span translate="no" className="font-medium">{r.handle}</span>}
                    {r.source_url && <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="text-[12px]">찾은 글</a>}
                    {r.why && <span className="text-[12px] text-[var(--dim)] min-w-0 break-words">{r.why}</span>}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <details className="text-[13px]">
            <summary className="cursor-pointer text-[var(--dim)]">제외된 후보 {result.rejected.reduce((a, r) => a + r.count, 0)}명</summary>
            <ul className="mt-1.5 mb-0 pl-5 text-[var(--ink-2)] tabular">
              {result.rejected.map((r, i) => <li key={i}>{r.reason}: {r.count}명</li>)}
            </ul>
            {!!result.rejected_people?.length && (
              <div className="mt-2 relative overflow-x-auto">
                <table className="w-full border-collapse text-[12.5px] min-w-[640px]">
                  <thead>
                    <tr className="text-left text-[11.5px] text-[var(--dim)] bg-[var(--soft)]">
                      {["후보", "어디서", "왜 떨어졌나", "근거"].map((h) => <th key={h} scope="col" className="px-2.5 py-1.5 font-semibold whitespace-nowrap">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rejected_people.map((r) => (
                      <tr key={r.handle + r.stage} className="border-t border-[var(--border)] align-top">
                        <td className="px-2.5 py-1.5 whitespace-nowrap font-medium" translate="no">{r.handle}</td>
                        <td className="px-2.5 py-1.5 whitespace-nowrap text-[var(--dim)]">{r.stage_ko}</td>
                        <td className="px-2.5 py-1.5">{r.reason}</td>
                        <td className="px-2.5 py-1.5 text-[var(--ink-2)]">
                          {r.detail || "—"}
                          {r.source_url && <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="ml-1.5 text-[11.5px]">근거 보기</a>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </details>
        </div>
      )}

      {open && result && (
        <DossierDrawer key={open.handle} d={open} conditions={result.plan.conditions} missionId={result.mission_id} traceUrl={result.trace_url}
          feedback={feedback[open.handle]} onFeedback={(f) => giveFeedback(open, f)} onClose={() => setOpen(null)} />
      )}
    </main>
  );
}
