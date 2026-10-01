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
 *   GET   /api/ops/missions · /api/ops/missions/{id} · /api/ops/agents · /api/ops/health · /api/ops/trend · /api/ops/feedback   (AgentOps 콘솔 · 실제 기록)
 *   GET   /api/ops/{overview|runs|scores|observe|gates|experiments}   (예시 데이터 — 평가 · 배포 판정 API 전)
 *   POST  /api/ops/gate {version}                  → GateDecision
 */
import type {
  Capabilities, CompiledPlan, ConditionPatch, FeedbackReq, GateDecision, MissionEvent, MissionResult,
  OpsOverview, MissionRunSummary, TraceEvent, EvaluatorScore, AgentScore, ObserveSeries,
  SLOItem, HealthCheck, ExperimentRow, OpsMissionRow, OpsMissionView, OpsCatalog, OpsHealth, OpsTrendRow, OpsFeedback, OpsMeasure, GoldenConsole, GoldenItem,
  CondConsole, CondDraft, CondItem, ExpectCard, LinkPlatform, VerdictAnswer, VerdictConsole, VerdictItem,
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

export async function http<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
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

// ── 검색 실행 ────────────────────────────────────────────────────────────────
export async function startMission(plan: CompiledPlan): Promise<{ mission_id: string }> {
  if (USE_MOCK) return { mission_id: "m_mock_short" };
  return http("/api/v2/missions", { method: "POST", body: JSON.stringify({ plan_id: plan.plan_id }) });
}

/** v4 · D51 — '실시간으로 더 찾기': 같은 승인 조건 · 모자란 인원만 · 이미 결과에 든 사람 제외로 live 검색을 새로 돌린다 */
export async function startLiveMission(missionId: string): Promise<{ mission_id: string }> {
  if (USE_MOCK) return { mission_id: "m_mock_live" };
  return http(`/api/v2/missions/${encodeURIComponent(missionId)}/live`, { method: "POST" });
}

/** 진행 이벤트 구독. 해제 함수를 돌려준다 */
export function followMission(missionId: string, onEvent: (e: MissionEvent) => void): () => void {
  if (USE_MOCK) {
    let stop = () => {};
    let cancelled = false;
    import("@/mocks/mission").then(({ simulateMission }) => {
      if (!cancelled) stop = simulateMission(onEvent, missionId.endsWith("_live"));
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
    return mockResult(plan, missionId);
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
export async function getOpsTrend(limit = 30): Promise<OpsTrendRow[]> {
  if (USE_MOCK) return (await import("@/mocks/ops-live")).opsTrend;
  return (await http<{ rows: OpsTrendRow[] }>(`/api/ops/trend?limit=${limit}`)).rows;
}
export async function getOpsFeedback(limit = 200): Promise<OpsFeedback> {
  if (USE_MOCK) return (await import("@/mocks/ops-live")).opsFeedback;
  return http(`/api/ops/feedback?limit=${limit}`);
}
export async function getOpsMeasure(mock: "auto" | "1" | "0" = "auto"): Promise<OpsMeasure> {
  if (USE_MOCK) return (await import("@/mocks/ops-live")).opsMeasure;
  return http(`/api/ops/measure?mock=${mock}`);
}
// 계정 연결 골든셋 — mock 에서는 메모리 안에서만 바뀐다
export async function getGolden(): Promise<GoldenConsole> {
  if (USE_MOCK) return (await import("@/mocks/ops-live")).opsGolden;
  return http("/api/ops/golden");
}
export async function harvestGolden(): Promise<{ added: number }> {
  if (USE_MOCK) { await wait(300); return { added: 0 }; }
  return http("/api/ops/golden/harvest", { method: "POST" });
}
export async function decideGolden(id: number, body: { status: GoldenItem["status"]; exists?: boolean | null; expect?: string; note?: string }): Promise<GoldenItem> {
  if (USE_MOCK) {
    const g = (await import("@/mocks/ops-live")).opsGolden;
    const it = g.items.find((x) => x.id === id)!;
    Object.assign(it, { status: body.status, expect_exists: body.exists ?? null, expect_id: body.expect || null, note: body.note || null });
    return it;
  }
  return http(`/api/ops/golden/${id}`, { method: "POST", body: JSON.stringify(body) });
}
export async function addGolden(body: { from_platform: string; from_handle: string; to_platform: string; exists: boolean; expect: string; note?: string }): Promise<{ ok: boolean }> {
  if (USE_MOCK) { await wait(200); return { ok: true }; }
  return http("/api/ops/golden", { method: "POST", body: JSON.stringify(body) });
}
// 조건 골든셋 — 요청문 → 기대 카드. 파일 문제(yaml)는 읽기만, 화면 문제는 확인 대기 → 확정
export async function getGoldenConditions(): Promise<CondConsole> {
  if (USE_MOCK) return (await import("@/mocks/ops-live")).opsGoldenConditions;
  return http("/api/ops/golden-conditions");
}
export async function harvestGoldenConditions(): Promise<{ added: number }> {
  if (USE_MOCK) { await wait(300); return { added: 0 }; }
  return http("/api/ops/golden-conditions/harvest", { method: "POST" });
}
export async function draftGoldenCondition(request: string): Promise<CondDraft> {
  if (USE_MOCK) { await wait(400); return { expect: [{ type: "규모", min: 10000, max: 200000 }, { type: "협찬", negate: true }], count: 10, platforms: ["instagram"], notes: [] }; }
  return http("/api/ops/golden-conditions/draft", { method: "POST", body: JSON.stringify({ request }) });
}
export async function decideGoldenCondition(id: number, body: { status: CondItem["status"]; expect?: ExpectCard[]; count?: number | null; platforms?: LinkPlatform[]; split?: "dev" | "holdout" | null; note?: string }): Promise<CondItem> {
  if (USE_MOCK) {
    const g = (await import("@/mocks/ops-live")).opsGoldenConditions;
    const it = g.items.find((x) => x.id === id)!;
    Object.assign(it, { ...body, split: body.split || it.split });
    return it;
  }
  return http(`/api/ops/golden-conditions/${id}`, { method: "POST", body: JSON.stringify(body) });
}
export async function addGoldenCondition(body: { request: string; expect: ExpectCard[]; count?: number | null; platforms?: LinkPlatform[]; confirm?: boolean; note?: string }): Promise<{ ok: boolean }> {
  if (USE_MOCK) { await wait(200); return { ok: true }; }
  return http("/api/ops/golden-conditions", { method: "POST", body: JSON.stringify(body) });
}
// 판정 골든셋 — 사람 × 조건 → 충족 · 미충족 · 판단 불가 + 근거
export async function getGoldenVerdicts(): Promise<VerdictConsole> {
  if (USE_MOCK) return (await import("@/mocks/ops-live")).opsGoldenVerdicts;
  return http("/api/ops/golden-verdicts");
}
export async function harvestGoldenVerdicts(): Promise<{ added: number }> {
  if (USE_MOCK) { await wait(300); return { added: 0 }; }
  return http("/api/ops/golden-verdicts/harvest", { method: "POST" });
}
export async function decideGoldenVerdict(id: number, body: { status: VerdictItem["status"]; expect?: VerdictAnswer; evidence?: string[]; scope?: string; note?: string }): Promise<VerdictItem> {
  if (USE_MOCK) {
    const g = (await import("@/mocks/ops-live")).opsGoldenVerdicts;
    const it = g.items.find((x) => x.id === id)!;
    Object.assign(it, { status: body.status, expect: body.expect ?? it.expect, evidence: (body.evidence || []).map((url) => ({ url })), scope: body.scope ?? it.scope });
    return it;
  }
  return http(`/api/ops/golden-verdicts/${id}`, { method: "POST", body: JSON.stringify(body) });
}
export async function addGoldenVerdict(body: { platform: LinkPlatform; handle: string; phrase: string; criterion?: string; name?: string; expect?: VerdictAnswer | null; evidence?: string[]; scope?: string; note?: string }): Promise<{ ok: boolean }> {
  if (USE_MOCK) { await wait(200); return { ok: true }; }
  return http("/api/ops/golden-verdicts", { method: "POST", body: JSON.stringify(body) });
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
