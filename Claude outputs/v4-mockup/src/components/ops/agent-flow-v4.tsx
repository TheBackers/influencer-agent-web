"use client";

/**
 * 에이전트 화면 '전체 구조' v4 (0930 승인 · B1 · B6 · 설계서 6-1) — 그래프 둘은 DB 표로만 만난다.
 * 적재 쪽: 계획(하루 몫 · 다양성 몫) → 워커 5(에이전트 0). 가운데: 후보 풀 · 작업 표 · 인플루언서 DB.
 * 검색 쪽: 기본 워커 4 + 버튼 검색 워커 4. 아래: 툴 게이트웨이 · 감독관 · AgentOps/LLMOps.
 * 워커 칩마다 점 셋 = 정확도 · 배포 · 운영(D60). 번호 ①~⑦ = 흐름(설계서 6-1 표).
 */
import { Arrows } from "@/components/ops/agent-map";
import { TONE } from "@/components/v4/bits";
import type { WorkerStatus } from "@/types/v4";

const MONO = { fontFamily: "var(--font-geist-mono), monospace" };

function Box({ x, y, w, h, label, id, sub, dashed = false }: { x: number; y: number; w: number; h: number; label: string; id?: string; sub?: string; dashed?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="8" fill="var(--panel)" stroke="var(--border-strong)" strokeWidth="1.2" strokeDasharray={dashed ? "6 4" : undefined} />
      <text x={x + 10} y={y + 18} fontSize="12" fontWeight="700" fill="var(--foreground)">{label}</text>
      {id && <text x={x + 10} y={y + 31} fontSize="9.5" fill="var(--dim)" style={MONO}>{id}</text>}
      {sub && <text x={x + 10} y={y + (id ? 46 : 33)} fontSize="10" fill="var(--ink-2)">{sub}</text>}
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

/** 워커 칩 — 이름 + 점 셋(정확도 · 배포 · 운영). 에이전트(LLM이 툴을 고름)는 이름 뒤 * */
function WChip({ w, x, y, width = 150, onPick }: { w?: WorkerStatus; x: number; y: number; width?: number; onPick?: (n: string) => void }) {
  if (!w) return null;
  const dots = [w.accuracy.tone, w.deploy.tone, w.ops.tone];
  const worst = dots.includes("fail");
  return (
    <g role={onPick ? "button" : undefined} tabIndex={onPick ? 0 : undefined} aria-label={`${w.ko} — 정확도 ${w.accuracy.label} · 배포 ${w.deploy.label} · 운영 ${w.ops.label}`}
      onClick={() => onPick?.(w.name)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick?.(w.name)}
      style={{ cursor: onPick ? "pointer" : "default", outline: "none" }}>
      <title>{`${w.ko} (${w.name})\n정확도: ${w.accuracy.label}\n배포: ${w.deploy.label}\n운영: ${w.ops.label}`}</title>
      <rect x={x} y={y} width={width} height={22} rx="4" fill="var(--accent-bg)" stroke={worst ? "var(--fail)" : "var(--accent)"} strokeWidth={worst ? 1.6 : 1} />
      <text x={x + 8} y={y + 15} fontSize="10.5" fontWeight="600" fill="var(--accent)">{w.ko}{w.ai === "agent" ? " *" : ""}</text>
      {dots.map((t, i) => <circle key={i} cx={x + width - 30 + i * 10} cy={y + 11} r="3.6" fill={TONE[t].color} />)}
    </g>
  );
}

export function AgentSystemMapV4({ ws, onPick }: { ws: WorkerStatus[]; onPick?: (n: string) => void }) {
  const by = Object.fromEntries(ws.map((w) => [w.name, w]));
  const line = { stroke: "var(--border-strong)", strokeWidth: 1.5, fill: "none", markerEnd: "url(#am-m0)" };
  const meet = { stroke: "var(--accent)", strokeWidth: 1.8, fill: "none", markerEnd: "url(#am-m1)" };
  return (
    <div className="relative overflow-x-auto">
      <svg viewBox="0 0 960 500" role="img" className="block w-full min-w-[880px] h-auto" style={{ fontFamily: "inherit" }}
        aria-label="v4 전체 구조: 왼쪽 적재 그래프(계획과 워커 5개), 가운데 후보 풀 · 작업 표 · 인플루언서 DB, 오른쪽 검색 그래프(기본 워커 4개와 버튼 검색 워커 4개), 아래 툴 게이트웨이 · 감독관 · AgentOps와 LLMOps. 그래프끼리는 DB 표로만 만난다.">
        <Arrows />
        {/* 시작 */}
        <rect x="36" y="8" width="130" height="28" rx="14" fill="var(--soft)" stroke="var(--border-strong)" />
        <text x="101" y="26" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--dim)">크론 매시 7분</text>
        <line x1="101" y1="36" x2="101" y2="62" {...line} />
        <rect x="420" y="8" width="120" height="28" rx="14" fill="var(--soft)" stroke="var(--border-strong)" />
        <text x="480" y="26" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--foreground)">관리자</text>
        <path d="M540 22 H676" {...line} />
        <text x="552" y="17" fontSize="10" fill="var(--dim)">요청 · 조건 승인 · 버튼</text>
        <WChip w={by["query-planner"]} x={678} y={11} width={130} onPick={onPick} />
        <path d="M808 22 H830 V62" {...line} />
        <path d="M420 22 H260 V62" {...line} />
        <text x="272" y="17" fontSize="10" fill="var(--dim)">빼기 · 지금 한 번</text>

        {/* 적재 그래프 */}
        <Box x={16} y={64} w={330} h={214} dashed label="적재 그래프" id="ingest/graph.py · 에이전트 0" sub="계획이 몫을 정하고 → 워커 → 세고 멈출지 — 판을 되풀이" />
        <rect x="28" y="118" width="306" height="24" rx="4" fill="var(--soft)" stroke="var(--border-strong)" />
        <text x="38" y="134" fontSize="10.5" fontWeight="600" fill="var(--foreground)">계획 catalog_plan — 하루 200명 · 한 분야 25% · 출처 몫 · 7일 갱신</text>
        <WChip w={by["seed-harvester"]} x={28} y={152} onPick={onPick} />
        <WChip w={by["collector"]} x={184} y={152} onPick={onPick} />
        <WChip w={by["extractor"]} x={28} y={180} onPick={onPick} />
        <WChip w={by["classifier"]} x={184} y={180} onPick={onPick} />
        <WChip w={by["web-enricher"]} x={28} y={208} onPick={onPick} />
        <text x="28" y="258" fontSize="10" fill="var(--dim)">워커끼리 직접 부르지 않는다 — 다음 작업은 작업 표로</text>

        {/* 가운데 */}
        <Box x={384} y={64} w={192} h={56} label="후보 풀" id="catalog.candidates" sub="계정마다 한 번 · 출처 · 점수" />
        <Box x={384} y={140} w={192} h={48} label="작업 표 · 탐색 요청" id="catalog.jobs · explore_requests" />
        <Box x={384} y={208} w={192} h={70} label="인플루언서 DB" id="catalog" sub="인물 · 계정 · 활동 · 판정" />
        <line x1="480" y1="120" x2="480" y2="138" {...line} />
        <text x="486" y="133" fontSize="9.5" fill="var(--dim)">계획이 꺼냄</text>
        <line x1="382" y1="164" x2="348" y2="164" {...line} />
        <text x="365" y="158" textAnchor="middle" fontSize="9.5" fill="var(--dim)">작업</text>

        {/* 검색 그래프 */}
        <Box x={614} y={64} w={330} h={214} dashed label="검색 그래프" id="supervisor/graph.py" sub="DB에서 거르기 → 재기 → 판정 → 저장 · 모자라면 탐색 요청" />
        <WChip w={by["catalog-retriever"]} x={626} y={118} onPick={onPick} />
        <WChip w={by["profiler"]} x={782} y={118} onPick={onPick} />
        <WChip w={by["verifier"]} x={626} y={146} onPick={onPick} />
        <WChip w={by["account-linker"]} x={782} y={146} onPick={onPick} />
        <text x="626" y="192" fontSize="10" fontWeight="600" fill="var(--dim)">버튼 ‘실시간으로 더 찾기’에서만</text>
        <WChip w={by["scout"]} x={626} y={200} onPick={onPick} />
        <WChip w={by["web-researcher"]} x={782} y={200} onPick={onPick} />
        <WChip w={by["ig-researcher"]} x={626} y={228} onPick={onPick} />
        <WChip w={by["yt-researcher"]} x={782} y={228} onPick={onPick} />

        {/* 흐름 ①~⑥ */}
        <line x1="346" y1="250" x2="382" y2="250" {...meet} /><Num x={364} y={266} n={1} />
        <line x1="346" y1="92" x2="382" y2="92" {...meet} /><Num x={364} y={78} n={2} />
        <line x1="578" y1="228" x2="612" y2="228" {...meet} /><Num x={595} y={214} n={3} />
        <line x1="614" y1="262" x2="580" y2="262" {...meet} /><Num x={597} y={278} n={4} />
        <line x1="614" y1="164" x2="580" y2="164" {...meet} /><Num x={597} y={150} n={5} />
        <line x1="614" y1="100" x2="580" y2="100" {...meet} /><Num x={597} y={86} n={6} />

        {/* 같이 쓰는 것 */}
        <line x1="180" y1="278" x2="180" y2="304" {...line} />
        <line x1="780" y1="278" x2="780" y2="304" {...line} />
        <Box x={16} y={306} w={928} h={34} label="툴 게이트웨이" />
        <text x="118" y="324" fontSize="10.5" fill="var(--ink-2)">모든 외부 호출 — 캐시 · 몫(쿼터) · 재시도 · 막힌 툴(O8) → 인스타 · 유튜브 · 블로그 · 네이버/카카오 웹 검색 · OpenAI</text>
        <Box x={16} y={346} w={928} h={34} label="감독관" />
        <text x="80" y="364" fontSize="10.5" fill="var(--ink-2)">코드 규칙 — O1 예산 · O2 비용 · O3 반복 · O4 지어낸 핸들 · O5 지어낸 근거 · O6 마감 · O8 차단 · O9 동일인물</text>
        <rect x="16" y="390" width="928" height="52" rx="8" fill="var(--accent-bg)" stroke="var(--accent)" strokeWidth="1.2" />
        <text x="28" y="408" fontSize="12" fontWeight="700" fill="var(--foreground)">AgentOps · LLMOps</text>
        <text x="28" y="424" fontSize="10.5" fill="var(--ink-2)">기록(추적 ID: 실행 · 작업 · 빌드 · 트레이스) → agentops · LangSmith  /  push → GitHub Actions 바뀐 워커 채점 · 게이트 → Railway Wait for CI → 배포 → 24시간 확인</text>
        <text x="28" y="437" fontSize="10" fill="var(--dim)">워커 칩의 점 셋 = 정확도 · 배포 · 운영 (초록 통과 · 노랑 측정 부족 · 빨강 문제 · 회색 해당 없음) · * = 에이전트(LLM이 툴을 고름)</text>
        <Num x={930} y={390} n={7} />
        <text x="16" y="476" fontSize="10.5" fontWeight="600" fill="var(--dim)">다음 단계 — 꺼짐: 캠페인 기획 · DM 작성 · 검수 · 답장 대응</text>
      </svg>
    </div>
  );
}

