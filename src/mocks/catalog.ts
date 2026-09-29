/**
 * 인물 DB 목업 — 실제 /api/catalog/* 응답과 같은 모양(src/types/catalog.ts).
 * ★ 인물 · 브랜드는 모두 지어낸 예시다. 링크는 example.com 으로 막아 두었다.
 * 기준 시각은 2026-09-29 (목업 화면이 날마다 달라지지 않게 고정).
 */
import type {
  AccountType, Activity, BrandDeal, CatalogAccount, CatalogPlatform, Contact, ContactState, Freshness,
  HistoryItem, IngestStatus, Mention, PeoplePage, PeopleQuery, Person, PersonSummary, VerdictRecord,
} from "@/types/catalog";

const NOW = Date.parse("2026-09-29T09:00:00+09:00");
const DAY = 86_400_000;
const ago = (d: number, h = 0) => new Date(NOW - d * DAY - h * 3_600_000).toISOString();

interface Seed {
  id: string; name: string; handle: string; hue: number; topics: string[]; type: AccountType;
  ig?: number | null;           // null = 인스타 조회 불가(개인 계정 · 없는 계정)
  yt?: number; blog?: boolean;
  posts30: number; sp90: number; brands?: string[]; contact: boolean; refreshed: number;
  review?: boolean; summary: string; primary?: CatalogPlatform;
  extIg?: { handle: string; url: string; label: string };   // 연락처 찾기가 외부 글에서 찾은 인스타 (D24)
  hidden?: boolean;                                        // 삭제 요청으로 숨김 (D26)
}

