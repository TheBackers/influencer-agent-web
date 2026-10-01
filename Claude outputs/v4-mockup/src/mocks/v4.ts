/**
 * v4 목업 데이터 — PRD B9 상황(0930 승인): 적재 10일째 · 검색 3건(DB로 채움 / 모자람 → 탐색 요청 / 버튼으로 실시간) ·
 * 빌드 3개(통과 · 막힘 · 측정 부족) + 배포 뒤 경고 1건. 인물 · 아이디는 모두 지어낸 예시다.
 */
import type {
  Build, CostV4, IngestTraceRun, IngestV4, OverviewV4, PersonPath, WorkerStatus,
} from "@/types/v4";

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const ahead = (min: number) => new Date(Date.now() + min * 60_000).toISOString();
const day = (d: number) => { const t = new Date(Date.now() - d * 86_400_000); return `${t.getMonth() + 1}/${t.getDate()}`; };
const LS = "https://smith.langchain.com/";

// ── 적재 ────────────────────────────────────────────────────────────────────
const T = (name: string, origin: IngestV4["topics"][number]["origin"], people: number, new7: number, today: number, kw: string[], extra: Partial<IngestV4["topics"][number]> = {}) =>
  ({ name, origin, status: "active" as const, people, new7, share7: new7 / 1302, today, keywords: kw.map((w, i) => ({ word: w, auto: i >= 3 })), ...extra });

