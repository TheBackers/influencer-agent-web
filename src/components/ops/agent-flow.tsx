"use client";

/**
 * 에이전트 화면 '전체 구조' (설계서 13장) — 대략적인 아키텍처. 두 그래프(적재 · 검색)를 상자 하나씩으로 두고,
 * 그 안의 워커 칩 · 가운데 작업 표 · 인플루언서 DB · 아래 게이트웨이 · 감독관, 파란 번호 ①~④ = 적재와 검색이 만나는 곳.
 * 그리는 부품(노드 상자 · 워커 칩 · 화살표)은 검색 그래프 · 적재 그래프 탭 · 검색 추적과 같은 것(agent-map.tsx)을 쓴다.
 * 그래프 안의 자세한 순서는 그 탭에 있다 — 여기서는 누가 어느 쪽에 있고 어디서 만나는지만.
 */
import { Arrows, Chip } from "@/components/ops/agent-map";
import type { OpsCatalog } from "@/types/v2";

type Pick = (name: string) => void;
const MONO = { fontFamily: "var(--font-geist-mono), monospace" };

/** 노드 상자 — 검색 추적 · 그래프 탭의 노드와 같은 모양(판 · 테두리 · 굵은 이름 · 코드 이름 · 한 줄 설명) */
function Node({ x, y, w, h, label, id, sub, dashed = false }: { x: number; y: number; w: number; h: number; label: string; id?: string; sub?: string; dashed?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="8" fill="var(--panel)" stroke="var(--border-strong)" strokeWidth="1.2" strokeDasharray={dashed ? "6 4" : undefined} />
      <text x={x + 10} y={y + 19} fontSize="12" fontWeight="700" fill="var(--foreground)">{label}</text>
      {id && <text x={x + 10} y={y + 33} fontSize="9.5" fill="var(--dim)" style={MONO}>{id}</text>}
      {sub && <text x={x + 10} y={y + (id ? 51 : 36)} fontSize="10" fill="var(--ink-2)">{sub}</text>}
    </g>
  );
}

function Num({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="9" fill="var(--accent)" stroke="var(--panel)" strokeWidth="1.5" />
      <text x={x} y={y + 3.8} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--accent-ink)">{n}</text>
    </g>
  );
}

function Link({ x, y, t, on }: { x: number; y: number; t: string; on?: () => void }) {
  return (
    <g role={on ? "button" : undefined} tabIndex={on ? 0 : undefined} onClick={on} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && on?.()}
      style={{ cursor: on ? "pointer" : "default", outline: "none" }}>
      <text x={x} y={y} fontSize="10.5" fontWeight="600" fill="var(--accent)">{t}</text>
    </g>
  );
}

