"use client";

/**
 * AgentOps 콘솔 부품 — 실제 실행 기록(/api/ops/missions/{id})을 보이게 만든다.
 *   RunGraph       그래프 노드 6개 + 후보 조사 단계 — 몇 번 돌았고 어떻게 끝났나, 어느 갈림길을 탔나
 *   CandidateGrid  후보 × 단계 격자 — 어느 후보의 어느 단계가 막혔나 (칸을 누르면 그 작업의 호출 기록)
 *   ProblemList    문제와 원인 — 이벤트에 있는 사실 + 규칙표의 할 일
 *   AgentBars · ToolTable · TaskDrawer
 * 상태색은 상태에만 쓰고, 색만으로 구분하지 않게 아이콘과 글자를 함께 둔다.
 */
import { useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, Info, MinusCircle, OctagonAlert, X, XCircle } from "lucide-react";
import type { OpsCandidate, OpsGraphEdge, OpsGraphNode, OpsProblem, OpsStep, OpsTask, OpsTool, OpsAgentRow, Severity, TaskStatus } from "@/types/v2";

// ── 상태 · 심각도 ────────────────────────────────────────────────────────────
type S = TaskStatus | "waiting";
const ST: Record<S, { label: string; fg: string; bg: string; Icon: typeof CheckCircle2 }> = {
  ok: { label: "정상", fg: "var(--pass)", bg: "var(--pass-bg)", Icon: CheckCircle2 },
  partial: { label: "부분", fg: "var(--unknown)", bg: "var(--unknown-bg)", Icon: AlertTriangle },
  failed: { label: "실패", fg: "var(--fail)", bg: "var(--fail-bg)", Icon: XCircle },
  blocked: { label: "차단", fg: "var(--fail)", bg: "var(--fail-bg)", Icon: OctagonAlert },
  skipped: { label: "건너뜀", fg: "var(--dim)", bg: "var(--soft)", Icon: MinusCircle },
  running: { label: "진행 중", fg: "var(--accent)", bg: "var(--accent-bg)", Icon: CircleDashed },
  waiting: { label: "안 돎", fg: "var(--dim)", bg: "var(--soft)", Icon: MinusCircle },
};
export const statusStyle = (s: string) => ST[(s as S) in ST ? (s as S) : "partial"];

export function StatusChip({ s, small = false }: { s: string; small?: boolean }) {
  const st = statusStyle(s);
  return (
    <span className={`inline-flex items-center gap-1 rounded ${small ? "h-[18px] px-1 text-[11px]" : "h-[20px] px-1.5 text-[11.5px]"} font-medium whitespace-nowrap`}
      style={{ color: st.fg, background: st.bg }}>
      <st.Icon aria-hidden size={small ? 11 : 12} strokeWidth={2.2} />{st.label}
    </span>
  );
}

const SEV: Record<Severity, { label: string; fg: string; bg: string; Icon: typeof Info }> = {
  critical: { label: "심각", fg: "var(--fail)", bg: "var(--fail-bg)", Icon: OctagonAlert },
  warning: { label: "주의", fg: "var(--unknown)", bg: "var(--unknown-bg)", Icon: AlertTriangle },
  info: { label: "참고", fg: "var(--dim)", bg: "var(--soft)", Icon: Info },
};
export function SeverityChip({ s }: { s: Severity }) {
  const v = SEV[s];
  return (
    <span className="inline-flex items-center gap-1 h-[20px] px-1.5 rounded text-[11.5px] font-semibold whitespace-nowrap" style={{ color: v.fg, background: v.bg }}>
      <v.Icon aria-hidden size={12} strokeWidth={2.2} />{v.label}
    </span>
  );
}

export const usd = (v: number | null | undefined) =>
  v == null ? "—" : v === 0 ? "$0" : v < 0.001 ? "<$0.001" : v < 0.1 ? `$${v.toFixed(3)}` : `$${v.toFixed(2)}`;

