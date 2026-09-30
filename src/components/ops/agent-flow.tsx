"use client";

/**
 * 에이전트 화면 '전체 구조' (설계서 13장) — 에이전트 18개가 한 그림에 다 보이고, 적재와 검색이 어떻게 맞물리는지.
 *   왼쪽 = 적재(총괄 + 워커 5) · 가운데 = 작업 표 · 인플루언서 DB · 오른쪽 = 검색(조건 설계 · 총괄 + 워커)
 *   아래 = 둘이 같이 쓰는 툴 게이트웨이 · 감독관 · AgentOps 기록
 *   파란 번호 ①~④ = 적재와 검색이 만나는 곳(아래 목록에 설명)
 * 워커가 어느 쪽 · 어느 노드에서 불리는지는 /api/ops/agents 의 노드 표(코드가 정본)에서 온다. 칩을 누르면 그 워커 카드로.
 */
import type { OpsAgentSpec, OpsCatalog } from "@/types/v2";

type Pick = (name: string) => void;
const MONO = { fontFamily: "var(--font-geist-mono), monospace" };

function Markers() {
  return (
    <defs>
      {[["0", "var(--border-strong)"], ["1", "var(--accent)"], ["2", "var(--foreground)"]].map(([k, c]) => (
        <marker key={k} id={`as${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill={c} />
        </marker>
      ))}
    </defs>
  );
}

const T = ({ x, y, t, size = 10.5, color = "var(--dim)", anchor = "start", bold = false }: {
  x: number; y: number; t: string; size?: number; color?: string; anchor?: "start" | "middle" | "end"; bold?: boolean;
}) => <text x={x} y={y} fontSize={size} fill={color} textAnchor={anchor} fontWeight={bold ? 700 : 400}>{t}</text>;

/** 워커 칩 — 이름 + 코드 이름. 누르면 카드로 · 빨간 점 = 쓰는 툴이 지금 막힘 · 꺼진 워커는 점선 */
function W({ x, y, w, h = 40, a, onPick }: { x: number; y: number; w: number; h?: number; a?: OpsAgentSpec; onPick?: Pick }) {
  if (!a) return null;
  const off = a.status === "disabled";
  const blocked = !off && (a.blocked?.length ?? 0) > 0;
  return (
    <g role={onPick ? "button" : undefined} tabIndex={onPick ? 0 : undefined} aria-label={`${a.label} 카드 보기`}
      onClick={() => onPick?.(a.name)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick?.(a.name)}
      style={{ cursor: onPick ? "pointer" : "default", outline: "none" }}>
      <title>{`${a.label} (${a.name}) — ${a.description}${blocked ? `\n지금 막힌 툴: ${a.blocked!.join(", ")}` : ""}\n눌러서 카드 보기`}</title>
      <rect x={x} y={y} width={w} height={h} rx="7" fill={off ? "var(--soft)" : "var(--accent-bg)"} stroke={off ? "var(--border-strong)" : "var(--accent)"}
        strokeWidth="1.4" strokeDasharray={off ? "4 3" : undefined} />
      <text x={x + 10} y={y + (h >= 40 ? 17 : h / 2 + 4)} fontSize="12" fontWeight="700" fill={off ? "var(--dim)" : "var(--accent)"}>{a.label}</text>
      {h >= 40 && <text x={x + 10} y={y + 32} fontSize="9.5" fill="var(--ink-2)" style={MONO}>{a.name}{a.uses_llm && !off ? " · AI" : ""}</text>}
      {blocked && <circle cx={x + w - 5} cy={y + 5} r="4.5" fill="var(--fail)" stroke="var(--panel)" strokeWidth="1.2" />}
    </g>
  );
}

function Boss({ x, y, w, h, title, sub, sub2 }: { x: number; y: number; w: number; h: number; title: string; sub: string; sub2?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="9" fill="var(--soft)" stroke="var(--foreground)" strokeWidth="1.9" />
      <T x={x + 12} y={y + 20} t={title} size={13} color="var(--foreground)" bold />
      <T x={x + 12} y={y + 36} t={sub} size={10.5} color="var(--ink-2)" />
      {sub2 && <T x={x + 12} y={y + 50} t={sub2} size={9.5} />}
    </g>
  );
}

function Cyl({ x, y, w, h, title, lines }: { x: number; y: number; w: number; h: number; title: string; lines: string[] }) {
  const r = 9;
  return (
    <g>
      <path d={`M${x} ${y + r} a${w / 2} ${r} 0 0 1 ${w} 0 V${y + h - r} a${w / 2} ${r} 0 0 1 ${-w} 0 Z`} fill="var(--panel)" stroke="var(--foreground)" strokeWidth="1.6" />
      <path d={`M${x} ${y + r} a${w / 2} ${r} 0 0 0 ${w} 0`} fill="none" stroke="var(--foreground)" strokeWidth="1.6" />
      <T x={x + w / 2} y={y + r + 22} t={title} size={12.5} color="var(--foreground)" anchor="middle" bold />
      {lines.map((l, i) => <T key={l} x={x + w / 2} y={y + r + 38 + i * 14} t={l} size={10} color="var(--ink-2)" anchor="middle" />)}
    </g>
  );
}

/** 적재 ↔ 검색이 만나는 곳 번호 */
function Num({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="9.5" fill="var(--accent)" stroke="var(--panel)" strokeWidth="1.5" />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--accent-ink)">{n}</text>
    </g>
  );
}

const INGEST_ROWS: { node: string; y: number }[] = [
  { node: "seed", y: 204 }, { node: "collect", y: 270 }, { node: "classify", y: 336 }, { node: "enrich", y: 402 },
];
const HAND: Record<string, string> = { seed: "새 계정", collect: "처음 보는 사람", classify: "개인 크리에이터" };

export function AgentSystemMap({ cat, onPick }: { cat: OpsCatalog; onPick?: Pick }) {
  const by = Object.fromEntries(cat.agents.map((a) => [a.name, a]));
  const sNode = Object.fromEntries(cat.graphs.search.nodes.map((n) => [n.id, n.agents]));
  const iNode = Object.fromEntries(cat.graphs.ingest.nodes.map((n) => [n.id, n.agents]));
  // 검색 워커 — DB 후보에도 부르는 워커(늘) / 실시간 쪽에서만 부르는 워커(모자랄 때)
  const always = [...new Set(["retrieve", "measure", "research_db"].flatMap((id) => sNode[id] ?? []))];
  const liveOnly = [...new Set(["dispatch_scout", "research"].flatMap((id) => sNode[id] ?? []))].filter((n) => !always.includes(n));
  const next = cat.agents.filter((a) => a.graph === "next");
  const qp = cat.graphs.search.outside[0]?.agent;
  const arrow = { stroke: "var(--foreground)", strokeWidth: 1.5, fill: "none", markerEnd: "url(#as2)" };
  const inter = { stroke: "var(--accent)", strokeWidth: 2.2, fill: "none", markerEnd: "url(#as1)" };
  const col = (i: number) => 664 + (i % 2) * 184, row = (i: number, y0: number) => y0 + Math.floor(i / 2) * 50;

  return (
    <div className="relative overflow-x-auto">
      <svg viewBox="0 0 1040 604" role="img" className="block w-full min-w-[940px] h-auto" style={{ fontFamily: "inherit" }}
        aria-label="에이전트 전체 구조: 왼쪽은 적재 총괄과 적재 워커 5개(씨앗 줍기, 수집, 뽑기, 분류, 웹 보강), 가운데는 작업 표와 인플루언서 DB, 오른쪽은 조건 설계와 검색 총괄, 검색 워커들. 적재 워커가 모은 것을 DB에 저장하고, 검색은 DB에서 먼저 읽고, 검색 판정과 실시간으로 찾은 사람을 DB에 저장하고, 찾은 사람의 수집 작업을 작업 표에 넣는다. 아래에 둘이 같이 쓰는 툴 게이트웨이와 감독관이 있다.">
        <Markers />
        {/* 관리자 */}
        <rect x="460" y="8" width="120" height="34" rx="17" fill="var(--pass-bg)" stroke="var(--pass)" strokeWidth="1.4" />
        <T x={520} y={30} t="관리자" size={12.5} color="var(--pass)" anchor="middle" bold />
        <path d="M460 25 H240 V108" {...arrow} />
        <T x={256} y={19} t="분야 고르기 · 지금 한 번 돌리기" color="var(--ink-2)" />
        <path d="M580 25 H652 V60" {...arrow} />
        <T x={664} y={19} t="검색 요청 · 조건 카드 승인" color="var(--ink-2)" />

        {/* ── 적재 ── */}
        <T x={16} y={56} t="적재 — 인플루언서 DB를 쌓는다" size={11.5} color="var(--foreground)" bold />
        <rect x="36" y="64" width="112" height="28" rx="14" fill="var(--panel)" stroke="var(--border-strong)" strokeWidth="1.3" />
        <T x={92} y={82} t="크론 1시간마다" size={11} color="var(--foreground)" anchor="middle" bold />
        <line x1="92" y1="92" x2="92" y2="108" {...arrow} />
        <Boss x={36} y={110} w={220} h={54} title="적재 총괄" sub="작업 꺼내기 → 나눠 주기 → 세기" sub2="ingest/graph.py · 코드(AI 아님)" />
        <rect x="26" y="176" width="390" height="278" rx="12" fill="none" stroke="var(--border-strong)" strokeDasharray="5 4" />
        <T x={70} y={193} t={`적재 워커 ${cat.agents.filter((a) => a.graph === "ingest").length} — 총괄이 작업마다 부른다`} size={11} color="var(--foreground)" bold />
        <path d="M56 164 V423" stroke="var(--foreground)" strokeWidth="1.5" fill="none" />
        {INGEST_ROWS.map((r, i) => {
          const [first, second] = iNode[r.node] ?? [];
          return (
            <g key={r.node}>
              <line x1="56" y1={r.y + 21} x2="78" y2={r.y + 21} {...arrow} />
              <W x={80} y={r.y} w={156} a={by[first]} onPick={onPick} />
              {second && (
                <>
                  <line x1="236" y1={r.y + 21} x2="266" y2={r.y + 21} {...arrow} />
                  <W x={268} y={r.y} w={140} a={by[second]} onPick={onPick} />
                </>
              )}
              {i < INGEST_ROWS.length - 1 && (
                <>
                  <line x1="158" y1={r.y + 42} x2="158" y2={INGEST_ROWS[i + 1].y - 1} stroke="var(--accent)" strokeWidth="1.4" strokeDasharray="4 3" markerEnd="url(#as1)" />
                  <T x={166} y={r.y + 57} t={HAND[r.node]} size={9.5} color="var(--accent)" />
                </>
              )}
            </g>
          );
        })}
        <path d="M236 423 H254 V304 H238" stroke="var(--accent)" strokeWidth="1.4" strokeDasharray="4 3" fill="none" markerEnd="url(#as1)" />
        <T x={260} y={386} t="찾은 인스타" size={9.5} color="var(--accent)" />
        <T x={266} y={430} t="파란 점선 = 다음 작업" size={9.5} />
        <T x={266} y={443} t="(작업 표를 거쳐 다음 판에)" size={9.5} />

        {/* ── 가운데: 작업 표 · DB ── */}
        <Cyl x={450} y={112} w={140} h={74} title="작업 표" lines={["남은 일 · 다음 갱신일"]} />
        <line x1="448" y1="148" x2="258" y2="140" {...arrow} />
        <T x={276} y={132} t="이번 판 몫만큼 꺼냄" color="var(--ink-2)" />
        <Cyl x={436} y={250} w={168} h={126} title="인플루언서 DB" lines={["사람 · 계정 · 활동", "협찬 · 연락처", "판정 이력"]} />
        <line x1="520" y1="250" x2="520" y2="190" {...arrow} />
        <T x={528} y={226} t="다음 작업 넣기" color="var(--ink-2)" />
        <line x1="416" y1="330" x2="434" y2="330" {...inter} />
        <Num x={425} y={314} n={1} />

        {/* ── 검색 ── */}
        <T x={664} y={54} t="검색 — DB에서 먼저 찾는다" size={11.5} color="var(--foreground)" bold />
        <W x={640} y={62} w={160} h={44} a={qp ? by[qp] : undefined} onPick={onPick} />
        <line x1="800" y1="84" x2="826" y2="84" {...arrow} />
        <Boss x={828} y={58} w={200} h={58} title="검색 총괄" sub="DB 먼저 → 모자라면 실시간" sub2="supervisor/graph.py · 코드(AI 아님)" />
        <line x1="926" y1="116" x2="926" y2="148" {...arrow} />
        <T x={934} y={138} t="후보마다 부른다" color="var(--ink-2)" />
        <rect x="650" y="150" width="380" height={40 + Math.ceil(always.length / 2) * 50} rx="12" fill="none" stroke="var(--border-strong)" strokeWidth="1.3" />
        <T x={662} y={168} t={`검색 워커 ${always.length} — DB 후보에 늘`} size={11} color="var(--foreground)" bold />
        {always.map((n, i) => <W key={n} x={col(i)} y={row(i, 178)} w={170} a={by[n]} onPick={onPick} />)}
        <rect x="650" y="354" width="380" height="92" rx="12" fill="none" stroke="var(--border-strong)" strokeDasharray="5 4" />
        <T x={662} y={372} t={`모자랄 때만 — 실시간 ${liveOnly.length}`} size={11} color="var(--foreground)" bold />
        {liveOnly.map((n, i) => <W key={n} x={col(i)} y={380} w={170} a={by[n]} onPick={onPick} />)}
        <T x={662} y={438} t="새 후보에는 위 워커(계정 연결 · 유튜브 · 인스타 · 판정 · 정리)도 다시 부른다" size={9.5} />
        <path d="M1028 100 H1036 V400 H1032" {...arrow} />
        <T x={1024} y={348} t="모자라면" anchor="end" color="var(--ink-2)" />
        {/* 검색 ↔ DB · 작업 표 */}
        <path d="M606 344 H632 V198 H662" {...inter} />
        <Num x={632} y={268} n={2} />
        <path d="M846 116 V132 H614 V300 H606" {...inter} />
        <T x={640} y={128} t="결과 낼 때 저장" color="var(--accent)" />
        <Num x={614} y={220} n={3} />
        <path d="M614 160 H594" {...inter} />
        <Num x={604} y={144} n={4} />

        {/* ── 같이 쓰는 것 ── */}
        <line x1="220" y1="454" x2="220" y2="470" {...arrow} />
        <line x1="840" y1="446" x2="840" y2="470" {...arrow} />
        <T x={228} y={466} t="툴 호출" />
        <T x={848} y={464} t="툴 호출" />
        <rect x="16" y="472" width="1016" height="36" rx="8" fill="var(--soft)" stroke="var(--border-strong)" />
        <T x={28} y={494} t="툴 게이트웨이" size={12} color="var(--foreground)" bold />
        <T x={122} y={494} t="적재 · 검색 워커의 모든 외부 호출 — 캐시 · 몫(쿼터) · 재시도 · 막힌 툴 기억(O8)" color="var(--ink-2)" />
        <T x={1020} y={494} t="→ 인스타 · 유튜브 · 블로그 · 웹 검색" anchor="end" color="var(--ink-2)" />
        <rect x="16" y="516" width="1016" height="36" rx="8" fill="var(--unknown-bg)" stroke="var(--unknown)" />
        <T x={28} y={538} t="감독관" size={12} color="var(--unknown)" bold />
        <T x={82} y={538} t="코드 규칙 — 배정 전 O2 비용 · O3 반복 / 작업마다 O1 예산 · O6 마감 / 결과 O4 핸들 · O5 근거 · O9 동일인물 · 적재는 몫 · AI 월 상한도"
          color="var(--ink-2)" />
        {next.length > 0 && (
          <g>
            <rect x="16" y="562" width="520" height="36" rx="8" fill="none" stroke="var(--border-strong)" strokeDasharray="4 3" />
            <T x={28} y={584} t={`다음 단계 ${next.length} — 꺼짐`} size={11} color="var(--dim)" bold />
            {next.map((a, i) => <W key={a.name} x={140 + i * 98} y={568} w={92} h={24} a={a} onPick={onPick} />)}
          </g>
        )}
        <T x={1020} y={584} t="모든 상자가 AgentOps에 기록을 남긴다 → 검색 추적 · 관측 · 진단" anchor="end" />
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
