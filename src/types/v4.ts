/**
 * v4 화면 타입 (0930 승인 · PRD 2장 · 설계서 7 · 13 · 14장) — 적재(자동 탐색) · AgentOps(추적 · 정확도 · 배포 · 관측).
 * 백엔드 응답과 1:1이 되게 만든다(목업과 실제가 같은 타입 · D22). 목업 데이터는 src/mocks/v4.ts.
 */

// ── 적재 — GET /api/catalog/ingest (v4) ──────────────────────────────────────
export type Source = "web" | "youtube" | "snowball" | "request" | "live" | "human";
export type TopicOrigin = "seed" | "candidate" | "auto" | "request" | "manual";

export interface TopicMapRow {
  name: string;
  origin: TopicOrigin;
  status: "active" | "excluded";
  people: number;          // 이 분야 개인 크리에이터
  new7: number;            // 7일 새 인물
  share7: number;          // 7일 새 인물 중 비중 (0~1) — 25% 선(D48)
  today: number;           // 오늘 새 인물
  keywords: { word: string; auto: boolean }[];
  is_new?: boolean;        // 7일 안에 자동으로 생긴 분야
}

export interface SourceRow {
  source: Source;
  waiting: number;         // 후보 풀 대기
  today_new: number;       // 오늘 새 인물
  day_cap: number | null;  // 하루 몫(명) — null = 나머지
  creator_ratio: number;   // 새 인물 중 개인 크리에이터 비율(7일)
}

export interface ExploreRequest {
  id: string;
  at: string;
  mission_id: string;
  request: string;
  topic: string;
  words: string[];
  short: number;           // 모자란 인원
  added: number;           // 이 요청으로 들어온 새 인물
  status: "open" | "done" | "dropped";
  topic_created?: boolean; // 분야 지도에 없어 새로 만든 분야
}

export interface IngestRunV4 {
  id: string;
  started_at: string;
  minutes: number;
  done: number;
  new_people: number;
  failed: number;
  usd: number;
  stopped: string;
  build: string;
}

export interface IngestV4 {
  enabled: boolean;
  manual?: import("./catalog").IngestManual | null;   // 이 서버에서 '지금 한 번 돌리기'로 돌린 마지막 실행
  next_run_at: string;
  running: boolean;
  today: { new_people: number; target: number; avg7: number; days7: { date: string; n: number }[] };
  fresh: { active_creators: number; fresh7: number; ratio: number; deferred: number; idle_creators: number };
  cost: { month_usd: number; cap_usd: number; today_usd: number };
  quota: { instagram_hour: number; instagram_cap: number; youtube_units: number; youtube_cap: number; web_today: number; web_cap: number };
  db: { mb: number; warn_mb: number; cap_mb: number };
  totals: { people: number; creators: number; topics: number; auto_topics: number; excluded: number };
  topics: TopicMapRow[];
  proposals: { name: string; people: number; need: number }[];   // 분야 제안 — 5명이 되면 분야(D49)
  sources: SourceRow[];
  requests: ExploreRequest[];
  stages: { kind: string; ko: string; queued: number; done24: number; failed24: number }[];
  workers: { name: string; ko: string; ai: string; metric: string }[];
  errors: { at: string; kind: string; key: string; why: string; todo: string }[];
  runs: IngestRunV4[];
}

// ── 워커 상태 — 에이전트 화면 · 정확도 화면 (D60 · 13-5) ─────────────────────
export type Tone = "pass" | "warn" | "fail" | "none";

export interface WorkerStatus {
  name: string;
  ko: string;
  side: "ingest" | "search" | "button";
  ai: "agent" | "llm" | "code";          // agent = LLM이 툴을 고름 · llm = 한 번 부름 · code = AI 없음
  accuracy: { tone: Tone; label: string; suite?: string; score?: number; base?: number; n?: number; min?: number; measured?: string };
  deploy: { tone: Tone; label: string };
  ops: { tone: Tone; label: string; err24: number; p95_s?: number; blocked?: string };
}

// ── 배포 — GET /api/ops/builds (D55~D58) ─────────────────────────────────────
export interface EvalCase { id: string; label: string; expected: string; got: string; trace_url: string }
export interface EvalRow {
  worker: string;
  suite: string;            // eval-verify …
  n: number;
  min: number;
  dev: number | null;       // 개발용 정확도
  base: number | null;      // 기준 버전
  holdout: number | null;
  ci: number;               // ±
  new_wrong: EvalCase[];
  new_right: number;
  critical: number;
  state: "pass" | "blocked" | "thin" | "unit";
  usd: number;
}
export interface PostMetric { side: "검색" | "적재"; name: string; base: string; now: string; sample: string; red: boolean }
export interface Build {
  id: string;
  git: string;
  message: string;
  at: string;
  baseline: boolean;
  deployed: boolean;
  current: boolean;
  gate: "pass" | "blocked" | "skip";
  skip_reason?: string;
  changed: { worker: string; files: string[] }[];
  evals: EvalRow[];
  gates: { n: 1 | 2 | 3 | 4; label: string; state: "pass" | "fail" | "warn" | "na"; why: string }[];
  post?: { state: "watching" | "green" | "red"; hours: number; metrics: PostMetric[]; worker?: string };
  ci_usd: number;
}

// ── 개요 — GET /api/ops/overview ─────────────────────────────────────────────
export interface OverviewV4 {
  alert?: { build: string; title: string; detail: string; worker: string };
  build: { current: string; baseline: string; gate: string; deployed_ago: string };
  ingest: { today: number; target: number; fresh: number; month_usd: number; blocked: number };
  search: { n24: number; p95_s: number; usd_avg: number; thumbs_down: number; db_fill: number };
  reds: { kind: string; label: string; href: string }[];
}

// ── 추적 › 적재 — GET /api/ops/ingest/runs (D59) ──────────────────────────────
export interface TraceCall { at: string; who: string; tool: string; args: string; status: string; ms: number; note?: string }
export interface TraceJob {
  id: string;
  kind: string;
  key: string;
  node: string;
  person?: string;
  result: "done" | "retry" | "failed" | "later";
  ms: number;
  note: string;
  calls: TraceCall[];
  trace_url: string;
}
export interface IngestTraceRun {
  id: string;
  started_at: string;
  minutes: number;
  build: string;
  stopped: string;
  new_people: number;
  usd: number;
  nodes: { id: string; ko: string; done: number; failed: number; later: number }[];
  jobs: TraceJob[];
}

// ── 추적 › 검색 › 인물의 길 — GET /api/ops/missions/{id}/people/{key} ──────────
export interface PersonPath {
  handle: string;
  name: string;
  outcome: string;
  nodes: { id: string; ko: string; state: "pass" | "drop" | "skip" | "reuse"; note: string }[];
  checks: { phrase: string; verdict: "pass" | "fail" | "unknown"; how: "DB" | "코드" | "재사용" | "LLM 판정"; evidence: string; trace_url?: string; call?: string }[];
}

// ── 관측 › 비용 ─────────────────────────────────────────────────────────────
export interface CostV4 {
  month: { k: string; usd: number; cap?: number; note: string }[];
  langsmith: { traces: number; cap: number; by: { k: string; n: number }[] };
  ci: { runs: number; usd: number; cap: number; skipped: number };
}
