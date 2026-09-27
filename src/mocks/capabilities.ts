/** 목업 — GET /api/v2/capabilities (rules/capabilities.yaml 의 condition_types 복사본) */
import type { Capabilities } from "@/types/v2";

export const capabilities: Capabilities = {
  condition_types: [
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
        "광고를 안 하는"
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
        "20~30대 여성",
        "현직 개발자",
        "엄마 유튜버"
      ],
      "template": "evidence('본인이 20~30대 여성', [web, ig, yt])",
      "how": "본인이 밝힌 사실 · 기사 (근거 링크 필요)"
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
      "how": "위반 근거를 찾았을 때만 탈락 (없음은 증명할 수 없다)"
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
  blocked: [],
};
