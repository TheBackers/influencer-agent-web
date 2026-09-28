/**
 * 목업 — AgentOps. 설계서 v2.1 의 시연 장면(web-researcher 회귀로 IMPROVE)을 그대로 옮겼다.
 * 실제로는 `/api/ops/*` 가 Ops 저장소(Postgres agentops 스키마)에서 계산해 돌려준다.
 */
import type {
  AgentScore, EvaluatorScore, ExperimentRow, GateDecision, HealthCheck, MissionRunSummary,
  ObserveSeries, OpsOverview, SLOItem, TraceEvent,
} from "@/types/v2";

export const VERSION = "ae13f39";
const LS = "https://smith.langchain.com/";

export const evaluators: EvaluatorScore[] = [
  { key: "count_met", label: "요청 인원 충족", target: "E2E", method: "코드", score: 0.95, threshold: 0.8, op: ">=", weight: 0.15, critical: true, baseline: 0.95 },
  { key: "handle_valid", label: "지어낸 핸들 없음", target: "E2E", method: "코드", score: 1, threshold: 1, op: "=", weight: 0.1, critical: true, baseline: 1 },
  { key: "deep_link_rate", label: "pass 근거가 딥링크", target: "E2E", method: "코드", score: 0.86, threshold: 0.85, op: ">=", weight: 0.15, critical: true, baseline: 0.91 },
  { key: "known_rate", label: "1 − unknown 비율", target: "E2E", method: "코드", score: 0.68, threshold: 0.7, op: ">=", weight: 0.15, critical: false, baseline: 0.76 },
  { key: "cross_fill", label: "교차 플랫폼 채움", target: "E2E", method: "코드", score: 0.81, threshold: 0.7, op: ">=", weight: 0.1, critical: false, baseline: 0.8 },
  { key: "golden_recall", label: "기대 계정 포함률", target: "E2E", method: "코드", score: 0.55, threshold: 0.5, op: ">=", weight: 0.1, critical: false, baseline: 0.6 },
  { key: "verdict_correct", label: "판정이 근거와 맞음", target: "E2E", method: "LLM 판정", score: 0.74, threshold: 0.8, op: ">=", weight: 0.15, critical: false, baseline: 0.84 },
  { key: "human_fit", label: "👍 비율 (온라인)", target: "E2E", method: "사람", score: 0.62, threshold: 0.7, op: ">=", weight: 0.1, critical: false, baseline: 0.74 },
  { key: "no_invented_condition", label: "요청에 없는 조건 없음", target: "query-planner", method: "코드", score: 1, threshold: 1, op: "=", critical: true, baseline: 1 },
  { key: "plan_faithful", label: "기대 조건표와 일치", target: "query-planner", method: "LLM 판정", score: 0.92, threshold: 0.9, op: ">=", critical: false, baseline: 0.92 },
  { key: "measure_valid", label: "측정식 검증 통과", target: "query-planner", method: "코드", score: 1, threshold: 1, op: "=", critical: true, baseline: 1 },
  { key: "feasibility_calibration", label: "가능성 예측 정확도", target: "query-planner", method: "코드", score: 0.78, threshold: 0.7, op: ">=", critical: false, baseline: 0.75 },
  { key: "valid_candidate_rate", label: "유효 후보 비율", target: "scout", method: "코드", score: 0.87, threshold: 0.8, op: ">=", critical: false, baseline: 0.86 },
  { key: "topic_precision", label: "주제 적합 (표본 10)", target: "scout", method: "LLM 판정", score: 0.8, threshold: 0.75, op: ">=", critical: false, baseline: 0.8 },
  { key: "fetch_success", label: "조회 성공 (개인 계정 제외)", target: "ig / yt-researcher", method: "코드", score: 0.96, threshold: 0.9, op: ">=", critical: false, baseline: 0.95 },
  { key: "metrics_deterministic", label: "재실행 동일", target: "ig / yt-researcher", method: "코드", score: 1, threshold: 1, op: "=", critical: true, baseline: 1 },
  { key: "primary_source_rate", label: "1차 출처 비율", target: "web-researcher", method: "코드", score: 0.41, threshold: 0.6, op: ">=", critical: false, baseline: 0.66 },
  { key: "attribution_precision", label: "남의 정보 섞임 없음", target: "web-researcher", method: "LLM 판정", score: 0.81, threshold: 0.9, op: ">=", critical: true, baseline: 0.94 },
  { key: "budget_efficiency", label: "스텝당 새 정보", target: "web-researcher", method: "코드", score: 0.48, threshold: 0.5, op: ">=", critical: false, baseline: 0.58 },
  { key: "unsupported_pass", label: "근거 없는 pass 0", target: "verifier", method: "코드", score: 1, threshold: 1, op: "=", critical: true, baseline: 1 },
  { key: "gold_agreement", label: "정답 판정 일치", target: "verifier", method: "코드", score: 0.79, threshold: 0.8, op: ">=", critical: false, baseline: 0.83 },
  { key: "merge_precision", label: "잘못 합친 계정 없음", target: "profiler", method: "코드", score: 0.97, threshold: 0.95, op: ">=", critical: true, baseline: 0.97 },
  { key: "dossier_complete", label: "필수 칸 채움", target: "profiler", method: "코드", score: 0.88, threshold: 0.8, op: ">=", critical: false, baseline: 0.87 },
  { key: "intervention_rate", label: "검색당 개입 ≤ 2", target: "감독관", method: "코드", score: 0.86, threshold: 0.9, op: ">=", critical: false, baseline: 0.95 },
];