export const ingestV4: IngestV4 = {
  enabled: true,
  next_run_at: ahead(41),
  running: false,
  today: {
    new_people: 143, target: 200, avg7: 186,
    days7: [192, 201, 178, 199, 184, 200, 143].map((n, i) => ({ date: day(6 - i), n })),
  },
  fresh: { active_creators: 1164, fresh7: 1094, ratio: 0.94, deferred: 0, idle_creators: 212 },
  cost: { month_usd: 1.18, cap_usd: 10, today_usd: 0.06 },
  quota: { instagram_hour: 71, instagram_cap: 100, youtube_units: 2610, youtube_cap: 4000, web_today: 388, web_cap: 3000 },
  db: { mb: 71, warn_mb: 400, cap_mb: 500 },
  totals: { people: 1812, creators: 1376, topics: 25, auto_topics: 2, excluded: 1 },
  topics: [
    T("홈카페", "seed", 131, 58, 6, ["홈카페", "홈바리스타", "라떼아트", "핸드드립", "모카포트"]),
    T("IT 리뷰", "seed", 118, 61, 7, ["IT 리뷰", "테크 유튜버", "스마트폰 리뷰", "노트북 추천"]),
    T("패션", "seed", 164, 92, 11, ["패션", "데일리룩", "오피스룩", "체형별 코디", "스트릿 하울"]),
    T("뷰티", "candidate", 142, 88, 9, ["뷰티", "메이크업", "스킨케어", "화장품 리뷰"]),
    T("육아", "candidate", 97, 71, 8, ["육아", "육아맘", "아기 일상", "이유식"]),
    T("요리", "candidate", 88, 64, 7, ["요리", "집밥", "자취요리", "도시락"]),
    T("맛집", "candidate", 74, 58, 6, ["맛집", "서울 맛집", "맛집 탐방"]),
    T("여행", "candidate", 81, 63, 8, ["여행", "국내여행", "여행 브이로그", "제주 여행"]),
    T("캠핑", "seed", 52, 41, 4, ["캠핑", "차박", "캠핑 장비"]),
    T("운동", "candidate", 66, 55, 6, ["홈트", "헬스", "필라테스"]),
    T("러닝", "candidate", 38, 33, 3, ["러닝", "마라톤", "러닝화"]),
    T("골프", "candidate", 44, 36, 4, ["골프", "골린이", "골프웨어"]),
    T("반려동물", "candidate", 71, 57, 7, ["강아지", "고양이", "반려견 일상"]),
    T("인테리어", "candidate", 63, 49, 5, ["인테리어", "자취방 꾸미기", "오늘의집"]),
    T("식물", "candidate", 22, 19, 2, ["식물", "플랜테리어", "반려식물"]),
    T("다이어트", "candidate", 35, 30, 3, ["다이어트", "식단", "다이어트 식단"]),
    T("게임", "candidate", 41, 35, 4, ["게임", "게임 유튜버", "모바일 게임"]),
    T("재테크", "candidate", 27, 24, 3, ["재테크", "주식", "절약"]),
    T("독서", "candidate", 24, 21, 2, ["독서", "북스타그램", "책 추천"]),
    T("자동차", "candidate", 30, 26, 3, ["자동차", "카리뷰", "전기차"]),
    T("공예", "candidate", 18, 16, 2, ["공예", "뜨개질", "도자기"]),
    T("웨딩", "candidate", 26, 22, 3, ["웨딩", "웨딩홀", "셀프웨딩"]),
    T("전시 · 문화", "candidate", 17, 15, 2, ["전시", "전시회 추천", "미술관"]),
    T("다이빙", "auto", 9, 9, 3, ["프리다이빙", "스쿠버다이빙", "다이빙 여행"], { is_new: true }),
    T("보드게임", "auto", 6, 6, 1, ["보드게임", "보드게임 카페", "보드게임 추천"], { is_new: true }),
    { ...T("쇼핑몰 사장", "auto", 0, 0, 0, ["쇼핑몰 운영"]), status: "excluded" },
  ],
  proposals: [
    { name: "우쿨렐레", people: 3, need: 5 },
    { name: "클라이밍", people: 4, need: 5 },
  ],
  sources: [
    { source: "request", waiting: 18, today_new: 12, day_cap: 40, creator_ratio: 0.71 },
    { source: "snowball", waiting: 2140, today_new: 82, day_cap: 120, creator_ratio: 0.63 },
    { source: "web", waiting: 312, today_new: 38, day_cap: null, creator_ratio: 0.74 },
    { source: "youtube", waiting: 96, today_new: 9, day_cap: null, creator_ratio: 0.88 },
    { source: "live", waiting: 5, today_new: 2, day_cap: null, creator_ratio: 1 },
    { source: "human", waiting: 0, today_new: 0, day_cap: null, creator_ratio: 1 },
  ],
  requests: [
    { id: "req_14", at: ago(52), mission_id: "m_mock_short", request: "홈카페 인스타 인플루언서 중 팔로워 1만~20만, 최근 커피 브랜드 협업 안 했고 제품 단점도 말하는 사람 10명",
      topic: "홈카페", words: ["원두 리뷰", "캡슐커피", "홈카페 레시피"], short: 3, added: 5, status: "open" },
    { id: "req_13", at: ago(60 * 26), mission_id: "m_mock_diving", request: "프리다이빙 하는 여성 크리에이터 5명",
      topic: "다이빙", words: ["프리다이빙", "다이빙 여행"], short: 5, added: 9, status: "done", topic_created: true },
  ],
  stages: [
    { kind: "seed.accounts", ko: "씨앗", queued: 3, done24: 88, failed24: 0 },
    { kind: "collect", ko: "수집 · 뽑기", queued: 214, done24: 2310, failed24: 4 },
    { kind: "classify.profile", ko: "분류", queued: 20, done24: 214, failed24: 0 },
    { kind: "enrich.person", ko: "웹 보강", queued: 41, done24: 96, failed24: 1 },
  ],
  workers: [
    { name: "seed-harvester", ko: "씨앗 줍기", ai: "낱말 넓히기만", metric: "검색 1회당 새 후보 3.4 · 켜진 낱말 131" },
    { name: "collector", ko: "수집", ai: "없음", metric: "오늘 새 인물 143 · 인스타 이번 시간 71/100" },
    { name: "extractor", ko: "뽑기(스노볼)", ai: "없음", metric: "스노볼 후보 오늘 +640 · 연락처 못 찾음 38" },
    { name: "classifier", ko: "분류", ai: "20명 한 번", metric: "개인 크리에이터 76% · 분야 제안 2 · '모름' 31%" },
    { name: "web-enricher", ko: "웹 보강", ai: "없음", metric: "24시간 96명 · 웹 검색 오늘 388" },
  ],
  errors: [
    { at: ago(48), kind: "enrich.person", key: "p_1532 (카페민 @cafe.min)", why: "네이버 검색 429(호출 한도) — 카카오로 넘겼지만 결과 0건", todo: "1시간 뒤 다시 — 할 일 없음" },
    { at: ago(170), kind: "collect.youtube", key: "UC_mock_ride77", why: "채널이 삭제됨(404) — 3번 실패", todo: "후보를 '없는 계정'으로 닫았습니다" },
  ],
  runs: [
    { id: "ing_231", started_at: ago(53), minutes: 47, done: 96, new_people: 9, failed: 2, usd: 0.006, stopped: "마감 5분 전", build: "7c2e1a9f" },
    { id: "ing_230", started_at: ago(113), minutes: 46, done: 101, new_people: 11, failed: 0, usd: 0.005, stopped: "마감 5분 전", build: "7c2e1a9f" },
    { id: "ing_229", started_at: ago(173), minutes: 44, done: 94, new_people: 8, failed: 1, usd: 0.005, stopped: "인스타 몫 소진", build: "7c2e1a9f" },
    { id: "ing_228", started_at: ago(233), minutes: 47, done: 99, new_people: 10, failed: 0, usd: 0.006, stopped: "마감 5분 전", build: "7c2e1a9f" },
    { id: "ing_227", started_at: ago(293), minutes: 45, done: 97, new_people: 9, failed: 0, usd: 0.005, stopped: "마감 5분 전", build: "3b91d0e2" },
  ],
};

