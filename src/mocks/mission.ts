/**
 * 목업 — 검색 진행 이벤트. 실제로는 `GET /api/v2/missions/{id}/stream` (SSE) 이 보낸다.
 * 약 5초 동안 v3 DB 검색(설계서 10장) 순서로 진행을 흉내 낸다 — DB에서 거르기 → 코드로 재기 → 판정(재사용) → 검토 → 재확인 · 저장.
 */
import type { MissionEvent, MissionStep, CompiledPlan } from "@/types/v2";
import type { MissionResultDb } from "@/types/catalog";
import { mockDossiers, mockCoverage } from "./dossiers";

export const STEP_TEMPLATE: MissionStep[] = [
  { key: "plan", label: "조건 확정", agent: "query-planner", status: "done", detail: "승인된 조건 6개" },
  { key: "scout", label: "발굴", agent: "scout", status: "waiting" },
  { key: "ig", label: "인스타 조사", agent: "ig-researcher", status: "waiting" },
  { key: "yt", label: "유튜브 조사", agent: "yt-researcher", status: "waiting" },
  { key: "web", label: "웹 조사", agent: "web-researcher", status: "waiting" },
  { key: "link", label: "다른 플랫폼 계정 찾기", agent: "account-linker", status: "waiting" },
  { key: "verify", label: "조건 판정", agent: "verifier", status: "waiting" },
  { key: "review", label: "총괄 검토", agent: "supervisor", status: "waiting" },
  { key: "profile", label: "정리", agent: "profiler", status: "waiting" },
];

/** v3 DB 검색 단계(설계서 10장). 목업은 이 단계로 진행한다. 3단계에 백엔드가 같은 키를 보내면 STEP_TEMPLATE 을 이것으로 바꾼다 */
export const DB_STEPS: MissionStep[] = [
  { key: "plan", label: "조건 확정", agent: "query-planner", status: "done", detail: "승인된 조건 6개" },
  { key: "retrieve", label: "DB에서 거르기", agent: "catalog-retriever", status: "waiting" },
  { key: "measure", label: "코드로 재기", agent: "profiler", status: "waiting" },
  { key: "link", label: "다른 플랫폼 계정 찾기", agent: "account-linker", status: "waiting" },
  { key: "verify", label: "조건 판정", agent: "verifier", status: "waiting" },
  { key: "review", label: "총괄 검토", agent: "supervisor", status: "waiting" },
  { key: "finalize", label: "재확인 · 저장", agent: "profiler", status: "waiting" },
];

const now = () => new Date().toTimeString().slice(0, 8);

type Frame = { after: number; ev: Omit<MissionEvent, "at"> };

const s = (key: string, patch: Partial<MissionStep>): Omit<MissionEvent, "at"> => ({
  t: "step",
  step: { ...DB_STEPS.find((x) => x.key === key)!, ...patch },
});

const FRAMES: Frame[] = [
  { after: 200, ev: s("retrieve", { status: "running", detail: "패션 개인 크리에이터 445명에서 SQL로 거르는 중" }) },
  { after: 600, ev: s("retrieve", { status: "done", done: 58, total: 58, detail: "445명 → 인스타·유튜브 둘 다 · 국내 → 58명 (LLM 0)" }) },
  { after: 200, ev: s("measure", { status: "running", done: 0, total: 58 }) },
  { after: 500, ev: s("measure", { status: "done", done: 58, total: 58, detail: "'뜨고 있는'을 DB 활동으로 계산 — 신호 2개 미만 22명은 판정하지 않음(파도식)" }) },
  { after: 100, ev: s("link", { status: "running", done: 0, total: 3 }) },
  { after: 400, ev: s("link", { status: "done", done: 3, total: 3, detail: "링크가 없는 3명만 — 2명 연결 · 1명 확신도 0.6 미만" }) },
  { after: 100, ev: s("verify", { status: "running", done: 0, total: 36 }) },
  { after: 500, ev: s("verify", { status: "running", done: 20, total: 36, detail: "이전 판정 재사용 18개" }) },
  { after: 300, ev: { t: "intervention", rule: "O5", text: "감독관 · 채널 홈 주소를 근거로 쓴 판정 2건을 '확인 못 함'으로 되돌림" } },
  { after: 400, ev: s("verify", { status: "done", done: 36, total: 36, detail: "36명 × 참고 조건 2개 — 재사용 31 · 새로 판정 41" }) },
  { after: 200, ev: s("review", { status: "running", detail: "근거 부족 4명 — 새 단서가 있는 2명만 다시" }) },
  { after: 500, ev: { t: "log", text: "review · 통과 26명 (요청 30명) · 필수 조건 확인 못 함 1명 · 탈락 9명" } },
  { after: 200, ev: s("review", { status: "done", detail: "통과 26 · 재조사 1회" }) },
  { after: 200, ev: s("finalize", { status: "running" }) },
  { after: 400, ev: s("finalize", { status: "done", done: 26, total: 26, detail: "정보 7일 넘은 4명 지표 재확인 · 판정 72개 DB에 저장" }) },
  { after: 100, ev: { t: "done" } },
];