export function AgentSystemMap({ cat, onPick, onGraph }: { cat: OpsCatalog; onPick?: Pick; onGraph?: (g: "search" | "ingest") => void }) {
  const by = Object.fromEntries(cat.agents.map((a) => [a.name, a]));
  const sNode = Object.fromEntries(cat.graphs.search.nodes.map((n) => [n.id, n.agents]));
  const iNode = Object.fromEntries(cat.graphs.ingest.nodes.map((n) => [n.id, n.agents]));
  const ingest = [...new Set(["seed", "collect", "classify", "enrich"].flatMap((id) => iNode[id] ?? []))];
  const always = [...new Set(["retrieve", "measure", "research_db"].flatMap((id) => sNode[id] ?? []))];
  const liveOnly = [...new Set(["dispatch_scout", "research"].flatMap((id) => sNode[id] ?? []))].filter((n) => !always.includes(n));
  const next = cat.agents.filter((a) => a.graph === "next");
  const qp = cat.graphs.search.outside[0]?.agent;
  const CW = 98, gap = 6;
  const chips = (list: string[], x0: number, y0: number) => list.map((n, i) => (
    <Chip key={n} a={by[n]} x={x0 + (i % 3) * (CW + gap)} y={y0 + Math.floor(i / 3) * 26} w={CW} onPick={onPick} />));
  const line = { stroke: "var(--border-strong)", strokeWidth: 1.5, fill: "none", markerEnd: "url(#am-m0)" };
  const meet = { stroke: "var(--accent)", strokeWidth: 1.8, fill: "none", markerEnd: "url(#am-m1)" };

  return (
    <div className="relative overflow-x-auto">
      <svg viewBox="0 0 960 420" role="img" className="block w-full min-w-[880px] h-auto" style={{ fontFamily: "inherit" }}
        aria-label="대략적인 아키텍처: 왼쪽 적재 그래프(워커 5개), 오른쪽 검색 그래프(조건 설계와 워커 8개), 가운데 작업 표와 인플루언서 DB. 적재가 DB에 저장하고, 검색이 DB에서 먼저 읽고, 판정과 찾은 사람을 DB에 저장하고, 찾은 사람의 수집 작업을 작업 표에 넣는다. 아래에 둘이 같이 쓰는 툴 게이트웨이와 감독관.">
        <Arrows />
        {/* 시작 */}
        <rect x="40" y="8" width="112" height="28" rx="14" fill="var(--soft)" stroke="var(--border-strong)" />
        <text x="96" y="26" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--dim)">크론 1시간마다</text>
        <rect x="420" y="8" width="120" height="28" rx="14" fill="var(--soft)" stroke="var(--border-strong)" />
        <text x="480" y="26" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--foreground)">관리자</text>
        <line x1="96" y1="36" x2="96" y2="62" {...line} />
        <path d="M420 22 H240 V62" {...line} />
        <text x="252" y="17" fontSize="10" fill="var(--dim)">분야 고르기 · 지금 한 번 돌리기</text>
        <path d="M540 22 H676" {...line} />
        <text x="552" y="17" fontSize="10" fill="var(--dim)">검색 요청 · 조건 승인</text>
        <Chip a={qp ? by[qp] : undefined} x={678} y={12} w={96} onPick={onPick} />
        <line x1="774" y1="22" x2="790" y2="22" stroke="var(--border-strong)" strokeWidth="1.5" />
        <path d="M790 22 V62" {...line} />

        {/* 적재 그래프 */}
        <Node x={16} y={64} w={330} h={186} dashed label="적재 그래프" id="ingest/graph.py · 노드 6 · 적재 총괄(코드)" sub="작업 꺼내기 → 워커 → 세고 멈출지 — 판을 되풀이" />
        {chips(ingest, 28, 132)}
        <text x="28" y="206" fontSize="10" fill="var(--dim)">워커끼리 직접 부르지 않는다 — 다음 작업은 작업 표로</text>
        <Link x={28} y={236} t="적재 그래프 자세히 →" on={onGraph ? () => onGraph("ingest") : undefined} />

        {/* 가운데 */}
        <Node x={384} y={72} w={192} h={58} label="작업 표" id="catalog.jobs" sub="남은 일 · 다음 갱신일" />
        <Node x={384} y={166} w={192} h={70} label="인플루언서 DB" id="catalog" sub="사람 · 계정 · 활동 · 판정" />
        <line x1="480" y1="166" x2="480" y2="132" {...line} />
        <text x="486" y="153" fontSize="9.5" fill="var(--dim)">다음 작업</text>
        <line x1="382" y1="96" x2="348" y2="96" {...line} />
        <text x="365" y="88" textAnchor="middle" fontSize="9.5" fill="var(--dim)">꺼냄</text>

        {/* 검색 그래프 */}
        <Node x={614} y={64} w={330} h={186} dashed label="검색 그래프" id="supervisor/graph.py · 노드 9 · 검색 총괄(코드)" sub="DB에서 거르기 → 판정 → 모자라면 실시간 → 저장" />
        {chips(always, 626, 132)}
        <text x="626" y="198" fontSize="10" fill="var(--dim)">모자랄 때만</text>
        {chips(liveOnly, 626, 204)}
        <Link x={842} y={236} t="검색 그래프 자세히 →" on={onGraph ? () => onGraph("search") : undefined} />

        {/* 적재 ↔ 검색이 만나는 곳 */}
        <line x1="346" y1="210" x2="382" y2="210" {...meet} />
        <Num x={364} y={226} n={1} />
        <line x1="578" y1="186" x2="612" y2="186" {...meet} />
        <Num x={595} y={172} n={2} />
        <line x1="614" y1="218" x2="580" y2="218" {...meet} />
        <Num x={597} y={234} n={3} />
        <line x1="614" y1="112" x2="580" y2="112" {...meet} />
        <Num x={597} y={128} n={4} />

        {/* 같이 쓰는 것 */}
        <line x1="180" y1="250" x2="180" y2="284" {...line} />
        <line x1="780" y1="250" x2="780" y2="284" {...line} />
        <text x="188" y="272" fontSize="9.5" fill="var(--dim)">툴 호출</text>
        <text x="788" y="272" fontSize="9.5" fill="var(--dim)">툴 호출</text>
        <Node x={16} y={286} w={928} h={38} label="툴 게이트웨이" sub="" />
        <text x="118" y="305" fontSize="10.5" fill="var(--ink-2)">적재 · 검색 워커의 모든 외부 호출 — 캐시 · 몫(쿼터) · 재시도 · 막힌 툴 기억(O8) → 인스타 · 유튜브 · 블로그 · 웹 검색</text>
        <Node x={16} y={332} w={928} h={38} label="감독관" />
        <text x="80" y="351" fontSize="10.5" fill="var(--ink-2)">코드 규칙 — 배정 전 O2 비용 · O3 반복 / 작업마다 O1 예산 · O6 마감 / 결과 O4 핸들 · O5 근거 · O9 동일인물 (규칙표는 아래)</text>
        {next.length > 0 && (
          <g>
            <text x="16" y="400" fontSize="10.5" fontWeight="600" fill="var(--dim)">다음 단계 — 꺼짐</text>
            {next.map((a, i) => <Chip key={a.name} a={a} x={120 + i * (CW + gap)} y={387} w={CW} onPick={onPick} />)}
          </g>
        )}
        <text x="944" y="400" textAnchor="end" fontSize="10" fill="var(--dim)">모든 상자가 AgentOps에 기록을 남긴다</text>
      </svg>
    </div>
  );
}

