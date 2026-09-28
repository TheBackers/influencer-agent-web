/**
 * v2 API 어댑터 — 화면은 이 파일만 부른다.
 *
 * NEXT_PUBLIC_USE_MOCK=1 이면 src/mocks 의 데이터를 돌려주고, 아니면 실제 백엔드를 부른다.
 * 목업과 실제가 같은 타입(src/types/v2.ts)을 쓰므로, 구축 단계에서는 환경변수만 끄면 된다.
 *
 * 실제 엔드포인트(구축 4단계에서 web/app.py 에 추가):
 *   POST  /api/v2/compile                          → CompiledPlan
 *   PATCH /api/v2/plans/{plan_id}/conditions/{cid} → CompiledPlan   (코드 재검증 · LLM 없음)
 *   POST  /api/v2/plans/{plan_id}/revise           → CompiledPlan   (말로 고치기 · LLM 1회)
 *   POST  /api/v2/missions {plan_id}               → {mission_id}
 *   GET   /api/v2/missions/{id}/stream             → SSE MissionEvent
 *   GET   /api/v2/missions/{id}                    → MissionResult
 *   POST  /api/feedback                            → {ok}
 *   GET   /api/ops/missions · /api/ops/missions/{id} · /api/ops/agents · /api/ops/health   (AgentOps 콘솔 · 실제 기록)
 *   GET   /api/ops/{overview|runs|scores|observe|gates|experiments}   (예시 데이터 — 평가 · 배포 판정 API 전)
 *   POST  /api/ops/gate {version}                  → GateDecision
 */
import type {
  Capabilities, CompiledPlan, ConditionPatch, FeedbackReq, GateDecision, MissionEvent, MissionResult,
  OpsOverview, MissionRunSummary, TraceEvent, EvaluatorScore, AgentScore, ObserveSeries,
  SLOItem, HealthCheck, ExperimentRow, OpsMissionRow, OpsMissionView, OpsCatalog, OpsHealth,
} from "@/types/v2";

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "1";
/** Ops 화면은 서버 API(/api/ops/*)가 붙기 전까지 예시 데이터를 쓴다. 붙으면 NEXT_PUBLIC_OPS_LIVE=1 */
export const OPS_SAMPLE = USE_MOCK || process.env.NEXT_PUBLIC_OPS_LIVE !== "1";
const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ── 관리자 토큰 — 서버에 ADMIN_TOKEN 이 설정되어 있으면 요청마다 필요하다 (배포 서버가 공개 주소라서)
//    번들에 넣지 않고, 처음 한 번 물어서 이 브라우저에만 저장한다.
const TOKEN_KEY = "ia_admin_token";
function token(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}
function askToken(): string {
  const t = typeof window !== "undefined" ? window.prompt("관리자 토큰을 입력하세요 (서버의 ADMIN_TOKEN)") : null;
  if (t) {
    try {
      localStorage.setItem(TOKEN_KEY, t.trim());
    } catch {
      /* 저장 못 해도 이번 요청에는 쓴다 */
    }
  }
  return (t || "").trim();
}

async function http<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "X-Admin-Token": token(), ...init?.headers },
  });
  if (res.status === 401 && !retried && askToken()) return http<T>(path, init, true);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const mocks = () => Promise.all([import("@/mocks/plan"), import("@/mocks/mission"), import("@/mocks/ops")]);

// ── 쓸 수 있는 조건 · 막힌 툴 ──────────────────────────────────────────────
export async function getCapabilities(): Promise<Capabilities> {
  if (USE_MOCK) return (await import("@/mocks/capabilities")).capabilities;
  return http("/api/v2/capabilities");
}

// ── 조건 컴파일 · 승인 ────────────────────────────────────────────────────────
export async function compilePlan(request: string, count: number): Promise<CompiledPlan> {
  if (USE_MOCK) {
    const [{ mockPlan, estimate }] = await mocks();
    await wait(900);
    const plan = structuredClone(mockPlan);
    plan.request = request || plan.request;
    plan.estimate = { ...estimate(plan), count };
    return plan;
  }
  return http("/api/v2/compile", { method: "POST", body: JSON.stringify({ request, count }) });
}

