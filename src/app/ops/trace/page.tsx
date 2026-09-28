"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AgentBars, CandidateGrid, EventRows, ProblemList, RunGraph, StatusChip, TaskDrawer, ToolTable, secs } from "@/components/ops/live";
import { getOpsMission, listOpsMissions } from "@/lib/api-v2";
import type { OpsMissionRow, OpsMissionView, OpsProblem, OpsTask } from "@/types/v2";

const AGENT_KO: Record<string, string> = {
  "query-planner": "조건 설계", scout: "발굴", "web-researcher": "웹 조사", "account-linker": "계정 연결",
  "yt-researcher": "유튜브", "ig-researcher": "인스타", verifier: "조건 판정", profiler: "정리",
  supervisor: "총괄", overseer: "감독관", gateway: "툴 게이트웨이",
};
const label = (a: string) => AGENT_KO[a] ?? a;
const NODE_AGENT: Record<string, string> = { dispatch_scout: "scout" };

export default function TracePage() {
  return (
    <Suspense fallback={<p className="text-[var(--dim)]">불러오는 중…</p>}>
      <Trace />
    </Suspense>
  );
}

/** 임무 추적 — 한 건이 어떻게 돌았고 어디서 문제가 났나. 위에서 아래로: 문제 → 그래프 → 후보 격자 → 시간 · 툴 */
function Trace() {
  const q = useSearchParams();
  const router = useRouter();
  const [rows, setRows] = useState<OpsMissionRow[]>([]);
  const [data, setData] = useState<{ mid: string; v?: OpsMissionView; err?: string } | null>(null);
  const [listErr, setListErr] = useState("");
  const [focus, setFocus] = useState<string>("");
  const [drawer, setDrawer] = useState<{ tasks?: OpsTask[]; rows?: OpsMissionView["timeline"]; title?: string } | null>(null);
  const mid = q.get("m") || rows[0]?.mission_id || "";

  useEffect(() => { listOpsMissions().then(setRows).catch((e) => setListErr(String(e?.message || e))); }, []);
  useEffect(() => {
    if (!mid) return;
    getOpsMission(mid).then((v) => setData({ mid, v })).catch((e) => setData({ mid, err: String(e?.message || e) }));
  }, [mid]);
  const v = data?.mid === mid ? data.v ?? null : null;
  const err = (data?.mid === mid ? data.err : "") || listErr;

  const allEvents = useMemo(() => {
    if (!v) return new Map<string, OpsMissionView["timeline"][number]>();
    const m = new Map<string, OpsMissionView["timeline"][number]>();
    v.timeline.forEach((r) => m.set(r.event_id, { ...r }));
    Object.values(v.tasks).forEach((t) => t.events.forEach((r) => m.set(r.event_id, { ...r, text: `[${label(t.agent)}${t.candidate ? " · " + t.candidate : ""}] ${r.text}` })));
    return m;
  }, [v]);

  const openTasks = useCallback((ids: string[]) => {
    if (!v) return;
    const ts = ids.map((i) => v.tasks[i]).filter(Boolean);
    if (ts.length) setDrawer({ tasks: ts });
  }, [v]);
  const openProblem = useCallback((p: OpsProblem) => {
    const rs = p.event_ids.map((id) => allEvents.get(id)).filter(Boolean) as OpsMissionView["timeline"];
    setDrawer({ rows: rs, title: p.title });
  }, [allEvents]);
  const pick = (id: string) => {
    const a = NODE_AGENT[id] ?? id;
    if (a === "scout" && v) {
      const ts = Object.values(v.tasks).filter((t) => t.agent === "scout");
      if (ts.length) return setDrawer({ tasks: ts });
    }
    setFocus((f) => (f === a ? "" : a));
  };

  const s = v?.summary;
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="mission" className="text-[12.5px] text-[var(--dim)]">임무</label>
        <select id="mission" value={mid} onChange={(e) => router.replace(`/ops/trace?m=${e.target.value}`)}
          className="h-[32px] max-w-full min-w-0 flex-1 md:flex-none md:w-[560px] px-2 rounded-md border border-[var(--border-strong)] text-[13px]">
          {!rows.some((r) => r.mission_id === mid) && mid && <option value={mid}>{mid}</option>}
          {rows.map((r) => <option key={r.mission_id} value={r.mission_id}>{r.mission_id} · {(r.request || "").slice(0, 48)}</option>)}
        </select>
      </div>

      {err && <p className="m-0 text-[13px] text-[var(--fail)]">불러오지 못했습니다: {err}</p>}
      {!v && !err && <p className="m-0 text-[13px] text-[var(--dim)]">불러오는 중…</p>}

      {v && s && (
        <>
          <section className="surface px-4 py-3" aria-label="임무 요약">
            <p className="m-0 text-[14px] font-medium">{s.request || "(요청문 없음)"}</p>
            <dl className="m-0 mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-[12.5px] tabular">
              <Stat k="상태"><StatusChip s={s.status === "ok" ? "ok" : s.status === "failed" ? "failed" : s.status === "running" ? "running" : "partial"} /></Stat>
              <Stat k="결과" bad={!!s.requested && (s.returned ?? 0) < s.requested}>{s.returned ?? "—"}/{s.requested ?? "—"}명 (탈락 {s.rejected ?? 0})</Stat>
              <Stat k="시간">{secs(s.duration_s * 1000)}</Stat>
              <Stat k="비용">{s.cost_usd != null ? `$${Number(s.cost_usd).toFixed(3)}` : "—"}</Stat>
              <Stat k="LLM">{s.llm_calls}회 · 입력 {s.tokens_in.toLocaleString()}토큰</Stat>
              <Stat k="툴">{s.tool_calls}회 · 캐시 {s.cache_hits}</Stat>
              <Stat k="감독관 개입" bad={s.interventions > 2}>{s.interventions}</Stat>
              <Stat k="환경"><span translate="no">{s.env} · {s.version}</span></Stat>
            </dl>
          </section>

          <section className="surface px-4 py-3" aria-labelledby="p-title">
            <h2 id="p-title" className="m-0 mb-1 text-[14px] font-semibold">문제와 원인 {v.problems.length > 0 && <span className="font-normal text-[var(--dim)]">{v.problems.length}건 · 심각한 것부터</span>}</h2>
            <ProblemList problems={v.problems} agentLabel={label} onEvents={openProblem} />
          </section>

          <section className="surface px-4 py-3" aria-labelledby="g-title">
            <div className="flex flex-wrap items-baseline gap-x-3 mb-2">
              <h2 id="g-title" className="m-0 text-[14px] font-semibold">실행 그래프</h2>
              <span className="text-[12.5px] text-[var(--dim)]">노드 테두리 = 결과 · 파란 선 = 이번에 탄 갈림길 · 조사 단계를 누르면 아래 격자에서 그 열을 강조합니다</span>
            </div>
            <RunGraph nodes={v.graph.nodes} edges={v.graph.edges} steps={v.steps} picked={focus} onPick={pick} />
          </section>

          <section className="surface px-4 py-3" aria-labelledby="c-title">
            <div className="flex flex-wrap items-baseline gap-x-3 mb-1">
              <h2 id="c-title" className="m-0 text-[14px] font-semibold">후보 × 조사 단계</h2>
              <span className="text-[12.5px] text-[var(--dim)]">후보 {v.candidates.length}명 · 문제 있는 후보가 위 · 칸을 누르면 그 작업의 LLM · 툴 호출을 봅니다</span>
            </div>
            <CandidateGrid candidates={v.candidates} steps={v.steps} focus={focus} onPick={openTasks} />
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="surface px-4 py-3" aria-labelledby="t-title">
              <h2 id="t-title" className="m-0 mb-2 text-[14px] font-semibold">에이전트별 걸린 시간 <span className="font-normal text-[var(--dim)]">합계 · 병렬 실행 포함</span></h2>
              <AgentBars agents={v.agents} />
            </section>
            <section className="surface px-4 py-3" aria-labelledby="tool-title">
              <h2 id="tool-title" className="m-0 mb-1 text-[14px] font-semibold">툴 호출</h2>
              <ToolTable tools={v.tools} />
            </section>
          </div>

          <details className="surface px-4 py-3">
            <summary className="cursor-pointer text-[14px] font-semibold">총괄 이벤트 {v.timeline.length}개 <span className="font-normal text-[var(--dim)]">(계획 · 배정 · 검토 · 조건 컴파일 — 작업 밖에서 난 것)</span></summary>
            <div className="mt-2"><EventRows rows={v.timeline} /></div>
          </details>
        </>
      )}

      {drawer && <TaskDrawer {...drawer} agentLabel={label} onClose={() => setDrawer(null)} />}
    </>
  );
}

function Stat({ k, children, bad }: { k: string; children: React.ReactNode; bad?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <dt className="text-[var(--dim)]">{k}</dt>
      <dd className={`m-0 ${bad ? "font-semibold text-[var(--unknown)]" : ""}`}>{children}</dd>
    </div>
  );
}