// ── 워커 상태 (정확도 · 배포 · 운영) ─────────────────────────────────────────
export const workersV4: WorkerStatus[] = [
  { name: "seed-harvester", ko: "씨앗 줍기", side: "ingest", ai: "llm",
    accuracy: { tone: "none", label: "골든셋 없음 — 운영 지표로" }, deploy: { tone: "pass", label: "이번 빌드 그대로" }, ops: { tone: "pass", label: "24시간 오류 0", err24: 0 } },
  { name: "collector", ko: "수집", side: "ingest", ai: "code",
    accuracy: { tone: "none", label: "단위 시험 통과" }, deploy: { tone: "pass", label: "이번 빌드 그대로" }, ops: { tone: "pass", label: "24시간 오류 4 (0.2%)", err24: 4 } },
  { name: "extractor", ko: "뽑기 · 스노볼", side: "ingest", ai: "code",
    accuracy: { tone: "pass", label: "추출 고정 사례 100/100", suite: "eval-extract", score: 1, base: 1, n: 100, min: 100, measured: "3일 전" },
    deploy: { tone: "pass", label: "이번 빌드 그대로" }, ops: { tone: "pass", label: "24시간 오류 0", err24: 0 } },
  { name: "classifier", ko: "분류", side: "ingest", ai: "llm",
    accuracy: { tone: "warn", label: "측정 부족 — 골든셋 12/50", suite: "eval-classify", n: 12, min: 50 },
    deploy: { tone: "warn", label: "바뀜 · eval-skip으로 배포" }, ops: { tone: "fail", label: "배포 뒤 '모름' 18%→31%", err24: 0 } },
  { name: "web-enricher", ko: "웹 보강", side: "ingest", ai: "code",
    accuracy: { tone: "none", label: "단위 시험 통과" }, deploy: { tone: "pass", label: "이번 빌드 그대로" },
    ops: { tone: "warn", label: "네이버 429 1건", err24: 1, blocked: "" } },
  { name: "query-planner", ko: "조건 설계", side: "search", ai: "llm",
    accuracy: { tone: "pass", label: "조건 48문제 91%", suite: "eval-decompose", score: 0.91, base: 0.9, n: 48, min: 48, measured: "9일 전" },
    deploy: { tone: "pass", label: "이번 빌드 그대로" }, ops: { tone: "pass", label: "24시간 오류 0", err24: 0, p95_s: 7 } },
  { name: "catalog-retriever", ko: "DB 거르기", side: "search", ai: "code",
    accuracy: { tone: "pass", label: "거르기 손실 0/31", suite: "eval-retrieve", score: 1, base: 1, n: 31, min: 30, measured: "3일 전" },
    deploy: { tone: "pass", label: "이번 빌드 그대로" }, ops: { tone: "pass", label: "24시간 오류 0", err24: 0, p95_s: 1 } },
  { name: "profiler", ko: "코드로 재기", side: "search", ai: "code",
    accuracy: { tone: "none", label: "단위 시험 통과" }, deploy: { tone: "pass", label: "이번 빌드 그대로" }, ops: { tone: "pass", label: "24시간 오류 0", err24: 0 } },
  { name: "verifier", ko: "조건 판정", side: "search", ai: "agent",
    accuracy: { tone: "pass", label: "판정 75개 86%", suite: "eval-verify", score: 0.86, base: 0.86, n: 75, min: 75, measured: "1일 전" },
    deploy: { tone: "fail", label: "막힌 빌드 9a41c0de(▼5%p) — 배포 안 됨" }, ops: { tone: "pass", label: "24시간 오류 0", err24: 0, p95_s: 38 } },
  { name: "account-linker", ko: "계정 찾기", side: "search", ai: "agent",
    accuracy: { tone: "pass", label: "계정 연결 30쌍 93%", suite: "eval-link", score: 0.93, base: 0.9, n: 30, min: 30, measured: "4일 전" },
    deploy: { tone: "pass", label: "이번 빌드 그대로" }, ops: { tone: "pass", label: "24시간 오류 0", err24: 0, p95_s: 22 } },
  { name: "scout", ko: "실시간 발굴", side: "button", ai: "agent",
    accuracy: { tone: "none", label: "골든셋 없음 — 운영 지표로" }, deploy: { tone: "pass", label: "이번 빌드 그대로" }, ops: { tone: "pass", label: "24시간 1회 · 오류 0", err24: 0 } },
  { name: "web-researcher", ko: "웹 조사", side: "button", ai: "llm",
    accuracy: { tone: "none", label: "단위 시험 통과" }, deploy: { tone: "pass", label: "이번 빌드 그대로" }, ops: { tone: "pass", label: "24시간 1회", err24: 0 } },
  { name: "ig-researcher", ko: "인스타 조사", side: "button", ai: "code",
    accuracy: { tone: "none", label: "단위 시험 통과" }, deploy: { tone: "pass", label: "이번 빌드 그대로" }, ops: { tone: "pass", label: "24시간 1회", err24: 0 } },
  { name: "yt-researcher", ko: "유튜브 조사", side: "button", ai: "code",
    accuracy: { tone: "none", label: "단위 시험 통과" }, deploy: { tone: "pass", label: "이번 빌드 그대로" }, ops: { tone: "pass", label: "24시간 1회", err24: 0 } },
];