const SEEDS: Seed[] = [
  // ── 홈카페 ─────────────────────────────────────────────
  { id: "p01", name: "브루다이어리", handle: "brew.diary", hue: 25, topics: ["홈카페", "핸드드립"], type: "creator", ig: 48200, yt: 12400, blog: true, posts30: 9, sp90: 0, contact: true, refreshed: 2, summary: "핸드드립 · 원두 리뷰 위주. 원두마다 산미 · 쓴맛 같은 아쉬운 점을 따로 적는다." },
  { id: "p02", name: "라떼노트", handle: "latte.note", hue: 200, topics: ["홈카페", "라떼아트"], type: "creator", ig: 132000, posts30: 14, sp90: 3, brands: ["캡슐랩", "모모로스터스"], contact: true, refreshed: 5, summary: "라떼아트 영상과 캡슐 머신 레시피. 최근 커피 머신 협찬이 잦다." },
  { id: "p03", name: "모카포트일기", handle: "mokapot_days", hue: 40, topics: ["홈카페"], type: "creator", ig: 23800, blog: true, posts30: 6, sp90: 1, brands: ["모모로스터스"], contact: false, refreshed: 9, summary: "모카포트 한 가지로 만드는 아침 커피 기록. 블로그에 긴 후기를 쓴다." },
  { id: "p04", name: "원두상자", handle: "beanbox.kr", hue: 90, topics: ["홈카페", "원두 리뷰"], type: "creator", ig: 71500, yt: 3100, posts30: 11, sp90: 0, contact: true, refreshed: 1, summary: "매주 원두 3종을 블라인드로 비교한다. 별점과 단점을 함께 적는다." },
  { id: "p05", name: "드립하는곰", handle: "drip.bear", hue: 150, topics: ["홈카페", "핸드드립"], type: "creator", ig: 15600, posts30: 4, sp90: 0, contact: false, refreshed: 16, summary: "드립 도구 사용기. 이름을 확정하지 못해 웹 언급은 없다." },
  { id: "p06", name: "새벽커피", handle: "dawn.coffee", hue: 260, topics: ["홈카페", "브이로그"], type: "creator", ig: null, yt: 45800, posts30: 5, sp90: 2, brands: ["커피공방 하루"], contact: true, refreshed: 3, summary: "새벽 홈카페 브이로그 유튜버. 인스타는 개인 계정이라 지표를 볼 수 없다.", primary: "youtube" },
  { id: "p07", name: "홈바리스타J", handle: "homebarista.j", hue: 330, topics: ["홈카페", "라떼아트"], type: "creator", ig: 9800, posts30: 8, sp90: 0, contact: false, refreshed: 4, summary: "라떼아트 연습 기록. 팔로워는 적지만 반응이 높다." },
  { id: "p08", name: "로스터리 온도", handle: "ondo.roastery", hue: 10, topics: ["홈카페"], type: "store", ig: 21000, posts30: 20, sp90: 0, contact: true, refreshed: 6, summary: "원두를 파는 로스터리 매장 계정. 검색 후보에서 빠진다." },
  { id: "p09", name: "캡슐랩 공식", handle: "capsulelab.official", hue: 0, topics: ["홈카페"], type: "brand", ig: 88000, posts30: 25, sp90: 0, contact: true, refreshed: 6, summary: "커피 머신 브랜드 공식 계정. 검색 후보에서 빠진다." },
  { id: "p10", name: "커피한잔요", handle: "coffee_yo", hue: 60, topics: ["홈카페"], type: "creator", ig: 186000, yt: 67000, posts30: 12, sp90: 5, brands: ["캡슐랩", "머그온"], contact: true, refreshed: 11, review: true, summary: "홈카페 레시피 · 도구 추천. 유튜브 채널이 같은 사람인지 확인이 필요하다." },
  { id: "p25", name: "필터노트", handle: "filter.note", hue: 110, topics: ["홈카페", "핸드드립"], type: "creator", ig: 31000, posts30: 7, sp90: 0, contact: true, refreshed: 3, summary: "필터 · 드리퍼 비교. '추출이 느리다' 같은 단점을 표로 정리한다." },
  { id: "p26", name: "커피일지", handle: "coffee.ilji", hue: 170, topics: ["홈카페"], type: "creator", ig: 12500, blog: true, posts30: 5, sp90: 0, contact: false, refreshed: 8, summary: "동네 원두를 사서 집에서 내려 본 기록." },
  { id: "p27", name: "핸드드립연구", handle: "handdrip.lab", hue: 190, topics: ["홈카페", "핸드드립"], type: "creator", ig: 64000, yt: 5200, posts30: 6, sp90: 0, contact: true, refreshed: 2, summary: "추출 변수 실험. 그라인더 · 드리퍼의 단점을 실험 결과로 보여 준다." },
  { id: "p28", name: "우유거품", handle: "milk.foam", hue: 300, topics: ["홈카페", "라떼아트"], type: "creator", ig: 27400, posts30: 9, sp90: 0, contact: true, refreshed: 7, summary: "스팀 우유 · 라떼아트 도구 리뷰." },
  // ── IT 리뷰 ────────────────────────────────────────────
  { id: "p11", name: "테크한입", handle: "techhanip", hue: 215, topics: ["IT 리뷰", "스마트폰"], type: "creator", yt: 312000, ig: 41000, posts30: 6, sp90: 4, brands: ["루멘폰", "소닉버드"], contact: true, refreshed: 2, summary: "스마트폰 · 이어폰 비교 영상. 협찬 영상에는 유료 광고 표시를 단다.", primary: "youtube" },
  { id: "p12", name: "가젯로그", handle: "gadgetlog", hue: 230, topics: ["IT 리뷰", "가전"], type: "creator", yt: 128000, posts30: 5, sp90: 2, brands: ["아크북"], contact: true, refreshed: 7, summary: "생활 가전과 노트북 장기 사용기. 인스타는 연락처 찾기가 검색 결과 요약에서 찾았다.", primary: "youtube", extIg: { handle: "gadget.log", url: "https://example.com/search?q=가젯로그+나무위키", label: "검색 결과 요약(나무위키) — 유튜브 채널 주소가 함께 적힘" } },
  { id: "p13", name: "리뷰하는개발자", handle: "dev.reviews", hue: 245, topics: ["IT 리뷰", "노트북"], type: "creator", yt: 54000, ig: 8700, blog: true, posts30: 4, sp90: 0, contact: true, refreshed: 3, summary: "개발자 시선의 노트북 · 모니터 리뷰. 블로그에 벤치마크를 올린다.", primary: "youtube" },
  { id: "p14", name: "폰비교소", handle: "phone.compare", hue: 205, topics: ["IT 리뷰", "스마트폰"], type: "creator", yt: 89000, posts30: 8, sp90: 1, brands: ["루멘폰"], contact: false, refreshed: 20, summary: "카메라 · 배터리 비교 전문 채널.", primary: "youtube" },
  { id: "p15", name: "언박싱민", handle: "unboxing.min", hue: 180, topics: ["IT 리뷰"], type: "creator", ig: 26000, yt: 17000, posts30: 10, sp90: 6, brands: ["소닉버드", "아크북", "루멘폰"], contact: true, refreshed: 1, summary: "신제품 언박싱. 협찬 비중이 높다." },
  { id: "p16", name: "칩셋연구소", handle: "chipset.lab", hue: 240, topics: ["IT 리뷰", "PC"], type: "creator", yt: 205000, posts30: 3, sp90: 0, contact: true, refreshed: 5, summary: "PC 부품 · 칩셋 성능 분석.", primary: "youtube", extIg: { handle: "chipset.lab", url: "https://example.com/news/chipset-interview", label: "기사 — 유튜브 채널 주소가 함께 적힘" } },
  { id: "p17", name: "테크매거진 오늘", handle: "techmag.today", hue: 220, topics: ["IT 리뷰"], type: "media", yt: 150000, ig: 60000, posts30: 40, sp90: 3, brands: ["루멘폰"], contact: true, refreshed: 4, summary: "IT 매체 계정. 검색 후보에서 빠진다.", primary: "youtube" },
  { id: "p18", name: "가전상점 하이", handle: "hi.appliance", hue: 195, topics: ["IT 리뷰", "가전"], type: "store", ig: 12000, posts30: 15, sp90: 0, contact: true, refreshed: 9, summary: "가전 판매점 계정. 검색 후보에서 빠진다." },
  // ── 패션 ───────────────────────────────────────────────
  { id: "p19", name: "데일리룩수", handle: "dailylook.su", hue: 340, topics: ["패션", "데일리룩"], type: "creator", ig: 97000, posts30: 18, sp90: 7, brands: ["무드앤코", "라인드"], contact: true, refreshed: 4, summary: "출근 데일리룩. 브랜드 협찬 게시물이 꾸준하다." },
  { id: "p20", name: "빈티지하루", handle: "vintage.haru", hue: 20, topics: ["패션", "빈티지"], type: "creator", ig: 34000, yt: 8900, blog: true, posts30: 9, sp90: 1, brands: ["오브제웨어"], contact: true, refreshed: 8, summary: "빈티지 쇼핑 · 수선 기록." },
  { id: "p21", name: "미니멀옷장", handle: "minimal.closet", hue: 0, topics: ["패션", "미니멀"], type: "creator", ig: 58000, posts30: 7, sp90: 0, contact: false, refreshed: 2, summary: "옷 30벌로 사계절 나기.", hidden: true },
  { id: "p22", name: "스트릿지니", handle: "street.jini", hue: 280, topics: ["패션", "스트릿"], type: "creator", ig: null, yt: 23000, posts30: 6, sp90: 2, brands: ["라인드"], contact: true, refreshed: 13, summary: "스트릿 패션 하울 유튜버.", primary: "youtube" },
  { id: "p23", name: "오늘의코디", handle: "today.codi", hue: 350, topics: ["패션"], type: "creator", ig: 143000, posts30: 21, sp90: 9, brands: ["무드앤코", "오브제웨어", "라인드"], contact: true, refreshed: 31, summary: "코디 추천 · 세일 정보. 정보가 30일 넘게 갱신되지 않았다." },
  { id: "p24", name: "룩북하우스", handle: "lookbook.house", hue: 320, topics: ["패션"], type: "media", ig: 76000, posts30: 30, sp90: 4, brands: ["무드앤코"], contact: true, refreshed: 6, summary: "룩북 큐레이션 매체 계정. 검색 후보에서 빠진다." },
  // ── 최근 적재로 새로 들어온 사람 ─────────────────────────────
  { id: "p29", name: "커피랩노트", handle: "coffeelab.note", hue: 130, topics: ["홈카페"], type: "creator", ig: 19400, posts30: 6, sp90: 0, contact: false, refreshed: 1, summary: "원두 · 추출 실험 노트. 어제 적재로 새로 들어왔다." },
  { id: "p30", name: "필터커피 한잔", handle: "filter.hanjan", hue: 70, topics: ["홈카페", "핸드드립"], type: "creator", ig: 42800, posts30: 8, sp90: 0, contact: true, refreshed: 1, summary: "필터커피 레시피. 어제 적재로 새로 들어왔다." },
];

