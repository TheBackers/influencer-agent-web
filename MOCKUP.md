# v2 화면 목업 — 설계서 v2.1 기준

> 2차 개편: ui-ux-pro-max(“Minimalism & Swiss Style”, 고밀도 대시보드)와 Vercel Web Interface Guidelines 기준으로 단순화.
> 왼쪽 메뉴 셸 · 조건은 표 한 장(행을 눌러 자세히) · 진행은 한 줄 · 결과는 표 기본 · 확인률은 문제 있는 조건만 · 배지와 이모지 제거.

설계·PRD: https://claude.ai/artifact/R9U3Fi6JwLELCj4VSwComY

## 실행

```bash
npm install            # lucide-react(아이콘) 추가됨
npm run dev:mock        # 목업 데이터로 실행 → http://localhost:3000
```

바로 보고 싶은 장면이 있으면 주소 뒤에 붙인다 (목업 모드에서만 동작):

| 주소 | 장면 |
|---|---|
| `/` | 요청 입력 → 조건 만들기 → 조건 승인 → 진행 → 결과 (전체 흐름) |
| `/?demo=review` | 조건 승인 카드 |
| `/?demo=running` | 진행 (총괄 · 병렬 조사 · 판정) |
| `/?demo=done` | 조건 확인률 + 결과 30명 |
| `/?demo=detail` | 인물 상세 패널 (요약 · 인스타 · 유튜브 · 구글 · 조건 + 👍/👎) |
| `/ops` | AgentOps 개요 (게이트 판정 · 모듈 타일 · 에이전트 점수표 · 타임라인) |
| `/ops/trace` `/ops/eval` `/ops/observe` `/ops/diagnose` `/ops/gates` | 추적 · 평가 · 관측 · 진단 · 게이트 이력 |

## 구축 때 재사용하는 방법

- 화면은 `src/lib/api-v2.ts` 만 부른다. `NEXT_PUBLIC_USE_MOCK` 을 끄면 같은 컴포넌트가 실제 API를 부른다.
  실제 엔드포인트 목록은 그 파일 맨 위 주석에 있다 (구축 4단계에서 `web/app.py` 에 추가).
- 타입 `src/types/v2.ts` 는 백엔드 Pydantic 모델과 1:1 이다. 한쪽을 바꾸면 다른 쪽도 바꾼다.
- 목업 데이터 `src/mocks/*` 는 실제 응답 모양 그대로이므로, 백엔드 테스트의 기대값으로도 쓸 수 있다.
- 목업 인물 30명은 **전부 지어낸 예시**다. 링크는 example.com 으로 막아 두었다.

## 파일

```
src/types/v2.ts                 ConditionSpec · CompiledPlan · Dossier · MissionResult · Ops 타입
src/lib/api-v2.ts               목업/실제 어댑터
src/mocks/                      plan · dossiers · mission(진행 흉내) · ops
src/components/v2/              request-composer · condition-board · condition-card · mission-stepper
                                coverage-band · results-toolbar · dossier-card · dossier-table
                                dossier-drawer · feedback-bar · app-header · ui
src/components/ops/             gate-card · agent-scoreboard · charts(BarList · TrendLine · MissionTimeline) · ops-nav
src/app/page.tsx                검색 흐름
src/app/ops/*                   Ops 콘솔 6탭
```