// ── 배포 — 빌드 3개 ─────────────────────────────────────────────────────────
const G4 = (s2: "pass" | "fail" | "warn", w2: string, s4: "pass" | "fail" | "warn" | "na", w4: string): Build["gates"] => [
  { n: 1, label: "운영 진단", state: "pass", why: "키 · API 연결 · 쿼터 · 오류 군집 정상" },
  { n: 2, label: "이 빌드의 CI 채점", state: s2, why: w2 },
  { n: 3, label: "품질 · 치명", state: s2 === "fail" ? "fail" : "pass", why: s2 === "fail" ? "판정 하락 5%p · 새로 틀림 6" : "치명 0 · 하락 없음" },
  { n: 4, label: "SLO · 배포 뒤 확인", state: s4, why: w4 },
];

export const buildsV4: Build[] = [
  {
    id: "7c2e1a9f", git: "e41b7c0", message: "분류: 목록 밖 분야를 new_topic으로 제안 [eval-skip: 분류 골든셋 12개 — 새 칸 추가라 기준이 없음]",
    at: ago(60 * 5), baseline: false, deployed: true, current: true, gate: "skip",
    skip_reason: "분류 골든셋 12개(최소 50) — 새 칸(new_topic) 추가라 비교할 기준이 없음",
    changed: [{ worker: "classifier", files: ["agent/agents/classifier/prompt.py", "agent/agents/classifier/__init__.py"] }],
    evals: [
      { worker: "classifier", suite: "eval-classify", n: 12, min: 50, dev: 0.83, base: 0.83, holdout: null, ci: 0.21, new_wrong: [], new_right: 0, critical: 0, state: "thin", usd: 0.003 },
      { worker: "(단위 시험)", suite: "pytest", n: 431, min: 0, dev: 1, base: 1, holdout: null, ci: 0, new_wrong: [], new_right: 0, critical: 0, state: "unit", usd: 0 },
    ],
    gates: G4("warn", "분류가 측정 부족 — eval-skip 이유를 남기고 통과", "fail", "배포 뒤 5시간: 분류 '모름' 18% → 31% (빨강)"),
    post: {
      state: "red", hours: 5, worker: "classifier",
      metrics: [
        { side: "적재", name: "분류 '모름' 비율", base: "18%", now: "31%", sample: "분류 240명", red: true },
        { side: "적재", name: "새 인물 중 개인 크리에이터", base: "77%", now: "74%", sample: "새 인물 51명", red: false },
        { side: "적재", name: "수집 실패율", base: "0.3%", now: "0.2%", sample: "작업 480", red: false },
        { side: "검색", name: "👎 비율", base: "8%", now: "—", sample: "검색 2건(5건 모자람)", red: false },
        { side: "검색", name: "판정 '확인 못 함'", base: "12%", now: "11%", sample: "판정 64", red: false },
      ],
    },
    ci_usd: 0.003,
  },
  {
    id: "9a41c0de", git: "a90f2d1", message: "판정: 단점 신호 낱말을 프롬프트에 더함",
    at: ago(60 * 27), baseline: false, deployed: false, current: false, gate: "blocked",
    changed: [{ worker: "verifier", files: ["agent/agents/verifier/prompt.py"] }],
    evals: [
      {
        worker: "verifier", suite: "eval-verify", n: 75, min: 75, dev: 0.81, base: 0.86, holdout: 0.8, ci: 0.04, new_right: 1, critical: 0, state: "blocked", usd: 0.11,
        new_wrong: [
          { id: "v12", label: "김○○(@mock_brew) × ‘제품 단점도 말하는’", expected: "미충족 — 광고 문구뿐", got: "충족 — ‘호불호’ 낱말만 보고 판정", trace_url: LS },
          { id: "v31", label: "이○○(@mock_dripbar) × ‘제품 단점도 말하는’", expected: "판단 불가 — 글 4개", got: "충족", trace_url: LS },
          { id: "v40", label: "박○○(@mock_cafe.day) × ‘협업 안 한’", expected: "충족", got: "확인 못 함", trace_url: LS },
          { id: "v44", label: "최○○(@mock_latte) × ‘제품 단점도 말하는’", expected: "미충족", got: "충족", trace_url: LS },
          { id: "v58", label: "정○○(@mock_beanlog) × ‘국내’", expected: "충족", got: "확인 못 함", trace_url: LS },
          { id: "v71", label: "윤○○(@mock_moka) × ‘제품 단점도 말하는’", expected: "미충족", got: "충족", trace_url: LS },
        ],
      },
    ],
    gates: G4("fail", "판정 86% → 81% (▼5%p · 범위 ±4) · 새로 틀림 6 · 새로 맞음 1", "na", "배포하지 않음"),
    ci_usd: 0.11,
  },
  {
    id: "3b91d0e2", git: "5c2d9e8", message: "뽑기: 캡션 @계정 → 스노볼 후보 · 협찬 글의 @은 브랜드로",
    at: ago(60 * 74), baseline: true, deployed: true, current: false, gate: "pass",
    changed: [{ worker: "extractor", files: ["agent/agents/extractor/__init__.py", "agentops/eval/fixtures/snowball.yaml"] }],
    evals: [
      { worker: "extractor", suite: "eval-extract", n: 100, min: 100, dev: 1, base: 0.97, holdout: 1, ci: 0.02, new_wrong: [], new_right: 3, critical: 0, state: "pass", usd: 0 },
    ],
    gates: G4("pass", "뽑기 100/100 (▲3) · 치명 0", "pass", "24시간 확인 통과 → 기준 버전"),
    post: {
      state: "green", hours: 24,
      metrics: [
        { side: "적재", name: "스노볼 후보 중 개인 크리에이터", base: "—", now: "63%", sample: "새 인물 412명", red: false },
        { side: "적재", name: "수집 실패율", base: "0.4%", now: "0.3%", sample: "작업 2,210", red: false },
        { side: "검색", name: "👎 비율", base: "9%", now: "8%", sample: "검색 11건", red: false },
      ],
    },
    ci_usd: 0,
  },
];

