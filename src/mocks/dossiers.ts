/**
 * 목업 — 도시에 30명. **전부 지어낸 예시 인물이다(실제 계정 아님).**
 * 링크는 example.com 으로 두어 실제 계정으로 가지 않게 했다.
 * 모양은 profiler 에이전트의 Dossier 출력과 같다.
 */
import type { ConditionCheck, Dossier, MediaItem, PlatformCard, WebItem, ConditionCoverage } from "@/types/v2";

const NAMES: [string, string][] = [
  ["하루의옷장", "haru.closet"], ["소담코디", "sodam_codi"], ["무드서랍", "mood.drawer"],
  ["봄결스타일", "bomgyeol.style"], ["데일리민", "daily_min.look"], ["린넨노트", "linen.note"],
  ["서울핏", "seoulfit.kr"], ["모노지수", "mono_jisu"], ["옷결", "otgyeol"],
  ["단정한하나", "danjeong.hana"], ["주말룩북", "weekend.lookbook"], ["코디일기", "codi.diary"],
  ["베이지무드", "beige_mood"], ["출근룩연구소", "office.look.lab"], ["가을소녀", "gaeul.sonyeo"],
  ["빈티지채", "vintage.chae"], ["미니멀유나", "minimal_yuna"], ["스트릿다온", "street.daon"],
  ["하객룩정리", "guest.look.note"], ["오늘뭐입지", "today.what2wear"], ["키작녀코디", "petite.codi"],
  ["니트장인", "knit.master.kr"], ["컬러풀서아", "colorful.seoa"], ["클래식유진", "classic_yujin"],
  ["룩북하윤", "lookbook.hayun"], ["데님일지", "denim.log"], ["여름빛", "summerlight.style"],
  ["가방수집가", "bag.collector.kr"], ["슈즈노트", "shoes.note"], ["캠퍼스룩", "campus.look"],
];

function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const TOPICS = ["데일리룩", "오피스룩", "하울", "룩북", "코디 추천", "가을 아우터", "니트", "데님", "슈즈", "가방", "키작녀", "미니멀"];
const BRANDS = ["브랜드 A", "브랜드 B", "브랜드 C", "브랜드 D", "브랜드 E"];

const day = (n: number) => new Date(Date.UTC(2026, 8, 27) - n * 86400000).toISOString();

function media(r: () => number, kind: "ig" | "yt", n: number, base: number, growth: number, sponsoredEvery: number): MediaItem[] {
  const out: MediaItem[] = [];
  for (let i = 0; i < n; i++) {
    const age = Math.round(i * (kind === "yt" ? 6 : 4) + r() * 3);
    const boost = age < 90 ? growth : 1;
    const v = Math.round(base * boost * (0.6 + r() * 0.8));
    const t = TOPICS[Math.floor(r() * TOPICS.length)];
    const sponsored = sponsoredEvery > 0 && i % sponsoredEvery === 2;
    out.push({
      title:
        kind === "yt"
          ? `${t} ${["모음", "추천 5가지", "일주일 코디", "하울 리뷰", "브이로그"][i % 5]}${sponsored ? " (유료 광고 포함)" : ""}`
          : `${t} 🤍 ${sponsored ? `#광고 ${BRANDS[i % BRANDS.length]} ` : ""}#데일리룩 #ootd`,
      url: kind === "yt" ? `https://example.com/yt/watch?v=mock${i}` : `https://example.com/ig/p/mock${i}`,
      date: day(age),
      views: kind === "yt" ? v : undefined,
      likes: kind === "yt" ? Math.round(v * 0.04) : v,
      comments: Math.round(v * (kind === "yt" ? 0.004 : 0.02)),
      sponsored,
    });
  }
  return out;
}

function card(platform: "instagram" | "youtube", handle: string, followers: number, r: () => number, growth: number, sponsoredEvery: number, limited = false): PlatformCard {
  const yt = platform === "youtube";
  const recent = limited ? [] : media(r, yt ? "yt" : "ig", 6, yt ? followers * 0.18 : followers * 0.012, growth, sponsoredEvery);
  const er = yt ? 8 + r() * 18 : 0.4 + r() * 1.4;
  return {
    platform,
    url: yt ? `https://example.com/yt/@${handle}` : `https://example.com/ig/${handle}`,
    handle: yt ? `@${handle.replace(/\./g, "")}` : `@${handle}`,
    followers,
    engagement_rate: limited ? 0 : Math.round(er * 10) / 10,
    engagement_known: !limited,
    engagement_basis: yt ? "최근 영상 40개 조회수 중앙값 / 구독자" : "최근 게시물 25개 (좋아요+댓글) 중앙값 / 팔로워",
    last_activity: day(Math.floor(r() * 5)),
    limited,
    identity_confidence: 0.82 + r() * 0.17,
    trend: limited
      ? { ratio: 0, basis: "개인 계정 — 게시물 조회 불가", known: false }
      : { ratio: Math.round(growth * (0.9 + r() * 0.2) * 100) / 100, basis: "최근 90일 중앙값 / 이전 90일 중앙값", known: true },
    uploads_90d: limited ? undefined : Math.round(10 + r() * 20),
    uploads_prev_90d: limited ? undefined : Math.round(8 + r() * 14),
    recent,
    source: "researcher",
  };
}