export function composite(list: EvaluatorScore[], useBaseline = false) {
  const e2e = list.filter((e) => e.target === "E2E" && e.weight);
  const w = e2e.reduce((a, e) => a + (e.weight ?? 0), 0);
  return e2e.reduce((a, e) => a + (e.weight ?? 0) * (useBaseline ? e.baseline ?? e.score : e.score), 0) / w;
}

export const passes = (e: EvaluatorScore) => (e.op === "=" ? e.score >= e.threshold - 1e-9 : e.score >= e.threshold);

export const agents: AgentScore[] = [
  { agent: "query-planner", version: "2.1.0", status: "active", score: 0.95, p95_s: 4, slo_p95_s: 8, cost_per_mission: 0.004, error_rate: 0, health: "green" },
  { agent: "scout", version: "2.0.3", status: "active", score: 0.86, p95_s: 31, slo_p95_s: 40, cost_per_mission: 0.021, error_rate: 0.004, health: "green" },
  { agent: "ig-researcher", version: "2.0.1", status: "active", score: 0.95, p95_s: 8, slo_p95_s: 12, cost_per_mission: 0, error_rate: 0.012, health: "green" },
  { agent: "yt-researcher", version: "2.0.1", status: "active", score: 0.96, p95_s: 9, slo_p95_s: 12, cost_per_mission: 0, error_rate: 0.006, health: "green" },
  { agent: "web-researcher", version: "2.1.0-rc1", status: "active", score: 0.71, p95_s: 22, slo_p95_s: 25, cost_per_mission: 0.108, error_rate: 0.019, health: "red" },
  { agent: "verifier", version: "2.0.2", status: "active", score: 0.82, p95_s: 11, slo_p95_s: 15, cost_per_mission: 0.031, error_rate: 0.003, health: "yellow" },
  { agent: "profiler", version: "2.0.0", status: "active", score: 0.97, p95_s: 1, slo_p95_s: 3, cost_per_mission: 0, error_rate: 0, health: "green" },
  { agent: "campaign-planner", version: "0.1.0", status: "disabled", score: 0, p95_s: 0, slo_p95_s: 30, cost_per_mission: 0, error_rate: 0, health: "green" },
];

export const health: HealthCheck[] = [
  { id: "H1", label: "키 · 토큰", kind: "운영", status: "yellow", value: "인스타 토큰 5일 남음", rule: "만료까지 ≥ 7일이면 초록", action: "Meta 장기 토큰(60일) 재발급" },
  { id: "H2", label: "외부 API 응답", kind: "운영", status: "green", value: "5종 성공 · p95 1.4s", rule: "핑 5종 성공 · p95 < 3s" },
  { id: "H3", label: "쿼터 여유", kind: "운영", status: "green", value: "YouTube 오늘 61% 남음", rule: "일 여유 ≥ 30%" },
  { id: "H4", label: "평가 신선도", kind: "품질", status: "green", value: `${VERSION} golden 실험 2시간 전`, rule: "이 버전의 golden 실험 존재" },
  { id: "H5", label: "회귀", kind: "품질", status: "red", value: "종합 0.78 (baseline 0.83, Δ −0.05) · 치명 1 미달", rule: "Δ ≥ −0.01 초록 · < −0.03 또는 치명 미달 빨강", cause_agent: "web-researcher", traces: ["run_w1", "run_w2", "run_w3"], action: "attribution_precision 최악 예제 5건 검토" },
  { id: "H6", label: "SLO 소진", kind: "운영", status: "green", value: "24h 전부 충족", rule: "24h SLO 전부 충족" },
  { id: "H7", label: "오류 군집", kind: "운영", status: "green", value: "최다 시그니처 2회/24h", rule: "같은 시그니처 < 3회/24h" },
  { id: "H8", label: "드리프트", kind: "품질", status: "green", value: "온라인 − 오프라인 = −0.02", rule: "≥ −0.05" },
  { id: "H9", label: "감독관 개입률", kind: "품질", status: "yellow", value: "O5 1.4회/검색", rule: "검색당 ≤ 1", cause_agent: "verifier", traces: ["run_v1", "run_v2", "run_v3"], action: "verifier 근거 URL 규칙 점검" },
  { id: "H10", label: "트레이스 무결성", kind: "운영", status: "green", value: "짝 없는 이벤트 0 · 고아 span 0", rule: "0건" },
];

