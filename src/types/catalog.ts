/**
 * 인물 DB(catalog) 타입 — 백엔드 `catalog` 스키마 · /api/catalog/* 응답과 1:1 (설계서 8장 · 14장).
 * 목업(src/mocks/catalog.ts)과 실제 API가 같은 타입을 쓴다. 한쪽을 바꾸면 다른 쪽도 바꾼다.
 */

export type CatalogPlatform = "instagram" | "youtube" | "blog";

/** 계정 종류 — 적재 때 분류 워커가 붙인다. 개인 크리에이터만 검색 후보가 된다 */
export type AccountType = "creator" | "brand" | "store" | "media" | "institution" | "unknown";

/** 다른 플랫폼 계정을 어떻게 이었나 — discovered(씨앗이 찾은 주 계정) · anchor(소개 · 설명란 링크) · web(연락처 찾기 — 본인 확인된 글에 두 계정이 함께 · 0.8) · llm(검색 때 LLM 연결) · human(사람 확정) — D32 */
export type LinkHow = "discovered" | "anchor" | "web" | "llm" | "human";

/** 정보가 얼마나 새것인가 — fresh(14일 안 갱신) · stale(14일 넘음) · expired(30일 넘음 — 유튜브 글은 지워짐) */
export type Freshness = "fresh" | "stale" | "expired";

export type PersonStatus = "active" | "needs_review" | "hidden";

export interface CatalogAccount {
  platform: CatalogPlatform;
  handle: string;               // @brew.diary · @techhanip · 블로그 아이디
  url: string;
  followers: number | null;     // 인스타 팔로워 · 유튜브 구독자 · 블로그는 null
  posts: number | null;
  bio: string;
  /** ok · unavailable(인스타 개인 계정 · 없는 계정 — 30일 뒤 다시 본다) */
  state: "ok" | "unavailable";
  link: { how: LinkHow; confidence: number; evidence_url?: string; note?: string };
  fetched_at: string;
}

export type ActivityKind = "post" | "video" | "blog";

export interface Activity {
  id: string;
  platform: CatalogPlatform;
  kind: ActivityKind;
  url: string;
  posted_at: string;
  text: string;                 // 캡션 · 제목+설명 · 블로그 제목+요약 (최대 1,500자)
  likes: number | null;
  comments: number | null;
  views: number | null;
  sponsored: boolean;
  signals: string[];            // 협찬 표시 — '#광고' · '유료 광고 표시' · '제공받아'
  brands: string[];             // 언급 브랜드 (정리된 이름)
  text_expires_at?: string;     // 유튜브 제목 · 설명은 30일 뒤 지운다 (D30)
}

/** 협찬 · 브랜드 이력 — activities 를 브랜드별로 묶은 것(DB 뷰 brand_deals) */
export interface BrandDeal {
  brand: string;
  category: string;             // 커피 · 가전 · 의류 …
  count: number;
  first_seen: string;
  last_seen: string;
  evidence: { url: string; posted_at: string; signal: string; platform: CatalogPlatform }[];
}

/** 연락처 종류 — instagram 은 DM 창구(D24). 전화번호는 받지 않는다 */
export type ContactKind = "instagram" | "email" | "link" | "kakao" | "site";

/** 어디서 왔나 — self(본인이 자기 계정에 공개) · external(검색으로 찾은 외부 글 — 앵커로 본인 확인) · human(관리자가 넣음) */
export type ContactOrigin = "self" | "external" | "human";

/** 연락처 상태 — found(하나 이상 있음) · pending(찾기 전) · needs_human(검색해도 못 찾음 → 관리자가 채울 목록) */
export type ContactState = "found" | "pending" | "needs_human";

export interface Contact {
  kind: ContactKind;
  value: string;
  label?: string;               // '협업 문의' · '소속사' · 'DM'
  origin: ContactOrigin;
  source_url: string;           // 어디에 적혀 있었나 (본인 소개란 · 설명란 · 기사 · 검색 결과 요약)
  source_label: string;
  found_at: string;
}

