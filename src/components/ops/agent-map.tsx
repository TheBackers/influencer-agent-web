"use client";

/**
 * 에이전트 화면 부품 (설계서 13장) — 코드가 정본인 구성(/api/ops/agents)을 그림으로.
 *   OrchestrationMap  두 총괄(검색 · 적재) → 워커 부르기(레지스트리 · 작업 범위 · 결과) → 워커 → 툴 게이트웨이, 감독관 · AgentOps 기록
 *   SearchMap         검색 그래프 9노드 — 노드마다 부르는 워커 칩 · 최근 N건 중 몇 건이 그 길을 탔나
 *   IngestMap         적재 그래프 6노드 — 작업 꺼내기 → 워커 4갈래 → 세고 멈출지 보기 · 단계별 24시간 숫자
 *   AgentCard         워커 한 명 — 그래프 자리 · 역할 지표 · 최근 성적 · 툴(막힌 것 빨강) · 예산 · 평가 · 볼 곳
 * 칩을 누르면 onPick(이름) — 화면이 그 워커 카드로 옮겨 간다.
 */
import Link from "next/link";
import { secs, usd } from "@/components/ops/live";
import type { OpsAgentSpec, OpsCatalog, OpsKpi } from "@/types/v2";

type Pick = (name: string) => void;
const MONO = { fontFamily: "var(--font-geist-mono), monospace" };
const clip = (s: string, n: number) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s || "");