const BRAND_CAT: Record<string, string> = {
  "캡슐랩": "커피 머신", "모모로스터스": "원두", "커피공방 하루": "원두", "머그온": "커피 도구",
  "루멘폰": "스마트폰", "소닉버드": "이어폰", "아크북": "노트북",
  "무드앤코": "의류", "라인드": "의류", "오브제웨어": "잡화",
};

const TEXTS: Record<string, string[]> = {
  "홈카페": [
    "에티오피아 원두 핸드드립. 산미가 꽤 강해서 호불호는 갈릴 듯해요",
    "모카포트로 아침 라떼 — 우유는 60도 정도가 제일 달았어요",
    "새 그라인더 2주 사용기. 분쇄는 고른데 소음이 아쉬움",
    "라떼아트 하트 연습 7일차",
    "드리퍼 3종 비교 — 추출 속도 · 맛 · 설거지",
    "디카페인 원두 블라인드 테스트, 바디감이 약한 게 단점",
  ],
  "IT 리뷰": [
    "스마트폰 카메라 야간 비교 — 노이즈는 여전히 아쉽다",
    "20만원대 무선 이어폰 5종 비교",
    "개발자용 노트북 고르는 법 (발열 · 키감 · 포트)",
    "태블릿 필기감 비교, 펜 지연이 큰 모델은?",
    "한 달 쓰고 쓰는 배터리 후기",
  ],
  "패션": [
    "가을 출근 데일리룩 5가지",
    "빈티지 셔츠 고르는 팁 — 어깨선부터 보세요",
    "옷 30벌로 한 달 입기",
    "오버핏 코트 사이즈 비교",
    "세일 때 사도 되는 기본템",
  ],
};

const slug = (h: string) => h.replace(/[^a-z0-9]/gi, "");
const url = (plat: CatalogPlatform, h: string, tail = "") =>
  `https://example.com/${plat === "instagram" ? "ig" : plat === "youtube" ? "yt" : "blog"}/${h}${tail}`;

function freshness(days: number): Freshness {
  return days <= 14 ? "fresh" : days <= 30 ? "stale" : "expired";
}

function platformsOf(s: Seed): CatalogPlatform[] {
  const out: CatalogPlatform[] = [];
  if (s.ig !== undefined) out.push("instagram");
  if (s.yt !== undefined) out.push("youtube");
  if (s.blog) out.push("blog");
  return out;
}

