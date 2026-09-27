/**
 * 목업 — 조건 컴파일러 결과. 설계서 v2.1 4장 예시(ia-golden 1번)를 그대로 옮겼다.
 * 실제 API(`POST /api/v2/compile`)가 같은 모양을 돌려준다.
 */
import type { CompiledPlan, ConditionSpec, ConditionPatch, MissionEstimate } from "@/types/v2";

export const FASHION_REQUEST =
  "최근 3개월 동안 국내에서 뜨고 있는 20~30대 여성 패션 인플루언서를 찾아줘. 인스타와 유튜브를 둘 다 운영하고, 브랜드 협찬 사례가 있는 사람 위주로 30명 정리해줘.";

const conditions: ConditionSpec[] = [
  {
    id: "c1",
    source_phrase: "국내에서",
    intent: "한국어로 활동하는",
    kind: "metric",
    how: "최근 캡션·영상 제목의 한글 비율 60% 이상",
    expr: "hangul_ratio(ig.post.caption + yt.video.title) >= 0.6",
    weight: "must",
    polarity: "require",
    feasibility: "direct",
    why: "국내 활동 여부는 콘텐츠 언어로 가장 확실하게 드러납니다.",
    expected_coverage: 0.99,
    agents: ["ig-researcher", "yt-researcher"],
  },
  {
    id: "c2",
    source_phrase: "패션 인플루언서",
    intent: "패션 콘텐츠를 주로 올리는",
    kind: "evidence",
    how: "최근 콘텐츠 중 패션(코디·하울·스타일링) 비중이 가장 큼",
    expr: "topic_gate('패션', recent_items)",
    weight: "must",
    polarity: "require",
    feasibility: "direct",
    why: "발굴 단계의 주제 선별과 검증 단계의 콘텐츠 확인을 함께 씁니다.",
    expected_coverage: 0.96,
    agents: ["scout", "verifier"],
  },
  {
    id: "c3",
    source_phrase: "인스타와 유튜브를 둘 다 운영하고",
    intent: "인스타그램과 유튜브 계정을 모두 운영하는",
    kind: "platform",
    how: "두 계정을 모두 찾고, 같은 사람일 확률 0.8 이상",
    expr: "has_account(instagram, 0.8) and has_account(youtube, 0.8)",
    weight: "must",
    polarity: "require",
    feasibility: "direct",
    why: "소개란의 상호 링크·이름·최근 콘텐츠 일치로 동일인물을 확인합니다. 발굴은 유튜브에서 먼저 하고 연결된 인스타를 확인합니다.",
    caveat: "인스타 개인 계정은 지표를 읽을 수 없어 '지표 비공개'로 표시됩니다(계정 존재는 확인).",
    expected_coverage: 0.93,
    agents: ["scout", "ig-researcher", "yt-researcher", "profiler"],
  },
  {
    id: "c4",
    source_phrase: "브랜드 협찬 사례가 있는 사람 위주로",
    intent: "브랜드 협찬·유료 광고 콘텐츠가 있는",
    kind: "evidence",
    how: "인스타 캡션 #광고·#협찬·#유료광고·#제공 또는 유튜브 '유료 광고 포함' 표시·설명란 협찬 문구가 1건 이상",
    expr: "count(ig.post, caption~/#광고|#협찬|#유료광고|#제공/, 0..365d) + count(yt.video, paid_placement or desc~/유료 광고|협찬/, 0..365d) >= 1",
    threshold: "≥ 1건",
    weight: "nice",
    polarity: "require",
    feasibility: "direct",
    why: "'위주로'는 탈락 기준이 아니라 순위 가중치로 읽었습니다. 근거는 해당 게시물·영상 링크입니다.",
    expected_coverage: 0.88,
    agents: ["ig-researcher", "yt-researcher"],
  },
  {
    id: "c5",
    source_phrase: "최근 3개월 동안 … 뜨고 있는",
    intent: "최근 3개월 사이 반응이 커지고 있는",
    kind: "metric",
    how: "아래 신호 4개 중 2개 이상",
    expr: "any_k(2, [c5a, c5b, c5c, c5d])",
    k: 2,
    signals: [
      {
        id: "c5a",
        label: "유튜브 최근 90일 조회수 중앙값이 이전 90일의 {x}배 이상",
        expr: "ratio(median(yt.video.views, 0..90d), median(yt.video.views, 90..180d)) >= x",
        enabled: true,
        param: { name: "x", value: 1.3, min: 1.1, max: 3, step: 0.1, unit: "배" },
      },
      {
        id: "c5b",
        label: "인스타 최근 90일 반응(좋아요+댓글) 중앙값이 이전 90일의 {x}배 이상",
        expr: "ratio(median(ig.post.likes+comments, 0..90d), median(…, 90..180d)) >= x",
        enabled: true,
        param: { name: "x", value: 1.3, min: 1.1, max: 3, step: 0.1, unit: "배" },
      },
      {
        id: "c5c",
        label: "최근 90일 업로드 수가 이전 90일보다 많음",
        expr: "count(uploads, 0..90d) > count(uploads, 90..180d)",
        enabled: true,
      },
      {
        id: "c5d",
        label: "최근 90일 기사·정리글에 '라이징·주목·요즘 뜨는' 류로 언급",
        expr: "web_mentions('{이름} 라이징|주목|요즘 뜨는', 0..90d, [언론, 커뮤니티]) >= 1",
        enabled: true,
      },
    ],
    weight: "must",
    polarity: "require",
    feasibility: "proxy",
    why: "'뜨고 있다'를 조회수·반응·업로드 흐름과 최근 언급으로 대신 잽니다.",
    caveat:
      "실제 팔로워 증가율은 API가 과거 수치를 주지 않아 잴 수 없습니다. 매일 올리는 계정은 게시물 25개가 180일을 못 덮어 그 계정만 '확인 못 함'이 됩니다.",
    expected_coverage: 0.85,
    cost_delta_usd: 0.03,
    agents: ["ig-researcher", "yt-researcher", "web-researcher"],
  },
  {
    id: "c6",
    source_phrase: "20~30대 여성",
    intent: "본인이 20~30대 여성인",
    kind: "evidence",
    how: "여성: 본인 언급·프로필·기사로 확인 / 20~30대: 본인이 밝힌 나이나 기사만",
    expr: "evidence(gender:self_reference|profile|press) and evidence(age:stated|press)",
    weight: "nice",
    polarity: "require",
    feasibility: "proxy",
    why: "인플루언서 본인 조건으로 읽은 해석입니다.",
    caveat: "나이는 본인이 밝힌 경우에만 확인됩니다 — 지난 20회 실행에서 확인률 22%였습니다.",
    expected_coverage: 0.4,
    agents: ["web-researcher", "verifier"],
    interpretation_group: "g-age",
    alternatives: [
      { id: "alt-c6-gender", label: "'여성'만 남기기 (나이 조건 빼기)", feasibility: "proxy", weight: "nice" },
    ],
    chosen_alternative: null,
  },
  {
    id: "c6b",
    source_phrase: "20~30대 여성",
    intent: "팔로워층이 20~30대 여성인",
    kind: "evidence",
    how: "팔로워의 연령·성별 분포",
    expr: "audience(age, gender)",
    weight: "nice",
    polarity: "require",
    feasibility: "infeasible",
    why: "같은 표현을 팔로워층으로도 읽을 수 있어 따로 보여드립니다.",
    caveat: "다른 사람 계정의 팔로워 연령·성별은 인스타·유튜브 API로 볼 수 없습니다.",
    expected_coverage: 0,
    agents: [],
    interpretation_group: "g-age",
    alternatives: [
      { id: "alt-c6b-content", label: "'20~30대 여성 대상 콘텐츠(오피스룩·데일리룩)'로 판단", feasibility: "proxy", weight: "nice" },
      { id: "alt-c6b-self", label: "인플루언서 본인 조건(c6)으로만 판단", feasibility: "proxy", weight: "nice" },
    ],
    chosen_alternative: "drop",
    dropped: true,
  },
];

