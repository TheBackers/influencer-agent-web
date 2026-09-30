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
import { AlertTriangle, CheckCircle2, CircleDashed, Info, MinusCircle, OctagonAlert, ThumbsDown, ThumbsUp, X, XCircle } from "lucide-react";
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

// ── 실행 그래프 (설계서 10장 · D42) ─────────────────────────────────────────
// 윗줄 = DB 쪽(늘 먼저) · 아랫줄 = 실시간 쪽(모자랄 때만). 점선 상자 안 칩 = 후보 한 명마다 부르는 워커(DB 후보도 같은 워커)
const BOX: Record<string, { x: number; y: number; w: number; h: number }> = {
  plan_mission: { x: 56, y: 22, w: 128, h: 62 },
  retrieve: { x: 200, y: 22, w: 118, h: 62 },
  measure: { x: 334, y: 22, w: 118, h: 62 },
  research_db: { x: 468, y: 22, w: 150, h: 62 },
  review: { x: 656, y: 22, w: 130, h: 62 },
  judge: { x: 806, y: 22, w: 130, h: 62 },
  finalize: { x: 806, y: 124, w: 130, h: 62 },
  dispatch_scout: { x: 40, y: 250, w: 150, h: 62 },
  research: { x: 222, y: 226, w: 564, h: 112 },
};

function nodeColors(status: string, live: boolean) {
  if (!live) return { stroke: "var(--border-strong)", fill: "var(--panel)", ink: "var(--foreground)" };
  const st = statusStyle(status);
  return status === "waiting" ? { stroke: "var(--border-strong)", fill: "var(--soft)", ink: "var(--dim)" }
    : { stroke: st.fg, fill: "var(--panel)", ink: "var(--foreground)" };
}