export const secs = (ms: number | null | undefined) =>
  ms == null ? "—" : ms >= 60000 ? `${Math.floor(ms / 60000)}분 ${Math.round((ms % 60000) / 1000)}초` : ms >= 1000 ? `${(ms / 1000).toFixed(1)}초` : `${Math.round(ms)}ms`;

// ── 실행 그래프 ──────────────────────────────────────────────────────────────
const BOX: Record<string, { x: number; y: number; w: number; h: number }> = {
  plan_mission: { x: 76, y: 40, w: 150, h: 70 },
  dispatch_scout: { x: 256, y: 40, w: 150, h: 70 },
  research: { x: 446, y: 16, w: 498, h: 118 },
  review: { x: 774, y: 178, w: 170, h: 70 },
  judge: { x: 566, y: 178, w: 170, h: 70 },
  finalize: { x: 358, y: 178, w: 170, h: 70 },
};

function nodeColors(status: string, live: boolean) {
  if (!live) return { stroke: "var(--border-strong)", fill: "var(--panel)", ink: "var(--foreground)" };
  const st = statusStyle(status);
  return status === "waiting" ? { stroke: "var(--border-strong)", fill: "var(--soft)", ink: "var(--dim)" }
    : { stroke: st.fg, fill: "var(--panel)", ink: "var(--foreground)" };
}

/**
 * 총괄 그래프 — live=false 면 구성만(에이전트 화면), true 면 이번 임무에서 어떻게 돌았는지(상태 · 횟수 · 탄 갈림길).
 * 노드 · 단계를 누르면 onPick(id) — 추적 화면이 그 단계의 후보 칸을 강조한다.
 */