export type MentionAbout = "본인 확인" | "이름 일치";
export type MentionKind = "언론" | "블로그" | "커뮤니티" | "위키" | "기타";

export interface Mention {
  url: string;
  title: string;
  snippet: string;
  kind: MentionKind;
  about: MentionAbout;          // D9 귀속 등급 — '무관'은 저장하지 않는다
  date: string;
  found_at: string;
}

/** 판정 이력 — 검색에서 이 사람을 판정한 기록. 같은 조건 · 같은 동작 지문이면 다음 검색이 재사용한다(판정 캐시) */
export interface VerdictRecord {
  condition: string;            // 원문 구절
  verdict: "pass" | "fail" | "unknown";
  links: string[];
  checked_at: string;
  build: string;
  mission_id: string;
  request: string;
  source: "auto" | "human";
}

export interface HistoryItem {
  at: string;
  by: "적재" | "검색" | "사람";
  what: string;
  detail?: string;
}

/** 목록 한 줄 — GET /api/catalog/people */
export interface PersonSummary {
  id: string;
  name: string;
  handle: string;               // 대표 계정
  avatar_hue: number;
  topics: string[];
  account_type: AccountType;
  instagram?: { followers: number | null; state: "ok" | "unavailable" };
  youtube?: { subscribers: number };
  blog?: boolean;
  last_post_at: string;
  posts_30d: number;
  sponsored_90d: number;
  top_brands: string[];
  contact_state: ContactState;
  refreshed_at: string;
  freshness: Freshness;
  status: PersonStatus;
}

/** 상세 — GET /api/catalog/people/{id} */
export interface Person extends PersonSummary {
  summary: string;
  accounts: CatalogAccount[];
  activities: Activity[];
  deals: BrandDeal[];
  contacts: Contact[];
  mentions: Mention[];
  verdicts: VerdictRecord[];
  history: HistoryItem[];
  /** 사람이 고친 칸 — 적재가 덮어쓰지 않는다 */
  locked: ("topics" | "account_type" | "links" | "contacts")[];
}

export type SponsorFilter = "any" | "none_90d" | "has_90d";
export type PeopleSort = "refreshed" | "followers" | "activity" | "sponsored";

export interface PeopleQuery {
  q?: string;
  topics?: string[];
  platform?: CatalogPlatform | "any";
  followers_min?: number | null;
  followers_max?: number | null;
  account_type?: AccountType | "any";
  sponsor?: SponsorFilter;
  contact?: "any" | "has" | "missing";   // missing = 연락처 못 찾음(관리자가 채울 목록)
  hidden?: boolean;                     // true = 숨긴 사람만 본다 (기본은 숨긴 사람 제외 · D26)
  fresh_only?: boolean;
  sort?: PeopleSort;
  limit?: number;                       // 기본 200 · 최대 500 (서버가 자른다)
}

export interface PeoplePage {
  total: number;                // DB 전체 인원
  matched: number;              // 필터에 맞은 인원
  items: PersonSummary[];
  topics: { name: string; count: number }[];
}

/** 정보 고치기 — PATCH /api/catalog/people/{id}. 고친 칸은 locked 로 잠긴다 */
export type PersonPatch =
  | { kind: "topics"; topics: string[] }
  | { kind: "account_type"; account_type: AccountType }
  | { kind: "unlink"; platform: CatalogPlatform; note: string }
  | { kind: "link"; platform: CatalogPlatform; handle: string; note: string }            // 관리자가 계정을 잇는다(인스타 넣기) — 확신도 1.0
  | { kind: "contact"; contact: Pick<Contact, "kind" | "value" | "label" | "source_url"> } // 연락처 넣기 — origin human (D24)
  | { kind: "hide"; hidden: boolean; note?: string };                                    // 삭제 요청도 숨기기로 한다 (D26)