function summaryOf(s: Seed): PersonSummary {
  return {
    id: s.id, name: s.name, handle: `@${s.handle}`, avatar_hue: s.hue, topics: s.topics, account_type: s.type,
    ...(s.ig !== undefined ? { instagram: { followers: s.ig, state: s.ig === null ? "unavailable" as const : "ok" as const } } : {}),
    ...(s.yt !== undefined ? { youtube: { subscribers: s.yt } } : {}),
    ...(s.blog ? { blog: true } : {}),
    last_post_at: ago(Math.max(0, s.refreshed - 1) + (s.id.charCodeAt(2) % 3)),
    posts_30d: s.posts30, sponsored_90d: s.sp90, top_brands: (s.brands ?? []).slice(0, 2), contact_state: contactStateOf(s),
    refreshed_at: ago(s.refreshed, 3), freshness: freshness(s.refreshed),
    status: s.hidden ? "hidden" : s.review ? "needs_review" : "active",
  };
}

function contactStateOf(s: Seed): ContactState {
  return s.ig !== undefined || s.extIg || s.contact ? "found" : "needs_human";
}

function accountsOf(s: Seed): CatalogAccount[] {
  const primary = s.primary ?? (s.ig !== undefined ? "instagram" : "youtube");
  const ext: CatalogAccount[] = s.extIg ? [{
    platform: "instagram", handle: `@${s.extIg.handle}`, url: url("instagram", s.extIg.handle), followers: null, posts: null,
    bio: "연락처 찾기로 이어짐 — 다음 적재에서 수집", state: "ok",
    link: { how: "web", confidence: 0.8, evidence_url: s.extIg.url, note: s.extIg.label }, fetched_at: ago(s.refreshed, 2),
  }] : [];
  return [...platformsOf(s).map((p): CatalogAccount => {
    const discovered = p === primary;
    const unsure = s.review && p === "youtube";
    return {
      platform: p,
      handle: p === "blog" ? slug(s.handle) : `@${s.handle}`,
      url: url(p, s.handle),
      followers: p === "instagram" ? (s.ig ?? null) : p === "youtube" ? (s.yt ?? null) : null,
      posts: p === "blog" ? 212 : p === "youtube" ? 180 + (s.hue % 90) : 400 + s.hue * 3,
      bio: p === "blog" ? `${s.name}의 기록` : `${s.summary.split(".")[0]}.${s.contact ? " 협업 문의 ✉" : ""}`,
      state: p === "instagram" && s.ig === null ? "unavailable" : "ok",
      link: discovered
        ? { how: "discovered", confidence: 1 }
        : unsure
          ? { how: "llm", confidence: 0.55, note: "이름 검색으로만 찾았다 — 소개 · 설명란에 서로의 링크가 없다" }
          : p === "blog"
            ? { how: "anchor", confidence: 0.9, evidence_url: url(primary, s.handle), note: `${primary === "instagram" ? "인스타" : "유튜브"} 소개란에 블로그 주소` }
            : { how: "anchor", confidence: 0.85, evidence_url: url(primary, s.handle), note: `${primary === "instagram" ? "인스타 소개란" : "유튜브 설명란"}에 ${p === "instagram" ? "인스타" : "유튜브"} 주소` },
      fetched_at: ago(s.refreshed, 3),
    };
  }), ...ext];
}

function activitiesOf(s: Seed): Activity[] {
  const texts = TEXTS[s.topics[0]] ?? TEXTS["홈카페"];
  const plats = platformsOf(s).filter((p) => !(p === "instagram" && s.ig === null));
  const n = Math.min(10, Math.max(5, Math.round(s.posts30 / 2) + 3));
  const out: Activity[] = [];
  let sponsoredLeft = Math.min(s.sp90, n - 2);
  for (let i = 0; i < n; i++) {
    const p = plats[i % Math.max(1, plats.length)] ?? "instagram";
    const kind = p === "youtube" ? "video" : p === "blog" ? "blog" : "post";
    const day = Math.round((i * 88) / n) + (s.refreshed % 3);
    const sponsored = sponsoredLeft > 0 && i % 2 === 1;
    const brand = sponsored ? (s.brands ?? [])[(i >> 1) % Math.max(1, (s.brands ?? []).length)] : undefined;
    if (sponsored) sponsoredLeft--;
    const base = texts[(i + s.hue) % texts.length];
    out.push({
      id: `${s.id}-a${i}`, platform: p, kind, url: url(p, s.handle, `/${kind}/${i + 1}`), posted_at: ago(day, i),
      text: sponsored && brand
        ? `${base} ${p === "youtube" ? `(이 영상은 ${brand}에서 제품을 제공받았습니다)` : `#광고 #${brand} 제공받아 솔직하게 써 봤어요`}`
        : base,
      likes: p === "blog" ? null : Math.round((s.ig ?? s.yt ?? 10000) * (0.02 + (i % 4) * 0.006)),
      comments: p === "blog" ? null : 20 + ((s.hue + i * 7) % 140),
      views: p === "youtube" ? Math.round((s.yt ?? 10000) * (0.3 + (i % 3) * 0.15)) : null,
      sponsored: Boolean(sponsored && brand),
      signals: sponsored && brand ? (p === "youtube" ? ["유료 광고 표시", "제공받았습니다"] : ["#광고", "제공받아"]) : [],
      brands: brand ? [brand] : [],
      ...(p === "youtube" ? { text_expires_at: ago(day - 30) } : {}),
    });
  }
  return out;
}

