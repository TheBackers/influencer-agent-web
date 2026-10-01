/**
 * v4 API 어댑터 — 적재(자동 탐색) · AgentOps(개요 · 추적 · 정확도 · 배포 · 관측). 화면은 이 파일만 부른다.
 * NEXT_PUBLIC_USE_MOCK=1 이면 src/mocks/v4.ts, 아니면 실제 백엔드(설계서 14장 · web/catalog_api.py · web/ops_v4.py):
 *   GET   /api/catalog/ingest                         → IngestV4 (+ manual)
 *   POST  /api/catalog/ingest/run {minutes}           → { started, manual } (지금 한 번 돌리기 · 스위치가 꺼져도 시험으로)
 *   PATCH /api/catalog/topics/{name} {status}         → IngestV4 (빼기 · 다시 넣기)
 *   POST  /api/catalog/topics {name}                  → IngestV4 (이름만 더하기)
 *   PATCH /api/catalog/requests/{id} {status}         → IngestV4 (탐색 요청 그만두기)
 *   GET   /api/ops/overview                           → OverviewV4
 *   GET   /api/ops/workers                            → WorkerStatus[]
 *   GET   /api/ops/builds · /api/ops/builds/{build}   → Build[] · Build
 *   POST  /api/ops/builds/{build}/baseline            → Build
 *   GET   /api/ops/ingest/runs/{run}                  → IngestTraceRun
 *   GET   /api/ops/missions/{id}/people               → PersonPath[]
 *   GET   /api/ops/cost                               → CostV4
 */
import { USE_MOCK, http } from "@/lib/api-v2";
import type { IngestManual } from "@/types/catalog";
import type { Build, CostV4, IngestTraceRun, IngestV4, OverviewV4, PersonPath, WorkerStatus } from "@/types/v4";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let ingest: IngestV4 | null = null;
async function mockIngest(): Promise<IngestV4> {
  if (!ingest) ingest = structuredClone((await import("@/mocks/v4")).ingestV4);
  return ingest;
}

export async function getIngestV4(): Promise<IngestV4> {
  if (USE_MOCK) { await wait(120); return structuredClone(await mockIngest()); }
  return http("/api/catalog/ingest");
}

/** 지금 한 번 돌리기 — 서버 스레드에서 한 번(최대 minutes분). 도는 중이면 409. 끝났는지는 getIngestV4().manual 로 본다 */
export async function runIngestV4(minutes: number): Promise<{ started: boolean; manual: IngestManual }> {
  if (!USE_MOCK) return http("/api/catalog/ingest/run", { method: "POST", body: JSON.stringify({ minutes }) });
  const s = await mockIngest();
  const started_at = new Date().toISOString();
  s.manual = { alive: true, started_at, minutes, finished_at: "", error: "", result: null };
  setTimeout(() => {
    s.manual = { alive: false, started_at, minutes, finished_at: new Date().toISOString(), error: "",
                 result: { status: "ok", jobs_done: 94, jobs_failed: 0, people_added: 8, llm_usd: 0.005, stopped: "할 일 없음" } };
  }, 2500);
  return { started: true, manual: structuredClone(s.manual) };
}

/** 분야 빼기 · 다시 넣기 — 뺀 분야는 씨앗 · 분야 몫에서 빠지고, 이미 모은 사람은 그대로 둔다(D44) */
export async function setTopicStatus(name: string, status: "active" | "excluded"): Promise<IngestV4> {
  if (!USE_MOCK) return http(`/api/catalog/topics/${encodeURIComponent(name)}`, { method: "PATCH", body: JSON.stringify({ status }) });
  const s = await mockIngest();
  await wait(200);
  const t = s.topics.find((x) => x.name === name);
  if (t) t.status = status;
  return structuredClone(s);
}

/** 분야 이름만 더하기 — 낱말은 첫 씨앗에서 자동(D40) */
export async function addTopicName(name: string): Promise<IngestV4> {
  if (!USE_MOCK) return http("/api/catalog/topics", { method: "POST", body: JSON.stringify({ name }) });
  const s = await mockIngest();
  await wait(200);
  if (s.topics.some((t) => t.name === name)) throw new Error("이미 있는 분야입니다");
  s.topics.push({ name, origin: "manual", status: "active", people: 0, new7: 0, share7: 0, today: 0, keywords: [], is_new: true });
  return structuredClone(s);
}

export async function removeKeyword(topic: string, word: string): Promise<IngestV4> {
  if (!USE_MOCK) return http(`/api/catalog/topics/${encodeURIComponent(topic)}`, { method: "PATCH", body: JSON.stringify({ remove_keywords: [word] }) });
  const s = await mockIngest();
  await wait(150);
  const t = s.topics.find((x) => x.name === topic);
  if (t) t.keywords = t.keywords.filter((k) => k.word !== word);
  return structuredClone(s);
}

export async function dropRequest(id: string): Promise<IngestV4> {
  if (!USE_MOCK) return http(`/api/catalog/requests/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status: "dropped" }) });
  const s = await mockIngest();
  await wait(150);
  const r = s.requests.find((x) => x.id === id);
  if (r) r.status = "dropped";
  return structuredClone(s);
}

export async function getOverviewV4(): Promise<OverviewV4> {
  if (USE_MOCK) return (await import("@/mocks/v4")).overviewV4;
  return http("/api/ops/overview");
}
export async function getWorkers(): Promise<WorkerStatus[]> {
  if (USE_MOCK) return (await import("@/mocks/v4")).workersV4;
  return http("/api/ops/workers");
}
export async function getBuilds(): Promise<Build[]> {
  if (USE_MOCK) return (await import("@/mocks/v4")).buildsV4;
  return http("/api/ops/builds");
}
/** 사람이 '기준으로' — 배포 뒤 확인이 표본을 못 채웠거나 빨강을 확인한 뒤(D58) */
export async function setBaseline(build: string): Promise<Build> {
  if (USE_MOCK) {
    const b = (await import("@/mocks/v4")).buildsV4.find((x) => x.id === build);
    if (!b) throw new Error("없는 빌드입니다");
    return { ...b, baseline: true };
  }
  return http(`/api/ops/builds/${encodeURIComponent(build)}/baseline`, { method: "POST" });
}
export async function getIngestTrace(run: string): Promise<IngestTraceRun> {
  if (USE_MOCK) return (await import("@/mocks/v4")).ingestTrace;
  return http(`/api/ops/ingest/runs/${encodeURIComponent(run)}`);
}
export async function getPersonPaths(mission: string): Promise<PersonPath[]> {
  if (USE_MOCK) return (await import("@/mocks/v4")).personPaths;
  return http(`/api/ops/missions/${encodeURIComponent(mission)}/people`);
}
export async function getCost(): Promise<CostV4> {
  if (USE_MOCK) return (await import("@/mocks/v4")).costV4;
  return http("/api/ops/cost");
}