function build(i: number): Dossier {
  const [name, handle] = NAMES[i];
  const r = rng(1000 + i * 17);
  const igF = Math.round((12000 + r() * 380000) / 100) * 100;
  const ytF = Math.round((5000 + r() * 250000) / 100) * 100;
  const growth = 1.15 + r() * 1.1;
  const sponsoredEvery = i % 5 === 4 ? 0 : 3;
  const limited = i % 9 === 7;
  const ig = card("instagram", handle, igF, r, growth, sponsoredEvery, limited);
  const yt = card("youtube", handle, ytF, r, growth * (0.9 + r() * 0.3), sponsoredEvery);
  // 인스타는 account-linker 가 이은 계정 — 찾은 경로 · 근거를 보여 준다. 5명 중 1명은 확신도가 낮아 '확인 필요'
  const low = i % 5 === 2;
  if (low) ig.identity_confidence = 0.42;
  ig.needs_review = low;
  ig.link = low
    ? { how_found: `블로그 소개글의 '@${handle}' 표기 → 인스타 조회`, identity_evidence: ["같은 분야(패션) 게시물"],
        counter_evidence: ["표시 이름이 다름", "상호 링크 없음"], link_source: "https://example.com/blog/1", verified: true, lookup_note: "" }
    : { how_found: "유튜브 설명란의 'Instagram' 표기 → 인스타 조회", identity_evidence: ["본인 설명란에 적음", "최근 콘텐츠 소재 일치"],
        counter_evidence: [], link_source: yt.url, verified: true, lookup_note: "" };
  const sponsored = [...ig.recent, ...yt.recent].filter((m) => m.sponsored);
  const ageKnown = i % 3 === 0;
  const signals = ["c5a", "c5b", "c5c", "c5d"].filter((s, k) => (s === "c5b" && limited ? false : (i + k) % 4 !== 3));
  const firstSp = sponsored[0];

  const checks: ConditionCheck[] = [
    { id: "c1", verdict: "pass", evidence: "최근 캡션·제목 한글 비율 94%", source_url: yt.recent[0]?.url ?? "", source_title: yt.recent[0]?.title ?? "" },
    { id: "c2", verdict: "pass", evidence: `최근 콘텐츠 31건 중 27건이 패션(${TOPICS[i % TOPICS.length]} 중심)`, source_url: yt.recent[1]?.url ?? "", source_title: yt.recent[1]?.title ?? "" },
    { id: "c3", verdict: "pass", evidence: `유튜브 채널 소개란에 인스타 @${handle} 링크 · 이름과 최근 콘텐츠 일치 (동일인물 ${Math.round(Math.min(ig.identity_confidence, yt.identity_confidence) * 100)}%)`, source_url: yt.url, source_title: "채널 정보" },
    firstSp
      ? { id: "c4", verdict: "pass", evidence: `협찬 표시 ${sponsored.length}건 — ${firstSp.title.slice(0, 28)}`, source_url: firstSp.url, source_title: firstSp.title }
      : limited
        ? { id: "c4", verdict: "unknown", evidence: "인스타 개인 계정이라 캡션 조회 불가, 유튜브에서는 협찬 표시 없음", source_url: "", source_title: "" }
        : { id: "c4", verdict: "fail", evidence: "최근 1년 인스타·유튜브에서 협찬 표시를 찾지 못함", source_url: "", source_title: "" },
    { id: "c5", verdict: "pass", evidence: `신호 4개 중 ${signals.length}개 충족 · 유튜브 조회수 ×${yt.trend?.ratio}`, source_url: yt.recent[0]?.url ?? "", source_title: "최근 90일 영상", signals_met: signals },
    ageKnown
      ? { id: "c6", verdict: "pass", evidence: "인터뷰 기사에서 '20대 후반' 언급 · 본인 영상에서 여성으로 소개", source_url: `https://example.com/news/mock${i}`, source_title: "예시 인터뷰 기사" }
      : { id: "c6", verdict: "unknown", evidence: "여성은 확인(본인 소개), 나이는 밝힌 곳을 찾지 못함", source_url: "", source_title: "" },
  ];

  const web: WebItem[] = [
    { title: `[예시] 요즘 주목받는 패션 크리에이터 10인 — ${name}`, url: `https://example.com/news/rising${i}`, snippet: "최근 3개월 사이 데일리룩 영상 조회수가 크게 늘며…", kind: "언론", date: day(20 + i), about: "본인 확인" },
    { title: `${name} 나무위키`, url: `https://example.com/wiki/${handle}`, snippet: "패션 유튜버 겸 인스타그래머. 2021년부터 활동…", kind: "위키" },
    { title: `${name} 코디 정보 모음`, url: `https://example.com/community/${handle}`, snippet: "영상에 나온 아우터 정보 정리합니다…", kind: "커뮤니티", date: day(40 + i), about: "이름 일치" },
    { title: `${name} 링크 모음`, url: `https://example.com/links/${handle}`, snippet: "인스타 · 유튜브 · 쇼핑몰", kind: "링크모음", about: "본인 확인" },
  ];
  if (firstSp) web.push({ title: `[예시] ${BRANDS[i % BRANDS.length]}, 패션 크리에이터와 캡슐 컬렉션`, url: `https://example.com/news/collab${i}`, snippet: "협업 컬렉션 출시 소식…", kind: "언론", date: day(60 + i) });

  const pass = checks.filter((c) => c.verdict === "pass").map((c) => c.id);
  return {
    handle: `@${handle}`,
    name,
    avatar_hue: (i * 37) % 360,
    primary: "youtube",
    instagram: ig,
    youtube: yt,
    web,
    background: [
      { kind: "보도", fact: "패션 크리에이터 소개 기사에 실림(예시)", url: web[0].url, source_title: web[0].title },
      ...(firstSp ? [{ kind: "협업", fact: `${BRANDS[i % BRANDS.length]} 협업 컬렉션(예시)`, url: web[web.length - 1].url, source_title: web[web.length - 1].title }] : []),
    ],
    summary: `${TOPICS[i % TOPICS.length]}·${TOPICS[(i + 3) % TOPICS.length]} 중심의 패션 크리에이터(예시). 최근 90일 동안 유튜브는 주 2회, 인스타는 주 3~4회 올렸고 조회수 흐름이 이전 분기보다 ${Math.round((yt.trend!.ratio - 1) * 100)}% 올랐다.${firstSp ? ` 협찬 표시 콘텐츠 ${sponsored.length}건.` : ""}`,
    topics: [TOPICS[i % TOPICS.length], TOPICS[(i + 3) % TOPICS.length], TOPICS[(i + 7) % TOPICS.length]],
    checks,
    score: {
      must_pass: ["c1", "c2", "c3", "c5"].filter((x) => pass.includes(x)).length,
      must_total: 4,
      nice_pass: ["c4", "c6"].filter((x) => pass.includes(x)).length,
      nice_total: 2,
    },
    missing: [...(limited ? ["인스타 개인 계정 — 지표 비공개"] : []), ...(ageKnown ? [] : ["나이 공개 정보 없음"])],
    identity_note: "유튜브 소개란 ↔ 인스타 링크 상호 확인",
    sponsored_count: sponsored.length,
    usage: { cost_usd: Math.round((0.009 + r() * 0.008) * 1000) / 1000, tool_calls: 6 + Math.floor(r() * 6), latency_s: Math.round(14 + r() * 20) },
    run_id: `run_mock_${i}`,
  };
}