function dealsOf(acts: Activity[]): BrandDeal[] {
  const by = new Map<string, BrandDeal>();
  for (const a of acts.filter((x) => x.sponsored)) {
    for (const b of a.brands) {
      const d = by.get(b) ?? { brand: b, category: BRAND_CAT[b] ?? "기타", count: 0, first_seen: a.posted_at, last_seen: a.posted_at, evidence: [] };
      d.count++;
      if (a.posted_at < d.first_seen) d.first_seen = a.posted_at;
      if (a.posted_at > d.last_seen) d.last_seen = a.posted_at;
      d.evidence.push({ url: a.url, posted_at: a.posted_at, signal: a.signals[0] ?? "", platform: a.platform });
      by.set(b, d);
    }
  }
  return [...by.values()].sort((x, y) => y.last_seen.localeCompare(x.last_seen));
}

function contactsOf(s: Seed): Contact[] {
  const primary = s.primary ?? (s.ig !== undefined ? "instagram" : "youtube");
  const where = primary === "instagram" ? "인스타 소개란" : "유튜브 채널 설명";
  const out: Contact[] = [];
  if (s.ig !== undefined) out.push({ kind: "instagram", value: `@${s.handle}`, label: "DM", origin: "self", source_url: url(primary, s.handle), source_label: primary === "instagram" ? "주 계정" : `${where}의 인스타 링크`, found_at: ago(s.refreshed + 20) });
  else if (s.extIg) out.push({ kind: "instagram", value: `@${s.extIg.handle}`, label: "DM", origin: "external", source_url: s.extIg.url, source_label: s.extIg.label, found_at: ago(s.refreshed + 4) });
  if (!s.contact) return out;
  out.push({ kind: "email", value: `${slug(s.handle)}.biz@example.com`, label: "협업 문의", origin: "self", source_url: url(primary, s.handle), source_label: where, found_at: ago(s.refreshed + 20) });
  if (s.hue % 2 === 0) out.push({ kind: "link", value: `https://example.com/links/${slug(s.handle)}`, origin: "self", source_url: url(primary, s.handle), source_label: `${where} 링크`, found_at: ago(s.refreshed + 20) });
  if (s.blog) out.push({ kind: "site", value: url("blog", s.handle), label: "블로그", origin: "self", source_url: url(primary, s.handle), source_label: where, found_at: ago(s.refreshed + 20) });
  return out;
}

function mentionsOf(s: Seed): Mention[] {
  if (s.type !== "creator" || s.id === "p05") return [];
  const t = s.topics[0];
  const out: Mention[] = [
    { url: `https://example.com/news/${slug(s.handle)}`, title: `[인터뷰] ${t} 크리에이터 ${s.name} "좋은 점만 말하진 않아요"`, snippet: `인스타그램 @${s.handle} 로 활동하는 ${s.name}은 …`, kind: "언론", about: "본인 확인", date: ago(40 + (s.hue % 60)), found_at: ago(s.refreshed + 10) },
    { url: `https://example.com/blog/list-${slug(s.handle)}`, title: `${t} 계정 추천 모음 (2026)`, snippet: `… @${s.handle} — ${s.summary.split(".")[0]} …`, kind: "블로그", about: "본인 확인", date: ago(90 + (s.hue % 30)), found_at: ago(s.refreshed + 25) },
  ];
  if (s.hue % 3 === 0) out.push({ url: `https://example.com/cafe/${slug(s.handle)}`, title: `${s.name} 님 후기 보신 분?`, snippet: `${s.name} 추천으로 샀는데 …`, kind: "커뮤니티", about: "이름 일치", date: ago(20), found_at: ago(s.refreshed + 5) });
  return out;
}

const REQUESTS: Record<string, { request: string; phrases: string[] }> = {
  "홈카페": { request: "홈카페 인스타 인플루언서 중 팔로워 1만~20만, 최근 커피 브랜드 협업 안 했고 제품 단점도 말하는 사람 10명", phrases: ["최근 커피 브랜드 협업 안 했고", "제품 단점도 말하는"] },
  "IT 리뷰": { request: "IT 리뷰 유튜버 중 구독자 5만 이상, 스마트폰 비교 영상을 올리는 사람 10명", phrases: ["스마트폰 비교 영상을 올리는"] },
  "패션": { request: "20~30대 여성 패션 인플루언서, 브랜드 협찬 사례가 있는 사람 30명", phrases: ["브랜드 협찬 사례가 있는"] },
};