export function simulateMission(onEvent: (e: MissionEvent) => void): () => void {
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  let acc = 0;
  for (const f of FRAMES) {
    acc += f.after;
    timers.push(setTimeout(() => !cancelled && onEvent({ ...f.ev, at: now() }), acc));
  }
  return () => {
    cancelled = true;
    timers.forEach(clearTimeout);
  };
}

/** 목업 결과 — 패션 30명 요청을 인플루언서 DB에서 찾았더니 26명뿐이었던 경우(D25) + 필수 조건 확인 못 함 1명(D36) */
export function mockResult(plan: CompiledPlan): MissionResultDb {
  const confirmed = mockDossiers.filter((d) => !d.weak).slice(0, 26);
  const dossiers = [...confirmed, ...mockDossiers.filter((d) => d.weak)];
  const recount = (id: string) => {
    let pass = 0, fail = 0, unknown = 0;
    for (const d of confirmed) {
      const v = d.checks.find((c) => c.id === id)?.verdict;
      if (v === "pass") pass++; else if (v === "fail") fail++; else unknown++;
    }
    return { pass, fail, unknown };
  };
  const V3_REASONS: Record<string, { label: string; count: number }[]> = {
    c3: [{ label: "필수 — DB에서 거르기로 제외(356명)", count: 356 }],
    c5: [{ label: "필수 — 신호 2개 미만 탈락(27명)", count: 27 }],
  };
  return {
    mission_id: "m_mock_fashion30",
    request: plan.request,
    plan,
    dossiers,
    extra_passed: 0,
    coverage: mockCoverage
      .filter((c) => !plan.conditions.find((x) => x.id === c.id)?.dropped)
      .map((c) => ({ ...c, ...recount(c.id), reasons: V3_REASONS[c.id] ?? c.reasons })),
    rejected: [
      { stage: "DB에서 거르기", reason: "인스타·유튜브 둘 다 아님", count: 352 },
      { stage: "DB에서 거르기", reason: "국내(한글 비율 60%) 미달", count: 35 },
      { stage: "코드로 재기", reason: "'뜨고 있는' 신호 2개 미만", count: 27 },
      { stage: "판정", reason: "동일인물 확신 0.6 미만 — '둘 다'를 확인 못 함", count: 4 },
    ],
    rejected_people: [
      { handle: "@styleby.min", name: "민", platform: "instagram", stage: "measure", stage_ko: "코드로 재기", reason: "필수 조건 미충족 — 요즘 뜨고 있는",
        detail: "c5: 최근 90일 조회수 중앙값이 이전 90일의 0.9배 · 업로드 수 그대로", source_url: "" },
      { handle: "@daily_kim", name: "", platform: "instagram", stage: "retrieve", stage_ko: "DB에서 거르기", reason: "인스타·유튜브 둘 다 아님", detail: "DB에 유튜브 계정 없음", source_url: "" },
      { handle: "UC_mock_look", name: "룩북채널", platform: "youtube", stage: "review", stage_ko: "근거 검문", reason: "동일인물 불확실 (0.42)",
        detail: "인스타 계정이 같은 사람인지 확인할 글을 찾지 못함", source_url: "" },
    ],
    needs_review: [
      { handle: "@minimal.closet", platform: "instagram", url: "https://www.instagram.com/minimal.closet/", source_url: "",
        why: "", reason: "팔로워 확인 필요 (인스타 조회 불가 — 개인 계정이거나 없는 계정)" },
    ],
    cost: { usd: 0.09, llm_calls: 58, youtube_units: 12, searches: 6 },
    elapsed_s: 52,
    interventions: [{ rule: "O5", text: "지어낸 근거(채널 홈 주소) → 확인 못 함으로 되돌림", count: 2 }],
    trace_url: "https://smith.langchain.com/",
    mock: true,
    catalog: {
      topic: "패션", db_pool: 445, db_candidates: 58, verdict_reused: 31, verdict_total: 72, max_info_age_days: 11, rechecked: 4,
      shortfall: {
        requested: 30, found: 26, topic: "패션",
        dropped: [
          { phrase: "인스타·유튜브 둘 다", removed: 356 },
          { phrase: "국내", removed: 35 },
          { phrase: "요즘 뜨고 있는", removed: 27 },
        ],
        suggest_keywords: ["오피스룩", "체형별 코디", "스트릿 하울"],
      },
    },
  };
}