export const baseEstimate: MissionEstimate = {
  count: 30,
  candidates: 240,
  verify: 75,
  cost_usd: 0.45,
  youtube_units: 1500,
  minutes: [5, 7],
};

export const mockPlan: CompiledPlan = {
  plan_id: "pl_mock_fashion30",
  request: FASHION_REQUEST,
  topic: "패션",
  interpretation:
    "국내에서 최근 3개월 사이 반응이 커지고 있는 패션 인플루언서 중, 인스타·유튜브를 모두 운영하는 사람 30명을 찾고 협찬 사례가 있는 사람을 앞에 둡니다.",
  conditions,
  query_angles: [
    "요즘 뜨는 패션 유튜버",
    "데일리룩 코디 유튜버 인스타",
    "하울 룩북 브이로그",
    "2026 가을 코디 추천 인플루언서",
    "오피스룩 출근룩 유튜버",
    "패션 인플루언서 협찬 정리",
  ],
  scout_strategy: "‘둘 다 운영’ 조건 → 유튜브 채널 검색으로 먼저 발굴하고, 채널 소개란에서 인스타 계정을 찾습니다.",
  estimate: baseEstimate,
  validator_notes: [
    "c5: 첫 제안의 'ig.follower_history'는 카탈로그에 없는 필드라 거부 → 반응·업로드 흐름으로 재제안됨",
    "c6·c6b: 같은 표현이 두 가지로 읽혀 두 카드로 나눴습니다",
  ],
  revisions: [],
};