/**
 * 총괄 그래프 — live=false 면 구성만(에이전트 화면), true 면 이번 검색에서 어떻게 돌았는지(상태 · 횟수 · 탄 갈림길).
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
  const fanDb = e("measure", "research_db");
  const toScout = e("measure", "dispatch_scout");
  const fan = e("dispatch_scout", "research");
  const hot = (x?: OpsGraphEdge) => live && !!x?.taken;
  const stroke = (x?: OpsGraphEdge) => (hot(x) ? "var(--accent)" : "var(--border-strong)");
  const mk = (x?: OpsGraphEdge) => `url(#ops-${hot(x) ? "a1" : "a0"})`;
  const chipW = 74, gap = 5, x0 = 236;

  return (
    <div className="relative overflow-x-auto">
      <svg viewBox="0 0 960 350" role="img" aria-label="총괄 그래프: 윗줄은 DB 쪽으로 실행 계획, DB에서 거르기, 코드로 재기, DB 후보 판정, 근거 검토, 통과 탈락, 재확인 저장. 아랫줄은 모자랄 때만 도는 실시간 발굴과 실시간 후보 조사. 조사 상자 안에는 후보마다 부르는 워커 단계가 있다"
        className="block w-full min-w-[880px] h-auto" style={{ fontFamily: "inherit" }}>
        <defs>
          {[["a0", "var(--border-strong)"], ["a1", "var(--accent)"]].map(([id, c]) => (
            <marker key={id} id={`ops-${id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" fill={c} />
            </marker>
          ))}
        </defs>
        <text x="56" y="14" fontSize="10.5" fontWeight="600" fill="var(--dim)">DB 쪽 — 늘 먼저</text>
        <text x="40" y="332" fontSize="10.5" fontWeight="600" fill="var(--dim)">실시간 쪽 — 모자랄 때만</text>
        {/* START / END */}
        <circle cx="26" cy="53" r="16" fill="var(--soft)" stroke="var(--border-strong)" />
        <text x="26" y="57" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--dim)">시작</text>
        <circle cx="871" cy="214" r="15" fill="var(--soft)" stroke="var(--border-strong)" />
        <text x="871" y="218" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--dim)">끝</text>

        {/* 기본 엣지 */}
        <g stroke="var(--border-strong)" strokeWidth="1.5" fill="none">
          <line x1="42" y1="53" x2="54" y2="53" markerEnd="url(#ops-a0)" />
          <line x1="184" y1="53" x2="198" y2="53" markerEnd="url(#ops-a0)" />
          <line x1="318" y1="53" x2="332" y2="53" markerEnd="url(#ops-a0)" />
          <line x1="618" y1="53" x2="654" y2="53" markerEnd="url(#ops-a0)" />
          <line x1="786" y1="53" x2="804" y2="53" markerEnd="url(#ops-a0)" />
          <line x1="871" y1="84" x2="871" y2="122" markerEnd="url(#ops-a0)" />
          <line x1="871" y1="186" x2="871" y2="197" markerEnd="url(#ops-a0)" />
          <line x1="740" y1="226" x2="740" y2="86" markerEnd="url(#ops-a0)" />
        </g>
        <text x="746" y="200" fontSize="10" fill="var(--dim)">팬인</text>
        {/* DB 후보마다 Send */}
        <line x1="452" y1="53" x2="466" y2="53" stroke={stroke(fanDb)} strokeWidth="1.8" markerEnd={mk(fanDb)} />
        {live && fanDb && fanDb.count > 0 && <text x="543" y="98" textAnchor="middle" fontSize="10" fill="var(--accent)">DB 후보 ×{fanDb.count}</text>}
        {/* DB 후보 0명 → 실시간 */}
        <path d="M393 84 L393 206 L115 206 L115 248" fill="none" stroke={stroke(toScout)} strokeWidth={hot(toScout) ? 2 : 1.3}
          strokeDasharray={hot(toScout) ? undefined : "4 3"} markerEnd={mk(toScout)} />
        <text x="400" y="150" fontSize="10" fill={hot(toScout) ? "var(--accent)" : "var(--dim)"}>DB 후보 0명</text>
        {/* 새 후보마다 Send */}
        <line x1="190" y1="281" x2="220" y2="281" stroke={stroke(fan)} strokeWidth="1.8" markerEnd={mk(fan)} />
        {live && fan && fan.count > 0 && <text x="205" y="273" textAnchor="middle" fontSize="10" fill="var(--accent)">×{fan.count}</text>}

        {/* 갈림길 — 이번 검색에서 탔으면 파란 실선 + 횟수 */}
        <path d="M700 86 L700 224" fill="none" stroke={stroke(loopR)} strokeWidth={hot(loopR) ? 2 : 1.3}
          strokeDasharray={hot(loopR) ? undefined : "4 3"} markerEnd={mk(loopR)} />
        <text x="694" y="150" textAnchor="end" fontSize="10" fill={hot(loopR) ? "var(--accent)" : "var(--dim)"}>재조사(실시간 후보만){live ? ` ${loopR?.count ?? 0}` : ""}</text>
        <path d="M826 84 L826 104 L18 104 L18 281 L38 281" fill="none" stroke={stroke(loopJ)} strokeWidth={hot(loopJ) ? 2 : 1.3}
          strokeDasharray={hot(loopJ) ? undefined : "4 3"} markerEnd={mk(loopJ)} />
        <text x="470" y="118" fontSize="10" fill={hot(loopJ) ? "var(--accent)" : "var(--dim)"}>인원 부족 → 실시간으로 채움{live ? ` ${loopJ?.count ?? 0}` : ""}</text>

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
              <text x={b.x + 10} y={b.y + 19} fontSize="12" fontWeight="700" fill={c.ink}>{isResearch ? `${n.label} — 후보마다 부르는 워커(DB 후보도 같은 워커)` : n.label}</text>
              <text x={b.x + 10} y={b.y + 33} fontSize="9.5" fill="var(--dim)" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>{id}</text>
              {live && (
                <>
                  <text x={b.x + b.w - 8} y={b.y + 33} textAnchor="end" fontSize="10.5" fontWeight="600" fill={statusStyle(n.status).fg}>
                    {n.status === "waiting" ? "안 돎" : `${statusStyle(n.status).label}${n.runs > 1 ? ` ×${n.runs}` : ""}`}
                  </text>
                  {!isResearch && <text x={b.x + 10} y={b.y + 51} fontSize="9.5" fill="var(--ink-2)">{clip(n.detail, Math.floor((b.w - 16) / 9.2))}</text>}
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
              <rect x={x} y={268} width={chipW} height={58} rx="6" fill="var(--panel)" stroke={sel ? "var(--accent)" : color} strokeWidth={sel ? 2.4 : 1.6} />
              <text x={x + chipW / 2} y={286} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--foreground)">{i + 1} {s.label}</text>
              {live && st ? (
                <>
                  <text x={x + chipW / 2} y={302} textAnchor="middle" fontSize="10" fill="var(--ink-2)">{st.runs ? `${st.runs}회 · ${secs(st.p95_ms)}` : "안 돎"}</text>
                  {(bad || part) && <text x={x + chipW / 2} y={317} textAnchor="middle" fontSize="10" fontWeight="600" fill={color}>{bad ? `실패 ${st.failed}` : `부분 ${st.partial}`}</text>}
                </>
              ) : (
                <text x={x + chipW / 2} y={304} textAnchor="middle" fontSize="9.5" fill="var(--dim)" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>{clip(s.agent.replace(/-researcher$/, ""), 12)}</text>
              )}
            </g>
          );
        })}
        {steps.length > 1 && steps.slice(0, -1).map((_, i) => (
          <line key={i} x1={x0 + i * (chipW + gap) + chipW} y1={297} x2={x0 + (i + 1) * (chipW + gap)} y2={297} stroke="var(--border-strong)" strokeWidth="1" />
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
                {c.verdict === "pass" ? <StatusChip s="ok" small /> : c.verdict === "fail" || c.verdict === "review" ? (
                  <span className="block max-w-[220px]" title={c.reject ? `${c.reject.stage_ko} · ${c.reject.reason}${c.reject.detail ? `\n${c.reject.detail}` : ""}` : undefined}>
                    <span className={`text-[11.5px] font-medium ${c.verdict === "review" ? "text-[var(--unknown)]" : "text-[var(--fail)]"}`}>
                      {c.verdict === "review" ? "확인 필요" : "탈락"}</span>
                    {c.reject && <span className="block text-[11px] text-[var(--ink-2)] leading-snug line-clamp-2">{c.reject.reason}</span>}
                  </span>) : <span className="text-[var(--dim)]">—</span>}
                {c.feedback && (c.feedback.score === 1
                  ? <span className="flex items-center gap-1 mt-0.5 text-[11px] text-[var(--pass)]"><ThumbsUp size={11} aria-hidden />맞음</span>
                  : <span className="flex items-center gap-1 mt-0.5 text-[11px] text-[var(--fail)] whitespace-nowrap" title={[c.feedback.reason_label, c.feedback.condition_id, c.feedback.comment].filter(Boolean).join(" · ")}>
                      <ThumbsDown size={11} aria-hidden />{c.feedback.reason_label || "안 맞음"}</span>)}
              </td>
              {steps.map((s) => {
                const cell = c.cells[s.agent];
                if (!cell) return <td key={s.agent} className="px-2 py-1.5 text-[var(--dim)]">—</td>;
                const st = statusStyle(cell.status);
                return (
                  <td key={s.agent} className={`px-1 py-1 ${focus === s.agent ? "bg-[var(--accent-bg)]" : ""}`}>
                    <button type="button" onClick={() => onPick(cell.task_ids)}
                      title={`${s.label} · ${st.label} · ${secs(cell.ms)} · ${usd(cell.usd)} · LLM ${cell.llm_calls} · 툴 ${cell.tool_calls}${cell.errors ? ` · 오류 ${cell.errors}${cell.error_hint ? ` (${cell.error_hint})` : ""}` : ""}${cell.runs > 1 ? ` · ${cell.runs}회(재조사)` : ""}`}
                      className="w-full flex items-center gap-1 px-1.5 h-[26px] rounded text-left border border-transparent hover:border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                      style={{ background: cell.status === "ok" ? "transparent" : st.bg }}>
                      <st.Icon aria-hidden size={12} strokeWidth={2.2} style={{ color: st.fg }} className="shrink-0" />
                      <span className="sr-only">{st.label}</span>
                      <span className="text-[11.5px]">{secs(cell.ms)}</span>
                      {cell.runs > 1 && <span className="text-[10.5px] text-[var(--accent)] font-semibold">×{cell.runs}</span>}
                      {cell.errors > 0 && <span className="ml-auto text-[10.5px] font-semibold" style={{ color: "var(--fail)" }}>오류 {cell.errors}</span>}
                    </button>
                    {cell.error_hint && <span className="block px-1.5 text-[10.5px] leading-tight text-[var(--fail)] truncate max-w-[150px]" title={cell.error_hint}>{cell.error_hint}</span>}
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
        <CheckCircle2 aria-hidden size={15} /> 이 검색에서 찾은 문제가 없습니다.
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
  "account.linked": "계정 연결", "account.rejected": "계정 버림", "tool.provider_dead": "공급사 빠짐", "feedback.recorded": "사람 평가",
  "supervisor.planned": "계획", "supervisor.dispatched": "배정", "supervisor.reviewed": "검토",
  "mission.started": "검색 시작", "mission.finished": "검색 끝", "condition.compiled": "조건", "condition.coverage": "확인률",
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