function verdictsOf(s: Seed, acts: Activity[]): VerdictRecord[] {
  if (s.type !== "creator") return [];
  const r = REQUESTS[s.topics[0]];
  return r.phrases.map((phrase, i) => {
    const sponsorPhrase = phrase.includes("협업 안") || phrase.includes("협찬 사례");
    const verdict: VerdictRecord["verdict"] = sponsorPhrase
      ? ((phrase.includes("안") ? s.sp90 === 0 : s.sp90 > 0) ? "pass" : "fail")
      : (s.hue + i) % 4 === 0 ? "unknown" : "pass";
    return {
      condition: phrase, verdict, links: verdict === "pass" ? acts.slice(0, 2).map((a) => a.url) : [],
      checked_at: ago(1 + (s.hue % 12)), build: "428545f7", mission_id: `m_${slug(s.handle).slice(0, 6)}${i}a1`,
      request: r.request, source: "auto",
    };
  });
}

function historyOf(s: Seed): HistoryItem[] {
  const primary = s.primary ?? (s.ig !== undefined ? "instagram" : "youtube");
  const firstDay = s.refreshed <= 1 ? 1 : s.refreshed + 24;
  const h: HistoryItem[] = [{ at: ago(firstDay, 2), by: "적재", what: `처음 수집 — '${s.topics[0]} ${primary === "instagram" ? "인스타 계정 추천" : "유튜버"}' 소개글에서`, detail: "seed-harvester" }];
  if (platformsOf(s).length > 1) h.push({ at: ago(s.refreshed + 24, -1), by: "적재", what: s.review ? "계정 연결 — 유튜브 (확신도 0.55 · 확인 필요)" : "계정 연결 — 소개 · 설명란 링크", detail: s.review ? "account-linker (검색 중 LLM)" : "anchor-linker" });
  h.push({ at: ago(s.refreshed + 23), by: "적재", what: `분류 — ${s.topics.join(" · ")} · ${TYPE_KO[s.type]}`, detail: "profile-classifier v1" });
  if (s.refreshed > 0) h.push({ at: ago(s.refreshed, 3), by: "적재", what: `갱신 — 새 게시물 ${Math.max(1, s.posts30 % 5)}개 · 팔로워 값 덮어씀`, detail: "ig-collector · yt-collector" });
  if (s.id === "p04") h.push({ at: ago(3), by: "사람", what: "분야 고침 — '원두 리뷰' 추가 (잠금)", detail: "관리자" });
  if (s.extIg) h.push({ at: ago(s.refreshed + 4), by: "적재", what: `연락처 찾기 — 인스타 @${s.extIg.handle} (외부 글 · 확신도 0.8)`, detail: "contact-finder" });
  if (!s.ig && !s.extIg && !s.contact) h.push({ at: ago(s.refreshed + 4), by: "적재", what: "연락처 찾기 — 못 찾음 → 관리자 목록", detail: "contact-finder" });
  if (s.hidden) h.push({ at: ago(1), by: "사람", what: "숨김 — 삭제 요청 (갱신 멈춤)", detail: "관리자" });
  return h.sort((a, b) => b.at.localeCompare(a.at));
}

export const TYPE_KO: Record<AccountType, string> = {
  creator: "개인 크리에이터", brand: "브랜드", store: "매장 · 판매", media: "매체", institution: "기관 · 학원", unknown: "모름",
};

export const PEOPLE: Person[] = SEEDS.map((s) => {
  const acts = activitiesOf(s);
  return {
    ...summaryOf(s), summary: s.summary, accounts: accountsOf(s), activities: acts, deals: dealsOf(acts),
    contacts: contactsOf(s), mentions: mentionsOf(s), verdicts: verdictsOf(s, acts), history: historyOf(s),
    locked: s.id === "p04" ? ["topics"] : [],
  };
});

export const DB_TOTAL = 2184;

function followersOf(p: PersonSummary): number {
  return Math.max(p.instagram?.followers ?? 0, p.youtube?.subscribers ?? 0);
}

