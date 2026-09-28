/**
 * 목업 — 검색 진행 이벤트. 실제로는 `GET /api/v2/missions/{id}/stream` (SSE) 이 보낸다.
 * 약 7초 동안 총괄 → 워커 순서로 진행을 흉내 낸다.
 */
import type { MissionEvent, MissionResult, MissionStep, CompiledPlan } from "@/types/v2";
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

const now = () => new Date().toTimeString().slice(0, 8);

type Frame = { after: number; ev: Omit<MissionEvent, "at"> };

const s = (key: string, patch: Partial<MissionStep>): Omit<MissionEvent, "at"> => ({
  t: "step",
  step: { ...STEP_TEMPLATE.find((x) => x.key === key)!, ...patch },
});

const FRAMES: Frame[] = [
  { after: 200, ev: s("scout", { status: "running", detail: "유튜브 채널 검색 6개 각도" }) },
  { after: 700, ev: { t: "log", text: "scout · 후보 240명 발굴 (유튜브 186 · 웹 정리글 54)" } },
  { after: 500, ev: s("scout", { status: "done", detail: "240명 → 숫자·주제 선별 → 75명", done: 75, total: 75 }) },
  { after: 200, ev: s("ig", { status: "running", done: 0, total: 75 }) },
  { after: 0, ev: s("yt", { status: "running", done: 0, total: 75 }) },
  { after: 0, ev: s("web", { status: "running", done: 0, total: 75 }) },
  { after: 500, ev: s("ig", { status: "running", done: 31, total: 75 }) },
  { after: 0, ev: s("yt", { status: "running", done: 44, total: 75 }) },
  { after: 0, ev: s("web", { status: "running", done: 12, total: 75 }) },
  { after: 500, ev: s("ig", { status: "done", done: 75, total: 75, detail: "개인 계정 9명 — 지표 비공개" }) },
  { after: 0, ev: s("yt", { status: "done", done: 75, total: 75 }) },
  { after: 300, ev: { t: "intervention", rule: "O5", text: "감독관 · 채널 홈 주소를 근거로 쓴 판정 2건을 '확인 못 함'으로 되돌림" } },
  { after: 400, ev: s("web", { status: "done", done: 75, total: 75 }) },
  { after: 0, ev: s("link", { status: "running", done: 30, total: 75 }) },
  { after: 400, ev: s("link", { status: "done", done: 75, total: 75, detail: "다른 플랫폼 계정 52명 연결 · 확인 필요 7명" }) },
  { after: 200, ev: s("verify", { status: "running", done: 40, total: 75 }) },
  { after: 500, ev: s("verify", { status: "done", done: 75, total: 75 }) },
  { after: 200, ev: s("review", { status: "running", detail: "must 근거 부족 6명 → 웹 조사만 재지시" }) },
  { after: 700, ev: { t: "log", text: "review · 통과 34명 (요청 30명) · 탈락 41명" } },
  { after: 200, ev: s("review", { status: "done", detail: "통과 34 · 재지시 1회" }) },
  { after: 200, ev: s("profile", { status: "running" }) },
  { after: 400, ev: s("profile", { status: "done", done: 34, total: 34 }) },
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

export function mockResult(plan: CompiledPlan): MissionResult {
  return {
    mission_id: "m_mock_fashion30",
    request: plan.request,
    plan,
    dossiers: mockDossiers,
    extra_passed: 4,
    coverage: mockCoverage.filter((c) => !plan.conditions.find((x) => x.id === c.id)?.dropped),
    rejected: [
      { stage: "발굴", reason: "인스타·유튜브 둘 중 하나만 운영", count: 41 },
      { stage: "발굴", reason: "팔로워·주제 선별에서 제외", count: 124 },
      { stage: "판정", reason: "'뜨고 있는' 신호 2개 미만", count: 18 },
      { stage: "판정", reason: "동일인물 확신 0.8 미만", count: 7 },
    ],
    needs_review: [
      { handle: "@daily.lookbook_", platform: "instagram", url: "https://www.instagram.com/daily.lookbook_/", source_url: "https://example.com/blog/fashion-accounts",
        why: "소개글: 요즘 뜨는 데일리룩 계정 @daily.lookbook_ 코디가 깔끔해요", reason: "팔로워 확인 필요 (인스타 조회 불가 — 개인 계정이거나 없는 계정)" },
      { handle: "@minimal.closet", platform: "instagram", url: "https://www.instagram.com/minimal.closet/", source_url: "",
        why: "", reason: "팔로워 확인 필요 (인스타 조회 불가 — 개인 계정이거나 없는 계정)" },
    ],
    cost: { usd: 0.43, llm_calls: 214, youtube_units: 1462, searches: 131 },
    elapsed_s: 372,
    interventions: [{ rule: "O5", text: "지어낸 근거(채널 홈 주소) → 확인 못 함으로 되돌림", count: 2 }],
    trace_url: "https://smith.langchain.com/",
    mock: true,
  };
}