// ── 개요 ────────────────────────────────────────────────────────────────────
export const overviewV4: OverviewV4 = {
  alert: { build: "7c2e1a9f", title: "배포 뒤 확인 — 분류 '모름' 비율 18% → 31%", detail: "배포 5시간째 · 분류 240명 기준. 이 빌드는 분류 골든셋이 모자라 eval-skip으로 나갔습니다.", worker: "classifier" },
  build: { current: "7c2e1a9f", baseline: "3b91d0e2", gate: "통과 (eval-skip 1)", deployed_ago: "5시간 전" },
  ingest: { today: 143, target: 200, fresh: 0.94, month_usd: 1.18, blocked: 0 },
  search: { n24: 6, p95_s: 84, usd_avg: 0.04, thumbs_down: 1, db_fill: 0.67 },
  reds: [
    { kind: "배포 뒤", label: "분류(classifier) — '모름' 비율 상승", href: "/ops/release" },
    { kind: "막힌 빌드", label: "9a41c0de 판정 하락 5%p — 배포되지 않음", href: "/ops/release" },
    { kind: "쿼터", label: "인스타 이번 시간 71/100", href: "/catalog/ingest" },
  ],
};

// ── 추적 › 적재 — 실행 ing_231 ──────────────────────────────────────────────
export const ingestTrace: IngestTraceRun = {
  id: "ing_231", started_at: ago(53), minutes: 47, build: "7c2e1a9f", stopped: "마감 5분 전", new_people: 9, usd: 0.006,
  nodes: [
    { id: "plan", ko: "계획", done: 1, failed: 0, later: 0 },
    { id: "seed", ko: "씨앗", done: 4, failed: 0, later: 0 },
    { id: "collect", ko: "수집 · 뽑기", done: 58, failed: 1, later: 3 },
    { id: "classify", ko: "분류", done: 20, failed: 0, later: 0 },
    { id: "enrich", ko: "웹 보강", done: 13, failed: 1, later: 0 },
  ],
  jobs: [
    { id: "j_88213", kind: "enrich.person", key: "p_1532", node: "enrich", person: "카페민 @cafe.min", result: "retry", ms: 4120, note: "네이버 429 → 카카오 0건 · 1시간 뒤 다시", trace_url: LS,
      calls: [
        { at: "13:41:02", who: "web-enricher", tool: "web_search", args: "\"카페민\" 인터뷰 (naver)", status: "429", ms: 310, note: "호출 한도" },
        { at: "13:41:02", who: "gateway", tool: "web_search", args: "\"카페민\" 인터뷰 (kakao)", status: "200 · 0건", ms: 540 },
        { at: "13:41:03", who: "web-enricher", tool: "web_search", args: "cafe.min 협업 문의 (kakao)", status: "200 · 0건", ms: 610 },
        { at: "13:41:06", who: "overseer", tool: "O8", args: "naver 6시간 막음", status: "기록", ms: 0 },
      ] },
    { id: "j_88190", kind: "collect.youtube", key: "UC_mock_ride77", node: "collect", result: "failed", ms: 920, note: "채널 404 — 3번째 실패 → 후보 닫음", trace_url: LS,
      calls: [{ at: "13:22:40", who: "collector", tool: "youtube_channel", args: "UC_mock_ride77 (3유닛)", status: "404", ms: 920, note: "채널이 삭제됨" }] },
    { id: "j_88177", kind: "collect.instagram", key: "cafe_min", node: "collect", person: "@cafe_min(후보 · 스노볼)", result: "done", ms: 780, note: "조회 안 됨(개인 계정) → 인물을 만들지 않고 90일 뒤 다시(D46)", trace_url: LS,
      calls: [{ at: "13:18:11", who: "collector", tool: "instagram_profile", args: "cafe_min", status: "400 Invalid user id", ms: 780 }] },
    { id: "j_88150", kind: "collect.instagram", key: "mock_brew", node: "collect", person: "김○○ @mock_brew", result: "done", ms: 1310, note: "갱신 — 게시물 25 · 스노볼 후보 3개 · 협찬 1건", trace_url: LS,
      calls: [
        { at: "13:12:07", who: "collector", tool: "instagram_profile", args: "mock_brew", status: "200 · 게시물 25", ms: 1010 },
        { at: "13:12:08", who: "extractor", tool: "(정규식)", args: "캡션 25개", status: "@계정 5 → 후보 3 · 브랜드 2", ms: 12 },
      ] },
    { id: "j_88141", kind: "classify.profile", key: "20명 묶음", node: "classify", result: "done", ms: 6200, note: "개인 크리에이터 13 · 매장 4 · 브랜드 1 · 모름 2 · 분야 제안 '클라이밍' 1", trace_url: LS,
      calls: [{ at: "13:09:30", who: "classifier", tool: "llm (gpt-4.1-nano)", args: "20명 · 입력 44,810 토큰", status: "200", ms: 6100, note: "$0.0049" }] },
  ],
};

