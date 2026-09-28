/** 목업 — GET /api/v2/capabilities (rules/capabilities.yaml 의 condition_types 복사본) */
import type { Capabilities } from "@/types/v2";

export const capabilities: Capabilities = {
  "condition_types": [
    {
      "type": "규모",
      "code": true,
      "examples": [
        "구독자 5만 이상",
        "팔로워 1만~20만",
        "구독자 50만 이하"
      ],
      "template": "yt.channel.subscribers >= 50000",
      "how": "구독자 · 팔로워 수 (발굴 단계에서 바로 거른다)"
    },
    {
      "type": "플랫폼",
      "code": true,
      "examples": [
        "유튜버",
        "인스타그래머",
        "인스타와 유튜브 둘 다"
      ],
      "template": "has_account(instagram, 0.8) and has_account(youtube, 0.8)",
      "how": "어느 플랫폼에서 찾을지 · 둘 다 운영하는지"
    },
    {
      "type": "참여율",
      "code": true,
      "examples": [
        "참여율 3% 이상"
      ],
      "template": "engagement(instagram) >= 3",
      "how": "인스타는 (좋아요+댓글)÷팔로워, 유튜브는 조회수÷구독자"
    },
    {
      "type": "활동",
      "code": true,
      "examples": [
        "최근 3개월 안에 활동한",
        "꾸준히 올리는"
      ],
      "template": "count(uploads, 0..90d) >= 1",
      "how": "기간 안 업로드 수"
    },
    {
      "type": "인원",
      "code": true,
      "examples": [
        "10명"
      ],
      "template": "",
      "how": "찾을 인원 (예산이 인원에 비례)"
    },
    {
      "type": "분야",
      "examples": [
        "IT 리뷰",
        "패션",
        "홈카페"
      ],
      "template": "topic_gate('IT 리뷰')",
      "how": "최근 콘텐츠의 주제 — 코드가 자동으로 붙인다"
    },
    {
      "type": "콘텐츠",
      "examples": [
        "스마트폰 비교 영상을 올리는",
        "레시피 영상이 있는",
        "최근 콘텐츠에 캠핑이 나오는"
      ],
      "template": "content_count([yt, ig], '스마트폰|갤럭시|아이폰|폰', '비교|vs|차이', 0..365d) >= 1",
      "how": "제목 · 설명 · 캡션에 그 낱말이 들어간 콘텐츠가 있는가 (링크가 근거)"
    },
    {
      "type": "협찬·광고",
      "examples": [
        "협찬 사례가 있는",
        "광고를 안 하는",
        "최근 커피 브랜드 협업 안 한"
      ],
      "template": "count(ig.post, caption ~ /#광고|#협찬|#유료광고|#제공/, 0..365d) + count(yt.video, paid_placement or description ~ /유료 광고|협찬/, 0..365d) >= 1",
      "how": "인스타 광고 해시태그 · 유튜브 유료 광고 표시"
    },
    {
      "type": "성장",
      "examples": [
        "최근 뜨고 있는",
        "요즘 성장하는"
      ],
      "template": "any_k(2, [조회수 추세, 반응 추세, 업로드 추세, 최근 언급])",
      "how": "대체 지표 — 과거 팔로워 수는 API 가 주지 않는다"
    },
    {
      "type": "지역·언어",
      "examples": [
        "국내",
        "한국어로 활동하는"
      ],
      "template": "hangul_ratio(ig.post.caption + yt.video.title) >= 0.6",
      "how": "콘텐츠의 한글 비율"
    },
    {
      "type": "인물",
      "examples": [
        "여성",
        "20~30대",
        "현직 개발자",
        "엄마 유튜버",
        "대학생"
      ],
      "template": "infer('성별: 여성', [ig, yt, web])  /  infer('나이대: 20~30대', [ig, yt, web])",
      "how": "속성마다 따로 추정 — 본인 지칭(언니 · 엄마 · 여자 · 남편), 이름 · 소개, 'OO년생' · 'N살', 생활 단계(대학생 · 직장인 · 신혼 · 육아), 콘텐츠 맥락. 확실한 사실만 필요하면 evidence"
    },
    {
      "type": "성향",
      "examples": [
        "제품 단점도 말하는",
        "솔직한 리뷰를 하는",
        "내돈내산 위주",
        "정보 위주로 설명하는",
        "친근한 말투"
      ],
      "template": "evidence('제품 소개 게시물에서 아쉬운 점 · 단점을 직접 적는다', [ig, yt])  + 기준표",
      "how": "기준표(판정 기준 · 충족 신호 · 반대 신호 · 몇 건 이상)를 만들어 카드에 보여 주고, 검증 에이전트가 최근 게시물 · 영상을 읽어 그 기준대로 판정"
    },
    {
      "type": "협업·이력",
      "examples": [
        "삼성과 협업한 적 있는",
        "방송 출연한"
      ],
      "template": "evidence('삼성과 협업한 사례', [web, ig, yt])",
      "how": "기사 · 게시물 근거"
    },
    {
      "type": "평판",
      "examples": [
        "논란 없는",
        "광고만 하지 않는"
      ],
      "template": "not evidence('논란 · 사과문', [web])",
      "how": "기사 · 후기 · 본인 콘텐츠에서 기준에 해당하는 근거를 찾으면 탈락, 정해진 범위를 다 찾아도 없으면 통과"
    },
    {
      "type": "팔로워층",
      "examples": [
        "20대 여성 팔로워가 많은"
      ],
      "template": "unavailable('audience_age')",
      "how": "확인 불가 — 남의 계정 인사이트는 API 로 볼 수 없다. 대안: 그 대상을 겨냥한 콘텐츠"
    }
  ],
  "blocked": []
};