export function RunGraph({ nodes, edges, steps, live = true, picked, onPick }: {
  nodes: OpsGraphNode[]; edges: OpsGraphEdge[]; steps: (OpsStep | { agent: string; label: string })[]; live?: boolean;
  picked?: string; onPick?: (id: string) => void;
}) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const e = (a: string, b: string) => edges.find((x) => x.from === a && x.to === b);
  const loopR = e("review", "research");
  const loopJ = e("judge", "dispatch_scout");
  const fan = e("dispatch_scout", "research");
  const hot = (x?: OpsGraphEdge) => live && x?.taken;
  const chipW = 74, gap = 5, x0 = 458;

  return (
    <div className="relative overflow-x-auto">
      <svg viewBox="0 0 960 268" role="img" aria-label="총괄 그래프: 실행 계획, 발굴, 후보마다 조사, 근거 검토, 통과 탈락, 결과 정리. 조사 안에는 웹 조사, 계정 연결, 유튜브, 인스타, 조건 판정, 정리 단계가 있다"
        className="block w-full min-w-[880px] h-auto" style={{ fontFamily: "inherit" }}>
        <defs>
          {[["a0", "var(--border-strong)"], ["a1", "var(--accent)"]].map(([id, c]) => (
            <marker key={id} id={`ops-${id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" fill={c} />
            </marker>
          ))}
        </defs>
        {/* START / END */}
        <circle cx="36" cy="75" r="20" fill="var(--soft)" stroke="var(--border-strong)" />
        <text x="36" y="79" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--dim)">시작</text>
        <circle cx="310" cy="213" r="20" fill="var(--soft)" stroke="var(--border-strong)" />
        <text x="310" y="217" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--dim)">끝</text>

        {/* 기본 엣지 */}
        <g stroke="var(--border-strong)" strokeWidth="1.5" fill="none">
          <line x1="56" y1="75" x2="74" y2="75" markerEnd="url(#ops-a0)" />
          <line x1="226" y1="75" x2="254" y2="75" markerEnd="url(#ops-a0)" />
          <line x1="834" y1="134" x2="834" y2="176" markerEnd="url(#ops-a0)" />
          <line x1="774" y1="213" x2="738" y2="213" markerEnd="url(#ops-a0)" />
          <line x1="566" y1="213" x2="530" y2="213" markerEnd="url(#ops-a0)" />
          <line x1="358" y1="213" x2="332" y2="213" markerEnd="url(#ops-a0)" />
        </g>
        <line x1="406" y1="75" x2="444" y2="75" stroke={hot(fan) ? "var(--accent)" : "var(--border-strong)"} strokeWidth="1.8" markerEnd={`url(#ops-${hot(fan) ? "a1" : "a0"})`} />
        {live && fan && <text x="425" y="67" textAnchor="middle" fontSize="10" fill="var(--accent)">×{fan.count}</text>}
        <text x="842" y="160" fontSize="10" fill="var(--dim)">팬인</text>

        {/* 갈림길 — 이번 임무에서 탔으면 파란 실선 + 횟수 */}
        <path d="M914 178 L914 134" fill="none" stroke={hot(loopR) ? "var(--accent)" : "var(--border-strong)"} strokeWidth={hot(loopR) ? 2 : 1.3}
          strokeDasharray={hot(loopR) ? undefined : "4 3"} markerEnd={`url(#ops-${hot(loopR) ? "a1" : "a0"})`} />
        <text x="920" y="152" fontSize="10" fill={hot(loopR) ? "var(--accent)" : "var(--dim)"}>재조사{live ? ` ${loopR?.count ?? 0}` : ""}</text>
        <path d="M600 178 L600 150 L331 150 L331 112" fill="none" stroke={hot(loopJ) ? "var(--accent)" : "var(--border-strong)"} strokeWidth={hot(loopJ) ? 2 : 1.3}
          strokeDasharray={hot(loopJ) ? undefined : "4 3"} markerEnd={`url(#ops-${hot(loopJ) ? "a1" : "a0"})`} />
        <text x="340" y="144" fontSize="10" fill={hot(loopJ) ? "var(--accent)" : "var(--dim)"}>인원 부족 → 재발굴{live ? ` ${loopJ?.count ?? 0}` : ""}</text>

        {/* 노드 */}
        {Object.entries(BOX).map(([id, b]) => {
          const n = byId[id] ?? { id, label: id, runs: 0, status: "waiting", detail: "" };
          const c = nodeColors(n.status, live);
          const sel = picked === id;
          const isResearch = id === "research";
          return (
            <g key={id} role={onPick ? "button" : undefined} tabIndex={onPick ? 0 : undefined} aria-label={`${n.label} ${live ? statusStyle(n.status).label : ""}`}
              onClick={() => onPick?.(id)} onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && onPick?.(id)}
              style={{ cursor: onPick ? "pointer" : "default", outline: "none" }}>
              <title>{`${n.label} (${id})${n.detail ? " — " + n.detail : ""}`}</title>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="8" fill={c.fill} stroke={sel ? "var(--accent)" : c.stroke}
                strokeWidth={sel ? 2.4 : live && n.status !== "waiting" ? 1.8 : 1.2} strokeDasharray={isResearch ? "6 4" : undefined} />
              <text x={b.x + 12} y={b.y + 20} fontSize="12.5" fontWeight="700" fill={c.ink}>{n.label}</text>
              <text x={b.x + 12} y={b.y + 34} fontSize="9.5" fill="var(--dim)" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>{id}</text>
              {live && (
                <>
                  <text x={b.x + b.w - 10} y={b.y + 20} textAnchor="end" fontSize="11" fontWeight="600" fill={statusStyle(n.status).fg}>
                    {n.status === "waiting" ? "안 돎" : `${statusStyle(n.status).label}${n.runs > 1 ? ` ×${n.runs}` : ""}`}
                  </text>
                  {!isResearch && <text x={b.x + 12} y={b.y + 54} fontSize="10" fill="var(--ink-2)">{clip(n.detail, 26)}</text>}
                </>
              )}
            </g>
          );
        })}
        {/* 조사 단계 칩 */}
        {steps.map((s, i) => {
          const x = x0 + i * (chipW + gap);
          const st = "runs" in s ? s : null;
          const bad = st && st.failed > 0, part = st && st.partial > 0;
          const color = !live || !st || !st.runs ? "var(--border-strong)" : bad ? "var(--fail)" : part ? "var(--unknown)" : "var(--pass)";
          const sel = picked === s.agent;
          return (
            <g key={s.agent} role={onPick ? "button" : undefined} tabIndex={onPick ? 0 : undefined}
              onClick={() => onPick?.(s.agent)} onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && onPick?.(s.agent)}
              style={{ cursor: onPick ? "pointer" : "default", outline: "none" }}>
              <title>{st ? `${s.label}: ${st.runs}회 · 정상 ${st.ok} · 부분 ${st.partial} · 실패 ${st.failed} · p95 ${secs(st.p95_ms)}` : s.label}</title>
              <rect x={x} y={62} width={chipW} height={60} rx="6" fill="var(--panel)" stroke={sel ? "var(--accent)" : color} strokeWidth={sel ? 2.4 : 1.6} />
              <text x={x + chipW / 2} y={80} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--foreground)">{i + 1} {s.label}</text>
              {live && st ? (
                <>
                  <text x={x + chipW / 2} y={96} textAnchor="middle" fontSize="10" fill="var(--ink-2)">{st.runs ? `${st.runs}회 · ${secs(st.p95_ms)}` : "안 돎"}</text>
                  {(bad || part) && <text x={x + chipW / 2} y={111} textAnchor="middle" fontSize="10" fontWeight="600" fill={color}>{bad ? `실패 ${st.failed}` : `부분 ${st.partial}`}</text>}
                </>
              ) : (
                <text x={x + chipW / 2} y={98} textAnchor="middle" fontSize="9.5" fill="var(--dim)" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>{clip(s.agent, 14)}</text>
              )}
            </g>
          );
        })}
        {steps.length > 1 && steps.slice(0, -1).map((_, i) => (
          <line key={i} x1={x0 + i * (chipW + gap) + chipW} y1={92} x2={x0 + (i + 1) * (chipW + gap)} y2={92} stroke="var(--border-strong)" strokeWidth="1" />
        ))}
      </svg>
    </div>
  );
}

const clip = (s: string, n: number) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s || "");

