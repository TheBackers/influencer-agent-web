/**
 * 목업 — 검색 진행 이벤트. 실제로는 `GET /api/v2/missions/{id}/stream` (SSE) 이 보낸다.
 * 약 6초 동안 검색(설계서 10장 · D42) 순서로 진행을 흉내 낸다 — DB에서 거르기 → 코드로 재기 → 판정(재사용) →
 * 모자라서 실시간 발굴 · 조사 → 검토 → 재확인 · 저장.
 */
import type { MissionEvent, MissionStep, CompiledPlan, MissionResult } from "@/types/v2";
import { mockDossiers, mockCoverage } from "./dossiers";

/** 진행 단계 — 백엔드 agent/supervisor/progress.py STEPS 와 같은 키 · 순서 */
export const DB_STEPS: MissionStep[] = [
  { key: "plan", label: "조건 확정", agent: "query-planner", status: "done", detail: "승인된 조건 6개" },
  { key: "retrieve", label: "DB에서 거르기", agent: "catalog-retriever", status: "waiting" },
  { key: "measure", label: "코드로 재기", agent: "profiler", status: "waiting" },
  { key: "link", label: "다른 플랫폼 계정 찾기", agent: "account-linker", status: "waiting" },
  { key: "verify", label: "조건 판정", agent: "verifier", status: "waiting" },
  { key: "scout", label: "모자라면 실시간 발굴", agent: "scout", status: "waiting" },
  { key: "research", label: "실시간 후보 조사", agent: "web-researcher", status: "waiting" },
  { key: "review", label: "총괄 검토", agent: "supervisor", status: "waiting" },
  { key: "finalize", label: "재확인 · 저장", agent: "supervisor", status: "waiting" },
];

const now = () => new Date().toTimeString().slice(0, 8);

type Frame = { after: number; ev: Omit<MissionEvent, "at"> };

const s = (key: string, patch: Partial<MissionStep>): Omit<MissionEvent, "at"> => ({
  t: "step",
  step: { ...DB_STEPS.find((x) => x.key === key)!, ...patch },
});