/** 코드 재검증 흉내 — 숫자 칸·필수/참고·대안 변경은 LLM 없이 즉시 반영된다 */
export function applyPatch(plan: CompiledPlan, cid: string, patch: ConditionPatch): CompiledPlan {
  const next: CompiledPlan = structuredClone(plan);
  const c = next.conditions.find((x) => x.id === cid);
  if (!c) return plan;
  if (patch.weight) c.weight = patch.weight;
  if (patch.k !== undefined && c.signals) {
    const on = c.signals.filter((s) => s.enabled).length;
    c.k = Math.max(1, Math.min(patch.k, on));
    c.expr = `any_k(${c.k}, [${c.signals.filter((s) => s.enabled).map((s) => s.id).join(", ")}])`;
  }
  if (patch.signal && c.signals) {
    const s = c.signals.find((x) => x.id === patch.signal!.id);
    if (s) {
      if (patch.signal.enabled !== undefined) s.enabled = patch.signal.enabled;
      if (patch.signal.value !== undefined && s.param) s.param.value = patch.signal.value;
    }
    const on = c.signals.filter((x) => x.enabled).length;
    c.k = Math.max(1, Math.min(c.k ?? 1, on));
  }
  if (patch.chosen_alternative !== undefined) {
    c.chosen_alternative = patch.chosen_alternative;
    c.dropped = patch.chosen_alternative === "drop";
  }
  if (patch.dropped !== undefined) {
    c.dropped = patch.dropped;
    if (!patch.dropped && c.chosen_alternative === "drop") c.chosen_alternative = null;
  }
  // 예상 확인률 재계산 (목업 규칙: 신호가 많고 k가 낮을수록 확인률↑, 배수가 높을수록 통과율↓)
  if (c.signals) {
    const on = c.signals.filter((s) => s.enabled);
    const strict = on.reduce((a, s) => a + (s.param ? (s.param.value - 1.3) * 0.25 : 0), 0);
    c.expected_coverage = Math.max(0.3, Math.min(0.95, 0.55 + on.length * 0.1 - (c.k ?? 1) * 0.05 - strict));
  }
  next.estimate = estimate(next);
  return next;
}

export function estimate(plan: CompiledPlan): MissionEstimate {
  const active = plan.conditions.filter((c) => !c.dropped);
  const extra = active.reduce((a, c) => a + (c.cost_delta_usd ?? 0), 0);
  const webNeeded = active.some((c) => c.agents.includes("web-researcher"));
  const cost = 0.3 + extra + (webNeeded ? 0.12 : 0);
  return { ...plan.estimate, cost_usd: Math.round(cost * 100) / 100 };
}