// ── 후보 × 단계 격자 ─────────────────────────────────────────────────────────
export function CandidateGrid({ candidates, steps, focus, onPick }: {
  candidates: OpsCandidate[]; steps: { agent: string; label: string }[]; focus?: string; onPick: (taskIds: string[]) => void;
}) {
  if (!candidates.length) return <p className="m-0 text-[13px] text-[var(--dim)]">조사한 후보가 없습니다 — 발굴 단계에서 멈췄습니다.</p>;
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px] tabular min-w-[760px]">
        <thead>
          <tr className="text-left text-[11.5px] text-[var(--dim)]">
            <th scope="col" className="px-2 py-1.5 font-semibold">후보</th>
            <th scope="col" className="px-2 py-1.5 font-semibold">결과</th>
            {steps.map((s) => (
              <th key={s.agent} scope="col" className={`px-2 py-1.5 font-semibold whitespace-nowrap ${focus === s.agent ? "text-[var(--accent)]" : ""}`}>{s.label}</th>
            ))}
            <th scope="col" className="px-2 py-1.5 font-semibold text-right">합계 시간 · 비용</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={c.handle} className="border-t border-[var(--border)]">
              <th scope="row" className="px-2 py-1.5 text-left font-medium max-w-[200px]">
                <span translate="no" className="block truncate" title={c.handle}>{c.handle}</span>
                {c.linked && (
                  <span className="block text-[11px] text-[var(--dim)] font-normal truncate">
                    + {c.linked.platform === "instagram" ? "인스타" : "유튜브"} <span translate="no">{c.linked.id}</span> · {Math.round((c.linked.confidence ?? 0) * 100)}%
                  </span>
                )}
              </th>
              <td className="px-2 py-1.5">
                {c.verdict === "pass" ? <StatusChip s="ok" small /> : c.verdict === "fail" ? (
                  <span className="text-[11.5px] text-[var(--dim)]">탈락</span>) : <span className="text-[var(--dim)]">—</span>}
              </td>
              {steps.map((s) => {
                const cell = c.cells[s.agent];
                if (!cell) return <td key={s.agent} className="px-2 py-1.5 text-[var(--dim)]">—</td>;
                const st = statusStyle(cell.status);
                return (
                  <td key={s.agent} className={`px-1 py-1 ${focus === s.agent ? "bg-[var(--accent-bg)]" : ""}`}>
                    <button type="button" onClick={() => onPick(cell.task_ids)}
                      title={`${s.label} · ${st.label} · ${secs(cell.ms)} · ${usd(cell.usd)} · LLM ${cell.llm_calls} · 툴 ${cell.tool_calls}${cell.errors ? ` · 오류 ${cell.errors}` : ""}${cell.runs > 1 ? ` · ${cell.runs}회(재조사)` : ""}`}
                      className="w-full flex items-center gap-1 px-1.5 h-[26px] rounded text-left border border-transparent hover:border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                      style={{ background: cell.status === "ok" ? "transparent" : st.bg }}>
                      <st.Icon aria-hidden size={12} strokeWidth={2.2} style={{ color: st.fg }} className="shrink-0" />
                      <span className="sr-only">{st.label}</span>
                      <span className="text-[11.5px]">{secs(cell.ms)}</span>
                      {cell.runs > 1 && <span className="text-[10.5px] text-[var(--accent)] font-semibold">×{cell.runs}</span>}
                      {cell.errors > 0 && <span className="ml-auto text-[10.5px] font-semibold" style={{ color: "var(--fail)" }}>오류 {cell.errors}</span>}
                    </button>
                  </td>
                );
              })}
              <td className="px-2 py-1.5 text-right text-[var(--dim)] whitespace-nowrap">{secs(c.ms)} · {usd(c.usd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 문제와 원인 ──────────────────────────────────────────────────────────────
export function ProblemList({ problems, agentLabel, onEvents }: {
  problems: OpsProblem[]; agentLabel: (a: string) => string; onEvents: (p: OpsProblem) => void;
}) {
  if (!problems.length) {
    return (
      <p className="m-0 flex items-center gap-2 text-[13px]" style={{ color: "var(--pass)" }}>
        <CheckCircle2 aria-hidden size={15} /> 이 임무에서 찾은 문제가 없습니다.
      </p>
    );
  }
  return (
    <ul className="m-0 p-0 list-none divide-y divide-[var(--border)]">
      {problems.map((p, i) => (
        <li key={i} className="py-2.5 grid gap-1 md:grid-cols-[64px_1fr_auto] md:items-start">
          <SeverityChip s={p.severity} />
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold">{p.title}{p.count > 1 && <span className="ml-1.5 font-normal text-[var(--dim)] tabular">×{p.count}</span>}</div>
            {p.cause && <div className="text-[12.5px] text-[var(--ink-2)] break-words"><span className="text-[var(--dim)]">원인 </span>{p.cause}</div>}
            <div className="text-[12.5px]"><span className="text-[var(--dim)]">할 일 </span>{p.hint}</div>
            <div className="text-[11.5px] text-[var(--dim)] mt-0.5">
              {p.agent && <>에이전트 {agentLabel(p.agent)}</>}
              {p.candidates.length > 0 && <> · 후보 <span translate="no">{p.candidates.slice(0, 4).join(", ")}</span>{p.candidates.length > 4 && ` 외 ${p.candidates.length - 4}`}</>}
              {p.first_t != null && <> · 시작 {p.first_t}초 뒤</>}
            </div>
          </div>
          {p.event_ids.length > 0 && (
            <button type="button" onClick={() => onEvents(p)} className="justify-self-start md:justify-self-end text-[12.5px] text-[var(--accent)] hover:underline whitespace-nowrap">
              이벤트 {p.event_ids.length}건 보기
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

// ── 에이전트별 시간 · 비용 (한 계열 · 가로 막대) ─────────────────────────────
export function AgentBars({ agents, by = "time" }: { agents: OpsAgentRow[]; by?: "time" | "cost" }) {
  const val = (a: OpsAgentRow) => (by === "cost" ? a.usd ?? 0 : a.total_ms);
  const rows = [...agents].filter((a) => by === "time" ? a.total_ms > 0 : true).sort((a, b) => val(b) - val(a));
  const max = Math.max(by === "cost" ? 1e-9 : 1, ...rows.map(val));
  const total = rows.reduce((n, a) => n + (a.usd ?? 0), 0);
  return (
    <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
      {rows.map((a) => (
        <li key={a.agent} className="grid grid-cols-[88px_1fr_auto] items-center gap-2 text-[12.5px]"
          title={`${a.label}: 시간 ${secs(a.total_ms)} · 비용 ${usd(a.usd)} (1회 ${usd(a.usd_per_run)}) · ${a.runs}회 · LLM ${a.llm_calls} · 입력 ${a.tokens_in.toLocaleString()}토큰${a.failed ? ` · 실패 ${a.failed}` : ""}`}>
          <span className="truncate">{a.label}</span>
          <span className="h-[10px] rounded-[3px] bg-[var(--soft)] overflow-hidden" aria-hidden>
            <span className="block h-full rounded-[3px]" style={{ width: `${Math.max(2, (val(a) / max) * 100)}%`, background: a.failed ? "var(--fail)" : "var(--accent)" }} />
          </span>
          <span className="tabular text-[var(--ink-2)] whitespace-nowrap">
            {by === "cost" ? <>{usd(a.usd)}{total > 0 && <span className="text-[var(--dim)]"> · {Math.round(((a.usd ?? 0) / total) * 100)}% · 1회 {usd(a.usd_per_run)}</span>}</>
              : <>{secs(a.total_ms)} <span className="text-[var(--dim)]">· {a.runs}회 · LLM {a.llm_calls}</span></>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ToolTable({ tools }: { tools: OpsTool[] }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px] tabular">
        <thead>
          <tr className="text-left text-[11.5px] text-[var(--dim)]">
            {["툴", "호출", "캐시", "빈 결과", "오류", "평균", "p95", "공급사"].map((h) => <th key={h} scope="col" className="px-2 py-1.5 font-semibold whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {tools.map((t) => (
            <tr key={t.tool} className="border-t border-[var(--border)]">
              <td className="px-2 py-1.5" translate="no">{t.tool}</td>
              <td className="px-2 py-1.5">{t.calls}</td>
              <td className="px-2 py-1.5 text-[var(--dim)]">{t.cache_hits}</td>
              <td className={`px-2 py-1.5 ${t.calls && t.empty / t.calls >= 0.5 ? "font-semibold text-[var(--unknown)]" : ""}`}>{t.empty}</td>
              <td className={`px-2 py-1.5 ${t.errors ? "font-semibold text-[var(--fail)]" : ""}`}>{t.errors}</td>
              <td className="px-2 py-1.5">{secs(t.avg_ms)}</td>
              <td className="px-2 py-1.5">{secs(t.p95_ms)}</td>
              <td className="px-2 py-1.5 text-[var(--dim)]">{Object.entries(t.providers).map(([k, v]) => `${k} ${v}`).join(" · ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 작업 상세 (오른쪽 서랍) ───────────────────────────────────────────────────
const TYPE_KO: Record<string, string> = {
  "agent.started": "시작", "agent.finished": "끝", "llm.called": "LLM", "tool.called": "툴", "tool.cache_hit": "캐시",
  "overseer.intervened": "감독관", "policy.violated": "규칙 위반", error: "오류", retry: "재시도", "budget.warned": "예산 경고",
  "account.linked": "계정 연결", "account.rejected": "계정 버림", "tool.provider_dead": "공급사 빠짐",
  "supervisor.planned": "계획", "supervisor.dispatched": "배정", "supervisor.reviewed": "검토",
  "mission.started": "임무 시작", "mission.finished": "임무 끝", "condition.compiled": "조건", "condition.coverage": "확인률",
};
const BAD = new Set(["error", "overseer.intervened", "policy.violated", "tool.provider_dead", "account.rejected"]);

export function EventRows({ rows }: { rows: { t: number; type: string; agent?: string; text: string; ms: number | null; event_id?: string }[] }) {
  return (
    <ol className="m-0 p-0 list-none text-[12.5px]">
      {rows.map((r, i) => (
        <li key={r.event_id || i} className="grid grid-cols-[52px_64px_1fr] gap-2 py-1 border-t border-[var(--border)] first:border-t-0">
          <span className="tabular text-[var(--dim)]">{r.t.toFixed(1)}초</span>
          <span className={`font-semibold ${BAD.has(r.type) ? "text-[var(--fail)]" : r.type === "llm.called" ? "text-[var(--accent)]" : "text-[var(--ink-2)]"}`}>{TYPE_KO[r.type] ?? r.type}</span>
          <span className="min-w-0 break-words">{r.text}{r.ms != null && r.type !== "agent.finished" && <span className="text-[var(--dim)] tabular"> · {secs(r.ms)}</span>}</span>
        </li>
      ))}
    </ol>
  );
}

export function TaskDrawer({ tasks, title, rows, agentLabel, onClose }: {
  tasks?: OpsTask[]; title?: string; rows?: { t: number; type: string; agent?: string; text: string; ms: number | null }[];
  agentLabel: (a: string) => string; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    ref.current?.focus();
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={title ?? "작업 상세"}>
      <button type="button" aria-label="닫기" className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className="relative w-full max-w-[560px] h-full overflow-y-auto bg-[var(--panel)] border-l border-[var(--border)] shadow-xl outline-none"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="sticky top-0 bg-[var(--panel)] border-b border-[var(--border)] px-4 h-[48px] flex items-center gap-2">
          <h2 className="m-0 text-[14.5px] font-semibold truncate">{title ?? (tasks?.[0] ? `${agentLabel(tasks[0].agent)} · ${tasks[0].candidate || "총괄"}` : "이벤트")}</h2>
          <button type="button" onClick={onClose} className="ml-auto p-1 rounded hover:bg-[var(--soft)]" aria-label="닫기"><X size={16} /></button>
        </div>
        <div className="p-4 flex flex-col gap-5">
          {tasks?.map((t, i) => (
            <section key={t.task_id} className="flex flex-col gap-2">
              {tasks.length > 1 && <h3 className="m-0 text-[13px] font-semibold">{i + 1}회차{t.focus.length ? ` · 재조사 초점 ${t.focus.join(", ")}` : ""}</h3>}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
                <StatusChip s={t.status} />
                <span className="tabular">{secs(t.ms)} · {usd(t.usd)}</span>
                <span className="text-[var(--dim)]">LLM {t.llm_calls}회 · 툴 {t.tool_calls}회 · 입력 토큰 {t.tokens_in.toLocaleString()}</span>
                {t.errors > 0 && <span className="font-semibold text-[var(--fail)]">오류 {t.errors}</span>}
              </div>
              {t.note && <p className="m-0 text-[12.5px] text-[var(--ink-2)]">{t.note}</p>}
              <p className="m-0 text-[11.5px] text-[var(--dim)]" translate="no">{t.capability} · {t.task_id}</p>
              <EventRows rows={t.events} />
            </section>
          ))}
          {rows && <EventRows rows={rows} />}
        </div>
      </div>
    </div>
  );
}
