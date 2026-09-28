/**
 * v2 타입 — 설계서 v2.1 의 Pydantic 모델과 1:1.
 * 목업(src/mocks)과 실제 API(src/lib/api-v2.ts)가 같은 모양을 쓴다.
 * 백엔드 모델 이름을 주석에 적어 둔다 — 한쪽을 바꾸면 다른 쪽도 바꾼다.
 */

// ── 조건 컴파일러 (agent/conditions) ─────────────────────────────────────────
export type Feasibility = "direct" | "proxy" | "infeasible";
export type Weight = "must" | "nice";
export type ConditionKind = "metric" | "evidence" | "platform" | "count";

/** any_k 조건의 하위 신호 한 개. 숫자 칸은 화면에서 바로 고친다 (코드 재검증, LLM 없음) */
export interface Signal {
  id: string;
  label: string; // "유튜브 최근 90일 조회수 중앙값이 이전 90일의 {x}배 이상"
  expr: string; // 측정식 원문 (부품 조합)
  enabled: boolean;
  param?: { name: string; value: number; min: number; max: number; step: number; unit?: string };
}

/** ConditionSpec (agent/conditions/compiler.py) */
export interface ConditionSpec {
  id: string;
  source_phrase: string;
  intent: string;
  kind: ConditionKind;
  how: string; // 사람이 읽는 측정 방법 한 줄
  expr: string; // 측정식 원문
  signals?: Signal[]; // any_k 일 때
  k?: number; // any_k 의 k
  threshold?: string;
  weight: Weight;
  polarity: "require" | "exclude";
  feasibility: Feasibility; // 코드가 확정
  why: string;
  caveat?: string;
  expected_coverage: number; // 0~1, 과거 확인률 기반
  cost_delta_usd?: number;
  agents: string[]; // 검증기가 뽑은 배정 에이전트
  alternatives?: Alternative[];
  chosen_alternative?: string | null; // 대안 id · "drop" · null(원안)
  interpretation_group?: string; // 뜻이 두 갈래일 때 같은 그룹
  dropped?: boolean;
  origin?: "llm" | "code"; // code = 요청문의 숫자(구독자 · 참여율 · 기간)를 코드가 읽어 만든 카드
  hard?: Record<string, number>; // 발굴 단계에서 바로 거르는 값
  rubric?: Rubric | null; // 판단 조건의 기준표 (성향 · 사실 · 평판 · 기타)
}

/** 추상적인 조건을 사람이 확인할 수 있게 푼 판정 기준 — 검증 에이전트가 이대로 판정한다 */
export interface Rubric {
  criterion: string;
  pass_signals: string[];
  fail_signals: string[];
  read: ("posts" | "web")[];
  window_days: number;
  min_hits: number;
  min_read: number;
}

/** GET /api/v2/capabilities — 관리자가 쓸 수 있는 조건의 종류 */
export interface ConditionType {
  type: string;
  code?: boolean; // 코드가 요청문에서 직접 읽는다
  examples: string[];
  template: string;
  how: string;
}

export interface Capabilities {
  condition_types: ConditionType[];
  blocked: { tool: string; reason: string; impact: string }[];
}

export interface Alternative {
  id: string;
  label: string;
  feasibility: Feasibility;
  weight: Weight;
}

export interface MissionEstimate {
  count: number;
  candidates: number;
  verify: number;
  cost_usd: number;
  youtube_units: number;
  minutes: [number, number];
  budget_usd?: number;
  cost_high_usd?: number; // 발굴 후보를 끝까지 다 판정할 때 (최대)
  basis?: string; // 추정 근거 — '최근 실제 임무 N건 실측' · '기본 단가'
}

/** CompiledPlan — 조건 승인 화면 전체 */
export interface CompiledPlan {
  plan_id: string;
  request: string;
  topic: string;
  interpretation: string;
  conditions: ConditionSpec[];
  query_angles: string[];
  scout_strategy: string;
  estimate: MissionEstimate;
  validator_notes: string[]; // 검증기가 고친 것 · 거부 후 재제안한 것
  revisions: string[];
}

export interface ConditionPatch {
  weight?: Weight;
  k?: number;
  signal?: { id: string; enabled?: boolean; value?: number };
  chosen_alternative?: string | null;
  dropped?: boolean;
  min_hits?: number; // 기준표 — 충족 신호 콘텐츠 몇 건 이상
}

// ── 임무 진행 (supervisor) ────────────────────────────────────────────────────
export type StepStatus = "waiting" | "running" | "done" | "skipped";

export interface MissionStep {
  key: string; // plan | scout | ig | yt | web | verify | review | profile
  label: string;
  agent: string;
  status: StepStatus;
  done?: number;
  total?: number;
  detail?: string;
}

export interface MissionEvent {
  t: "step" | "log" | "intervention" | "done" | "error";
  at: string;
  step?: MissionStep;
  text?: string;
  rule?: string; // 감독관 규칙 O1~O9
}

// ── 도시에 (agents/profiler) ─────────────────────────────────────────────────
export interface MediaItem {
  title: string;
  url: string;
  date: string; // ISO
  views?: number;
  likes?: number;
  comments?: number;
  sponsored?: boolean;
}