export const mockDossiers: Dossier[] = NAMES.map((_, i) => build(i)).sort((a, b) => {
  const s = (d: Dossier) => d.score.must_pass * 10 + d.score.nice_pass * 3 + (d.youtube?.trend?.ratio ?? 0);
  return s(b) - s(a);
});

function cov(id: string): [number, number, number] {
  let p = 0, f = 0, u = 0;
  for (const d of mockDossiers) {
    const v = d.checks.find((c) => c.id === id)?.verdict;
    if (v === "pass") p++; else if (v === "fail") f++; else u++;
  }
  return [p, f, u];
}

const [c4p, c4f, c4u] = cov("c4");
const [c6p, , c6u] = cov("c6");

export const mockCoverage: ConditionCoverage[] = [
  { id: "c1", label: "국내", feasibility: "direct", pass: 30, fail: 0, unknown: 0, reasons: [] },
  { id: "c2", label: "패션", feasibility: "direct", pass: 30, fail: 0, unknown: 0, reasons: [] },
  { id: "c3", label: "인스타·유튜브 둘 다", feasibility: "direct", pass: 30, fail: 0, unknown: 0, reasons: [{ label: "필수 — 미충족 후보는 발굴 단계에서 제외(41명)", count: 41 }] },
  { id: "c4", label: "협찬 사례", feasibility: "direct", pass: c4p, fail: c4f, unknown: c4u, reasons: [{ label: "인스타 개인 계정이라 캡션 조회 불가", count: c4u }] },
  { id: "c5", label: "뜨고 있는 (대체 지표)", feasibility: "proxy", pass: 30, fail: 0, unknown: 0, reasons: [{ label: "필수 — 신호 2개 미만 후보는 탈락(18명)", count: 18 }] },
  {
    id: "c6", label: "20~30대 여성", feasibility: "proxy", pass: c6p, fail: 0, unknown: c6u,
    reasons: [{ label: "나이를 밝힌 곳 없음", count: c6u }],
    suggestion: `확인률 ${Math.round((c6p / 30) * 100)}% — 다음부터 '여성'만 남기면 확인률이 약 90%로 오릅니다.`,
  },
];
