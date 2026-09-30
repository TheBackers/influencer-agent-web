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
/** 검색 낱말 한 줄 — 낱말은 자동으로 늘고 꺼진다(D40). 사람은 빼기만 한다 */
export type KeywordSource = "seed" | "manual" | "auto_tag" | "auto_llm";   // 후보 기본 · 사람 · 해시태그 · AI 넓히기
export interface KeywordRow {
  word: string;
  source: KeywordSource;
  status: "active" | "off";     // 사람이 뺀 낱말(removed)은 오지 않는다
  queries: number;              // 이 낱말로 한 검색 수
  added: number;                // 새로 들어온 사람
  classified: number;           // 그중 분류가 끝난 사람
  hits: number;                 // 그중 이 분야로 분류된 사람
  off_reason?: string;          // '새 사람 3번 연속 0명' · '분야 적중률 20% (새 사람 12명 중)'
}

export interface TopicRow {
  name: string;
  enabled: boolean;
  target: number;
  origin: "candidate" | "manual";   // 후보 체크로 넣었나(D39)
  people: number;
  creators: number;             // 그중 개인 크리에이터
  fresh_ratio: number;
  new_7d: number;
  keywords: string[];           // 켜진 낱말만
  keyword_rows: KeywordRow[];   // 켜진 · 꺼진 낱말과 성과
  queries_used: number;
  yield_per_query: number;      // 소개글 검색 1회에 새로 들어온 계정 수
  last_run_at: string;
}

/** 분야 후보 — GET /api/catalog/topics/candidates. 이미 넣은 분야는 빠진다 */
export interface TopicCandidate { name: string; keywords: string[]; note: string }

export interface StageRow {
  key: "seed" | "collect" | "classify" | "enrich" | "store";
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
  stage: StageRow["key"];
  does: string;
  llm: "없음" | "배치 1회" | "낱말 넓히기";
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
  stopped: string;              // '할 일 없음' · '마감 5분 전' · '몫 소진' · '도는 중'
}

/** '지금 한 번 돌리기' — 서버 스레드에서 도는 시험 실행(스위치가 꺼져 있어도 · POST /api/catalog/ingest/run) */
export interface IngestManual {
  alive: boolean;               // 아직 도는 중
  started_at: string;
  minutes: number;              // 최대 몇 분 (1~30)
  finished_at: string;          // "" = 아직
  error: string;                // 실행이 예외로 끝났을 때 까닭
  result: { status?: string; run_id?: number; jobs_done?: number; jobs_failed?: number; people_added?: number;
            llm_usd?: number; stopped?: string; note?: string } | null;
}

export interface IngestStatus {
  enabled: boolean;             // 서버 적재 스위치(INGEST_ENABLED=1) — 꺼져 있으면 크론이 돌아도 모으지 않는다(D29)
  totals: { people: number; creators: number; new_7d: number; fresh_ratio: number; needs_review: number; hidden: number; contact_missing: number };
  cost: { month_usd: number; cap_usd: number; today_usd: number; per_person_usd: number };
  quota: {
    youtube_units_today: number; youtube_cap: number;
    instagram_calls_hour: number; instagram_cap_hour: number;
    web_searches_today: number; web_cap: number;
  };
  next_run_at: string;          // "" = 스위치가 꺼져 있음
  running?: boolean;            // 지금 도는 적재 실행이 있다(크론 · 버튼) — 도는 동안 버튼을 막는다
  manual?: IngestManual | null; // 이 서버에서 '지금 한 번 돌리기'로 돌린 마지막 실행
  topics: TopicRow[];
  stages: StageRow[];
  workers: IngestWorker[];
  errors: IngestError[];
  runs: IngestRun[];
}

// ── DB 검색 결과에 붙는 칸 — 검색 결과(MissionResult.catalog · 설계서 10장 · D42) ─────────────
/** DB와 실시간 검색을 합쳐도 모자랄 때 — 조건마다 빠진 인원과 그 분야 적재 낱말 더하기(D25) */
export interface CatalogShortfall {
  requested: number;
  found: number;
  topic: string;                                   // "" = 요청 분야가 DB에 없음 → 분야 추가로 안내
  dropped: { phrase: string; removed: number }[];   // 조건마다 DB 거르기 · 코드로 재기에서 떨어진 인원
  suggest_keywords: string[];                      // 적재에 더할 검색 낱말 제안
}

/** 검색 한 번의 DB 요약 — 결과 화면 위에 보인다 */
export interface CatalogResultInfo {
  enabled?: boolean;            // DB 연결됨 (false = 실시간 검색만 했다)
  topic: string;                // 요청을 맞춘 DB 분야 ("" = 없음)
  note?: string;                // DB를 못 쓴 이유 ('요청 분야가 DB 분야에 없음' 등)
  db_pool: number;              // 그 분야 DB 개인 크리에이터 수
  db_candidates: number;        // DB 거르기 · 코드로 재기 뒤 판정한 인원
  verdict_reused: number;       // 이전 판정 재사용 수 (D35)
  verdict_total: number;
  max_info_age_days: number;    // 결과에 쓴 DB 정보 중 가장 오래된 것
  rechecked: number;            // 정보가 7일 넘어 결과로 내기 전 지표를 다시 조회한 인원
  from_db?: number;             // 결과 중 DB에서 찾은 인원
  from_live?: number;           // 결과 중 실시간으로 찾은 인원 (D42)
  live_rounds?: number;         // 실시간 발굴 라운드 (0 = DB로 채움)
  saved?: { found_new: number; verdicts: number; links: number; refresh: number };   // 이번 검색이 DB에 넣은 것
  shortfall?: CatalogShortfall;
}

// ── 분야 추가 · 고치기 — POST /api/catalog/topics · PATCH /api/catalog/topics/{name} ─────────
/** 낱말은 비워도 된다 — 후보면 후보 낱말, 아니면 첫 적재에서 자동으로 만든다(D39 · D40) */
export interface NewTopic { name: string; keywords?: string[]; target: number }
export interface TopicPatch { enabled?: boolean; add_keywords?: string[]; remove_keywords?: string[]; target?: number }