// ── 추적 › 검색 › 인물의 길 (검색 m_mock_short) ─────────────────────────────
export const personPaths: PersonPath[] = [
  {
    handle: "@mock_dripbar", name: "드립바 한○○", outcome: "결과에 듦 — DB에서 찾음 · 판정 2개 재사용",
    nodes: [
      { id: "retrieve", ko: "DB에서 거르기", state: "pass", note: "홈카페 · 인스타 · 팔로워 4.2만 · 90일 안 활동" },
      { id: "measure", ko: "코드로 재기", state: "pass", note: "협찬 표시 · 커피 브랜드 90일 0건" },
      { id: "research_db", ko: "조건 판정", state: "reuse", note: "‘단점도 말하는’ 재사용(9일 전) · 나머지 새로" },
      { id: "judge", ko: "총괄 판단", state: "pass", note: "참고 조건 충족 2 · 순위 3" },
      { id: "finalize", ko: "재확인 · 저장", state: "pass", note: "정보 3일 전 — 재조회 안 함" },
    ],
    checks: [
      { phrase: "팔로워 1만~20만", verdict: "pass", how: "DB", evidence: "인스타 42,180 (3일 전)" },
      { phrase: "최근 커피 브랜드 협업 안 한", verdict: "pass", how: "코드", evidence: "협찬 표시 글 90일 0건" },
      { phrase: "제품 단점도 말하는", verdict: "pass", how: "재사용", evidence: "게시물 2건 ‘아쉬운 점은…’ (판정 9일 전 · 같은 빌드 조건)", trace_url: LS, call: "원래 판정한 검색 m_mock_0921" },
    ],
  },
  {
    handle: "@mock_latte", name: "라떼 최○○", outcome: "탈락 — 조건 판정에서 ‘단점도 말하는’ 미충족",
    nodes: [
      { id: "retrieve", ko: "DB에서 거르기", state: "pass", note: "홈카페 · 팔로워 11만" },
      { id: "measure", ko: "코드로 재기", state: "pass", note: "커피 브랜드 90일 0건" },
      { id: "research_db", ko: "조건 판정", state: "drop", note: "필수 ‘단점도 말하는’ fail → 나머지 건너뜀(D37)" },
      { id: "judge", ko: "총괄 판단", state: "skip", note: "" },
      { id: "finalize", ko: "재확인 · 저장", state: "skip", note: "판정은 저장 — 다음 검색에서 재사용" },
    ],
    checks: [
      { phrase: "팔로워 1만~20만", verdict: "pass", how: "DB", evidence: "인스타 110,420" },
      { phrase: "제품 단점도 말하는", verdict: "fail", how: "LLM 판정", evidence: "제품 소개 글 11개 읽음 · 아쉬운 점 신호 0건", trace_url: LS, call: "verifier · 단계 6 · 입력 18,420 토큰 · $0.0021" },
    ],
  },
  {
    handle: "@mock_cafe.day", name: "카페데이 박○○", outcome: "탈락 — 코드로 재기에서 협찬 조건",
    nodes: [
      { id: "retrieve", ko: "DB에서 거르기", state: "pass", note: "홈카페 · 팔로워 2.8만" },
      { id: "measure", ko: "코드로 재기", state: "drop", note: "커피 브랜드 협찬 표시 글 2건(41일 전 · 63일 전)" },
      { id: "research_db", ko: "조건 판정", state: "skip", note: "LLM 판정 안 함 — 돈 0" },
      { id: "judge", ko: "총괄 판단", state: "skip", note: "" },
      { id: "finalize", ko: "재확인 · 저장", state: "skip", note: "" },
    ],
    checks: [
      { phrase: "최근 커피 브랜드 협업 안 한", verdict: "fail", how: "코드", evidence: "#광고 @mock_beans (41일 전) · #협찬 @mock_capsule (63일 전)" },
    ],
  },
];

// ── 관측 › 비용 ─────────────────────────────────────────────────────────────
export const costV4: CostV4 = {
  month: [
    { k: "적재 AI(분류 · 낱말 넓히기)", usd: 1.18, cap: 10, note: "하루 약 $0.05" },
    { k: "검색 AI(판정 · 조건 설계)", usd: 2.41, note: "검색 58건 · 건당 $0.04" },
    { k: "버튼 검색(실시간)", usd: 0.62, note: "2건" },
    { k: "CI 채점", usd: 0.21, cap: 10, note: "채점 9회 · eval-skip 1" },
    { k: "유료 웹 검색", usd: 0, note: "네이버 · 카카오만 씀" },
  ],
  langsmith: { traces: 301, cap: 5000, by: [{ k: "적재 실행", n: 232 }, { k: "검색", n: 60 }, { k: "채점", n: 9 }] },
  ci: { runs: 9, usd: 0.21, cap: 10, skipped: 1 },
};