const FRAMES: Frame[] = [
  { after: 200, ev: s("retrieve", { status: "running", detail: "인플루언서 DB에서 SQL로 거르는 중" }) },
  { after: 600, ev: s("retrieve", { status: "done", done: 58, total: 58, detail: "패션 개인 크리에이터 445명 → 조건 맞는 58명 (LLM 0)" }) },
  { after: 200, ev: s("measure", { status: "running", done: 0, total: 58 }) },
  { after: 500, ev: s("measure", { status: "done", done: 58, total: 58, detail: "필수 조건 미충족 22명 제외 → 판정 36명" }) },
  { after: 100, ev: s("link", { status: "running", done: 0, total: 3 }) },
  { after: 400, ev: s("link", { status: "running", done: 3, total: 3 }) },
  { after: 100, ev: s("verify", { status: "running", done: 0, total: 36 }) },
  { after: 500, ev: s("verify", { status: "running", done: 20, total: 36, detail: "이전 판정 재사용 18개 · 새로 판정 22개" }) },
  { after: 300, ev: { t: "intervention", rule: "O5", text: "감독관 · 채널 홈 주소를 근거로 쓴 판정 2건을 '확인 못 함'으로 되돌림" } },
  { after: 400, ev: s("verify", { status: "running", done: 36, total: 36, detail: "이전 판정 재사용 31개 · 새로 판정 41개" }) },
  { after: 200, ev: s("review", { status: "running", detail: "통과 26명 · 필수 조건 확인 못 함 1명 — 모자람" }) },
  { after: 100, ev: { t: "log", text: "총괄 · 통과 26명 — 모자라서 실시간으로 더 찾는다" } },
  { after: 100, ev: { t: "log", text: "총괄 · DB에 조건 맞는 사람이 모자라 실시간 검색으로 채운다" } },
  { after: 100, ev: s("scout", { status: "running", detail: "1라운드 실시간 발굴" }) },
  { after: 500, ev: s("scout", { status: "done", done: 5, total: 5, detail: "후보 12명 → 숫자·주제 선별 → 5명" }) },
  { after: 100, ev: s("research", { status: "running", done: 0, total: 5 }) },
  { after: 500, ev: s("research", { status: "running", done: 5, total: 5 }) },
  { after: 100, ev: s("verify", { status: "running", done: 41, total: 41 }) },
  { after: 200, ev: { t: "log", text: "총괄 · 실시간 검색 멈춤 — 두 라운드 연속 새 후보가 없어 멈췄습니다(검색어를 바꿔도 같은 글만 나옴)" } },
  { after: 100, ev: s("link", { status: "done", done: 3, total: 3 }) },
  { after: 0, ev: s("verify", { status: "done", done: 41, total: 41 }) },
  { after: 0, ev: s("scout", { status: "done" }) },
  { after: 0, ev: s("research", { status: "done" }) },
  { after: 100, ev: s("review", { status: "done", detail: "통과 29명 · 필수 조건 확인 못 함 1명" }) },
  { after: 200, ev: s("finalize", { status: "running" }) },
  { after: 400, ev: s("finalize", { status: "done", done: 29, total: 29, detail: "29명 · 정보 7일 넘은 4명 지표 재확인 · 새 인물 3명 · 판정 72개 DB에 저장" }) },
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

/** 목업 DB 인물 — 인플루언서 목록 목업(src/mocks/catalog.ts)에 같은 사람이 있다('인플루언서 DB에서 보기') */
const MOCK_PERSON: Record<string, string> = { "@haru.closet": "p31", "@sodam_codi": "p32", "@mood.drawer": "p33" };

/** 목업 결과 — 패션 30명 요청 → DB에서 26명 · 모자라서 실시간으로 3명 더(D42) · 그래도 1명 모자람 + 필수 조건 확인 못 함 1명(D36) */
export function mockResult(plan: CompiledPlan): MissionResult {
  const ok = mockDossiers.filter((d) => !d.weak);
  const confirmed = ok.slice(0, 29).map((d, i) => i < 26
    ? { ...d, origin: "db" as const, person_id: MOCK_PERSON[d.handle] ?? "", info_age_days: 2 + (i % 10),
        contacts: [{ kind: "instagram", value: d.handle, label: "인스타 DM", origin: "self", source_url: d.instagram?.url ?? "" }] }
    : { ...d, origin: "live" as const, person_id: "", contacts: [] });
  const dossiers = [...confirmed, ...mockDossiers.filter((d) => d.weak).map((d) => ({ ...d, origin: "db" as const, person_id: "" }))];
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
      { stage: "measure", reason: "필수 조건 미충족", count: 22 },
      { stage: "screen", reason: "팔로워 범위 밖", count: 7 },
      { stage: "fact_check", reason: "동일인물 불확실", count: 4 },
    ],
    rejected_people: [
      { handle: "@styleby.min", name: "민", platform: "instagram", stage: "measure", stage_ko: "코드로 재기", reason: "필수 조건 미충족 — 요즘 뜨고 있는",
        detail: "c5: 최근 90일 조회수 중앙값이 이전 90일의 0.9배 · 업로드 수 그대로", source_url: "" },
      { handle: "UC_mock_look", name: "룩북채널", platform: "youtube", stage: "fact_check", stage_ko: "근거 검문", reason: "동일인물 불확실 (0.42)",
        detail: "인스타 계정이 같은 사람인지 확인할 글을 찾지 못함", source_url: "" },
    ],
    needs_review: [
      { handle: "@minimal.closet", platform: "instagram", url: "https://www.instagram.com/minimal.closet/", source_url: "",
        why: "", reason: "팔로워 확인 필요 (인스타 조회 불가 — 개인 계정이거나 없는 계정)" },
    ],
    cost: { usd: 0.14, llm_calls: 74, youtube_units: 18, searches: 11 },
    elapsed_s: 96,
    interventions: [{ rule: "O5", text: "지어낸 근거(채널 홈 주소) → 확인 못 함으로 되돌림", count: 2 }],
    trace_url: "https://smith.langchain.com/",
    mock: true,
    requested: 30, rounds: 2, queries: 9, halt: "두 라운드 연속 새 후보가 없어 멈췄습니다(검색어를 바꿔도 같은 글만 나옴)",
    catalog: {
      enabled: true, topic: "패션", db_pool: 445, db_candidates: 36, verdict_reused: 31, verdict_total: 72, max_info_age_days: 11, rechecked: 4,
      from_db: 26, from_live: 3, live_rounds: 2, saved: { found_new: 3, verdicts: 41, links: 2, refresh: 4 },
      shortfall: {
        requested: 30, found: 29, topic: "패션",
        dropped: [
          { phrase: "플랫폼 계정", removed: 352 },
          { phrase: "최근 활동", removed: 35 },
          { phrase: "요즘 뜨고 있는", removed: 22 },
        ],
        suggest_keywords: ["오피스룩", "체형별 코디", "스트릿 하울"],
      },
    },
  };
}