export const slo: SLOItem[] = [
  { key: "p95", label: "검색 p95 (10명 기준, 사람 대기 제외)", value: 188, unit: "s", target: 240, op: "<=", pass: true },
  { key: "first", label: "첫 결과까지", value: 71, unit: "s", target: 90, op: "<=", pass: true },
  { key: "cost", label: "비용 / 요청 인원", value: 0.015, unit: "$", target: 0.02, op: "<=", pass: true },
  { key: "err", label: "검색 오류율", value: 1.1, unit: "%", target: 2, op: "<=", pass: true },
  { key: "task_err", label: "Task 오류율", value: 2.4, unit: "%", target: 5, op: "<=", pass: true },
  { key: "retry", label: "재시도율", value: 6.2, unit: "%", target: 10, op: "<=", pass: true },
  { key: "yt", label: "YouTube 유닛 / 요청 인원", value: 48.7, unit: "", target: 50, op: "<=", pass: true },
  { key: "cache", label: "캐시 적중", value: 19, unit: "%", target: 15, op: ">=", pass: true },
  { key: "partial", label: "partial 비율", value: 11, unit: "%", target: 15, op: "<=", pass: true },
];

export const observe: ObserveSeries[] = [
  { agent: "query-planner", p50_s: 2.1, p95_s: 4, p99_s: 6, tokens_in: 6200, tokens_out: 1900, cost_usd: 0.004, error_rate: 0, retry_rate: 0, cache_hit: 0 },
  { agent: "scout", p50_s: 22, p95_s: 31, p99_s: 38, tokens_in: 64000, tokens_out: 5200, cost_usd: 0.021, error_rate: 0.4, retry_rate: 3.1, cache_hit: 12 },
  { agent: "ig-researcher", p50_s: 4.2, p95_s: 8, p99_s: 11, tokens_in: 0, tokens_out: 0, cost_usd: 0, error_rate: 1.2, retry_rate: 8.4, cache_hit: 22 },
  { agent: "yt-researcher", p50_s: 5.1, p95_s: 9, p99_s: 12, tokens_in: 0, tokens_out: 0, cost_usd: 0, error_rate: 0.6, retry_rate: 4.2, cache_hit: 25 },
  { agent: "web-researcher", p50_s: 14, p95_s: 22, p99_s: 29, tokens_in: 410000, tokens_out: 22000, cost_usd: 0.108, error_rate: 1.9, retry_rate: 9.8, cache_hit: 17 },
  { agent: "verifier", p50_s: 7, p95_s: 11, p99_s: 14, tokens_in: 96000, tokens_out: 14000, cost_usd: 0.031, error_rate: 0.3, retry_rate: 1.1, cache_hit: 0 },
  { agent: "profiler", p50_s: 0.4, p95_s: 1, p99_s: 1.6, tokens_in: 0, tokens_out: 0, cost_usd: 0, error_rate: 0, retry_rate: 0, cache_hit: 0 },
];

/** 최근 14일 종합점수 (게이트 실험) — 추세 차트용 */
export const compositeTrend: { date: string; value: number; version: string }[] = [
  { date: "09-14", value: 0.8, version: "9b1c2d0" }, { date: "09-15", value: 0.81, version: "9b1c2d0" },
  { date: "09-16", value: 0.82, version: "a41f9e2" }, { date: "09-17", value: 0.82, version: "a41f9e2" },
  { date: "09-18", value: 0.83, version: "c5d8a11" }, { date: "09-19", value: 0.83, version: "c5d8a11" },
  { date: "09-20", value: 0.84, version: "c5d8a11" }, { date: "09-21", value: 0.83, version: "2d91871" },
  { date: "09-22", value: 0.83, version: "2d91871" }, { date: "09-23", value: 0.84, version: "2d91871" },
  { date: "09-24", value: 0.83, version: "2d91871" }, { date: "09-25", value: 0.83, version: "2d91871" },
  { date: "09-26", value: 0.83, version: "2d91871" }, { date: "09-27", value: 0.78, version: VERSION },
];