export interface PlatformCard {
  platform: "instagram" | "youtube";
  url: string;
  handle: string;
  followers: number;
  engagement_rate: number;
  engagement_known: boolean;
  engagement_basis: string;
  last_activity: string;
  limited: boolean;
  identity_confidence: number;
  trend?: { ratio: number; basis: string; known: boolean };
  uploads_90d?: number;
  uploads_prev_90d?: number;
  recent: MediaItem[];
  source: "screen" | "researcher";
  /** account-linker 가 이은 계정일 때 — 어떻게 찾았고 왜 같은 사람으로 봤나 */
  link?: AccountLink;
  needs_review?: boolean; // 확신도가 낮아 판정에 쓰지 않은 계정 (확인 필요)
}

export interface AccountLink {
  how_found: string;
  identity_evidence: string[];
  counter_evidence: string[];
  link_source: string;
  verified: boolean; // API 로 조회됨
  lookup_note: string;
}

export type WebKind = "언론" | "위키" | "커뮤니티" | "링크모음" | "본인계정" | "쇼핑" | "기타";

export interface WebItem {
  title: string;
  url: string;
  snippet: string;
  kind: WebKind;
  date?: string;
}

export interface PersonFact {
  kind: string;
  fact: string;
  url: string;
  source_title: string;
}

export interface ConditionCheck {
  id: string;
  verdict: "pass" | "fail" | "unknown";
  evidence: string;
  source_url: string;
  source_title: string;
  signals_met?: string[]; // any_k 에서 충족한 신호 id
}

export interface Dossier {
  handle: string;
  name: string;
  avatar_hue: number; // 목업 전용 — 실제는 avatar URL
  avatar?: string;
  primary: "instagram" | "youtube";
  instagram: PlatformCard | null;
  youtube: PlatformCard | null;
  web: WebItem[];
  background: PersonFact[];
  summary: string;
  topics: string[];
  checks: ConditionCheck[];
  score: { must_pass: number; must_total: number; nice_pass: number; nice_total: number };
  missing: string[];
  identity_note: string;
  sponsored_count: number;
  usage: { cost_usd: number; tool_calls: number; latency_s: number };
  run_id: string;
}

export interface ConditionCoverage {
  id: string;
  label: string;
  feasibility: Feasibility;
  pass: number;
  fail: number;
  unknown: number;
  reasons: { label: string; count: number }[];
  suggestion?: string;
}

export interface MissionResult {
  mission_id: string;
  request: string;
  plan: CompiledPlan;
  dossiers: Dossier[];
  extra_passed: number;
  coverage: ConditionCoverage[];
  rejected: { stage: string; reason: string; count: number }[];
  cost: { usd: number; llm_calls: number; youtube_units: number; searches: number };
  elapsed_s: number;
  interventions: { rule: string; text: string; count: number }[];
  trace_url: string;
  mock: boolean;
}

export interface FeedbackReq {
  mission_id: string;
  run_id: string;
  handle: string;
  score: 0 | 1;
  comment?: string;
}

// ── AgentOps (agentops/) ─────────────────────────────────────────────────────
export type GateVerdict = "DEPLOY" | "DEBUG" | "IMPROVE";
export type Health = "green" | "yellow" | "red";

export interface EvaluatorScore {
  key: string;
  label: string;
  target: string; // "E2E" | 에이전트 이름
  method: "코드" | "LLM 판정" | "사람";
  score: number;
  threshold: number;
  op: ">=" | "=";
  weight?: number;
  critical: boolean;
  baseline?: number;
}

export interface AgentScore {
  agent: string;
  version: string;
  status: "active" | "shadow" | "canary" | "disabled";
  score: number;
  p95_s: number;
  slo_p95_s: number;
  cost_per_mission: number;
  error_rate: number;
  health: Health;
}

export interface HealthCheck {
  id: string; // H1..H10
  label: string;
  kind: "운영" | "품질";
  status: Health;
  value: string;
  rule: string;
  cause_agent?: string;
  traces?: string[];
  action?: string;
}

export interface SLOItem {
  key: string;
  label: string;
  value: number;
  unit: string;
  target: number;
  op: "<=" | ">=";
  pass: boolean;
}

export interface GateDecision {
  id: string;
  at: string;
  version: string;
  agent?: string;
  verdict: GateVerdict;
  composite: number;
  baseline: number;
  reasons: string[];
  focus_agents: string[];
  notes: string[];
  actions: string[];
}

export interface MissionRunSummary {
  mission_id: string;
  at: string;
  request: string;
  version: string;
  count: number;
  returned: number;
  latency_s: number;
  cost_usd: number;
  known_rate: number;
  thumbs_up_rate: number | null;
  interventions: number;
  status: "ok" | "partial" | "failed";
  trace_url: string;
}

export interface TraceEvent {
  event_id: string;
  ts: number; // 임무 시작 기준 초
  dur?: number; // 초
  type: string;
  agent: string;
  lane: string;
  label: string;
  candidate?: string;
  tokens_in?: number;
  tokens_out?: number;
  cost_usd?: number;
  status?: "ok" | "partial" | "failed" | "info";
  run_url?: string;
}