// ── 적재 현황 — GET /api/catalog/ingest ───────────────────────────────────────
export interface TopicRow {
  name: string;
  enabled: boolean;
  target: number;
  people: number;
  creators: number;             // 그중 개인 크리에이터
  fresh_ratio: number;
  new_7d: number;
  keywords: string[];
  queries_used: number;
  yield_per_query: number;      // 소개글 검색 1회에 새로 들어온 계정 수
  last_run_at: string;
}

export interface StageRow {
  key: "seed" | "collect" | "extract" | "classify" | "enrich" | "store";
  label: string;
  waiting: number;
  done_24h: number;
  failed_24h: number;
  llm: boolean;
}

export type WorkerStatus = "active" | "shadow" | "canary" | "disabled";

export interface IngestWorker {
  name: string;                 // agent.yaml 의 name
  label: string;
  capability: string;
  stage: StageRow["key"] | "search";
  does: string;
  llm: "없음" | "배치 1회" | "뽑아 적기" | "낱말 넓히기" | "툴 선택";
  reuses: string;               // 지금 코드에서 가져오는 것
  status: WorkerStatus;
  runs_24h: number;
  success_rate: number | null;
  avg_usd: number | null;
}

export interface IngestError {
  at: string;
  worker: string;
  target: string;
  title: string;
  why: string;
  todo: string;
}

export interface IngestRun {
  id: string;                   // ing_…
  started_at: string;
  minutes: number;
  processed: number;
  added: number;
  failed: number;
  usd: number;
  stopped: string;              // '시간 끝' · '인스타 시간당 몫' · '월 비용 상한'
}

export interface IngestStatus {
  totals: { people: number; creators: number; new_7d: number; fresh_ratio: number; needs_review: number; hidden: number; contact_missing: number };
  cost: { month_usd: number; cap_usd: number; today_usd: number; per_person_usd: number };
  quota: {
    youtube_units_today: number; youtube_cap: number;
    instagram_calls_hour: number; instagram_cap_hour: number;
    web_searches_today: number; web_cap: number;
  };
  next_run_at: string;          // "" = 적재가 아직 꺼져 있음(워커 모두 꺼짐 · 1단계)
  topics: TopicRow[];
  stages: StageRow[];
  workers: IngestWorker[];
  errors: IngestError[];
  runs: IngestRun[];
}

// ── DB 검색 결과에 붙는 칸 — 검색 결과(MissionResult)에 더한다 (설계서 10장 · 3단계) ────────────
/** 인원이 모자랄 때 — 실시간 발굴은 하지 않고(D19) 알리고, 그 분야 적재 낱말을 더하게 한다 (D25) */
export interface CatalogShortfall {
  requested: number;
  found: number;
  topic: string;
  dropped: { phrase: string; removed: number }[];   // 조건마다 DB 거르기 · 판정에서 떨어진 인원
  suggest_keywords: string[];                      // 적재에 더할 검색 낱말 제안
}

/** DB 검색 한 번의 요약 — 결과 화면 위에 보인다 */
export interface CatalogResultInfo {
  topic: string;                // 요청의 분야
  db_pool: number;              // 그 분야 DB 개인 크리에이터 수
  db_candidates: number;        // DB 거르기 뒤 판정한 인원
  verdict_reused: number;       // 이전 판정 재사용 수 (D35)
  verdict_total: number;
  max_info_age_days: number;    // 결과에 쓴 정보 중 가장 오래된 것
  rechecked: number;            // 정보가 7일 넘어 결과로 내기 전 지표를 다시 조회한 인원
  shortfall?: CatalogShortfall;
}

/** 3단계에 MissionResult 에 catalog 칸을 더한다. 그 전까지 목업 · 화면은 이 타입으로 읽는다 */
export type MissionResultDb = import("./v2").MissionResult & { catalog?: CatalogResultInfo };

// ── 분야 추가 · 고치기 — POST /api/catalog/topics · PATCH /api/catalog/topics/{name} ─────────
export interface NewTopic { name: string; keywords: string[]; target: number }
export interface TopicPatch { enabled?: boolean; add_keywords?: string[]; target?: number }
