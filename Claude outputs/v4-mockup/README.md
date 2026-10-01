# v4 목업 코드 (0930 · 승인 전)

맥 저장소에는 아직 넣지 않았다(목업 승인 전 · `4. 세션 인계` 4-1). 이 폴더는 클라우드 사본에서 바꾼 웹 파일을 **저장소와 같은 경로**로 모은 것이다.

- `src/…` — 바꾼(MOD) · 새(NEW) 파일 26개(Version 4: flow-simple.tsx 더함 · agent-flow-v4.tsx 뺌). 목업 승인 뒤 저장소의 같은 경로로 옮긴다(옛 `src/app/ops/observe/page.tsx` · `src/app/ops/trace/page.tsx`의 내용은 `src/components/ops/observe-slo.tsx` · `trace-search.tsx`로 옮겼다).
- 목업 아티팩트: https://claude.ai/artifact/7bjcucgX39eF6chJg2ipaT (Version 4 · 0930 — 에이전트 화면을 단계 상자 흐름으로 단순화 · 정확도 화면에 골든셋 설명)
- **`src/components/ops/agent-flow-v4.tsx`는 더 쓰지 않는다**(Version 3의 큰 SVG 그림) — 이 폴더에 남아 있으면 옮기지 말고 지운다. 대신 `flow-simple.tsx`.
- `_build/` — 아티팩트로 묶는 스크립트(esbuild iife · next/link · next/navigation 메모리 라우터 shim · Tailwind v4 CLI). 바로가기 해시: `#ingest` `#short` `#live` `#demo-done` `#list` `#ops` `#agents` `#trace` `#trace-ingest` `#quality` `#release` `#observe` `#cost`.
- 확인: tsc · eslint 통과 · Playwright 1280 · 400폭 가로 넘침 없음 · 콘솔 오류 없음(글꼴 요청만 샌드박스에서 막힘).