export async function patchCondition(plan: CompiledPlan, cid: string, patch: ConditionPatch): Promise<CompiledPlan> {
  if (USE_MOCK) {
    const [{ applyPatch }] = await mocks();
    return applyPatch(plan, cid, patch);
  }
  return http(`/api/v2/plans/${plan.plan_id}/conditions/${cid}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function revisePlan(plan: CompiledPlan, instruction: string): Promise<CompiledPlan> {
  if (USE_MOCK) {
    await wait(1100);
    const next = structuredClone(plan);
    next.revisions = [...next.revisions, instruction];
    next.validator_notes = [...next.validator_notes, `말로 고치기 반영: "${instruction}" (목업 — 실제로는 LLM이 다시 컴파일)`];
    return next;
  }
  return http(`/api/v2/plans/${plan.plan_id}/revise`, { method: "POST", body: JSON.stringify({ instruction }) });
}

// ── 임무 실행 ────────────────────────────────────────────────────────────────
export async function startMission(plan: CompiledPlan): Promise<{ mission_id: string }> {
  if (USE_MOCK) return { mission_id: "m_mock_fashion30" };
  return http("/api/v2/missions", { method: "POST", body: JSON.stringify({ plan_id: plan.plan_id }) });
}

/** 진행 이벤트 구독. 해제 함수를 돌려준다 */
export function followMission(missionId: string, onEvent: (e: MissionEvent) => void): () => void {
  if (USE_MOCK) {
    let stop = () => {};
    let cancelled = false;
    import("@/mocks/mission").then(({ simulateMission }) => {
      if (!cancelled) stop = simulateMission(onEvent);
    });
    return () => {
      cancelled = true;
      stop();
    };
  }
  const es = new EventSource(`${API}/api/v2/missions/${missionId}/stream?token=${encodeURIComponent(token())}`);
  let finished = false;
  es.onmessage = (m) => {
    const ev: MissionEvent = JSON.parse(m.data);
    // 서버는 끝나면 스트림을 닫는다 — 닫힌 뒤 EventSource 가 다시 붙어 이벤트를 되풀이하지 않게 먼저 닫는다
    if (ev.t === "done" || (ev.t === "error" && !ev.step)) {
      finished = true;
      es.close();
    }
    onEvent(ev);
  };
  es.onerror = () => {
    if (finished) return;
    es.close();
    onEvent({ t: "error", at: new Date().toTimeString().slice(0, 8), text: "연결이 끊겼습니다. 결과는 서버에 저장됩니다." });
  };
  return () => es.close();
}

export async function getMission(missionId: string, plan: CompiledPlan): Promise<MissionResult> {
  if (USE_MOCK) {
    const [, { mockResult }] = await mocks();
    return mockResult(plan);
  }
  return http(`/api/v2/missions/${missionId}`);
}

export async function sendFeedback(req: FeedbackReq): Promise<{ ok: boolean }> {
  if (USE_MOCK) {
    await wait(250);
    return { ok: true };
  }
  return http("/api/feedback", { method: "POST", body: JSON.stringify(req) });
}

// ── AgentOps 콘솔 — 실제 실행 기록 (Supabase agentops · 없으면 서버의 로컬 기록) ─────────────
export async function listOpsMissions(limit = 30): Promise<OpsMissionRow[]> {
  if (USE_MOCK) return (await import("@/mocks/ops-live")).opsMissions;
  return (await http<{ missions: OpsMissionRow[] }>(`/api/ops/missions?limit=${limit}`)).missions;
}
export async function getOpsMission(id: string): Promise<OpsMissionView> {
  if (USE_MOCK) return (await import("@/mocks/ops-live")).opsMission;
  return http(`/api/ops/missions/${encodeURIComponent(id)}`);
}
export async function getOpsAgents(): Promise<OpsCatalog> {
  if (USE_MOCK) return (await import("@/mocks/ops-live")).opsCatalog;
  return http("/api/ops/agents");
}
export async function getOpsHealth(): Promise<OpsHealth> {
  if (USE_MOCK) return (await import("@/mocks/ops-live")).opsHealth;
  return http("/api/ops/health");
}

// ── AgentOps ─────────────────────────────────────────────────────────────────
export async function getOverview(): Promise<OpsOverview> {
  if (OPS_SAMPLE) return (await import("@/mocks/ops")).overview;
  return http("/api/ops/overview");
}

export async function listRuns(): Promise<MissionRunSummary[]> {
  if (OPS_SAMPLE) return (await import("@/mocks/ops")).runs;
  return http("/api/ops/runs");
}

export async function getRunEvents(missionId: string): Promise<TraceEvent[]> {
  if (OPS_SAMPLE) return (await import("@/mocks/ops")).timeline;
  return http(`/api/ops/runs/${missionId}`);
}

export async function getScores(): Promise<{ evaluators: EvaluatorScore[]; agents: AgentScore[]; experiments: ExperimentRow[]; trend: { date: string; value: number; version: string }[] }> {
  if (OPS_SAMPLE) {
    const m = await import("@/mocks/ops");
    return { evaluators: m.evaluators, agents: m.agents, experiments: m.experiments, trend: m.compositeTrend };
  }
  return http("/api/ops/scores");
}

export async function getObserve(): Promise<{ slo: SLOItem[]; series: ObserveSeries[] }> {
  if (OPS_SAMPLE) {
    const m = await import("@/mocks/ops");
    return { slo: m.slo, series: m.observe };
  }
  return http("/api/ops/observe");
}

export async function getHealth(): Promise<HealthCheck[]> {
  if (OPS_SAMPLE) return (await import("@/mocks/ops")).health;
  return http("/api/ops/health");
}

export async function listGates(): Promise<GateDecision[]> {
  if (OPS_SAMPLE) return (await import("@/mocks/ops")).gates;
  return http("/api/ops/gates");
}

export async function runGate(version: string): Promise<GateDecision> {
  if (OPS_SAMPLE) {
    await wait(1400);
    return (await import("@/mocks/ops")).gates[0];
  }
  return http("/api/ops/gate", { method: "POST", body: JSON.stringify({ version }) });
}
