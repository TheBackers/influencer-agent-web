/** 백엔드 API 타입 정의 */

export interface HardFilter {
  platforms: string[];
  follower_min: number;
  follower_max: number;
  engagement_min: number;
  active_within_days: number;
  count: number;
  language: string;
  candidate_target: number;
  screen_keep: number;
  max_discover_rounds: number;
  max_verify_rounds: number;
}

export interface SoftCondition {
  id: string;
  text: string;
  weight: "must" | "nice";
  kind: "require" | "exclude";
  source_phrase: string;
}

export interface Plan {
  topic: string;
  query_angles: string[];
  hard: HardFilter;
  soft: SoftCondition[];
  interpretation: string;
}

export interface ConditionCheck {
  id: string;
  verdict: "pass" | "fail" | "unknown";
  evidence: string;
  source_url: string;
  source_title: string;
}

export interface SourceRef {
  platform: string;
  url: string;
  is_same_person: boolean;
  evidence: string;
}

export interface PersonFact {
  kind: string;
  fact: string;
  url: string;
  source_title: string;
}

export interface Profile {
  name: string;
  handle: string;
  platform: string;
  followers: number;
  engagement_rate: number;
  engagement_basis: string;
  engagement_known: boolean;
  avatar: string;
  limited: boolean;
  attributable: boolean;
  identity_confidence: number;
  identity_evidence: string;
  identity?: {
    name: string;
    confidence: number;
    evidence: string;
    source_url: string;
  };
  activity_summary: string;
  topics: string[];
  checks: ConditionCheck[];
  sources: SourceRef[];
  background: PersonFact[];
  missing_info: string[];
  _nice_pass?: number;
  _nice_unknown?: number;
  _must_total?: number;
  _weak?: string;
  _trace?: { tool: string; args: Record<string, unknown> }[];
  metrics_url?: string;
}

export interface RejectedCandidate {
  name: string;
  handle: string;
  platform: string;
  followers: number;
  engagement_rate: number;
  _reject: string;
  _stage: string;
}

export interface RunResult {
  request: string;
  plan: Plan;
  passed: Profile[];
  passed_extra: number;
  rejected: RejectedCandidate[];
  cost: Record<string, unknown>;
  stem: string;
  discover_round: number;
  verify_round: number;
  elapsed: number;
  mock: boolean;
  revisions: string[];
}

export interface SSEEvent {
  t: "plan" | "confirm" | "node" | "done" | "error" | "end";
  i?: number;
  at?: string;
  plan?: Plan;
  node?: string;
  text?: string;
  message?: string;
  ask?: string;
  revisions?: string[];
  hints?: { level: string; text: string }[];
}

export interface EnvStatus {
  mock_llm: boolean;
  model: string;
  tools: {
    web_search: boolean;
    search_provider: string;
    youtube: boolean;
    instagram: boolean;
  };
}
