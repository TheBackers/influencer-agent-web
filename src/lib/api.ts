/** 백엔드 API 클라이언트 */

import type { Plan, RunResult, SSEEvent, EnvStatus } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

/** 조건 분해만 (LLM 1회) */
export async function planConditions(requestText: string, filters: Record<string, unknown> = {}) {
  return request<{ plan: Plan; mock: boolean }>("/api/plan", {
    method: "POST",
    body: JSON.stringify({ request: requestText, filters }),
  });
}

/** 전체 실행 시작 */
export async function startRun(
  requestText: string,
  filters: Record<string, unknown> = {},
  plan?: Plan | null,
  confirm = true
) {
  return request<{ job_id: string; thread_id: string }>("/api/run", {
    method: "POST",
    body: JSON.stringify({ request: requestText, filters, plan, confirm }),
  });
}

/** 멈춘 그래프 재개 (조건 승인/수정) */
export async function resumeJob(params: {
  job_id: string;
  action: string;
  instruction?: string;
  ids?: string[];
  to?: string;
  text?: string;
  kind?: string;
}) {
  return request<{ ok: boolean }>("/api/resume", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/** 조건 수정 (말로 고치기) */
export async function revisePlan(
  plan: Plan,
  instruction: string,
  filters: Record<string, unknown> = {}
) {
  return request<{ plan: Plan; mock: boolean }>("/api/revise", {
    method: "POST",
    body: JSON.stringify({ plan, instruction, filters }),
  });
}

/** 작업 상태 조회 */
export async function getJob(jobId: string) {
  return request<{
    id: string;
    status: string;
    result: RunResult | null;
    error: string | null;
    events: SSEEvent[];
    interrupt: Record<string, unknown> | null;
  }>(`/api/job/${jobId}`);
}

/** 실행 이력 조회 */
export async function listRuns() {
  return request<{ runs: { stem: string; request: string; date: string }[] }>("/api/runs");
}

/** 환경 상태 */
export async function getEnvStatus() {
  return request<EnvStatus>("/api/env");
}

/** SSE 스트림 URL */
export function streamUrl(jobId: string) {
  return `${API_BASE}/api/stream/${jobId}`;
}

export type { Plan, RunResult, SSEEvent, EnvStatus };
