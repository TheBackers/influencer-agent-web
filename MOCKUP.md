# 화면 목업

## v3 인플루언서 DB 목업 (0929 · PRD 검사 결정 D23~D38 반영)

설계 · PRD: https://claude.ai/artifact/R9U3Fi6JwLELCj4VSwComY — 2장(사용 흐름) · 8장(인플루언서 DB) · 14장(API). 목업 코드를 1단계 개발에 그대로 썼다(D22) — `NEXT_PUBLIC_USE_MOCK`을 끄면 인플루언서 목록 · 적재 현황이 실제 `/api/catalog/*`를 부른다(0929).
Claude 앱에서 바로 보기: 아티팩트 [인플루언서 DB 목업](https://claude.ai/artifact/7bjcucgX39eF6chJg2ipaT) — 이 폴더의 웹 앱 전체(검색 · 목록 · 적재 현황 · AgentOps)를 목업 데이터로 묶은 것. 바로가기는 주소 끝 해시: `#search` · `#demo-done` · `#list` · `#person-p12` · `#missing` · `#ingest` · `#ops-agents` …
맥에서는 `npm run dev:mock` 뒤 아래 주소로 본다.

| 주소 | 장면 |
|---|---|
| `/?demo=done` | 인플루언서 검색 결과(v3 DB 검색) — 진행 단계(DB에서 거르기 · 코드로 재기 · 판정 · 재확인 · 저장) · 'DB에서 찾음' 요약(판정 재사용 · 정보 기준일) · 'DB에 26명뿐' + 적재 낱말 더하기(D25) · 필수 조건 확인 못 함 따로(D36) |
| `/catalog` | 인플루언서 목록 — 필터(분야 · 플랫폼 · 팔로워 · 계정 종류 · 협찬 90일 · 연락처 · 14일 안 갱신 · 숨긴 사람) · 표 |
| `/catalog?person=p04` | 인물 상세 패널 — 요약 · 활동 · 협찬 · 연락처 · 외부 언급 · 판정 이력 · 기록 + 정보 고치기(분야 · 계정 종류 · 연결 · 인스타 · 연락처 · 숨기기) |
| `/catalog?person=p12` | 인스타를 외부 글(검색 결과 요약)에서 찾은 사람 — 연락처 출처 '외부 글' · 계정 연결 0.8 |
| `/catalog?contact=missing` | 연락처 못 찾음 — 관리자가 채울 목록(D24) |
| `/catalog?hidden=1` | 숨긴 사람(D26) |
| `/catalog/ingest` | 적재 현황 — 타일 · 분야(켜기/끄기 · 낱말 더하기 · 분야 추가) · 적재 그래프 단계 · 워커 10개 + shadow · 오류 · 실행 |

- 검색 결과의 DB 칸은 결과에 `catalog` 요약이 있을 때만 보인다(`MissionResultDb` · 목업 `src/mocks/mission.ts`). 지금 실시간 검색(v2) 결과에는 없어서 그 화면은 그대로다.
- 인플루언서 목록 · 적재 현황은 `src/lib/api-catalog.ts`만 부른다(`api-v2.ts`의 `http`를 같이 쓴다). 목업 모드에서 고친 정보 · 더한 분야는 그 탭 안에서만 남는다.
- 타입 `src/types/catalog.ts` = 백엔드 `catalog` 스키마 · `/api/catalog/*` 응답(설계서 8 · 14장). 목업 `src/mocks/catalog.ts`의 인물은 모두 지어낸 예시(example.com).
- 파일: `src/app/catalog/`(page · ingest · layout) · `src/components/catalog/`(bits · people-table · person-drawer · person-edit · ingest-parts · search-db — 검색 결과의 DB 칸).

---

## v2 화면 목업 — 설계서 v2.1 기준

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