export interface ObserveSeries {
  agent: string;
  p50_s: number;
  p95_s: number;
  p99_s: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  error_rate: number;
  retry_rate: number;
  cache_hit: number;
}

export interface ExperimentRow {
  id: string;
  version: string;
  at: string;
  dataset: string;
  composite: number;
  critical_failed: number;
  cost_usd: number;
  url: string;
}

export interface OpsOverview {
  version: string;
  env: string;
  gate: GateDecision;
  trace: { events_24h: number; missions_24h: number; integrity: Health };
  eval: { composite: number; baseline: number; critical_failed: number };
  observe: { p95_s: number; cost_per_mission: number; error_rate: number };
  health: HealthCheck[];
  agents: AgentScore[];
  latest_mission: { mission_id: string; events: TraceEvent[] };
}

// ── AgentOps 콘솔 (GET /api/ops/*) — 백엔드 agentops/view.py 와 1:1 ─────────────────────
export type TaskStatus = "ok" | "partial" | "failed" | "blocked" | "skipped" | "running";
export type Severity = "critical" | "warning" | "info";

export interface OpsMissionRow {
  mission_id: string;
  started_at: string;
  request: string | null;
  requested: number | null;
  returned: number | null;
  status: string;
  cost_usd: number | null;
  latency_ms: number | null;
  events: number;
  errors: number;
  interventions: number;
  failed_tasks: number;
  critical?: number;
  warning?: number;
}

export interface OpsGraphNode { id: string; label: string; runs: number; status: TaskStatus | "waiting"; detail: string }
export interface OpsGraphEdge { from: string; to: string; kind: "normal" | "fanout" | "loop"; label: string; count: number; taken: boolean }
export interface OpsStep { agent: string; label: string; runs: number; ok: number; partial: number; failed: number; p95_ms: number }
export interface OpsCell { status: TaskStatus; ms: number; runs: number; task_ids: string[]; llm_calls: number; tool_calls: number; errors: number; usd: number }
export interface OpsCandidate {
  handle: string;
  cells: Record<string, OpsCell>;
  ms: number;
  usd: number;
  problems: number;
  verdict?: "pass" | "fail";
  linked?: { platform: string; id: string; confidence: number };
}
export interface OpsProblem {
  severity: Severity;
  title: string;
  cause: string;
  hint: string;
  agent: string;
  candidates: string[];
  count: number;
  first_t: number | null;
  event_ids: string[];
}
export interface OpsTool { tool: string; calls: number; cache_hits: number; errors: number; empty: number; avg_ms: number; p95_ms: number; providers: Record<string, number> }
export interface OpsAgentRow { agent: string; label: string; runs: number; ok: number; partial: number; failed: number; total_ms: number; p95_ms: number; llm_calls: number; tool_calls: number; tokens_in: number; usd: number; usd_per_run: number }
export interface OpsEventRow { t: number; type: string; agent: string; text: string; ms: number | null; event_id: string }
export interface OpsTask {
  task_id: string; agent: string; candidate: string; capability?: string; status: TaskStatus; ms: number;
  focus: string[]; llm_calls: number; tool_calls: number; tokens_in: number; errors: number; start: number; usd: number;
  note?: string; events: OpsEventRow[];
}
export interface OpsMissionView {
  summary: {
    mission_id: string; request: string; started_at: string; status: string; requested: number | null;
    returned: number | null; passed: number | null; rejected: number | null; duration_s: number; cost_usd: number | null;
    tokens_in: number; llm_calls: number; tool_calls: number; cache_hits: number; events: number;
    interventions: number; errors: number; env: string; version: string; critical: number; warning: number;
    mode?: string; cost_by_agent_usd?: number; verify_runs?: number; verified_candidates?: number;
  };
  graph: { nodes: OpsGraphNode[]; edges: OpsGraphEdge[] };
  steps: OpsStep[];
  candidates: OpsCandidate[];
  problems: OpsProblem[];
  tools: OpsTool[];
  agents: OpsAgentRow[];
  tasks: Record<string, OpsTask>;
  timeline: OpsEventRow[];
}
export interface OpsAgentSpec {
  name: string; label: string; description: string; capabilities: string[]; status: string; tools: string[];
  uses_llm: boolean; tool_choice: string; budget: { llm_calls?: number | null; tool_calls?: number | null; timeout_s: number };
  slo: Record<string, number>; version: string; in_template: boolean;
  recent?: { runs: number; ok: number; partial: number; failed: number; success_rate: number | null; p95_ms: number;
             avg_llm_calls: number; avg_tool_calls: number; missions: number; usd?: number; avg_usd?: number } | null;
}
export interface OpsCatalog {
  agents: OpsAgentSpec[];
  graph: { nodes: { id: string; label: string }[]; edges: { from: string; to: string; kind: string; label: string }[] };
  research: string[];
  discover: string;
  recent_missions: number;
}
export interface OpsHealth { checks: HealthCheck[]; blocked: { tool: string; reason: string; impact: string }[] }