export const gates: GateDecision[] = [
  {
    id: "g_0927_1", at: "2026-09-27 14:20", version: VERSION, verdict: "IMPROVE", composite: 0.78, baseline: 0.83,
    reasons: ["치명 평가자 미달: attribution_precision 0.81 < 0.90", "H5 회귀 빨강 (Δ −0.05)", "primary_source_rate 0.41 < 0.60"],
    focus_agents: ["web-researcher"], notes: ["H1 인스타 토큰 5일 남음", "H9 감독관 개입 O5 1.4회/검색"],
    actions: ["최악 예제 5건을 주석 큐로 보내기", "web-researcher 프롬프트 '1차 출처를 열어라' 규칙 확인", "수정 후 agentops eval → gate"],
  },
  { id: "g_0926_1", at: "2026-09-26 18:02", version: "2d91871", verdict: "DEPLOY", composite: 0.83, baseline: 0.83, reasons: [], focus_agents: [], notes: ["H1 인스타 토큰 6일 남음"], actions: [] },
  { id: "g_0924_1", at: "2026-09-24 11:40", version: "2d91871", verdict: "DEBUG", composite: 0, baseline: 0.83, reasons: ["H4 평가 없음 — 이 버전의 golden 실험이 없음"], focus_agents: [], notes: [], actions: ["agentops eval --suite golden"] },
  { id: "g_0920_1", at: "2026-09-20 16:15", version: "c5d8a11", verdict: "DEPLOY", composite: 0.84, baseline: 0.83, reasons: [], focus_agents: [], notes: [], actions: [] },
  { id: "g_0918_2", at: "2026-09-18 21:03", version: "c5d8a11", verdict: "DEBUG", composite: 0, baseline: 0.82, reasons: ["H1 인스타 토큰 만료 (빨강)"], focus_agents: [], notes: [], actions: ["토큰 재발급 후 다시 게이트"] },
  { id: "g_0916_1", at: "2026-09-16 10:22", version: "a41f9e2", verdict: "DEPLOY", composite: 0.82, baseline: 0.81, reasons: [], focus_agents: [], notes: [], actions: [] },
  { id: "g_0915_1", at: "2026-09-15 09:48", version: "a41f9e2", verdict: "IMPROVE", composite: 0.79, baseline: 0.81, reasons: ["known_rate 0.61 < 0.70", "종합 0.79 < 0.80"], focus_agents: ["verifier"], notes: [], actions: [] },
];

export const experiments: ExperimentRow[] = [
  { id: "exp_0927", version: VERSION, at: "09-27 14:02", dataset: "ia-golden (20 × 2회)", composite: 0.78, critical_failed: 1, cost_usd: 2.91, url: LS },
  { id: "exp_0926", version: "2d91871", at: "09-26 17:40", dataset: "ia-golden (20 × 2회)", composite: 0.83, critical_failed: 0, cost_usd: 2.84, url: LS },
  { id: "exp_0925r", version: "2d91871", at: "09-25 20:11", dataset: "ia-regression (14)", composite: 0.81, critical_failed: 0, cost_usd: 1.6, url: LS },
  { id: "exp_0920", version: "c5d8a11", at: "09-20 15:55", dataset: "ia-golden (20 × 2회)", composite: 0.84, critical_failed: 0, cost_usd: 2.77, url: LS },
];

const REQS = [
  "최근 3개월 국내에서 뜨고 있는 20~30대 여성 패션, 인스타·유튜브 둘 다, 협찬 위주 30명",
  "홈카페 인스타 1만~20만, 커피 브랜드 협업 없는 10명",
  "IT 리뷰 유튜버 중 단점도 말하는 사람 10명",
  "캠핑 장비 리뷰, 가족 캠핑 콘텐츠 올리는 15명",
  "비건 요리 레시피 공유하는 인스타 10명",
  "러닝 크루 운영하는 운동 인플루언서 12명",
];