/** 흐름 ①~⑦ — 설계서 6-1 표와 같다 */
export const MEET_V4: { n: string; title: string; what: string }[] = [
  { n: "1", title: "적재 → DB", what: "새 인물 하루 200명 · 활동 중인 사람 7일 갱신. 사람이 고친 칸은 덮어쓰지 않는다." },
  { n: "2", title: "적재 → 후보 풀", what: "씨앗이 찾은 계정과 뽑기가 글에서 찾은 @계정(스노볼)이 후보 풀로 — 계정마다 한 번, 수집에 성공하면 인물." },
  { n: "3", title: "DB → 검색", what: "거르기(SQL) · 코드로 재기 · 이전 판정 재사용. 기본 검색은 DB에서만 찾는다." },
  { n: "4", title: "검색 → DB", what: "새 판정 · 계정 연결 · 결과에 나온 횟수를 저장한다 — 다음 검색은 같은 조건이면 다시 판정하지 않는다." },
  { n: "5", title: "검색 → 탐색 요청", what: "모자라면 그 분야 · 낱말이 탐색 요청이 되고, 다음 적재가 먼저 찾는다(하루 20%까지)." },
  { n: "6", title: "버튼 → 후보 풀 · DB", what: "‘실시간으로 더 찾기’로 찾아 결과에 든 사람은 인물로, 나머지 후보는 후보 풀로." },
  { n: "7", title: "모든 실행 → AgentOps", what: "추적 ID가 붙은 기록 · 트레이스가 추적 · 정확도 · 배포 화면과 배포 게이트로 간다." },
];