function Arrows() {
  return (
    <defs>
      {[["m0", "var(--border-strong)"], ["m1", "var(--accent)"], ["m2", "var(--unknown)"]].map(([id, c]) => (
        <marker key={id} id={`am-${id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill={c} />
        </marker>
      ))}
    </defs>
  );
}

/** 워커 칩 — 이름(한국어) · 꺼진 워커는 점선 · 누르면 카드로 */
function Chip({ x, y, w, a, n, onPick, h = 20 }: { x: number; y: number; w: number; a?: OpsAgentSpec; n?: number; onPick?: Pick; h?: number }) {
  if (!a) return null;
  const off = a.status === "disabled";
  const blocked = (a.blocked?.length ?? 0) > 0;
  return (
    <g role={onPick ? "button" : undefined} tabIndex={onPick ? 0 : undefined} aria-label={`${a.label} 카드 보기`}
      onClick={() => onPick?.(a.name)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick?.(a.name)}
      style={{ cursor: onPick ? "pointer" : "default", outline: "none" }}>
      <title>{`${a.label} (${a.name}) — ${a.description}${blocked ? `\n막힌 툴: ${a.blocked!.join(", ")}` : ""}`}</title>
      <rect x={x} y={y} width={w} height={h} rx="4" fill={off ? "var(--soft)" : "var(--accent-bg)"}
        stroke={off ? "var(--border-strong)" : "var(--accent)"} strokeWidth="1" strokeDasharray={off ? "3 2" : undefined} />
      <text x={x + w / 2} y={y + h / 2 + 3.6} textAnchor="middle" fontSize="10.5" fontWeight="600"
        fill={off ? "var(--dim)" : "var(--accent)"}>{n != null ? `${n} ` : ""}{clip(a.label, Math.floor((w - (n != null ? 14 : 4)) / 10.5))}</text>
      {blocked && !off && <circle cx={x + w - 4} cy={y + 4} r="4" fill="var(--fail)" stroke="var(--panel)" strokeWidth="1.2" />}
    </g>
  );
}

// ── 전체 구조 ────────────────────────────────────────────────────────────────
const GROUPS: [string, string][] = [["검색", "늘 돈다"], ["검색 · 모자랄 때", "모자랄 때만 (실시간)"]];

export function OrchestrationMap({ cat, onPick, onGraph }: { cat: OpsCatalog; onPick?: Pick; onGraph?: (g: "search" | "ingest") => void }) {
  const go = (g: "search" | "ingest", x: number, y: number) => (
    <g role="button" tabIndex={0} aria-label={`${g === "search" ? "검색" : "적재"} 그래프 보기`} style={{ cursor: "pointer", outline: "none" }}
      onClick={() => onGraph?.(g)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onGraph?.(g)}>
      <rect x={x - 4} y={y - 12} width="112" height="17" rx="3" fill="transparent" />
      <text x={x} y={y} fontSize="10.5" fontWeight="600" fill="var(--accent)">{g === "search" ? "검색" : "적재"} 그래프 보기 →</text>
    </g>);
  const by = (g: string) => cat.agents.filter((a) => a.group === g);
  const COLS = 3, CW = 84, CG = 5, RH = 23, X = 736;
  const rows = (n: number) => Math.max(1, Math.ceil(n / COLS));
  // 워커 묶음 상자 높이는 워커 수를 따라간다
  const s1 = by("검색"), s2 = by("검색 · 모자랄 때"), ing = by("적재"), nxt = by("다음 단계(꺼짐)");
  const w1 = { y: 86, h: 40 + rows(s1.length) * RH + 20 + rows(s2.length) * RH };
  const w2 = { y: w1.y + w1.h + 14, h: 26 + rows(ing.length) * RH + 6 };
  const w3 = { y: w2.y + w2.h + 14, h: 26 + rows(nxt.length) * RH + 6 };
  const bottom = Math.max(442, w3.y + w3.h);
  const gw = bottom + 32, ops = gw + 66, H = ops + 44;
  const chips = (list: OpsAgentSpec[], y0: number) => list.map((a, i) => (
    <Chip key={a.name} a={a} x={X + 10 + (i % COLS) * (CW + CG)} y={y0 + Math.floor(i / COLS) * RH} w={CW} onPick={onPick} />));
  const nSearch = s1.length + s2.length;
  const box = (x: number, y: number, w: number, h: number, dashed = false, strong = false) => (
    <rect x={x} y={y} width={w} height={h} rx="8" fill="var(--panel)" stroke={strong ? "var(--foreground)" : "var(--border-strong)"}
      strokeWidth={strong ? 1.6 : 1.2} strokeDasharray={dashed ? "5 4" : undefined} />);
  const pill = (x: number, y: number, t: string) => (
    <g>
      <rect x={x - (t.length * 3.4 + 10)} y={y} width={t.length * 6.8 + 20} height="18" rx="9" fill="var(--unknown-bg)" stroke="var(--unknown)" />
      <text x={x} y={y + 12.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--unknown)">{t}</text>
    </g>);
  const T = (x: number, y: number, t: string, o: { size?: number; bold?: boolean; dim?: boolean; mono?: boolean; anchor?: "start" | "middle" | "end"; color?: string } = {}) => (
    <text x={x} y={y} fontSize={o.size ?? 11} fontWeight={o.bold ? 700 : 400} textAnchor={o.anchor ?? "start"}
      fill={o.color ?? (o.dim ? "var(--dim)" : "var(--foreground)")} style={o.mono ? MONO : undefined}>{t}</text>);

  return (
    <div className="relative overflow-x-auto">
      <svg viewBox={`0 0 1040 ${H}`} role="img" className="block w-full min-w-[920px] h-auto" style={{ fontFamily: "inherit" }}
        aria-label="전체 구조: 관리자 검색은 검색 총괄을, 크론은 적재 총괄을 시작한다. 두 총괄 모두 같은 워커 부르기 층(레지스트리, 작업 범위, 결과)을 지나 워커를 부르고, 워커의 툴 호출은 툴 게이트웨이를 지난다. 감독관 규칙이 배정 전, 작업 범위, 워커 결과에서 걸리고, 모든 층이 AgentOps 기록을 남긴다. 두 총괄은 인플루언서 DB로 이어진다.">
        <Arrows />
        {/* 감독관 */}
        <rect x="236" y="8" width="784" height="36" rx="8" fill="var(--unknown-bg)" stroke="var(--unknown)" />
        {T(250, 24, "감독관", { bold: true, size: 12, color: "var(--unknown)" })}
        {T(250, 38, "코드 규칙 O1~O9 — LLM이 아니다 · 걸리면 overseer.intervened 기록", { size: 10, color: "var(--ink-2)" })}
        <g stroke="var(--unknown)" strokeWidth="1.2" strokeDasharray="3 3">
          <line x1="336" y1="44" x2="336" y2="84" markerEnd="url(#am-m2)" />
          <line x1="586" y1="44" x2="586" y2="214" markerEnd="url(#am-m2)" />
          <line x1="878" y1="44" x2="878" y2="84" markerEnd="url(#am-m2)" />
        </g>
        {pill(336, 55, "O2 · O3")}
        {pill(586, 55, "O1 · O6")}
        {pill(878, 55, "O4 · O5 · O9")}
        {T(378, 68, "배정 전", { size: 9.5, dim: true })}
        {T(628, 68, "작업마다", { size: 9.5, dim: true })}
        {T(936, 68, "워커 결과", { size: 9.5, dim: true })}

        {/* 시작 */}
        {box(16, 96, 180, 100, true)}
        {T(28, 116, "관리자 검색", { bold: true, size: 12 })}
        {T(28, 134, "요청문 → 조건 설계(AI 1회)", { size: 10.5, color: "var(--ink-2)" })}
        {T(28, 150, "→ 조건 카드를 사람이 승인", { size: 10.5, color: "var(--ink-2)" })}
        {T(28, 170, "웹 · POST /api/missions", { size: 9.5, dim: true, mono: true })}
        {box(16, 342, 180, 90, true)}
        {T(28, 362, "크론 1시간마다", { bold: true, size: 12 })}
        {T(28, 380, "적재 스위치가 켜졌을 때", { size: 10.5, color: "var(--ink-2)" })}
        {T(28, 396, "한 번에 최대 50분", { size: 10.5, color: "var(--ink-2)" })}
        {T(28, 416, "INGEST_ENABLED=1", { size: 9.5, dim: true, mono: true })}

        {/* 두 총괄 + DB */}
        {box(236, 86, 200, 120, false, true)}
        {T(248, 106, "검색 총괄", { bold: true, size: 13 })}
        {T(248, 121, "supervisor/graph.py · 노드 9", { size: 9.5, dim: true, mono: true })}
        {T(248, 142, "DB에서 먼저 찾고", { size: 10.5, color: "var(--ink-2)" })}
        {T(248, 158, "모자라면 실시간으로 채운다", { size: 10.5, color: "var(--ink-2)" })}
        {T(248, 178, "검토 · 통과/탈락은 코드", { size: 10.5, color: "var(--ink-2)" })}
        {go("search", 248, 197)}
        <rect x="236" y="238" width="200" height="62" rx="8" fill="var(--soft)" stroke="var(--border-strong)" />
        {T(248, 258, "인플루언서 DB", { bold: true, size: 12 })}
        {T(248, 274, "Supabase catalog", { size: 9.5, dim: true, mono: true })}
        {T(248, 290, "사람 · 계정 · 판정 · 작업 표", { size: 10, color: "var(--ink-2)" })}
        {box(236, 332, 200, 110, false, true)}
        {T(248, 352, "적재 총괄", { bold: true, size: 13 })}
        {T(248, 367, "ingest/graph.py · 노드 6", { size: 9.5, dim: true, mono: true })}
        {T(248, 388, "작업 표에서 몫만큼 꺼내", { size: 10.5, color: "var(--ink-2)" })}
        {T(248, 404, "워커마다 나눠 보내고 센다", { size: 10.5, color: "var(--ink-2)" })}
        {go("ingest", 248, 431)}

        {/* 워커 부르기 — 두 총괄이 같은 길 */}
        <rect x="476" y="86" width="220" height="356" rx="10" fill="var(--accent-bg)" stroke="var(--accent)" strokeWidth="1.4" />
        {T(488, 106, "워커 부르기 invoke(능력)", { bold: true, size: 12.5, color: "var(--accent)" })}
        {T(488, 121, "agents/base.py · 두 총괄이 같은 길", { size: 9.5, dim: true, mono: true })}
        {[
          { y: 134, h: 70, t: "① 레지스트리가 고른다", l: ["능력 이름 → agent.yaml", "사용 중 · 일부(20%) · 꺼짐 건너뜀"] },
          { y: 216, h: 84, t: "② 작업 범위를 씌운다", l: ["예산 LLM · 툴 호출 수 (O1)", "마감 시간 (O6)", "시작 · 끝 기록 (task_id)"] },
          { y: 312, h: 76, t: "③ 결과를 돌려준다", l: ["ok · partial · failed · blocked", "총괄이 받아 다음 노드를 정한다"] },
        ].map((s) => (
          <g key={s.t}>
            <rect x="488" y={s.y} width="196" height={s.h} rx="6" fill="var(--panel)" stroke="var(--border-strong)" />
            {T(498, s.y + 18, s.t, { bold: true, size: 11.5 })}
            {s.l.map((l, i) => <g key={l}>{T(498, s.y + 35 + i * 15, l, { size: 10.2, color: "var(--ink-2)" })}</g>)}
          </g>
        ))}
        <g stroke="var(--accent)" strokeWidth="1.3">
          <line x1="586" y1="204" x2="586" y2="214" />
          <line x1="586" y1="300" x2="586" y2="310" markerEnd="url(#am-m1)" />
        </g>
        {T(586, 412, "다음 길은 코드가 정한다", { size: 10, anchor: "middle", color: "var(--ink-2)" })}
        {T(586, 427, "LLM은 워커 안에서만 쓴다", { size: 10, anchor: "middle", color: "var(--ink-2)" })}

        {/* 워커 */}
        {box(736, w1.y, 284, w1.h)}
        {T(746, w1.y + 18, `검색 워커 ${nSearch}`, { bold: true, size: 12 })}
        {T(746, w1.y + 33, GROUPS[0][1], { size: 9.5, dim: true })}
        {chips(s1, w1.y + 38)}
        {T(746, w1.y + 38 + rows(s1.length) * RH + 13, GROUPS[1][1], { size: 9.5, dim: true })}
        {chips(s2, w1.y + 38 + rows(s1.length) * RH + 18)}
        {box(736, w2.y, 284, w2.h)}
        {T(746, w2.y + 18, `적재 워커 ${ing.length}`, { bold: true, size: 12 })}
        {chips(ing, w2.y + 24)}
        {box(736, w3.y, 284, w3.h, true)}
        {T(746, w3.y + 18, `다음 단계 ${nxt.length} — 꺼짐`, { bold: true, size: 12, dim: true })}
        {chips(nxt, w3.y + 24)}

        {/* 화살표 */}
        <g stroke="var(--border-strong)" strokeWidth="1.5" fill="none">
          <line x1="196" y1="146" x2="234" y2="146" markerEnd="url(#am-m0)" />
          <line x1="196" y1="387" x2="234" y2="387" markerEnd="url(#am-m0)" />
          <line x1="436" y1="146" x2="474" y2="146" markerEnd="url(#am-m0)" />
          <line x1="436" y1="387" x2="474" y2="387" markerEnd="url(#am-m0)" />
          <line x1="696" y1="170" x2="734" y2="170" markerEnd="url(#am-m0)" />
          <line x1="734" y1="330" x2="698" y2="330" markerEnd="url(#am-m0)" />
          <line x1="336" y1="208" x2="336" y2="236" markerStart="url(#am-m0)" markerEnd="url(#am-m0)" />
          <line x1="336" y1="330" x2="336" y2="302" markerEnd="url(#am-m0)" />
          <line x1="878" y1={bottom} x2="878" y2={gw - 2} markerEnd="url(#am-m0)" />
        </g>
        {T(455, 140, "능력", { size: 9.5, anchor: "middle", dim: true })}
        {T(455, 381, "능력", { size: 9.5, anchor: "middle", dim: true })}
        {T(715, 164, "작업", { size: 9.5, anchor: "middle", dim: true })}
        {T(715, 324, "결과", { size: 9.5, anchor: "middle", dim: true })}
        {T(344, 226, "먼저 찾기 · 찾은 사람 저장", { size: 9.5, dim: true })}
        {T(344, 320, "저장(DB 가드) · 작업 표", { size: 9.5, dim: true })}
        {T(886, gw - 10, "툴 호출", { size: 9.5, dim: true })}

        {/* 툴 게이트웨이 */}
        <rect x="476" y={gw} width="544" height="44" rx="8" fill="var(--soft)" stroke="var(--border-strong)" />
        {T(488, gw + 18, "툴 게이트웨이", { bold: true, size: 12 })}
        {T(488, gw + 34, "캐시 · 몫(쿼터) · 재시도 · 막힌 툴 기억(O1 · O8)", { size: 10.2, color: "var(--ink-2)" })}
        {T(1008, gw + 18, "→ 웹 검색 · 인스타 · 유튜브 · 블로그", { size: 10.2, anchor: "end", color: "var(--ink-2)" })}
        {T(1008, gw + 34, "LLM은 호출 직전 비용 상한(O2)", { size: 10, anchor: "end", dim: true })}

        {/* AgentOps 기록 */}
        <rect x="16" y={ops} width="1004" height="34" rx="8" fill="var(--panel)" stroke="var(--border-strong)" strokeDasharray="2 3" />
        {T(28, ops + 21, "AgentOps 기록", { bold: true, size: 12 })}
        {T(128, ops + 21, "총괄 · 워커 · 게이트웨이 · 감독관이 모두 이벤트를 남긴다 → 검색 추적 · 관측 · 진단 · 이 화면", { size: 10.5, color: "var(--ink-2)" })}
        <g stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="2 3">
          <line x1="336" y1="442" x2="336" y2={ops} />
          <line x1="586" y1="442" x2="586" y2={gw} />
          <line x1="586" y1={gw + 44} x2="586" y2={ops} />
        </g>
      </svg>
    </div>
  );
}

// ── 검색 그래프 ──────────────────────────────────────────────────────────────
const S_BOX: Record<string, { x: number; y: number; w: number; h: number; cols?: number }> = {
  plan_mission: { x: 16, y: 96, w: 120, h: 116 },
  retrieve: { x: 150, y: 96, w: 124, h: 116 },
  measure: { x: 288, y: 96, w: 124, h: 116 },
  research_db: { x: 426, y: 96, w: 206, h: 116, cols: 2 },
  review: { x: 646, y: 96, w: 112, h: 116 },
  judge: { x: 772, y: 96, w: 112, h: 116 },
  finalize: { x: 772, y: 250, w: 150, h: 92 },
  dispatch_scout: { x: 16, y: 318, w: 150, h: 104 },
  research: { x: 190, y: 318, w: 544, h: 104 },
};
const S_SUB: Record<string, string> = {
  plan_mission: "승인 조건 → 계획", retrieve: "SQL로 걸러 낸다", measure: "측정 조건을 코드로",
  research_db: "이전 판정 재사용", review: "필수 근거 확인", judge: "인원 채웠나 본다",
  finalize: "재확인 뒤 DB 저장", dispatch_scout: "검색어로 새 후보", research: "새 후보마다 — 이 순서로",
};
/** 글자 폭 어림 — 한글은 글자 크기만큼, 나머지는 0.6배 (SVG 글자 옆에 다른 글자를 붙일 때) */
const tw = (s: string, size: number) => [...s].reduce((n, ch) => n + (/[\u3131-\uD79D]/.test(ch) ? size : ch === " " ? size * 0.3 : size * 0.6), 0);

export function SearchMap({ cat, onPick }: { cat: OpsCatalog; onPick?: Pick }) {
  const g = cat.graphs.search;
  const by = Object.fromEntries(cat.agents.map((a) => [a.name, a]));
  const u = g.usage;
  const N = u?.searches ?? 0;
  const edge = (a: string, b: string) => u?.edges?.[`${a}>${b}`] ?? 0;
  const hot = (n: number) => N > 0 && n > 0;
  const line = (n: number) => ({ stroke: hot(n) ? "var(--accent)" : "var(--border-strong)", strokeWidth: hot(n) ? 1.8 : 1.3,
    strokeDasharray: hot(n) ? undefined : "4 3", markerEnd: `url(#am-${hot(n) ? "m1" : "m0"})`, fill: "none" });
  const cnt = (n: number) => (N ? ` · 최근 ${n}건` : "");
  const outside = g.outside[0];
  const qp = outside ? by[outside.agent] : undefined;

  return (
    <div className="relative overflow-x-auto">
      <svg viewBox="0 0 1000 440" role="img" className="block w-full min-w-[900px] h-auto" style={{ fontFamily: "inherit" }}
        aria-label="검색 그래프: 그래프 밖에서 조건 설계가 조건 카드를 만들고 사람이 승인하면 시작한다. 윗줄은 DB 쪽으로 실행 계획, DB에서 거르기(catalog-retriever), 코드로 재기(profiler), DB 후보 판정, 근거 검토, 통과 탈락, 재확인 저장. 아랫줄은 모자랄 때만 도는 실시간 발굴(scout)과 새 후보마다 조사(웹, 계정 연결, 유튜브, 인스타, 판정, 정리).">
        <Arrows />
        {/* 그래프 밖 */}
        <rect x="8" y="8" width="984" height="54" rx="8" fill="none" stroke="var(--border-strong)" strokeDasharray="5 4" />
        <text x="18" y="24" fontSize="10" fontWeight="600" fill="var(--dim)">그래프 밖 — 조건 승인 전</text>
        <text x="18" y="46" fontSize="11.5" fill="var(--ink-2)">요청문</text>
        <line x1="62" y1="42" x2="84" y2="42" stroke="var(--border-strong)" strokeWidth="1.3" markerEnd="url(#am-m0)" />
        <Chip x={88} y={32} w={96} a={qp} onPick={onPick} />
        <text x="192" y="46" fontSize="10.5" fill="var(--dim)">AI 1회 · 조건 카드(유형 · 기준표 · 숫자는 코드)</text>
        <line x1="440" y1="42" x2="462" y2="42" stroke="var(--border-strong)" strokeWidth="1.3" markerEnd="url(#am-m0)" />
        <text x="468" y="46" fontSize="11.5" fill="var(--ink-2)">사람이 조건 카드 승인</text>
        <text x="984" y="46" textAnchor="end" fontSize="10.5" fill="var(--dim)">{g.trigger}</text>
        <line x1="76" y1="62" x2="76" y2="94" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#am-m0)" />
        <text x="84" y="82" fontSize="10" fill="var(--dim)">시작</text>
        <text x="529" y="88" textAnchor="middle" fontSize="10" fill={hot(edge("measure", "research_db")) ? "var(--accent)" : "var(--dim)"}>
          DB 후보마다 Send{cnt(edge("measure", "research_db"))}</text>

        {/* 윗줄 엣지 */}
        <g stroke="var(--border-strong)" strokeWidth="1.5" fill="none">
          <line x1="136" y1="154" x2="148" y2="154" markerEnd="url(#am-m0)" />
          <line x1="274" y1="154" x2="286" y2="154" markerEnd="url(#am-m0)" />
          <line x1="632" y1="154" x2="644" y2="154" markerEnd="url(#am-m0)" />
          <line x1="758" y1="154" x2="770" y2="154" markerEnd="url(#am-m0)" />
          <line x1="828" y1="212" x2="828" y2="248" markerEnd="url(#am-m0)" />
          <line x1="922" y1="296" x2="938" y2="296" markerEnd="url(#am-m0)" />
          <line x1="166" y1="370" x2="188" y2="370" markerEnd="url(#am-m0)" />
          <line x1="712" y1="318" x2="712" y2="214" markerEnd="url(#am-m0)" />
        </g>
        <line x1="412" y1="154" x2="424" y2="154" {...line(edge("measure", "research_db"))} strokeDasharray={undefined} />
        <circle cx="955" cy="296" r="15" fill="var(--soft)" stroke="var(--border-strong)" />
        <text x="955" y="300" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--dim)">끝</text>
        <text x="718" y="300" fontSize="9.5" fill="var(--dim)">팬인</text>
        <text x="177" y="362" textAnchor="middle" fontSize="9.5" fill="var(--dim)">Send</text>
        {/* 갈림길 — 최근 N건에서 탔으면 파란 실선 */}
        <path d="M350 212 L350 280 L91 280 L91 316" {...line(edge("measure", "dispatch_scout"))} />
        <text x="358" y="274" fontSize="10" fill={hot(edge("measure", "dispatch_scout")) ? "var(--accent)" : "var(--dim)"}>DB 후보 0명 → 바로 실시간{cnt(edge("measure", "dispatch_scout"))}</text>
        <path d="M790 212 L790 238 L8 238 L8 370 L14 370" {...line(edge("judge", "dispatch_scout"))} />
        <text x="440" y="232" fontSize="10" fill={hot(edge("judge", "dispatch_scout")) ? "var(--accent)" : "var(--dim)"}>인원 부족 → 실시간으로 채움{cnt(edge("judge", "dispatch_scout"))}</text>
        <path d="M680 214 L680 316" {...line(edge("review", "research"))} />
        <text x="674" y="300" textAnchor="end" fontSize="10" fill={hot(edge("review", "research")) ? "var(--accent)" : "var(--dim)"}>재조사(실시간 후보만){cnt(edge("review", "research"))}</text>
        <text x="16" y="436" fontSize="10.5" fontWeight="600" fill="var(--dim)">실시간 쪽 — 모자랄 때만</text>

        {/* 노드 */}
        {g.nodes.map((n) => {
          const b = S_BOX[n.id];
          if (!b) return null;
          const ran = u?.nodes?.[n.id] ?? 0;
          const code = n.agents.length === 0;
          const wide = n.id === "research";
          const cols = b.cols ?? 1;
          const cw = wide ? 84 : (b.w - 16 - (cols - 1) * 6) / cols;
          return (
            <g key={n.id}>
              <title>{`${n.label} (${n.id})${code ? " — 총괄 코드만(워커 안 부름)" : " — 부르는 워커: " + n.agents.join(", ")}`}</title>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="8" fill={code ? "var(--soft)" : "var(--panel)"}
                stroke={N && ran ? "var(--accent)" : "var(--border-strong)"} strokeWidth={N && ran ? 1.6 : 1.2} strokeDasharray={wide ? "6 4" : undefined} />
              <text x={b.x + 9} y={b.y + 18} fontSize="12" fontWeight="700" fill="var(--foreground)">{n.label}</text>
              <text x={b.x + 9} y={b.y + 31} fontSize="9.5" fill="var(--dim)" style={MONO}>{n.id}</text>
              {N > 0 && <text x={b.x + b.w - 8} y={b.y + 31} textAnchor="end" fontSize="10" fontWeight="600" fill={ran ? "var(--accent)" : "var(--dim)"}>{ran}/{N}건</text>}
              <text x={b.x + 9} y={b.y + 46} fontSize="10" fill="var(--ink-2)">{clip(S_SUB[n.id] ?? "", Math.floor((b.w - 14) / 9.6))}</text>
              {code ? (
                <text x={b.x + 9} y={b.y + 68} fontSize="10" fill="var(--dim)">총괄 코드만</text>
              ) : n.agents.map((name, i) => (
                <Chip key={name} a={by[name]} onPick={onPick} n={wide ? i + 1 : undefined}
                  x={wide ? b.x + 9 + i * (cw + 6) : b.x + 8 + (i % cols) * (cw + 6)}
                  y={wide ? b.y + 58 : b.y + 54 + Math.floor(i / cols) * 22} w={cw} h={wide ? 26 : 19} />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── 적재 그래프 ──────────────────────────────────────────────────────────────
const I_ROW = { seed: 12, collect: 96, classify: 180, enrich: 264 } as Record<string, number>;
const I_SEND: Record<string, string> = { seed: "분야 작업마다", collect: "계정마다", classify: "한 묶음", enrich: "사람마다" };

export function IngestMap({ cat, onPick }: { cat: OpsCatalog; onPick?: Pick }) {
  const g = cat.graphs.ingest;
  const by = Object.fromEntries(cat.agents.map((a) => [a.name, a]));
  const st = g.usage?.stages ?? {};
  const node = (id: string) => g.nodes.find((n) => n.id === id);
  const workers = g.nodes.filter((n) => n.id in I_ROW);
  const pick = node("pick"), tally = node("tally");
  return (
    <div className="relative overflow-x-auto">
      <svg viewBox="0 0 1000 372" role="img" className="block w-full min-w-[900px] h-auto" style={{ fontFamily: "inherit" }}
        aria-label="적재 그래프: 크론이 시작하면 작업 꺼내기가 작업 표에서 이번 판 몫만큼 꺼내 씨앗 줍기, 수집 뽑기, 분류, 웹 보강으로 나눠 보낸다. 모두 세고 멈출지 보기로 모이고, 다음 판으로 돌아가거나 멈춘다.">
        <Arrows />
        {/* 크론 · 작업 꺼내기 */}
        <rect x="8" y="148" width="104" height="62" rx="8" fill="none" stroke="var(--border-strong)" strokeDasharray="5 4" />
        <text x="18" y="168" fontSize="11.5" fontWeight="700" fill="var(--foreground)">크론</text>
        <text x="18" y="184" fontSize="10" fill="var(--ink-2)">1시간마다</text>
        <text x="18" y="199" fontSize="9.5" fill="var(--dim)">{g.usage?.enabled ? "스위치 켜짐" : "스위치 꺼짐"}</text>
        <line x1="112" y1="179" x2="136" y2="179" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#am-m0)" />
        <rect x="140" y="112" width="162" height="134" rx="8" fill="var(--soft)" stroke="var(--foreground)" strokeWidth="1.5" />
        <title>작업 꺼내기(pick) — 총괄 코드만</title>
        <text x="150" y="132" fontSize="12" fontWeight="700" fill="var(--foreground)">{pick?.label ?? "작업 꺼내기"}</text>
        <text x="150" y="145" fontSize="9.5" fill="var(--dim)" style={MONO}>pick · 총괄 코드</text>
        {["작업 표에서 이번 판", "몫만큼 꺼낸다", "몫 없는 종류는 안 꺼냄", "(인스타 시간 · 유튜브 하루", " · 웹 하루 · AI 월 상한)"].map((t, i) => (
          <text key={t} x="150" y={164 + i * 15} fontSize="10" fill={i < 3 ? "var(--ink-2)" : "var(--dim)"}>{t}</text>
        ))}

        {/* 워커 노드 */}
        {workers.map((n) => {
          const y = I_ROW[n.id];
          const s = st[n.id];
          const bad = s && s.failed_24h > 0;
          return (
            <g key={n.id}>
              <title>{`${n.label} (${n.id}) — 부르는 워커: ${n.agents.join(", ")}`}</title>
              <path d={`M302 179 C340 179 340 ${y + 36} 376 ${y + 36}`} fill="none" stroke="var(--accent)" strokeWidth="1.5" markerEnd="url(#am-m1)" />
              <rect x="380" y={y} width="300" height="72" rx="8" fill="var(--panel)" stroke={bad ? "var(--fail)" : "var(--border-strong)"} strokeWidth="1.3" />
              <text x="390" y={y + 18} fontSize="12" fontWeight="700" fill="var(--foreground)">{n.label}</text>
              <text x={390 + tw(n.label, 12) + 8} y={y + 18} fontSize="9.5" fill="var(--dim)">
                <tspan style={MONO}>{n.id}</tspan><tspan fill="var(--accent)"> · {I_SEND[n.id]} Send</tspan></text>
              <text x="390" y={y + 36} fontSize="10" fill="var(--ink-2)">{n.detail}</text>
              <text x="390" y={y + 58} fontSize="10.5" fill={bad ? "var(--fail)" : "var(--ink-2)"} fontWeight={bad ? 600 : 400}>
                {s ? `24시간 완료 ${s.done_24h} · 실패 ${s.failed_24h} · 대기 ${s.waiting}` : "적재 기록 없음"}</text>
              {n.agents.map((name, i) => (
                <Chip key={name} a={by[name]} onPick={onPick} x={588} y={y + 8 + i * 24} w={84} />
              ))}
              <path d={`M680 ${y + 36} C720 ${y + 36} 720 179 756 179`} fill="none" stroke="var(--border-strong)" strokeWidth="1.3" markerEnd="url(#am-m0)" />
            </g>
          );
        })}

        {/* 세고 멈출지 보기 */}
        <rect x="760" y="126" width="140" height="106" rx="8" fill="var(--soft)" stroke="var(--foreground)" strokeWidth="1.5" />
        <text x="770" y="146" fontSize="12" fontWeight="700" fill="var(--foreground)">{tally?.label ?? "세고 멈출지 보기"}</text>
        <text x="770" y="159" fontSize="9.5" fill="var(--dim)" style={MONO}>tally · 총괄 코드</text>
        {["이번 판 결과를 세고", "전부 몫 소진 · 차단이면", "멈춘다"].map((t, i) => (
          <text key={t} x="770" y={178 + i * 15} fontSize="10" fill="var(--ink-2)">{t}</text>
        ))}
        <line x1="900" y1="179" x2="936" y2="179" stroke="var(--border-strong)" strokeWidth="1.5" markerEnd="url(#am-m0)" />
        <circle cx="955" cy="179" r="15" fill="var(--soft)" stroke="var(--border-strong)" />
        <text x="955" y="183" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--dim)">끝</text>
        {/* 다음 판 · 할 일 없음 */}
        <path d="M830 232 L830 356 L221 356 L221 248" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#am-m1)" />
        <text x="526" y="370" textAnchor="middle" fontSize="10" fill="var(--accent)">다음 판 — 마감 5분 전까지 되풀이</text>
        <path d="M221 112 L221 89 L955 89 L955 162" fill="none" stroke="var(--border-strong)" strokeWidth="1.2" strokeDasharray="4 3" markerEnd="url(#am-m0)" />
        <text x="948" y="84" textAnchor="end" fontSize="10" fill="var(--dim)">할 일 없음 · 몫 소진 · 마감 5분 전 → 끝</text>
      </svg>
    </div>
  );
}

// ── 워커 카드 ────────────────────────────────────────────────────────────────
const STATUS_KO: Record<string, string> = { active: "사용 중", canary: "일부(20%)", shadow: "그림자", disabled: "꺼짐", retired: "은퇴" };
const TONE: Record<string, string> = { ok: "var(--pass)", warn: "var(--unknown)", bad: "var(--fail)", "": "var(--foreground)" };
const NODE_KO: Record<string, string> = {
  plan_mission: "실행 계획", retrieve: "DB에서 거르기", measure: "코드로 재기", research_db: "DB 후보 판정", dispatch_scout: "실시간 발굴",
  research: "실시간 후보 조사", review: "근거 검토", judge: "통과 · 탈락", finalize: "재확인 · 저장",
  pick: "작업 꺼내기", seed: "씨앗 줍기", collect: "수집 · 뽑기", classify: "분류", enrich: "웹 보강", tally: "세고 멈출지 보기",
};

function Kpi({ k }: { k: OpsKpi }) {
  return (
    <div className="min-w-0 rounded-md bg-[var(--soft)] px-2.5 py-1.5" title={k.hint}>
      <div className="text-[11px] text-[var(--dim)] truncate">{k.label}</div>
      <div className="text-[14px] font-semibold tabular" style={{ color: TONE[k.tone] ?? TONE[""] }}>{k.value}</div>
      {k.hint && <div className="text-[10.5px] leading-snug text-[var(--ink-2)] line-clamp-2">{k.hint}</div>}
    </div>
  );
}

export function AgentCard({ a, focused, recentLabel }: { a: OpsAgentSpec; focused?: boolean; recentLabel: string }) {
  const r = a.recent;
  const off = a.status === "disabled";
  const rate = r?.success_rate;
  const blocked = new Set(a.blocked ?? []);
  const where = a.graph === "next" ? "아직 어느 그래프에도 없음"
    : a.nodes?.length ? a.nodes.map((n) => NODE_KO[n] ?? n).join(" · ") : "그래프 밖 — 조건 승인 전";
  return (
    <article id={`agent-${a.name}`} tabIndex={-1}
      className={`surface p-3.5 flex flex-col gap-2.5 min-w-0 scroll-mt-24 outline-none ${focused ? "ring-2 ring-[var(--accent)]" : ""} ${off ? "opacity-80" : ""}`}>
      <header className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h3 className="m-0 text-[14.5px] font-semibold">{a.label}</h3>
        <span className="text-[11.5px] text-[var(--dim)]" translate="no">{a.name} · v{a.version}</span>
        <span className={`ml-auto text-[11.5px] px-1.5 h-[20px] inline-flex items-center rounded ${off ? "bg-[var(--soft)] text-[var(--dim)]" : "bg-[var(--pass-bg)] text-[var(--pass)]"}`}>
          {STATUS_KO[a.status] ?? a.status}</span>
      </header>
      <p className="m-0 text-[12.5px] text-[var(--ink-2)]">{a.description}</p>
      <dl className="m-0 grid grid-cols-[72px_1fr] gap-x-2 gap-y-1 text-[12px]">
        <dt className="text-[var(--dim)]">그래프 자리</dt><dd className="m-0">{where}</dd>
        <dt className="text-[var(--dim)]">AI</dt><dd className="m-0">{off ? "—" : a.uses_llm ? "씀" : "안 씀 — 코드만"}</dd>
        <dt className="text-[var(--dim)]">툴 선택</dt><dd className="m-0">{off ? "—" : a.tool_choice === "LLM" ? "LLM이 골라 가며 조사" : a.tool_choice}</dd>
        <dt className="text-[var(--dim)]">툴</dt>
        <dd className="m-0 min-w-0 break-words" translate="no">
          {a.tools.length ? a.tools.map((t, i) => (
            <span key={t}>{i > 0 && ", "}<span className={blocked.has(t) ? "font-semibold text-[var(--fail)]" : ""}>{t}{blocked.has(t) && " (막힘)"}</span></span>
          )) : "—"}
        </dd>
        <dt className="text-[var(--dim)]">예산</dt>
        <dd className="m-0 tabular">{off ? "—" : `LLM ${a.budget.llm_calls ?? "∞"} · 툴 ${a.budget.tool_calls ?? "∞"} · ${a.budget.timeout_s}초`}</dd>
      </dl>
      {a.kpis && a.kpis.length > 0 && (
        <div>
          <div className="text-[11.5px] font-semibold text-[var(--dim)] mb-1">역할 지표</div>
          <div className={`grid gap-1.5 ${a.kpis.length % 3 === 0 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 min-[440px]:grid-cols-2"}`}>{a.kpis.map((k) => <Kpi key={k.label} k={k} />)}</div>
        </div>
      )}
      {!off && (
        <div className="text-[12px] tabular flex flex-wrap gap-x-3 gap-y-0.5">
          <span className="text-[var(--dim)]">{recentLabel}</span>
          {r ? (
            <>
              <span>{r.runs}회</span>
              <span className={`font-semibold ${rate == null ? "" : rate < 0.8 ? "text-[var(--fail)]" : rate < 0.95 ? "text-[var(--unknown)]" : "text-[var(--pass)]"}`}>
                성공 {rate == null ? "—" : `${Math.round(rate * 100)}%`}</span>
              <span>p95 {secs(r.p95_ms)}{a.slo?.p95_s ? <span className="text-[var(--dim)]"> (목표 {a.slo.p95_s}초)</span> : null}</span>
              <span>1회 {usd(r.avg_usd ?? null)}</span>
            </>
          ) : <span className="text-[var(--dim)]">기록 없음</span>}
        </div>
      )}
      <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] pt-1 border-t border-[var(--border)]">
        <span className="text-[var(--dim)]">평가</span>
        {a.evaluated_by?.href ? <Link href={a.evaluated_by.href}>{a.evaluated_by.label}</Link> : <span>{a.evaluated_by?.label ?? "—"}</span>}
        {(a.watch?.length ?? 0) > 0 && <span className="text-[var(--dim)] ml-auto">볼 곳</span>}
        {a.watch?.map((w) => <Link key={w.href} href={w.href}>{w.label}</Link>)}
      </footer>
    </article>
  );
}