export const runs: MissionRunSummary[] = Array.from({ length: 18 }, (_, i) => {
  const r = REQS[i % REQS.length];
  const count = Number(r.match(/(\d+)명/)?.[1] ?? 10);
  const bad = i === 0 || i === 3 || i === 7;
  return {
    mission_id: `m_${(9270 - i).toString(36)}`,
    at: `09-${String(27 - Math.floor(i / 3)).padStart(2, "0")} ${String(18 - (i % 3) * 3).padStart(2, "0")}:${String(10 + i).padStart(2, "0")}`,
    request: r,
    version: i < 4 ? VERSION : "2d91871",
    count,
    returned: bad ? count - 2 : count,
    latency_s: Math.round(120 + count * 7 + (i % 4) * 11),
    cost_usd: Math.round(count * (0.012 + (i % 3) * 0.002) * 1000) / 1000,
    known_rate: bad ? 0.61 : 0.74 + (i % 4) * 0.03,
    thumbs_up_rate: i % 2 === 0 ? 0.7 + (i % 3) * 0.05 : null,
    interventions: bad ? 3 : i % 3,
    status: bad ? "partial" : "ok",
    trace_url: LS,
  };
});

/** 검색 1건의 이벤트 타임라인 (추적 탭 · 개요 타임라인) */
export const timeline: TraceEvent[] = (() => {
  const ev: TraceEvent[] = [];
  let id = 0;
  const add = (e: Omit<TraceEvent, "event_id" | "run_url">) => ev.push({ ...e, event_id: `evt_${++id}`, run_url: LS });
  add({ ts: 0, type: "mission.started", agent: "supervisor", lane: "총괄", label: "검색 시작", status: "info" });
  add({ ts: 0.2, dur: 3.8, type: "condition.compiled", agent: "query-planner", lane: "조건 컴파일", label: "조건 7개 제안", tokens_in: 6200, tokens_out: 1900, cost_usd: 0.004, status: "ok" });
  add({ ts: 4.1, dur: 0.1, type: "condition.validated", agent: "query-planner", lane: "조건 컴파일", label: "c5 재제안 1회 · 통과", status: "ok" });
  add({ ts: 4.3, dur: 58, type: "hitl.requested", agent: "supervisor", lane: "사람 확인", label: "조건 승인 대기 58s (지연에서 제외)", status: "info" });
  add({ ts: 62.4, dur: 31, type: "agent.finished", agent: "scout", lane: "발굴", label: "후보 240 → 75", tokens_in: 64000, tokens_out: 5200, cost_usd: 0.021, status: "ok" });
  add({ ts: 93.6, dur: 38, type: "agent.finished", agent: "ig-researcher", lane: "인스타 ×75", label: "75건 · 개인 계정 9", status: "ok" });
  add({ ts: 93.6, dur: 41, type: "agent.finished", agent: "yt-researcher", lane: "유튜브 ×75", label: "75건 · 1,125유닛", status: "ok" });
  add({ ts: 93.6, dur: 96, type: "agent.finished", agent: "web-researcher", lane: "웹 ×75", label: "75건 · 1차 출처 41%", tokens_in: 410000, tokens_out: 22000, cost_usd: 0.108, status: "partial" });
  add({ ts: 151, type: "overseer.intervened", agent: "overseer", lane: "감독관", label: "O5 지어낸 근거 ×2", status: "partial" });
  add({ ts: 190, dur: 21, type: "agent.finished", agent: "verifier", lane: "판정", label: "75명 판정", tokens_in: 96000, tokens_out: 14000, cost_usd: 0.031, status: "ok" });
  add({ ts: 211.5, dur: 2, type: "supervisor.reviewed", agent: "supervisor", lane: "총괄", label: "재지시 6명 (web)", status: "info" });
  add({ ts: 214, dur: 24, type: "agent.finished", agent: "web-researcher", lane: "웹 ×75", label: "재조사 6명", tokens_in: 38000, tokens_out: 2100, cost_usd: 0.009, status: "ok" });
  add({ ts: 238.5, dur: 1, type: "agent.finished", agent: "profiler", lane: "도시에", label: "34명 정리", status: "ok" });
  add({ ts: 240, type: "condition.coverage", agent: "supervisor", lane: "총괄", label: "조건 확인률 기록", status: "info" });
  add({ ts: 240.2, type: "mission.finished", agent: "supervisor", lane: "총괄", label: "검색 종료 · $0.43", status: "ok" });
  return ev;
})();

export const overview: OpsOverview = {
  version: VERSION,
  env: "prod",
  gate: gates[0],
  trace: { events_24h: 1284, missions_24h: 9, integrity: "green" },
  eval: { composite: 0.78, baseline: 0.83, critical_failed: 1 },
  observe: { p95_s: 188, cost_per_mission: 0.17, error_rate: 1.1 },
  health,
  agents,
  latest_mission: { mission_id: runs[0].mission_id, events: timeline },
};