/** 목업의 필터 — 실제로는 백엔드 SQL 이 한다(설계서 10장 retrieve와 같은 기준). all = 목업 인물 전부(고친 내용이 반영된 것) */
export function filterPeople(all: PersonSummary[], q: PeopleQuery): PeoplePage {
  const text = (q.q ?? "").trim().toLowerCase();
  let items = all.filter((p) => (q.hidden ? p.status === "hidden" : p.status !== "hidden"));
  if (text) items = items.filter((p) => p.name.toLowerCase().includes(text) || p.handle.toLowerCase().includes(text) || p.top_brands.some((b) => b.includes(text)));
  if (q.topics?.length) items = items.filter((p) => q.topics!.some((t) => p.topics.includes(t)));
  if (q.platform && q.platform !== "any") items = items.filter((p) => (q.platform === "instagram" ? p.instagram : q.platform === "youtube" ? p.youtube : p.blog));
  if (q.account_type && q.account_type !== "any") items = items.filter((p) => p.account_type === q.account_type);
  if (q.followers_min != null) items = items.filter((p) => followersOf(p) >= q.followers_min!);
  if (q.followers_max != null) items = items.filter((p) => followersOf(p) <= q.followers_max!);
  if (q.sponsor === "none_90d") items = items.filter((p) => p.sponsored_90d === 0);
  if (q.sponsor === "has_90d") items = items.filter((p) => p.sponsored_90d > 0);
  if (q.contact === "has") items = items.filter((p) => p.contact_state === "found");
  if (q.contact === "missing") items = items.filter((p) => p.contact_state === "needs_human");
  if (q.fresh_only) items = items.filter((p) => p.freshness === "fresh");
  const sort = q.sort ?? "refreshed";
  items.sort((a, b) =>
    sort === "followers" ? followersOf(b) - followersOf(a)
      : sort === "activity" ? b.posts_30d - a.posts_30d
        : sort === "sponsored" ? b.sponsored_90d - a.sponsored_90d
          : b.refreshed_at.localeCompare(a.refreshed_at));
  const topics = new Map<string, number>();
  for (const p of all) if (p.status !== "hidden") for (const t of p.topics) topics.set(t, (topics.get(t) ?? 0) + 1);
  return {
    total: DB_TOTAL, matched: items.length, items: items.slice(0, Math.min(Math.max(q.limit ?? 200, 1), 500)),
    topics: [...topics.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
  };
}

export function queryPeople(q: PeopleQuery): PeoplePage {
  return filterPeople(PEOPLE, q);
}

export function personById(id: string): Person | undefined {
  return PEOPLE.find((p) => p.id === id);
}

// ── 적재 현황 ─────────────────────────────────────────────────────────────────
export const ingestStatus: IngestStatus = {
  totals: { people: DB_TOTAL, creators: 1712, new_7d: 346, fresh_ratio: 0.91, needs_review: 38, hidden: 2, contact_missing: 41 },
  cost: { month_usd: 1.12, cap_usd: 10, today_usd: 0.06, per_person_usd: 0.0005 },
  quota: { youtube_units_today: 2140, youtube_cap: 4000, instagram_calls_hour: 64, instagram_cap_hour: 100, web_searches_today: 1880, web_cap: 3000 },
  next_run_at: "2026-09-29T10:00:00+09:00",
  topics: [
    { name: "홈카페", enabled: true, target: 1000, people: 842, creators: 655, fresh_ratio: 0.93, new_7d: 121, keywords: ["홈카페", "핸드드립", "라떼아트", "모카포트", "원두 리뷰", "캡슐커피", "홈바리스타"], queries_used: 188, yield_per_query: 2.9, last_run_at: ago(0, 1) },
    { name: "IT 리뷰", enabled: true, target: 1000, people: 796, creators: 612, fresh_ratio: 0.92, new_7d: 122, keywords: ["IT 리뷰", "스마트폰 리뷰", "노트북 추천", "이어폰 비교", "태블릿 리뷰", "가전 리뷰"], queries_used: 164, yield_per_query: 3.4, last_run_at: ago(0, 1) },
    { name: "패션", enabled: true, target: 1000, people: 546, creators: 445, fresh_ratio: 0.88, new_7d: 103, keywords: ["패션", "데일리룩", "빈티지", "미니멀룩", "스트릿"], queries_used: 201, yield_per_query: 1.6, last_run_at: ago(0, 2) },
  ],
  stages: [
    { key: "seed", label: "씨앗 수집", waiting: 12, done_24h: 48, failed_24h: 0, llm: true },
    { key: "collect", label: "계정 · 활동 수집", waiting: 164, done_24h: 612, failed_24h: 23, llm: false },
    { key: "extract", label: "연결 · 협찬 · 연락처 뽑기", waiting: 40, done_24h: 590, failed_24h: 2, llm: true },
    { key: "classify", label: "분류", waiting: 18, done_24h: 560, failed_24h: 0, llm: true },
    { key: "enrich", label: "웹 언급 · 연락처 찾기", waiting: 210, done_24h: 305, failed_24h: 9, llm: true },
    { key: "store", label: "저장 (가드)", waiting: 0, done_24h: 1204, failed_24h: 0, llm: false },
  ],
  workers: [
    { name: "seed-harvester", label: "씨앗 수집", capability: "seed.accounts", stage: "seed", does: "분야 낱말로 소개글 속 인스타 계정 · 유튜브 채널을 모은다. 쓴 검색어는 다시 쓰지 않는다", llm: "낱말 넓히기", reuses: "scout — find_instagram_accounts · expand_keywords · youtube_search · 쓴 검색어 거부", status: "active", runs_24h: 48, success_rate: 0.98, avg_usd: 0.0004 },
    { name: "ig-collector", label: "인스타 수집", capability: "collect.instagram", stage: "collect", does: "프로필 · 최근 게시물 25개. 조회 불가 계정은 30일 뒤 다시 본다", llm: "없음", reuses: "ig-researcher — instagram_profile · metrics.from_instagram", status: "active", runs_24h: 402, success_rate: 0.94, avg_usd: 0 },
    { name: "yt-collector", label: "유튜브 수집", capability: "collect.youtube", stage: "collect", does: "채널 · 최근 영상 40개 · 유료 광고 표시", llm: "없음", reuses: "yt-researcher — youtube_channel · metrics.from_youtube", status: "active", runs_24h: 188, success_rate: 0.99, avg_usd: 0 },
    { name: "blog-collector", label: "블로그 수집", capability: "collect.blog", stage: "collect", does: "소개란에 적힌 본인 네이버 블로그의 최근 글 10개", llm: "없음", reuses: "naver_blog_posts · blog_ids (D15)", status: "active", runs_24h: 96, success_rate: 0.9, avg_usd: 0 },
    { name: "anchor-linker", label: "계정 연결 (링크)", capability: "link.anchor", stage: "extract", does: "소개 · 설명란 · 링크모음에 적힌 다른 플랫폼 계정을 잇는다. 서로 가리키면 0.95 · 한쪽만 0.85", llm: "없음", reuses: "accounts_in · own_instagram · 확신도는 증거 종류로 (D32)", status: "active", runs_24h: 420, success_rate: 1, avg_usd: 0 },
    { name: "sponsor-extractor", label: "협찬 · 브랜드", capability: "extract.sponsorship", stage: "extract", does: "게시물 · 영상의 협찬 표시와 언급 브랜드를 뽑아 브랜드 이력을 만든다", llm: "배치 1회", reuses: "slots.SPONSOR 정규식 · paid_placement", status: "active", runs_24h: 590, success_rate: 0.99, avg_usd: 0.00005 },
    { name: "contact-extractor", label: "연락처", capability: "extract.contact", stage: "extract", does: "본인 계정에 적힌 인스타(DM) · 이메일 · 링크모음 · 카카오 채널 · 웹사이트", llm: "없음", reuses: "person_anchors 의 메일 처리", status: "active", runs_24h: 590, success_rate: 1, avg_usd: 0 },
    { name: "profile-classifier", label: "분류", capability: "classify.profile", stage: "classify", does: "분야 태그 · 계정 종류 · 한 줄 요약 (20명씩 한 번에)", llm: "배치 1회", reuses: "scout 주제 선별 프롬프트", status: "active", runs_24h: 28, success_rate: 1, avg_usd: 0.0011 },
    { name: "profile-classifier-v2", label: "분류 (새 버전)", capability: "classify.profile", stage: "classify", does: "새 분류 프롬프트 — 운영 결과에 섞지 않고 같은 사람에게 돌려 사람 정답과 비교한다", llm: "배치 1회", reuses: "profile-classifier", status: "shadow", runs_24h: 28, success_rate: 1, avg_usd: 0.0012 },
    { name: "web-collector", label: "웹 언급", capability: "collect.web", stage: "enrich", does: "이름 확정 · 기사 · 인터뷰 · 언급과 귀속 등급 (개인 크리에이터만)", llm: "뽑아 적기", reuses: "web-researcher 절차 · about_person (D9)", status: "active", runs_24h: 305, success_rate: 0.97, avg_usd: 0.0004 },
    { name: "contact-finder", label: "연락처 찾기", capability: "find.contact", stage: "enrich", does: "본인 계정에 인스타 · 연락처가 없는 사람만 — 검색 결과 요약(나무위키 포함) · 기사 · 블로그에서 찾고 앵커로 본인 확인", llm: "없음", reuses: "web-collector 이름 확정 · about_person (D9) · 게이트웨이 캐시", status: "active", runs_24h: 96, success_rate: 0.58, avg_usd: 0 },
  ],
  errors: [
    { at: ago(0, 1), worker: "ig-collector", target: "@sunny.cup 외 22명", title: "인스타 조회 불가 23건", why: "business_discovery 는 프로 · 크리에이터 계정만 조회된다. 개인 계정과 없는 계정은 구분되지 않는다", todo: "할 일 없음 — 30일 뒤 자동으로 다시 본다" },
    { at: ago(0, 3), worker: "web-collector", target: "@drip.bear", title: "이름 확정 실패", why: "표시 이름이 아이디와 같고, 아이디가 적힌 웹 글이 없다", todo: "웹 언급 없이 저장했다. 인물 상세에서 이름을 넣으면 다음 적재 때 다시 찾는다" },
    { at: ago(0, 5), worker: "seed-harvester", target: "패션", title: "새 계정이 줄어듦 — 검색 1회에 1.6명", why: "'패션 인스타그래머' 소개글은 대부분 이미 모았다", todo: "분야 낱말을 추가하세요 (예: 오피스룩 · 체형별 코디)" },
  ],
  runs: [
    { id: "ing_0929_09", started_at: ago(0, 0.9), minutes: 50, processed: 188, added: 41, failed: 6, usd: 0.011, stopped: "시간 끝(50분)" },
    { id: "ing_0929_08", started_at: ago(0, 1.9), minutes: 38, processed: 164, added: 35, failed: 4, usd: 0.009, stopped: "인스타 시간당 몫(100회)" },
    { id: "ing_0929_07", started_at: ago(0, 2.9), minutes: 50, processed: 201, added: 52, failed: 9, usd: 0.012, stopped: "시간 끝(50분)" },
    { id: "ing_0929_06", started_at: ago(0, 3.9), minutes: 41, processed: 171, added: 38, failed: 3, usd: 0.010, stopped: "인스타 시간당 몫(100회)" },
  ],
};