/** 적재 ↔ 검색이 만나는 곳 — 그림의 번호 ①~④ + 그림 밖 하나 */
export const MEET: { n: string; title: string; what: string }[] = [
  { n: "1", title: "적재 → DB", what: "적재 워커가 모은 계정 · 활동 · 분류 · 연락처를 DB 함수가 저장하고(사람이 고친 칸은 안 덮어씀), 다음 작업을 작업 표에 넣는다." },
  { n: "2", title: "DB → 검색", what: "검색은 DB에서 먼저 찾는다 — DB 거르기가 사람 · 계정 · 활동과 같은 조건의 이전 판정을 읽고, 판정 · 정리 워커는 DB에 있는 글로 판정한다." },
  { n: "3", title: "검색 → DB", what: "검색이 낸 판정과 실시간으로 찾은 사람을 DB에 넣는다 — 다음 검색은 같은 조건이면 다시 판정하지 않는다(D35 · D42)." },
  { n: "4", title: "검색 → 적재", what: "실시간으로 찾은 사람은 수집 작업을 먼저(우선순위 5) 잡는다 — 다음 적재 판이 수집 · 뽑기 · 분류로 채워, 그다음 검색부터 DB 쪽에서 나온다." },
  { n: "5", title: "검색 → 관리자 → 적재", what: "검색이 모자라면 적재에 더할 낱말을 제안한다 — 관리자가 결과 화면에서 누르면 그 분야 적재 낱말이 된다(D25 · 그림 밖)." },
];
