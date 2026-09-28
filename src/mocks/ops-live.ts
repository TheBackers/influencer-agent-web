/** 목업 — AgentOps 콘솔 (/api/ops/*). mock 모드 검색 1건을 실제 가공 코드(agentops/view.py)로 만든 결과에
 *  문제 장면(인스타 토큰 만료 · 네이버 403 · 지어낸 아이디 · 느림)을 섞었다. 인물 · 핸들은 모두 예시다.
 *  다시 만들기: 세션 스크립트 gen_mock.py (저장소 밖) */
import type { OpsCatalog, OpsFeedback, OpsHealth, OpsMissionRow, OpsMissionView, OpsTrendRow } from "@/types/v2";

export const opsMissions: OpsMissionRow[] = [
 {
  "mission_id": "m_7f3a2c91d0e4",
  "started_at": "2026-09-28T03:58:57.313+00:00",
  "request": "국내에서 뜨고 있는 IT 리뷰 유튜버 3명, 협찬 사례 있는 사람 위주로",
  "requested": 3,
  "returned": 3,
  "status": "partial",
  "cost_usd": 0.074,
  "latency_ms": 312000.0,
  "events": 148,
  "errors": 0,
  "interventions": 1,
  "failed_tasks": 0,
  "critical": 1,
  "warning": 4
 },
 {
  "mission_id": "m_2b81f0c4aa19",
  "started_at": "2026-09-28T02:41:10.000+00:00",
  "request": "홈카페 인스타 인플루언서 중 팔로워 1만~20만, 최근 커피 브랜드 협업 안 했고 제품 단점도 말하는 사람 10명",
  "requested": 10,
  "returned": 10,
  "status": "ok",
  "cost_usd": 0.21,
  "latency_ms": 198000,
  "events": 402,
  "errors": 0,
  "interventions": 1,
  "failed_tasks": 0,
  "critical": 0,
  "warning": 0
 },
 {
  "mission_id": "m_91cc03de5f72",
  "started_at": "2026-09-27T23:07:22.000+00:00",
  "request": "최근 3개월 동안 국내에서 뜨고 있는 20~30대 여성 패션 인플루언서, 인스타 · 유튜브 둘 다, 협찬 사례 위주로 30명",
  "requested": 30,
  "returned": 3,
  "status": "partial",
  "cost_usd": 0.83,
  "latency_ms": 644000,
  "events": 1210,
  "errors": 1,
  "interventions": 9,
  "failed_tasks": 5,
  "critical": 2,
  "warning": 3
 }
];

export const opsMission = {"summary": {"mission_id": "m_7f3a2c91d0e4", "request": "국내에서 뜨고 있는 IT 리뷰 유튜버 3명, 협찬 사례 있는 사람 위주로", "mode": "mock", "planned_verify": 8, "planned_candidates": 24, "verified_candidates": 7, "verify_runs": 8, "cost_by_agent_usd": 0.0, "started_at": "2026-09-28T03:58:57.313+00:00", "status": "partial", "requested": 3, "returned": 3, "passed": 3, "rejected": 5, "duration_s": 312.0, "cost_usd": 0.074, "tokens_in": 182400, "llm_calls": 0, "tool_calls": 34, "cache_hits": 16, "events": 148, "interventions": 1, "errors": 0, "env": "mock", "version": "unknown", "compile_llm_calls": 0, "fb_up": 1, "fb_down": 2, "critical": 1, "warning": 4}, "graph": {"nodes": [{"id": "plan_mission", "label": "조건 → 실행 계획", "runs": 1, "status": "ok", "detail": "조건 4 · 측정 3 · 발굴 목표 24"}, {"id": "dispatch_scout", "label": "발굴 맡기기", "runs": 1, "status": "ok", "detail": "후보 8 → 선별 7"}, {"id": "research", "label": "후보마다 조사", "runs": 7, "status": "partial", "detail": "작업 39 · 실패 0 · 부분 1"}, {"id": "review", "label": "근거 검토", "runs": 2, "status": "partial", "detail": "재조사 1명"}, {"id": "judge", "label": "통과 · 탈락", "runs": 1, "status": "ok", "detail": "통과 3"}, {"id": "finalize", "label": "결과 정리", "runs": 1, "status": "ok", "detail": "반환 3"}], "edges": [{"from": "START", "to": "plan_mission", "kind": "normal", "label": "", "count": 1, "taken": true}, {"from": "plan_mission", "to": "dispatch_scout", "kind": "normal", "label": "", "count": 1, "taken": true}, {"from": "dispatch_scout", "to": "research", "kind": "fanout", "label": "후보마다 Send", "count": 7, "taken": true}, {"from": "research", "to": "review", "kind": "normal", "label": "", "count": 1, "taken": true}, {"from": "review", "to": "research", "kind": "loop", "label": "근거 부족 → 그 조건만 재조사", "count": 1, "taken": true}, {"from": "review", "to": "judge", "kind": "normal", "label": "", "count": 1, "taken": true}, {"from": "judge", "to": "dispatch_scout", "kind": "loop", "label": "인원 부족 → 재발굴", "count": 0, "taken": false}, {"from": "judge", "to": "finalize", "kind": "normal", "label": "", "count": 1, "taken": true}, {"from": "finalize", "to": "END", "kind": "normal", "label": "", "count": 1, "taken": true}]}, "steps": [{"agent": "web-researcher", "label": "웹 조사", "runs": 7, "ok": 7, "partial": 0, "failed": 0, "skipped": 0, "p95_ms": 4158.0}, {"agent": "account-linker", "label": "계정 연결", "runs": 7, "ok": 7, "partial": 0, "failed": 0, "skipped": 0, "p95_ms": 6244.0}, {"agent": "yt-researcher", "label": "유튜브", "runs": 8, "ok": 8, "partial": 0, "failed": 0, "skipped": 0, "p95_ms": 44.0}, {"agent": "ig-researcher", "label": "인스타", "runs": 1, "ok": 0, "partial": 1, "failed": 0, "skipped": 0, "p95_ms": 420.0}, {"agent": "verifier", "label": "조건 판정", "runs": 8, "ok": 8, "partial": 0, "failed": 0, "skipped": 0, "p95_ms": 11813.0}, {"agent": "profiler", "label": "정리", "runs": 8, "ok": 8, "partial": 0, "failed": 0, "skipped": 0, "p95_ms": 6.0}], "candidates": [{"handle": "UC_mock_gadgetlab", "cells": {"ig-researcher": {"status": "partial", "ms": 420, "runs": 1, "task_ids": ["t_mock_igblock"], "llm_calls": 0, "tool_calls": 1, "errors": 1, "usd": 0.0}, "web-researcher": {"status": "ok", "ms": 4105, "runs": 1, "task_ids": ["t_0976d8fd98"], "llm_calls": 0, "tool_calls": 2, "errors": 0, "usd": 0.0}, "account-linker": {"status": "ok", "ms": 6243, "runs": 1, "task_ids": ["t_e59bc1031d"], "llm_calls": 0, "tool_calls": 1, "errors": 0, "usd": 0.0}, "yt-researcher": {"status": "ok", "ms": 44, "runs": 1, "task_ids": ["t_d256314df8"], "llm_calls": 0, "tool_calls": 1, "errors": 0, "usd": 0.0}, "verifier": {"status": "ok", "ms": 11813, "runs": 1, "task_ids": ["t_4e0e641c00"], "llm_calls": 0, "tool_calls": 2, "errors": 0, "usd": 0.0}, "profiler": {"status": "ok", "ms": 6, "runs": 1, "task_ids": ["t_2223598fea"], "llm_calls": 0, "tool_calls": 0, "errors": 0, "usd": 0.0}}, "ms": 22631, "problems": 1, "usd": 0.0, "linked": {"platform": "instagram", "id": "gadget.lab", "confidence": 0.7}, "feedback": {"score": 1, "reason": "", "reason_label": "", "condition_id": "", "comment": ""}, "verdict": "pass"}, {"handle": "UC_mock_homecafe", "cells": {"web-researcher": {"status": "ok", "ms": 4111, "runs": 1, "task_ids": ["t_e9a1ef06b1"], "llm_calls": 0, "tool_calls": 2, "errors": 0, "usd": 0.0}, "account-linker": {"status": "ok", "ms": 6213, "runs": 1, "task_ids": ["t_fa26e6d8b5"], "llm_calls": 0, "tool_calls": 1, "errors": 0, "usd": 0.0}, "yt-researcher": {"status": "ok", "ms": 1, "runs": 1, "task_ids": ["t_ca8f618cba"], "llm_calls": 0, "tool_calls": 1, "errors": 0, "usd": 0.0}, "verifier": {"status": "ok", "ms": 11802, "runs": 1, "task_ids": ["t_8eeda42743"], "llm_calls": 0, "tool_calls": 2, "errors": 0, "usd": 0.0}, "profiler": {"status": "ok", "ms": 1, "runs": 1, "task_ids": ["t_6a238471f5"], "llm_calls": 0, "tool_calls": 0, "errors": 0, "usd": 0.0}}, "ms": 22128, "problems": 1, "usd": 0.0, "feedback": {"score": 0, "reason": "wrong_condition", "reason_label": "조건 판정이 틀림", "condition_id": "c3", "comment": "최근 협찬 있는데 없다고 판정"}, "verdict": "pass"}, {"handle": "UC_mock_tiny", "cells": {"web-researcher": {"status": "ok", "ms": 4158, "runs": 1, "task_ids": ["t_8e3d8cacbe"], "llm_calls": 0, "tool_calls": 2, "errors": 0, "usd": 0.0}, "account-linker": {"status": "ok", "ms": 6234, "runs": 1, "task_ids": ["t_d218463964"], "llm_calls": 0, "tool_calls": 1, "errors": 0, "usd": 0.0}, "yt-researcher": {"status": "ok", "ms": 10, "runs": 1, "task_ids": ["t_23fa500773"], "llm_calls": 0, "tool_calls": 1, "errors": 0, "usd": 0.0}, "verifier": {"status": "ok", "ms": 11810, "runs": 1, "task_ids": ["t_0b959da433"], "llm_calls": 0, "tool_calls": 1, "errors": 0, "usd": 0.0}, "profiler": {"status": "ok", "ms": 6, "runs": 1, "task_ids": ["t_f30b48fab3"], "llm_calls": 0, "tool_calls": 0, "errors": 0, "usd": 0.0}}, "ms": 22218, "problems": 1, "usd": 0.0, "feedback": {"score": 0, "reason": "wrong_person", "reason_label": "다른 사람 · 계정 오인", "condition_id": "", "comment": "동명이인 — 다른 사람 인스타가 붙음"}, "verdict": "pass"}, {"handle": "UC_mock_bigtech", "cells": {"web-researcher": {"status": "ok", "ms": 4133, "runs": 1, "task_ids": ["t_da1b88e1ef"], "llm_calls": 0, "tool_calls": 2, "errors": 0, "usd": 0.0}, "account-linker": {"status": "ok", "ms": 6232, "runs": 1, "task_ids": ["t_29ee9f3d68"], "llm_calls": 0, "tool_calls": 1, "errors": 0, "usd": 0.0}, "yt-researcher": {"status": "ok", "ms": 9, "runs": 1, "task_ids": ["t_388b15fdbb"], "llm_calls": 0, "tool_calls": 1, "errors": 0, "usd": 0.0}, "verifier": {"status": "ok", "ms": 11807, "runs": 1, "task_ids": ["t_3bca513ea4"], "llm_calls": 0, "tool_calls": 1, "errors": 0, "usd": 0.0}, "profiler": {"status": "ok", "ms": 5, "runs": 1, "task_ids": ["t_9a788a5045"], "llm_calls": 0, "tool_calls": 0, "errors": 0, "usd": 0.0}}, "ms": 22186, "problems": 0, "usd": 0.0, "verdict": "fail"}, {"handle": "UC_mock_coffeeman", "cells": {"web-researcher": {"status": "ok", "ms": 4115, "runs": 1, "task_ids": ["t_131d1e25e2"], "llm_calls": 0, "tool_calls": 2, "errors": 0, "usd": 0.0}, "account-linker": {"status": "ok", "ms": 6234, "runs": 1, "task_ids": ["t_7340cacc3e"], "llm_calls": 0, "tool_calls": 1, "errors": 0, "usd": 0.0}, "yt-researcher": {"status": "ok", "ms": 34, "runs": 1, "task_ids": ["t_2bf5d45155"], "llm_calls": 0, "tool_calls": 1, "errors": 0, "usd": 0.0}, "verifier": {"status": "ok", "ms": 11810, "runs": 1, "task_ids": ["t_a6758e67bf"], "llm_calls": 0, "tool_calls": 1, "errors": 0, "usd": 0.0}, "profiler": {"status": "ok", "ms": 6, "runs": 1, "task_ids": ["t_eba0dc9306"], "llm_calls": 0, "tool_calls": 0, "errors": 0, "usd": 0.0}}, "ms": 22199, "problems": 0, "usd": 0.0, "verdict": "fail"}, {"handle": "UC_mock_newbie", "cells": {"web-researcher": {"status": "ok", "ms": 4150, "runs": 1, "task_ids": ["t_5b40aae4dc"], "llm_calls": 0, "tool_calls": 2, "errors": 0, "usd": 0.0}, "account-linker": {"status": "ok", "ms": 6244, "runs": 1, "task_ids": ["t_d1a38e2481"], "llm_calls": 0, "tool_calls": 1, "errors": 0, "usd": 0.0}, "yt-researcher": {"status": "ok", "ms": 10, "runs": 1, "task_ids": ["t_93230d5c9d"], "llm_calls": 0, "tool_calls": 1, "errors": 0, "usd": 0.0}, "verifier": {"status": "ok", "ms": 11811, "runs": 1, "task_ids": ["t_f039e3a43a"], "llm_calls": 0, "tool_calls": 1, "errors": 0, "usd": 0.0}, "profiler": {"status": "ok", "ms": 5, "runs": 1, "task_ids": ["t_83a26d2485"], "llm_calls": 0, "tool_calls": 0, "errors": 0, "usd": 0.0}}, "ms": 22220, "problems": 0, "usd": 0.0, "verdict": "fail"}, {"handle": "UC_mock_techmonkey", "cells": {"web-researcher": {"status": "ok", "ms": 4118, "runs": 1, "task_ids": ["t_befe4f4ecd"], "llm_calls": 0, "tool_calls": 2, "errors": 0, "usd": 0.0}, "account-linker": {"status": "ok", "ms": 6242, "runs": 1, "task_ids": ["t_7d9873236b"], "llm_calls": 0, "tool_calls": 1, "errors": 0, "usd": 0.0}, "yt-researcher": {"status": "ok", "ms": 35, "runs": 2, "task_ids": ["t_f1f76b8225", "t_e21cac8e89"], "llm_calls": 0, "tool_calls": 2, "errors": 0, "usd": 0.0}, "verifier": {"status": "ok", "ms": 23610, "runs": 2, "task_ids": ["t_9cec96e5e7", "t_8404806e39"], "llm_calls": 0, "tool_calls": 2, "errors": 0, "usd": 0.0}, "profiler": {"status": "ok", "ms": 6, "runs": 2, "task_ids": ["t_8adf00b43c", "t_2ac7e75007"], "llm_calls": 0, "tool_calls": 0, "errors": 0, "usd": 0.0}}, "ms": 34011, "problems": 0, "usd": 0.0, "verdict": "fail"}], "problems": [{"severity": "critical", "title": "O8 외부 툴 차단 — instagram_profile", "cause": "Error validating access token: Session has expired", "hint": "인스타 토큰이 만료됐습니다 — Meta 개발자 도구에서 장기 토큰을 다시 받아 IG_ACCESS_TOKEN 을 바꾸세요", "agent": "overseer", "candidates": [], "count": 1, "first_t": 0.1, "event_ids": ["evt_x139"]}, {"severity": "warning", "title": "검색 공급사 네이버 빠짐 (HTTP 403)", "cause": "권한 없음(애플리케이션에 '검색' API 추가 필요)", "hint": "그 공급사 키 · 사용 API 설정을 확인하세요. 검색은 다음 공급사로 계속됩니다", "agent": "gateway", "candidates": [], "count": 1, "first_t": 0.1, "event_ids": ["evt_x138"]}, {"severity": "warning", "title": "사람 평가 안 맞음 — 다른 사람 · 계정 오인", "cause": "동명이인 — 다른 사람 인스타가 붙음", "hint": "계정 연결이 다른 사람을 붙였을 수 있습니다 — 그 후보의 '계정 연결' 칸에서 근거 글과 확신도를 보세요", "agent": "account-linker", "candidates": ["UC_mock_tiny"], "count": 1, "first_t": 0.3, "event_ids": ["evt_x146"]}, {"severity": "warning", "title": "사람 평가 안 맞음 — 조건 판정이 틀림", "cause": "c3 · 최근 협찬 있는데 없다고 판정", "hint": "조건 판정 칸을 눌러 LLM 이 어떤 게시물로 판단했는지 보세요 — 기준표(통과 · 탈락 신호)를 고칠 곳입니다", "agent": "verifier", "candidates": ["UC_mock_homecafe"], "count": 1, "first_t": 0.3, "event_ids": ["evt_x147"]}, {"severity": "warning", "title": "느림 — 312초 (기준 240초)", "cause": "가장 오래 걸린 작업: 발굴 21초", "hint": "그 작업의 툴 호출 시간을 보세요 — 느린 검색 공급사나 긴 LLM 루프일 수 있습니다", "agent": "scout", "candidates": [], "count": 1, "first_t": null, "event_ids": []}, {"severity": "info", "title": "계정 연결 버림 — 툴 결과에 없는 아이디(지어냄)", "cause": "instagram newbie_tech_kr", "hint": "LLM 이 툴 결과에 없는 아이디를 적었거나 조회가 실패했습니다", "agent": "account-linker", "candidates": ["UC_mock_newbie"], "count": 1, "first_t": 0.1, "event_ids": ["evt_x144"]}, {"severity": "info", "title": "조건 c4 확인률 0%", "cause": "3/3명 확인 못 함 (any_k+count+ig.post+median+ratio+web_mentions+yt.video)", "hint": "근거를 찾기 어려운 조건입니다 — 조건 카드의 대안을 고르거나 기준표를 넓혀 보세요", "agent": "verifier", "candidates": [], "count": 1, "first_t": 0.3, "event_ids": ["evt_dbc5f228ee6f4259"]}], "tools": [{"tool": "web_search", "calls": 22, "cache_hits": 0, "errors": 0, "empty": 0, "avg_ms": 900, "p95_ms": 900.0, "providers": {"카카오": 22}}, {"tool": "youtube_channel", "calls": 8, "cache_hits": 16, "errors": 0, "empty": 0, "avg_ms": 1, "p95_ms": 6.0, "providers": {}}, {"tool": "instagram_profile", "calls": 3, "cache_hits": 0, "errors": 1, "empty": 0, "avg_ms": 136, "p95_ms": 410.0, "providers": {}}, {"tool": "youtube_search", "calls": 1, "cache_hits": 0, "errors": 0, "empty": 0, "avg_ms": 0, "p95_ms": 0.0, "providers": {}}], "agents": [{"agent": "verifier", "label": "조건 판정", "runs": 8, "ok": 8, "partial": 0, "failed": 0, "total_ms": 94463, "p95_ms": 11813.0, "llm_calls": 0, "tool_calls": 10, "tokens_in": 0, "usd": 0.0, "usd_per_run": 0.0}, {"agent": "account-linker", "label": "계정 연결", "runs": 7, "ok": 7, "partial": 0, "failed": 0, "total_ms": 43642, "p95_ms": 6244.0, "llm_calls": 0, "tool_calls": 7, "tokens_in": 0, "usd": 0.0, "usd_per_run": 0.0}, {"agent": "web-researcher", "label": "웹 조사", "runs": 7, "ok": 7, "partial": 0, "failed": 0, "total_ms": 28890, "p95_ms": 4158.0, "llm_calls": 0, "tool_calls": 14, "tokens_in": 0, "usd": 0.0, "usd_per_run": 0.0}, {"agent": "scout", "label": "발굴", "runs": 1, "ok": 1, "partial": 0, "failed": 0, "total_ms": 21027, "p95_ms": 21027.0, "llm_calls": 0, "tool_calls": 10, "tokens_in": 0, "usd": 0.0, "usd_per_run": 0.0}, {"agent": "ig-researcher", "label": "인스타", "runs": 1, "ok": 0, "partial": 1, "failed": 0, "total_ms": 420, "p95_ms": 420.0, "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "usd": 0.0, "usd_per_run": 0.0}, {"agent": "yt-researcher", "label": "유튜브", "runs": 8, "ok": 8, "partial": 0, "failed": 0, "total_ms": 143, "p95_ms": 44.0, "llm_calls": 0, "tool_calls": 8, "tokens_in": 0, "usd": 0.0, "usd_per_run": 0.0}, {"agent": "profiler", "label": "정리", "runs": 8, "ok": 8, "partial": 0, "failed": 0, "total_ms": 35, "p95_ms": 6.0, "llm_calls": 0, "tool_calls": 0, "tokens_in": 0, "usd": 0.0, "usd_per_run": 0.0}], "tasks": {"t_9703b3c3f9": {"task_id": "t_9703b3c3f9", "agent": "scout", "candidate": "", "status": "ok", "ms": 21027, "focus": [], "llm_calls": 0, "tool_calls": 10, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.06, "events": [{"t": 0.06, "type": "agent.started", "agent": "scout", "text": "capability=discover.candidates · focus=[] · status=active", "ms": null, "event_id": "evt_fa0e95ddb8df4d8d"}, {"t": 0.07, "type": "tool.called", "agent": "gateway", "text": "youtube_search(분야: IT 리뷰\n검색 각도: ['IT 리뷰 유튜버 추천', '요즘 뜨는 IT 리뷰 인플루언서', 'IT 리) → 8건", "ms": 0, "event_id": "evt_38657af5c4f24250"}, {"t": 0.07, "type": "tool.called", "agent": "gateway", "text": "web_search(분야: IT 리뷰\n검색 각도: ['IT 리뷰 유튜버 추천', '요즘 뜨는 IT 리뷰 인플루언서', 'IT 리) → 5건", "ms": 900, "event_id": "evt_99f1f12fd6c2415b"}, {"t": 0.07, "type": "tool.called", "agent": "gateway", "text": "youtube_channel(UC_mock_gadgetlab)", "ms": 1, "event_id": "evt_403f7e0492094be5"}, {"t": 0.08, "type": "tool.called", "agent": "gateway", "text": "youtube_channel(UC_mock_jiyeon)", "ms": 0, "event_id": "evt_178e767931b54e15"}, {"t": 0.08, "type": "tool.called", "agent": "gateway", "text": "youtube_channel(UC_mock_techmonkey)", "ms": 6, "event_id": "evt_06c4694a972145c9"}, {"t": 0.08, "type": "tool.called", "agent": "gateway", "text": "youtube_channel(UC_mock_coffeeman)", "ms": 1, "event_id": "evt_188c5310201a4c60"}, {"t": 0.08, "type": "tool.called", "agent": "gateway", "text": "youtube_channel(UC_mock_tiny)", "ms": 0, "event_id": "evt_e056512bec9c49aa"}, {"t": 0.08, "type": "tool.called", "agent": "gateway", "text": "youtube_channel(UC_mock_newbie)", "ms": 0, "event_id": "evt_548ca4ab827644c7"}, {"t": 0.08, "type": "tool.called", "agent": "gateway", "text": "youtube_channel(UC_mock_bigtech)", "ms": 3, "event_id": "evt_4c6641225b8b424e"}, {"t": 0.08, "type": "tool.called", "agent": "gateway", "text": "youtube_channel(UC_mock_homecafe)", "ms": 0, "event_id": "evt_3206fc2dcf244f0b"}, {"t": 0.09, "type": "agent.finished", "agent": "scout", "text": "ok", "ms": 21027, "event_id": "evt_f88d45199568411b"}], "capability": "discover.candidates", "note": ""}, "t_mock_igblock": {"task_id": "t_mock_igblock", "agent": "ig-researcher", "candidate": "UC_mock_gadgetlab", "status": "partial", "ms": 420, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 1, "usd": 0.0, "start": 0.08, "events": [{"t": 0.08, "type": "agent.started", "agent": "ig-researcher", "text": "capability=research.instagram · focus=[]", "ms": null, "event_id": "evt_x139"}, {"t": 0.08, "type": "tool.called", "agent": "gateway", "text": "instagram_profile(gadget.lab) · 오류: Error validating access token: Session has expired", "ms": 410, "event_id": "evt_x139"}, {"t": 0.08, "type": "overseer.intervened", "agent": "overseer", "text": "O8 외부 툴 차단 · tool=instagram_profile · error=Error validating access token: Session has expired", "ms": null, "event_id": "evt_x139"}, {"t": 0.08, "type": "agent.finished", "agent": "ig-researcher", "text": "partial · 인스타 조회 불가(토큰 만료) — 계정만 연결", "ms": 420, "event_id": "evt_x139"}], "capability": "research.instagram", "note": "인스타 조회 불가(토큰 만료) — 계정만 연결"}, "t_0976d8fd98": {"task_id": "t_0976d8fd98", "agent": "web-researcher", "candidate": "UC_mock_gadgetlab", "status": "ok", "ms": 4105, "focus": [], "llm_calls": 0, "tool_calls": 2, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.09, "events": [{"t": 0.09, "type": "agent.started", "agent": "web-researcher", "text": "capability=research.web · focus=[] · status=active", "ms": null, "event_id": "evt_472807918436410f"}, {"t": 0.09, "type": "tool.called", "agent": "gateway", "text": "web_search(가젯랩 나무위키) → 5건", "ms": 900, "event_id": "evt_4d9def0f47c44f03"}, {"t": 0.09, "type": "tool.called", "agent": "gateway", "text": "web_search(\"가젯랩\" 유튜버 인터뷰) → 5건", "ms": 900, "event_id": "evt_e20877f5fcb8494c"}, {"t": 0.1, "type": "agent.finished", "agent": "web-researcher", "text": "ok", "ms": 4105, "event_id": "evt_c06e820998ae4d6d"}], "capability": "research.web", "note": ""}, "t_befe4f4ecd": {"task_id": "t_befe4f4ecd", "agent": "web-researcher", "candidate": "UC_mock_techmonkey", "status": "ok", "ms": 4118, "focus": [], "llm_calls": 0, "tool_calls": 2, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.09, "events": [{"t": 0.09, "type": "agent.started", "agent": "web-researcher", "text": "capability=research.web · focus=[] · status=active", "ms": null, "event_id": "evt_2a1f7d0f841c4f71"}, {"t": 0.1, "type": "tool.called", "agent": "gateway", "text": "web_search(테크몽키 나무위키) → 5건", "ms": 900, "event_id": "evt_9dc3d71116c64591"}, {"t": 0.1, "type": "tool.called", "agent": "gateway", "text": "web_search(\"테크몽키\" 유튜버 인터뷰) → 5건", "ms": 900, "event_id": "evt_ba438d282a0f46d2"}, {"t": 0.11, "type": "agent.finished", "agent": "web-researcher", "text": "ok", "ms": 4118, "event_id": "evt_f2355a1a5a244225"}], "capability": "research.web", "note": ""}, "t_131d1e25e2": {"task_id": "t_131d1e25e2", "agent": "web-researcher", "candidate": "UC_mock_coffeeman", "status": "ok", "ms": 4115, "focus": [], "llm_calls": 0, "tool_calls": 2, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.1, "events": [{"t": 0.1, "type": "agent.started", "agent": "web-researcher", "text": "capability=research.web · focus=[] · status=active", "ms": null, "event_id": "evt_909e504725ee4211"}, {"t": 0.11, "type": "tool.called", "agent": "gateway", "text": "web_search(커피맨TV 나무위키) → 5건", "ms": 900, "event_id": "evt_ca62c7c31c23495e"}, {"t": 0.11, "type": "tool.called", "agent": "gateway", "text": "web_search(\"커피맨TV\" 유튜버 인터뷰) → 5건", "ms": 900, "event_id": "evt_377ea19011c545cf"}, {"t": 0.11, "type": "agent.finished", "agent": "web-researcher", "text": "ok", "ms": 4115, "event_id": "evt_cf69bf5470504bbf"}], "capability": "research.web", "note": ""}, "t_da1b88e1ef": {"task_id": "t_da1b88e1ef", "agent": "web-researcher", "candidate": "UC_mock_bigtech", "status": "ok", "ms": 4133, "focus": [], "llm_calls": 0, "tool_calls": 2, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.1, "events": [{"t": 0.1, "type": "agent.started", "agent": "web-researcher", "text": "capability=research.web · focus=[] · status=active", "ms": null, "event_id": "evt_9efa94ba6e174b52"}, {"t": 0.11, "type": "tool.called", "agent": "gateway", "text": "web_search(빅테크TV 나무위키) → 5건", "ms": 900, "event_id": "evt_2d0407359b834058"}, {"t": 0.11, "type": "tool.called", "agent": "gateway", "text": "web_search(\"빅테크TV\" 유튜버 인터뷰) → 5건", "ms": 900, "event_id": "evt_43af4d75355d4fb8"}, {"t": 0.13, "type": "agent.finished", "agent": "web-researcher", "text": "ok", "ms": 4133, "event_id": "evt_09d2a56249f54166"}], "capability": "research.web", "note": ""}, "t_e59bc1031d": {"task_id": "t_e59bc1031d", "agent": "account-linker", "candidate": "UC_mock_gadgetlab", "status": "ok", "ms": 6243, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.1, "events": [{"t": 0.1, "type": "agent.started", "agent": "account-linker", "text": "capability=research.link · focus=[] · status=active", "ms": null, "event_id": "evt_d35f62e326b149fa"}, {"t": 0.13, "type": "tool.called", "agent": "gateway", "text": "web_search(발굴한 계정: youtube · UC_mock_gadgetlab · ht) → 5건", "ms": 900, "event_id": "evt_e3ca833f6c8543fb"}, {"t": 0.14, "type": "agent.finished", "agent": "account-linker", "text": "ok", "ms": 6243, "event_id": "evt_5ff4af1d7ead435a"}], "capability": "research.link", "note": ""}, "t_8e3d8cacbe": {"task_id": "t_8e3d8cacbe", "agent": "web-researcher", "candidate": "UC_mock_tiny", "status": "ok", "ms": 4158, "focus": [], "llm_calls": 0, "tool_calls": 2, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.1, "events": [{"t": 0.1, "type": "agent.started", "agent": "web-researcher", "text": "capability=research.web · focus=[] · status=active", "ms": null, "event_id": "evt_9eb8684cecde4cd4"}, {"t": 0.11, "type": "tool.called", "agent": "gateway", "text": "web_search(작은가전채널 나무위키) → 5건", "ms": 900, "event_id": "evt_2f87f3a7e8344a0e"}, {"t": 0.13, "type": "tool.called", "agent": "gateway", "text": "web_search(\"작은가전채널\" 유튜버 인터뷰) → 5건", "ms": 900, "event_id": "evt_c1d72356b18d4930"}, {"t": 0.16, "type": "agent.finished", "agent": "web-researcher", "text": "ok", "ms": 4158, "event_id": "evt_f863b4af88df4b24"}], "capability": "research.web", "note": ""}, "t_5b40aae4dc": {"task_id": "t_5b40aae4dc", "agent": "web-researcher", "candidate": "UC_mock_newbie", "status": "ok", "ms": 4150, "focus": [], "llm_calls": 0, "tool_calls": 2, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.11, "events": [{"t": 0.11, "type": "agent.started", "agent": "web-researcher", "text": "capability=research.web · focus=[] · status=active", "ms": null, "event_id": "evt_36c551254fa84a92"}, {"t": 0.13, "type": "tool.called", "agent": "gateway", "text": "web_search(새싹리뷰 나무위키) → 5건", "ms": 900, "event_id": "evt_ff7fdf05074b47ce"}, {"t": 0.16, "type": "tool.called", "agent": "gateway", "text": "web_search(\"새싹리뷰\" 유튜버 인터뷰) → 5건", "ms": 900, "event_id": "evt_90ec0167df824325"}, {"t": 0.16, "type": "agent.finished", "agent": "web-researcher", "text": "ok", "ms": 4150, "event_id": "evt_e7073b2216584c6d"}], "capability": "research.web", "note": ""}, "t_7d9873236b": {"task_id": "t_7d9873236b", "agent": "account-linker", "candidate": "UC_mock_techmonkey", "status": "ok", "ms": 6242, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.12, "events": [{"t": 0.12, "type": "agent.started", "agent": "account-linker", "text": "capability=research.link · focus=[] · status=active", "ms": null, "event_id": "evt_141973fdf96747e3"}, {"t": 0.15, "type": "tool.called", "agent": "gateway", "text": "web_search(발굴한 계정: youtube · UC_mock_techmonkey · h) → 5건", "ms": 900, "event_id": "evt_1a889c90d0494d5f"}, {"t": 0.16, "type": "agent.finished", "agent": "account-linker", "text": "ok", "ms": 6242, "event_id": "evt_d182f2f29d32437c"}], "capability": "research.link", "note": ""}, "t_7340cacc3e": {"task_id": "t_7340cacc3e", "agent": "account-linker", "candidate": "UC_mock_coffeeman", "status": "ok", "ms": 6234, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.13, "events": [{"t": 0.13, "type": "agent.started", "agent": "account-linker", "text": "capability=research.link · focus=[] · status=active", "ms": null, "event_id": "evt_2efd3b98086d4b70"}, {"t": 0.16, "type": "tool.called", "agent": "gateway", "text": "web_search(발굴한 계정: youtube · UC_mock_coffeeman · ht) → 5건", "ms": 900, "event_id": "evt_c74b13807bf54992"}, {"t": 0.16, "type": "agent.finished", "agent": "account-linker", "text": "ok", "ms": 6234, "event_id": "evt_4c4367196b0a43cf"}], "capability": "research.link", "note": ""}, "t_29ee9f3d68": {"task_id": "t_29ee9f3d68", "agent": "account-linker", "candidate": "UC_mock_bigtech", "status": "ok", "ms": 6232, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.16, "events": [{"t": 0.16, "type": "agent.started", "agent": "account-linker", "text": "capability=research.link · focus=[] · status=active", "ms": null, "event_id": "evt_e125b34beaa442e0"}, {"t": 0.18, "type": "tool.called", "agent": "gateway", "text": "web_search(발굴한 계정: youtube · UC_mock_bigtech · http) → 5건", "ms": 900, "event_id": "evt_6d99715bb0854935"}, {"t": 0.19, "type": "agent.finished", "agent": "account-linker", "text": "ok", "ms": 6232, "event_id": "evt_c01c4ef0ab68497a"}], "capability": "research.link", "note": ""}, "t_d256314df8": {"task_id": "t_d256314df8", "agent": "yt-researcher", "candidate": "UC_mock_gadgetlab", "status": "ok", "ms": 44, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.16, "events": [{"t": 0.16, "type": "agent.started", "agent": "yt-researcher", "text": "capability=research.youtube · focus=[] · status=active", "ms": null, "event_id": "evt_697f53517d8849ab"}, {"t": 0.18, "type": "tool.cache_hit", "agent": "gateway", "text": "youtube_channel(UC_mock_gadgetlab) · 캐시", "ms": null, "event_id": "evt_73167b7faf2f4209"}, {"t": 0.21, "type": "agent.finished", "agent": "yt-researcher", "text": "ok", "ms": 44, "event_id": "evt_c55938a2536a48b6"}], "capability": "research.youtube", "note": ""}, "t_d1a38e2481": {"task_id": "t_d1a38e2481", "agent": "account-linker", "candidate": "UC_mock_newbie", "status": "ok", "ms": 6244, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.16, "events": [{"t": 0.16, "type": "agent.started", "agent": "account-linker", "text": "capability=research.link · focus=[] · status=active", "ms": null, "event_id": "evt_fb999cb3a6f046ca"}, {"t": 0.19, "type": "tool.called", "agent": "gateway", "text": "web_search(발굴한 계정: youtube · UC_mock_newbie · https) → 5건", "ms": 900, "event_id": "evt_d769313e94194ca1"}, {"t": 0.21, "type": "agent.finished", "agent": "account-linker", "text": "ok", "ms": 6244, "event_id": "evt_cf759915aed0475c"}], "capability": "research.link", "note": ""}, "t_f1f76b8225": {"task_id": "t_f1f76b8225", "agent": "yt-researcher", "candidate": "UC_mock_techmonkey", "status": "ok", "ms": 34, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.18, "events": [{"t": 0.18, "type": "agent.started", "agent": "yt-researcher", "text": "capability=research.youtube · focus=[] · status=active", "ms": null, "event_id": "evt_0d887788cb6a42e9"}, {"t": 0.19, "type": "tool.cache_hit", "agent": "gateway", "text": "youtube_channel(UC_mock_techmonkey) · 캐시", "ms": null, "event_id": "evt_d31e1d25feda4d03"}, {"t": 0.21, "type": "agent.finished", "agent": "yt-researcher", "text": "ok", "ms": 34, "event_id": "evt_ad2af7a2ca364023"}], "capability": "research.youtube", "note": ""}, "t_d218463964": {"task_id": "t_d218463964", "agent": "account-linker", "candidate": "UC_mock_tiny", "status": "ok", "ms": 6234, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.18, "events": [{"t": 0.18, "type": "agent.started", "agent": "account-linker", "text": "capability=research.link · focus=[] · status=active", "ms": null, "event_id": "evt_b32c35d2fb3d447a"}, {"t": 0.21, "type": "tool.called", "agent": "gateway", "text": "web_search(발굴한 계정: youtube · UC_mock_tiny · https:/) → 5건", "ms": 900, "event_id": "evt_0a966e24b7e54957"}, {"t": 0.21, "type": "agent.finished", "agent": "account-linker", "text": "ok", "ms": 6234, "event_id": "evt_a3e0c45e591f4472"}], "capability": "research.link", "note": ""}, "t_2bf5d45155": {"task_id": "t_2bf5d45155", "agent": "yt-researcher", "candidate": "UC_mock_coffeeman", "status": "ok", "ms": 34, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.18, "events": [{"t": 0.18, "type": "agent.started", "agent": "yt-researcher", "text": "capability=research.youtube · focus=[] · status=active", "ms": null, "event_id": "evt_2c10edb161294921"}, {"t": 0.21, "type": "tool.cache_hit", "agent": "gateway", "text": "youtube_channel(UC_mock_coffeeman) · 캐시", "ms": null, "event_id": "evt_da783d0609ee46bd"}, {"t": 0.21, "type": "agent.finished", "agent": "yt-researcher", "text": "ok", "ms": 34, "event_id": "evt_d8819e33c2374747"}], "capability": "research.youtube", "note": ""}, "t_388b15fdbb": {"task_id": "t_388b15fdbb", "agent": "yt-researcher", "candidate": "UC_mock_bigtech", "status": "ok", "ms": 9, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.21, "events": [{"t": 0.21, "type": "agent.started", "agent": "yt-researcher", "text": "capability=research.youtube · focus=[] · status=active", "ms": null, "event_id": "evt_0b3009c1a03a43db"}, {"t": 0.22, "type": "tool.cache_hit", "agent": "gateway", "text": "youtube_channel(UC_mock_bigtech) · 캐시", "ms": null, "event_id": "evt_36a117a87b244b09"}, {"t": 0.22, "type": "agent.finished", "agent": "yt-researcher", "text": "ok", "ms": 9, "event_id": "evt_83e0f65ae6ac4949"}], "capability": "research.youtube", "note": ""}, "t_4e0e641c00": {"task_id": "t_4e0e641c00", "agent": "verifier", "candidate": "UC_mock_gadgetlab", "status": "ok", "ms": 11813, "focus": [], "llm_calls": 0, "tool_calls": 2, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.21, "events": [{"t": 0.21, "type": "agent.started", "agent": "verifier", "text": "capability=verify.conditions · focus=[] · status=active", "ms": null, "event_id": "evt_6f3c82ccdf60450f"}, {"t": 0.22, "type": "tool.cache_hit", "agent": "gateway", "text": "youtube_channel(UC_mock_gadgetlab) · 캐시", "ms": null, "event_id": "evt_8640034ae59c49bc"}, {"t": 0.22, "type": "tool.called", "agent": "gateway", "text": "instagram_profile(gadgetlab_kr)", "ms": 0, "event_id": "evt_68ca6ab6f76046b6"}, {"t": 0.23, "type": "agent.finished", "agent": "verifier", "text": "ok", "ms": 11813, "event_id": "evt_4835a75441b540d8"}], "capability": "verify.conditions", "note": ""}, "t_93230d5c9d": {"task_id": "t_93230d5c9d", "agent": "yt-researcher", "candidate": "UC_mock_newbie", "status": "ok", "ms": 10, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.21, "events": [{"t": 0.21, "type": "agent.started", "agent": "yt-researcher", "text": "capability=research.youtube · focus=[] · status=active", "ms": null, "event_id": "evt_dd8211d1ad134268"}, {"t": 0.22, "type": "tool.cache_hit", "agent": "gateway", "text": "youtube_channel(UC_mock_newbie) · 캐시", "ms": null, "event_id": "evt_6031b3b801db4371"}, {"t": 0.23, "type": "agent.finished", "agent": "yt-researcher", "text": "ok", "ms": 10, "event_id": "evt_84f857ea59414862"}], "capability": "research.youtube", "note": ""}, "t_9cec96e5e7": {"task_id": "t_9cec96e5e7", "agent": "verifier", "candidate": "UC_mock_techmonkey", "status": "ok", "ms": 11809, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.22, "events": [{"t": 0.22, "type": "agent.started", "agent": "verifier", "text": "capability=verify.conditions · focus=[] · status=active", "ms": null, "event_id": "evt_512591cf78fc40a3"}, {"t": 0.22, "type": "tool.cache_hit", "agent": "gateway", "text": "youtube_channel(UC_mock_techmonkey) · 캐시", "ms": null, "event_id": "evt_0a781922ad514333"}, {"t": 0.23, "type": "agent.finished", "agent": "verifier", "text": "ok", "ms": 11809, "event_id": "evt_f98cf9b37f1f4f50"}], "capability": "verify.conditions", "note": ""}, "t_23fa500773": {"task_id": "t_23fa500773", "agent": "yt-researcher", "candidate": "UC_mock_tiny", "status": "ok", "ms": 10, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.22, "events": [{"t": 0.22, "type": "agent.started", "agent": "yt-researcher", "text": "capability=research.youtube · focus=[] · status=active", "ms": null, "event_id": "evt_fba52b0b3a794483"}, {"t": 0.22, "type": "tool.cache_hit", "agent": "gateway", "text": "youtube_channel(UC_mock_tiny) · 캐시", "ms": null, "event_id": "evt_f72102bb5d0f4a01"}, {"t": 0.23, "type": "agent.finished", "agent": "yt-researcher", "text": "ok", "ms": 10, "event_id": "evt_6d24b15bf79d46d1"}], "capability": "research.youtube", "note": ""}, "t_a6758e67bf": {"task_id": "t_a6758e67bf", "agent": "verifier", "candidate": "UC_mock_coffeeman", "status": "ok", "ms": 11810, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.22, "events": [{"t": 0.22, "type": "agent.started", "agent": "verifier", "text": "capability=verify.conditions · focus=[] · status=active", "ms": null, "event_id": "evt_2d10d4b32eda4da2"}, {"t": 0.22, "type": "tool.cache_hit", "agent": "gateway", "text": "youtube_channel(UC_mock_coffeeman) · 캐시", "ms": null, "event_id": "evt_155d70f8cc964738"}, {"t": 0.23, "type": "agent.finished", "agent": "verifier", "text": "ok", "ms": 11810, "event_id": "evt_cc527daae0164967"}], "capability": "verify.conditions", "note": ""}, "t_3bca513ea4": {"task_id": "t_3bca513ea4", "agent": "verifier", "candidate": "UC_mock_bigtech", "status": "ok", "ms": 11807, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.22, "events": [{"t": 0.22, "type": "agent.started", "agent": "verifier", "text": "capability=verify.conditions · focus=[] · status=active", "ms": null, "event_id": "evt_02c12baef2d548ec"}, {"t": 0.23, "type": "tool.cache_hit", "agent": "gateway", "text": "youtube_channel(UC_mock_bigtech) · 캐시", "ms": null, "event_id": "evt_133d34a8e14048b7"}, {"t": 0.23, "type": "agent.finished", "agent": "verifier", "text": "ok", "ms": 11807, "event_id": "evt_0bc4ef7215444633"}], "capability": "verify.conditions", "note": ""}, "t_f039e3a43a": {"task_id": "t_f039e3a43a", "agent": "verifier", "candidate": "UC_mock_newbie", "status": "ok", "ms": 11811, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.23, "events": [{"t": 0.23, "type": "agent.started", "agent": "verifier", "text": "capability=verify.conditions · focus=[] · status=active", "ms": null, "event_id": "evt_651186a2040845ee"}, {"t": 0.23, "type": "tool.cache_hit", "agent": "gateway", "text": "youtube_channel(UC_mock_newbie) · 캐시", "ms": null, "event_id": "evt_fe2ca089facd4928"}, {"t": 0.24, "type": "agent.finished", "agent": "verifier", "text": "ok", "ms": 11811, "event_id": "evt_d592107197924c83"}], "capability": "verify.conditions", "note": ""}, "t_0b959da433": {"task_id": "t_0b959da433", "agent": "verifier", "candidate": "UC_mock_tiny", "status": "ok", "ms": 11810, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.23, "events": [{"t": 0.23, "type": "agent.started", "agent": "verifier", "text": "capability=verify.conditions · focus=[] · status=active", "ms": null, "event_id": "evt_5cf309f9c4124c73"}, {"t": 0.23, "type": "tool.cache_hit", "agent": "gateway", "text": "youtube_channel(UC_mock_tiny) · 캐시", "ms": null, "event_id": "evt_b572ddf7b1134027"}, {"t": 0.24, "type": "agent.finished", "agent": "verifier", "text": "ok", "ms": 11810, "event_id": "evt_0d5d64bbf71544e5"}], "capability": "verify.conditions", "note": ""}, "t_8adf00b43c": {"task_id": "t_8adf00b43c", "agent": "profiler", "candidate": "UC_mock_techmonkey", "status": "ok", "ms": 5, "focus": [], "llm_calls": 0, "tool_calls": 0, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.23, "events": [{"t": 0.23, "type": "agent.started", "agent": "profiler", "text": "capability=profile.assemble · focus=[] · status=active", "ms": null, "event_id": "evt_7cd4a815f6dd49b9"}, {"t": 0.24, "type": "agent.finished", "agent": "profiler", "text": "ok", "ms": 5, "event_id": "evt_daf50555099c4f4c"}], "capability": "profile.assemble", "note": ""}, "t_eba0dc9306": {"task_id": "t_eba0dc9306", "agent": "profiler", "candidate": "UC_mock_coffeeman", "status": "ok", "ms": 6, "focus": [], "llm_calls": 0, "tool_calls": 0, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.23, "events": [{"t": 0.23, "type": "agent.started", "agent": "profiler", "text": "capability=profile.assemble · focus=[] · status=active", "ms": null, "event_id": "evt_77647e6bb5bd44f7"}, {"t": 0.24, "type": "agent.finished", "agent": "profiler", "text": "ok", "ms": 6, "event_id": "evt_1efbb6f5684e494d"}], "capability": "profile.assemble", "note": ""}, "t_2223598fea": {"task_id": "t_2223598fea", "agent": "profiler", "candidate": "UC_mock_gadgetlab", "status": "ok", "ms": 6, "focus": [], "llm_calls": 0, "tool_calls": 0, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.23, "events": [{"t": 0.23, "type": "agent.started", "agent": "profiler", "text": "capability=profile.assemble · focus=[] · status=active", "ms": null, "event_id": "evt_172378cd013f49ed"}, {"t": 0.24, "type": "agent.finished", "agent": "profiler", "text": "ok", "ms": 6, "event_id": "evt_c6f3e34d10e549de"}], "capability": "profile.assemble", "note": ""}, "t_9a788a5045": {"task_id": "t_9a788a5045", "agent": "profiler", "candidate": "UC_mock_bigtech", "status": "ok", "ms": 5, "focus": [], "llm_calls": 0, "tool_calls": 0, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.24, "events": [{"t": 0.24, "type": "agent.started", "agent": "profiler", "text": "capability=profile.assemble · focus=[] · status=active", "ms": null, "event_id": "evt_b1d7e10c46824ae5"}, {"t": 0.24, "type": "agent.finished", "agent": "profiler", "text": "ok", "ms": 5, "event_id": "evt_1fff9a546d2f4e8c"}], "capability": "profile.assemble", "note": ""}, "t_e9a1ef06b1": {"task_id": "t_e9a1ef06b1", "agent": "web-researcher", "candidate": "UC_mock_homecafe", "status": "ok", "ms": 4111, "focus": [], "llm_calls": 0, "tool_calls": 2, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.24, "events": [{"t": 0.24, "type": "agent.started", "agent": "web-researcher", "text": "capability=research.web · focus=[] · status=active", "ms": null, "event_id": "evt_be6d7decf2074039"}, {"t": 0.25, "type": "tool.called", "agent": "gateway", "text": "web_search(홈카페다이어리 나무위키) → 5건", "ms": 900, "event_id": "evt_5885f1e657104b47"}, {"t": 0.25, "type": "tool.called", "agent": "gateway", "text": "web_search(\"홈카페다이어리\" 유튜버 인터뷰) → 5건", "ms": 900, "event_id": "evt_e8b9105ef4c44e59"}, {"t": 0.25, "type": "agent.finished", "agent": "web-researcher", "text": "ok", "ms": 4111, "event_id": "evt_32d6daa93b7c4809"}], "capability": "research.web", "note": ""}, "t_83a26d2485": {"task_id": "t_83a26d2485", "agent": "profiler", "candidate": "UC_mock_newbie", "status": "ok", "ms": 5, "focus": [], "llm_calls": 0, "tool_calls": 0, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.24, "events": [{"t": 0.24, "type": "agent.started", "agent": "profiler", "text": "capability=profile.assemble · focus=[] · status=active", "ms": null, "event_id": "evt_74c4ebb1e4be4697"}, {"t": 0.25, "type": "agent.finished", "agent": "profiler", "text": "ok", "ms": 5, "event_id": "evt_c9520ba6c56c4355"}], "capability": "profile.assemble", "note": ""}, "t_f30b48fab3": {"task_id": "t_f30b48fab3", "agent": "profiler", "candidate": "UC_mock_tiny", "status": "ok", "ms": 6, "focus": [], "llm_calls": 0, "tool_calls": 0, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.25, "events": [{"t": 0.25, "type": "agent.started", "agent": "profiler", "text": "capability=profile.assemble · focus=[] · status=active", "ms": null, "event_id": "evt_ccb5519b6ee446c2"}, {"t": 0.25, "type": "agent.finished", "agent": "profiler", "text": "ok", "ms": 6, "event_id": "evt_c6f718534c4747df"}], "capability": "profile.assemble", "note": ""}, "t_fa26e6d8b5": {"task_id": "t_fa26e6d8b5", "agent": "account-linker", "candidate": "UC_mock_homecafe", "status": "ok", "ms": 6213, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.25, "events": [{"t": 0.25, "type": "agent.started", "agent": "account-linker", "text": "capability=research.link · focus=[] · status=active", "ms": null, "event_id": "evt_b9e99c4902784c8a"}, {"t": 0.27, "type": "tool.called", "agent": "gateway", "text": "web_search(발굴한 계정: youtube · UC_mock_homecafe · htt) → 5건", "ms": 900, "event_id": "evt_0cd843c3fd5f4966"}, {"t": 0.27, "type": "agent.finished", "agent": "account-linker", "text": "ok", "ms": 6213, "event_id": "evt_8ae2e8606fe6446c"}], "capability": "research.link", "note": ""}, "t_ca8f618cba": {"task_id": "t_ca8f618cba", "agent": "yt-researcher", "candidate": "UC_mock_homecafe", "status": "ok", "ms": 1, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.27, "events": [{"t": 0.27, "type": "agent.started", "agent": "yt-researcher", "text": "capability=research.youtube · focus=[] · status=active", "ms": null, "event_id": "evt_7f35f3f95aab4a2f"}, {"t": 0.27, "type": "tool.cache_hit", "agent": "gateway", "text": "youtube_channel(UC_mock_homecafe) · 캐시", "ms": null, "event_id": "evt_76755b07866044d3"}, {"t": 0.27, "type": "agent.finished", "agent": "yt-researcher", "text": "ok", "ms": 1, "event_id": "evt_02956fbfbbaa4917"}], "capability": "research.youtube", "note": ""}, "t_8eeda42743": {"task_id": "t_8eeda42743", "agent": "verifier", "candidate": "UC_mock_homecafe", "status": "ok", "ms": 11802, "focus": [], "llm_calls": 0, "tool_calls": 2, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.27, "events": [{"t": 0.27, "type": "agent.started", "agent": "verifier", "text": "capability=verify.conditions · focus=[] · status=active", "ms": null, "event_id": "evt_9aa6e1304b024e86"}, {"t": 0.27, "type": "tool.cache_hit", "agent": "gateway", "text": "youtube_channel(UC_mock_homecafe) · 캐시", "ms": null, "event_id": "evt_7056f053866f4660"}, {"t": 0.27, "type": "tool.called", "agent": "gateway", "text": "instagram_profile(homecafe_diary)", "ms": 0, "event_id": "evt_192248a9e0884aba"}, {"t": 0.27, "type": "agent.finished", "agent": "verifier", "text": "ok", "ms": 11802, "event_id": "evt_ca043a9492a24394"}], "capability": "verify.conditions", "note": ""}, "t_6a238471f5": {"task_id": "t_6a238471f5", "agent": "profiler", "candidate": "UC_mock_homecafe", "status": "ok", "ms": 1, "focus": [], "llm_calls": 0, "tool_calls": 0, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.27, "events": [{"t": 0.27, "type": "agent.started", "agent": "profiler", "text": "capability=profile.assemble · focus=[] · status=active", "ms": null, "event_id": "evt_4022cb6fc4f4442b"}, {"t": 0.27, "type": "agent.finished", "agent": "profiler", "text": "ok", "ms": 1, "event_id": "evt_5cad2b9997a9463b"}], "capability": "profile.assemble", "note": ""}, "t_e21cac8e89": {"task_id": "t_e21cac8e89", "agent": "yt-researcher", "candidate": "UC_mock_techmonkey", "status": "ok", "ms": 1, "focus": [], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.28, "events": [{"t": 0.28, "type": "agent.started", "agent": "yt-researcher", "text": "capability=research.youtube · focus=[] · status=active", "ms": null, "event_id": "evt_ea1cde985235496e"}, {"t": 0.28, "type": "tool.cache_hit", "agent": "gateway", "text": "youtube_channel(UC_mock_techmonkey) · 캐시", "ms": null, "event_id": "evt_22ac0c015eb04bf7"}, {"t": 0.28, "type": "agent.finished", "agent": "yt-researcher", "text": "ok", "ms": 1, "event_id": "evt_65e154ed60e548dc"}], "capability": "research.youtube", "note": ""}, "t_8404806e39": {"task_id": "t_8404806e39", "agent": "verifier", "candidate": "UC_mock_techmonkey", "status": "ok", "ms": 11801, "focus": ["c0"], "llm_calls": 0, "tool_calls": 1, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.28, "events": [{"t": 0.28, "type": "agent.started", "agent": "verifier", "text": "capability=verify.conditions · focus=['c0'] · status=active", "ms": null, "event_id": "evt_e4fc6edf5a0a4ebc"}, {"t": 0.28, "type": "tool.cache_hit", "agent": "gateway", "text": "youtube_channel(UC_mock_techmonkey) · 캐시", "ms": null, "event_id": "evt_ee233f53d4b54fd0"}, {"t": 0.28, "type": "agent.finished", "agent": "verifier", "text": "ok", "ms": 11801, "event_id": "evt_5a80ee595c074ea3"}], "capability": "verify.conditions", "note": ""}, "t_2ac7e75007": {"task_id": "t_2ac7e75007", "agent": "profiler", "candidate": "UC_mock_techmonkey", "status": "ok", "ms": 1, "focus": [], "llm_calls": 0, "tool_calls": 0, "tokens_in": 0, "errors": 0, "usd": 0.0, "start": 0.28, "events": [{"t": 0.28, "type": "agent.started", "agent": "profiler", "text": "capability=profile.assemble · focus=[] · status=active", "ms": null, "event_id": "evt_7886ffb8665c44e9"}, {"t": 0.28, "type": "agent.finished", "agent": "profiler", "text": "ok", "ms": 1, "event_id": "evt_00749d0caefe457c"}], "capability": "profile.assemble", "note": ""}}, "timeline": [{"t": 0.0, "type": "mission.started", "agent": "supervisor", "text": "request=국내에서 뜨고 있는 IT 리뷰 유튜버 3명, 협찬 사례 있는 사람 위주로 · requested=3 · mode=mock", "ms": null, "event_id": "evt_237edc3c7843418b"}, {"t": 0.03, "type": "condition.compiled", "agent": "query-planner", "text": "plan_id=pl_f05fcdb6f7 · conditions=4 · parts=5 · types=['분야', '성장', '지역언어', '플랫폼', '협찬']", "ms": null, "event_id": "evt_4145f1b3134e4f2c"}, {"t": 0.04, "type": "supervisor.planned", "agent": "supervisor", "text": "conditions=4 · measured=3 · candidates=24 · verify=8", "ms": null, "event_id": "evt_bc0a450bc738434d"}, {"t": 0.04, "type": "supervisor.dispatched", "agent": "supervisor", "text": "capability=discover.candidates · round=1 · shortfall=", "ms": null, "event_id": "evt_58b9c01f6fdc45af"}, {"t": 0.08, "type": "tool.provider_dead", "agent": "gateway", "text": "tool=web_search · provider=네이버 · status=403 · hint=권한 없음(애플리케이션에 '검색' API 추가 필요)", "ms": null, "event_id": "evt_x138"}, {"t": 0.08, "type": "account.linked", "agent": "account-linker", "text": "instagram gadget.lab · 확신도 0.7", "ms": null, "event_id": "evt_x143"}, {"t": 0.08, "type": "account.rejected", "agent": "account-linker", "text": "instagram newbie_tech_kr · 툴 결과에 없는 아이디(지어냄)", "ms": null, "event_id": "evt_x144"}, {"t": 0.09, "type": "supervisor.reviewed", "agent": "supervisor", "text": "stage=scout · round=1 · status=ok · candidates=8", "ms": null, "event_id": "evt_53125653f67241da"}, {"t": 0.09, "type": "supervisor.dispatched", "agent": "supervisor", "text": "capability=research · candidates=7 · steps=['research.web', 'research.link', 'research.youtub", "ms": null, "event_id": "evt_34300ea1a2f14ff4"}, {"t": 0.28, "type": "supervisor.reviewed", "agent": "supervisor", "text": "stage=evidence · checked=6 · requeue=1 · rejected=0", "ms": null, "event_id": "evt_cc545278cf2e4156"}, {"t": 0.28, "type": "supervisor.reviewed", "agent": "supervisor", "text": "stage=evidence · checked=7 · requeue=0 · rejected=0", "ms": null, "event_id": "evt_dc7b93fa0e0348c4"}, {"t": 0.29, "type": "supervisor.reviewed", "agent": "supervisor", "text": "stage=judge · passed=3 · shortfall=", "ms": null, "event_id": "evt_ae4a69bb1ecc414e"}, {"t": 0.29, "type": "condition.coverage", "agent": "query-planner", "text": "plan_id=pl_f05fcdb6f7 · people=3 · rows=[{'id': 'c1', 'signature': 'topic_gate', 'known_ra", "ms": null, "event_id": "evt_dbc5f228ee6f4259"}, {"t": 0.29, "type": "mission.finished", "agent": "supervisor", "text": "status=partial · returned=3 · passed=3 · rejected=5", "ms": 312000, "event_id": "evt_41fb9115c118407d"}, {"t": 0.29, "type": "feedback.recorded", "agent": "human", "text": "UC_mock_gadgetlab 맞음", "ms": null, "event_id": "evt_x145"}, {"t": 0.29, "type": "feedback.recorded", "agent": "human", "text": "UC_mock_tiny 안 맞음 · 다른 사람 · 계정 오인 · 동명이인 — 다른 사람 인스타가 붙음", "ms": null, "event_id": "evt_x146"}, {"t": 0.29, "type": "feedback.recorded", "agent": "human", "text": "UC_mock_homecafe 안 맞음 · 조건 판정이 틀림 · c3 · 최근 협찬 있는데 없다고 판정", "ms": null, "event_id": "evt_x147"}]} as unknown as OpsMissionView;

export const opsCatalog = {
 "agents": [
  {
   "name": "query-planner",
   "label": "조건 설계",
   "description": "요청문 → 조건 카드 (v3: LLM 은 유형 · 칸 · 기준표, 숫자는 코드가 읽고 측정식은 틀이 만든다). 그래프 밖 · 승인 전",
   "capabilities": [
    "plan.conditions"
   ],
   "status": "active",
   "tools": [],
   "uses_llm": true,
   "tool_choice": "툴 없음",
   "budget": {
    "llm_calls": 2,
    "tool_calls": 0,
    "timeout_s": 90
   },
   "slo": {
    "p95_s": 20,
    "success_rate": 0.98
   },
   "version": "1.0.0",
   "in_template": false,
   "recent": null
  },
  {
   "name": "scout",
   "label": "발굴",
   "description": "각도별 검색 → 후보 8×count → 숫자 필터 + 배치 주제 선별 → 2.5×count",
   "capabilities": [
    "discover.candidates"
   ],
   "status": "active",
   "tools": [
    "web_search",
    "youtube_search",
    "fetch_url",
    "youtube_channel",
    "instagram_profile"
   ],
   "uses_llm": true,
   "tool_choice": "LLM",
   "budget": {
    "llm_calls": 20,
    "tool_calls": 400,
    "timeout_s": 300
   },
   "slo": {
    "p95_s": 90,
    "success_rate": 0.95
   },
   "version": "1.0.0",
   "in_template": true,
   "recent": {
    "runs": 1,
    "ok": 1,
    "partial": 0,
    "failed": 0,
    "success_rate": 1.0,
    "p95_ms": 21027.0,
    "avg_llm_calls": 0.0,
    "avg_tool_calls": 10.0,
    "usd": 0.0,
    "avg_usd": 0.0,
    "missions": 1
   }
  },
  {
   "name": "web-researcher",
   "label": "웹 조사",
   "description": "이름 확정 · 나무위키 · 인터뷰 등 인물 배경 (절차 고정 · LLM 은 뽑아 적기만). 다른 플랫폼 계정은 account-linker",
   "capabilities": [
    "research.web"
   ],
   "status": "active",
   "tools": [
    "web_search",
    "fetch_url",
    "instagram_profile",
    "youtube_channel"
   ],
   "uses_llm": true,
   "tool_choice": "코드 (고정 절차)",
   "budget": {
    "llm_calls": 3,
    "tool_calls": 12,
    "timeout_s": 90
   },
   "slo": {
    "p95_s": 40,
    "success_rate": 0.9
   },
   "version": "1.0.0",
   "in_template": true,
   "recent": {
    "runs": 7,
    "ok": 7,
    "partial": 0,
    "failed": 0,
    "success_rate": 1.0,
    "p95_ms": 4158.0,
    "avg_llm_calls": 0.0,
    "avg_tool_calls": 2.0,
    "usd": 0.0,
    "avg_usd": 0.0,
    "missions": 1
   }
  },
  {
   "name": "account-linker",
   "label": "계정 연결",
   "description": "다른 플랫폼 계정 찾기 — LLM 이 검색 · 글 읽기 · API 조회를 골라 쓰고, 같은 사람인지 내용으로 판단",
   "capabilities": [
    "research.link"
   ],
   "status": "active",
   "tools": [
    "search_mentions",
    "read_passages",
    "lookup_instagram",
    "lookup_youtube",
    "find_youtube_channel"
   ],
   "uses_llm": true,
   "tool_choice": "LLM",
   "budget": {
    "llm_calls": 9,
    "tool_calls": 14,
    "timeout_s": 90
   },
   "slo": {
    "p95_s": 45,
    "success_rate": 0.9
   },
   "version": "1.0.0",
   "in_template": true,
   "recent": {
    "runs": 7,
    "ok": 7,
    "partial": 0,
    "failed": 0,
    "success_rate": 1.0,
    "p95_ms": 6244.0,
    "avg_llm_calls": 0.0,
    "avg_tool_calls": 1.0,
    "usd": 0.0,
    "avg_usd": 0.0,
    "missions": 1
   }
  },
  {
   "name": "yt-researcher",
   "label": "유튜브",
   "description": "채널 · 최근 영상 40 · 참여율 · 기간별 추세 · 유료 광고 표시 — 3유닛 경로, 전부 코드",
   "capabilities": [
    "research.youtube"
   ],
   "status": "active",
   "tools": [
    "youtube_channel"
   ],
   "uses_llm": false,
   "tool_choice": "코드",
   "budget": {
    "llm_calls": 0,
    "tool_calls": 2,
    "timeout_s": 25
   },
   "slo": {
    "p95_s": 8,
    "success_rate": 0.95
   },
   "version": "1.0.0",
   "in_template": true,
   "recent": {
    "runs": 8,
    "ok": 8,
    "partial": 0,
    "failed": 0,
    "success_rate": 1.0,
    "p95_ms": 44.0,
    "avg_llm_calls": 0.0,
    "avg_tool_calls": 1.0,
    "usd": 0.0,
    "avg_usd": 0.0,
    "missions": 1
   }
  },
  {
   "name": "ig-researcher",
   "label": "인스타",
   "description": "프로필 · 최근 게시물 25 · 참여율 · 기간별 추세 · 협찬 표시 — 전부 코드. 개인 계정은 limited",
   "capabilities": [
    "research.instagram"
   ],
   "status": "active",
   "tools": [
    "instagram_profile"
   ],
   "uses_llm": false,
   "tool_choice": "코드",
   "budget": {
    "llm_calls": 0,
    "tool_calls": 2,
    "timeout_s": 25
   },
   "slo": {
    "p95_s": 12,
    "success_rate": 0.9
   },
   "version": "1.0.0",
   "in_template": true,
   "recent": {
    "runs": 1,
    "ok": 0,
    "partial": 1,
    "failed": 0,
    "success_rate": 0.0,
    "p95_ms": 420.0,
    "avg_llm_calls": 0.0,
    "avg_tool_calls": 1.0,
    "usd": 0.0,
    "avg_usd": 0.0,
    "missions": 1
   }
  },
  {
   "name": "verifier",
   "label": "조건 판정",
   "description": "판단 조건을 근거 링크로 판정 · 기준표 조건은 연결된 계정 글까지 읽고 문턱은 코드가 적용. 측정식 조건은 profiler",
   "capabilities": [
    "verify.conditions"
   ],
   "status": "active",
   "tools": [
    "web_search",
    "fetch_url",
    "youtube_channel",
    "youtube_channel_search",
    "instagram_profile"
   ],
   "uses_llm": true,
   "tool_choice": "LLM",
   "budget": {
    "llm_calls": 14,
    "tool_calls": 24,
    "timeout_s": 150
   },
   "slo": {
    "p95_s": 60,
    "success_rate": 0.9
   },
   "version": "1.0.0",
   "in_template": true,
   "recent": {
    "runs": 8,
    "ok": 8,
    "partial": 0,
    "failed": 0,
    "success_rate": 1.0,
    "p95_ms": 11813.0,
    "avg_llm_calls": 0.0,
    "avg_tool_calls": 1.25,
    "usd": 0.0,
    "avg_usd": 0.0,
    "missions": 1
   }
  },
  {
   "name": "profiler",
   "label": "정리",
   "description": "측정식 조건 계산(코드) · 동일인물 확신도 반영 · 플랫폼 카드 정리",
   "capabilities": [
    "profile.assemble"
   ],
   "status": "active",
   "tools": [],
   "uses_llm": false,
   "tool_choice": "코드",
   "budget": {
    "llm_calls": 0,
    "tool_calls": 0,
    "timeout_s": 10
   },
   "slo": {
    "p95_s": 1,
    "success_rate": 0.99
   },
   "version": "1.0.0",
   "in_template": true,
   "recent": {
    "runs": 8,
    "ok": 8,
    "partial": 0,
    "failed": 0,
    "success_rate": 1.0,
    "p95_ms": 6.0,
    "avg_llm_calls": 0.0,
    "avg_tool_calls": 0.0,
    "usd": 0.0,
    "avg_usd": 0.0,
    "missions": 1
   }
  },
  {
   "name": "campaign-planner",
   "label": "campaign-planner",
   "description": "향후 슬롯 — celeb-outreach 캠페인 기획",
   "capabilities": [
    "plan.campaign"
   ],
   "status": "disabled",
   "tools": [],
   "uses_llm": false,
   "tool_choice": "코드",
   "budget": {
    "llm_calls": null,
    "tool_calls": null,
    "timeout_s": 60
   },
   "slo": {},
   "version": "1.0.0",
   "in_template": false,
   "recent": null
  },
  {
   "name": "dm-writer",
   "label": "dm-writer",
   "description": "향후 슬롯 — 제안 DM 작성 (발송은 사람 승인)",
   "capabilities": [
    "write.dm"
   ],
   "status": "disabled",
   "tools": [],
   "uses_llm": false,
   "tool_choice": "코드",
   "budget": {
    "llm_calls": null,
    "tool_calls": null,
    "timeout_s": 60
   },
   "slo": {},
   "version": "1.0.0",
   "in_template": false,
   "recent": null
  },
  {
   "name": "qc",
   "label": "qc",
   "description": "향후 슬롯 — 문구 · 정책 검수",
   "capabilities": [
    "review.quality"
   ],
   "status": "disabled",
   "tools": [],
   "uses_llm": false,
   "tool_choice": "코드",
   "budget": {
    "llm_calls": null,
    "tool_calls": null,
    "timeout_s": 60
   },
   "slo": {},
   "version": "1.0.0",
   "in_template": false,
   "recent": null
  },
  {
   "name": "reply-handler",
   "label": "reply-handler",
   "description": "향후 슬롯 — 응답 분류 · 재기획",
   "capabilities": [
    "handle.reply"
   ],
   "status": "disabled",
   "tools": [],
   "uses_llm": false,
   "tool_choice": "코드",
   "budget": {
    "llm_calls": null,
    "tool_calls": null,
    "timeout_s": 60
   },
   "slo": {},
   "version": "1.0.0",
   "in_template": false,
   "recent": null
  }
 ],
 "graph": {
  "nodes": [
   {
    "id": "plan_mission",
    "label": "조건 → 실행 계획"
   },
   {
    "id": "dispatch_scout",
    "label": "발굴 맡기기"
   },
   {
    "id": "research",
    "label": "후보마다 조사"
   },
   {
    "id": "review",
    "label": "근거 검토"
   },
   {
    "id": "judge",
    "label": "통과 · 탈락"
   },
   {
    "id": "finalize",
    "label": "결과 정리"
   }
  ],
  "edges": [
   {
    "from": "START",
    "to": "plan_mission",
    "kind": "normal",
    "label": ""
   },
   {
    "from": "plan_mission",
    "to": "dispatch_scout",
    "kind": "normal",
    "label": ""
   },
   {
    "from": "dispatch_scout",
    "to": "research",
    "kind": "fanout",
    "label": "후보마다 Send"
   },
   {
    "from": "research",
    "to": "review",
    "kind": "normal",
    "label": ""
   },
   {
    "from": "review",
    "to": "research",
    "kind": "loop",
    "label": "근거 부족 → 그 조건만 재조사"
   },
   {
    "from": "review",
    "to": "judge",
    "kind": "normal",
    "label": ""
   },
   {
    "from": "judge",
    "to": "dispatch_scout",
    "kind": "loop",
    "label": "인원 부족 → 재발굴"
   },
   {
    "from": "judge",
    "to": "finalize",
    "kind": "normal",
    "label": ""
   },
   {
    "from": "finalize",
    "to": "END",
    "kind": "normal",
    "label": ""
   }
  ]
 },
 "research": [
  "research.web",
  "research.link",
  "research.youtube",
  "research.instagram",
  "verify.conditions",
  "profile.assemble"
 ],
 "discover": "discover.candidates",
 "recent_missions": 1
} as unknown as OpsCatalog;

export const opsHealth = {
 "checks": [
  {
   "id": "H1",
   "label": "키 · 토큰",
   "kind": "운영",
   "status": "red",
   "value": "인스타 토큰 만료",
   "rule": "전부 유효 · 인스타 만료까지 7일 이상",
   "items": [],
   "action": "Meta 개발자 도구에서 장기 토큰을 다시 받아 IG_ACCESS_TOKEN 을 바꾸세요"
  },
  {
   "id": "H2",
   "label": "외부 API 응답",
   "kind": "운영",
   "status": "yellow",
   "value": "네이버 403 · 카카오 정상",
   "rule": "핑 성공 · p95 3초 미만",
   "items": [],
   "action": "네이버 애플리케이션의 사용 API 에 '검색'을 추가하세요"
  },
  {
   "id": "H10",
   "label": "트레이스 무결성",
   "kind": "운영",
   "status": "green",
   "value": "짝 없는 이벤트 0",
   "rule": "짝 없는 이벤트 0",
   "items": [],
   "action": ""
  }
 ],
 "blocked": [
  {
   "tool": "instagram_profile",
   "reason": "Error validating access token: Session has expired",
   "impact": "인스타 조회를 지금 쓸 수 없습니다(토큰 만료 등) — 인스타 팔로워 · 게시물 조건은 '확인 못 함'이 됩니다"
  }
 ]
} as unknown as OpsHealth;

export const opsTrend: OpsTrendRow[] = [{"mission_id": "m_00a5c0de91f", "started_at": "2026-09-20T09:00:00+00:00", "request": "홈카페 인스타 인플루언서 1만~20만 10명", "status": "ok", "mode": "live", "version": "a1c9e02", "cost_usd": 0.0411, "duration_s": 193.1, "requested": 10, "returned": 10, "fill_rate": 1.0, "usd_per_person": 0.0041, "critical": 1, "warning": 2, "top_problem": "", "verify_runs": 14, "verified_candidates": 10, "fb_up": 0, "fb_down": 0}, {"mission_id": "m_01a5c0de91f", "started_at": "2026-09-20T18:00:00+00:00", "request": "홈카페 인스타 인플루언서 1만~20만 10명", "status": "partial", "mode": "live", "version": "a1c9e02", "cost_usd": 0.0175, "duration_s": 201.8, "requested": 5, "returned": 1, "fill_rate": 0.2, "usd_per_person": 0.0175, "critical": 1, "warning": 1, "top_problem": "인원 부족", "verify_runs": 7, "verified_candidates": 5, "fb_up": 0, "fb_down": 0}, {"mission_id": "m_02a5c0de91f", "started_at": "2026-09-21T03:00:00+00:00", "request": "홈카페 인스타 인플루언서 1만~20만 10명", "status": "ok", "mode": "live", "version": "a1c9e02", "cost_usd": 0.1335, "duration_s": 400.7, "requested": 30, "returned": 30, "fill_rate": 1.0, "usd_per_person": 0.0044, "critical": 0, "warning": 0, "top_problem": "", "verify_runs": 42, "verified_candidates": 30, "fb_up": 1, "fb_down": 1}, {"mission_id": "m_03a5c0de91f", "started_at": "2026-09-21T12:00:00+00:00", "request": "홈카페 인스타 인플루언서 1만~20만 10명", "status": "partial", "mode": "mock", "version": "a1c9e02", "cost_usd": 0.0666, "duration_s": 289.4, "requested": 15, "returned": 14, "fill_rate": 0.933, "usd_per_person": 0.0048, "critical": 0, "warning": 0, "top_problem": "인원 부족", "verify_runs": 21, "verified_candidates": 15, "fb_up": 1, "fb_down": 1}, {"mission_id": "m_04a5c0de91f", "started_at": "2026-09-21T21:00:00+00:00", "request": "캠핑 유튜버 구독자 10만 이상 8명", "status": "ok", "mode": "mock", "version": "a1c9e02", "cost_usd": 0.0174, "duration_s": 181.1, "requested": 5, "returned": 5, "fill_rate": 1.0, "usd_per_person": 0.0035, "critical": 1, "warning": 0, "top_problem": "", "verify_runs": 7, "verified_candidates": 5, "fb_up": 3, "fb_down": 1}, {"mission_id": "m_05a5c0de91f", "started_at": "2026-09-22T06:00:00+00:00", "request": "IT 리뷰 유튜버 5만~50만 협업 안 한 사람 5명", "status": "ok", "mode": "live", "version": "a1c9e02", "cost_usd": 0.0632, "duration_s": 167.0, "requested": 15, "returned": 15, "fill_rate": 1.0, "usd_per_person": 0.0042, "critical": 0, "warning": 0, "top_problem": "", "verify_runs": 21, "verified_candidates": 15, "fb_up": 2, "fb_down": 1}, {"mission_id": "m_06a5c0de91f", "started_at": "2026-09-22T15:00:00+00:00", "request": "뷰티 인스타 마이크로 인플루언서 15명", "status": "ok", "mode": "live", "version": "a1c9e02", "cost_usd": 0.039, "duration_s": 203.6, "requested": 10, "returned": 10, "fill_rate": 1.0, "usd_per_person": 0.0039, "critical": 0, "warning": 0, "top_problem": "", "verify_runs": 14, "verified_candidates": 10, "fb_up": 2, "fb_down": 0}, {"mission_id": "m_07a5c0de91f", "started_at": "2026-09-23T00:00:00+00:00", "request": "뷰티 인스타 마이크로 인플루언서 15명", "status": "ok", "mode": "live", "version": "a1c9e02", "cost_usd": 0.0777, "duration_s": 340.3, "requested": 15, "returned": 15, "fill_rate": 1.0, "usd_per_person": 0.0052, "critical": 1, "warning": 2, "top_problem": "", "verify_runs": 21, "verified_candidates": 15, "fb_up": 2, "fb_down": 1}, {"mission_id": "m_08a5c0de91f", "started_at": "2026-09-23T09:00:00+00:00", "request": "20~30대 여성 패션 인플루언서 30명", "status": "ok", "mode": "live", "version": "a1c9e02", "cost_usd": 0.0446, "duration_s": 214.8, "requested": 10, "returned": 10, "fill_rate": 1.0, "usd_per_person": 0.0045, "critical": 0, "warning": 0, "top_problem": "", "verify_runs": 14, "verified_candidates": 10, "fb_up": 0, "fb_down": 0}, {"mission_id": "m_09a5c0de91f", "started_at": "2026-09-23T18:00:00+00:00", "request": "캠핑 유튜버 구독자 10만 이상 8명", "status": "ok", "mode": "live", "version": "a1c9e02", "cost_usd": 0.0524, "duration_s": 297.4, "requested": 10, "returned": 10, "fill_rate": 1.0, "usd_per_person": 0.0052, "critical": 0, "warning": 1, "top_problem": "", "verify_runs": 14, "verified_candidates": 10, "fb_up": 2, "fb_down": 0}, {"mission_id": "m_10a5c0de91f", "started_at": "2026-09-24T03:00:00+00:00", "request": "20~30대 여성 패션 인플루언서 30명", "status": "ok", "mode": "live", "version": "a1c9e02", "cost_usd": 0.0677, "duration_s": 178.7, "requested": 15, "returned": 15, "fill_rate": 1.0, "usd_per_person": 0.0045, "critical": 0, "warning": 0, "top_problem": "", "verify_runs": 21, "verified_candidates": 15, "fb_up": 1, "fb_down": 1}, {"mission_id": "m_11a5c0de91f", "started_at": "2026-09-24T12:00:00+00:00", "request": "뷰티 인스타 마이크로 인플루언서 15명", "status": "ok", "mode": "live", "version": "5f3d7b1", "cost_usd": 0.1243, "duration_s": 215.0, "requested": 15, "returned": 15, "fill_rate": 1.0, "usd_per_person": 0.0083, "critical": 0, "warning": 2, "top_problem": "", "verify_runs": 21, "verified_candidates": 15, "fb_up": 1, "fb_down": 2}, {"mission_id": "m_12a5c0de91f", "started_at": "2026-09-24T21:00:00+00:00", "request": "IT 리뷰 유튜버 5만~50만 협업 안 한 사람 5명", "status": "ok", "mode": "live", "version": "5f3d7b1", "cost_usd": 0.2398, "duration_s": 260.1, "requested": 30, "returned": 30, "fill_rate": 1.0, "usd_per_person": 0.008, "critical": 0, "warning": 2, "top_problem": "", "verify_runs": 42, "verified_candidates": 30, "fb_up": 1, "fb_down": 1}, {"mission_id": "m_13a5c0de91f", "started_at": "2026-09-25T06:00:00+00:00", "request": "20~30대 여성 패션 인플루언서 30명", "status": "ok", "mode": "live", "version": "5f3d7b1", "cost_usd": 0.0522, "duration_s": 157.8, "requested": 8, "returned": 8, "fill_rate": 1.0, "usd_per_person": 0.0065, "critical": 0, "warning": 1, "top_problem": "", "verify_runs": 11, "verified_candidates": 8, "fb_up": 1, "fb_down": 2}, {"mission_id": "m_14a5c0de91f", "started_at": "2026-09-25T15:00:00+00:00", "request": "뷰티 인스타 마이크로 인플루언서 15명", "status": "ok", "mode": "live", "version": "5f3d7b1", "cost_usd": 0.2563, "duration_s": 434.7, "requested": 30, "returned": 30, "fill_rate": 1.0, "usd_per_person": 0.0085, "critical": 0, "warning": 3, "top_problem": "", "verify_runs": 42, "verified_candidates": 30, "fb_up": 0, "fb_down": 2}, {"mission_id": "m_15a5c0de91f", "started_at": "2026-09-26T00:00:00+00:00", "request": "홈카페 인스타 인플루언서 1만~20만 10명", "status": "ok", "mode": "live", "version": "5f3d7b1", "cost_usd": 0.238, "duration_s": 273.9, "requested": 30, "returned": 30, "fill_rate": 1.0, "usd_per_person": 0.0079, "critical": 1, "warning": 2, "top_problem": "", "verify_runs": 42, "verified_candidates": 30, "fb_up": 1, "fb_down": 2}, {"mission_id": "m_16a5c0de91f", "started_at": "2026-09-26T09:00:00+00:00", "request": "홈카페 인스타 인플루언서 1만~20만 10명", "status": "partial", "mode": "live", "version": "5f3d7b1", "cost_usd": 0.0548, "duration_s": 277.1, "requested": 8, "returned": 7, "fill_rate": 0.875, "usd_per_person": 0.0078, "critical": 0, "warning": 3, "top_problem": "인원 부족", "verify_runs": 11, "verified_candidates": 8, "fb_up": 0, "fb_down": 1}, {"mission_id": "m_17a5c0de91f", "started_at": "2026-09-26T18:00:00+00:00", "request": "뷰티 인스타 마이크로 인플루언서 15명", "status": "ok", "mode": "live", "version": "5f3d7b1", "cost_usd": 0.0562, "duration_s": 172.5, "requested": 8, "returned": 8, "fill_rate": 1.0, "usd_per_person": 0.007, "critical": 0, "warning": 2, "top_problem": "", "verify_runs": 11, "verified_candidates": 8, "fb_up": 0, "fb_down": 1}, {"mission_id": "m_7f3a2c91d0e4", "started_at": "2026-09-28T03:58:57.313+00:00", "request": "국내에서 뜨고 있는 IT 리뷰 유튜버 3명, 협찬 사례 있는 사람 위주로", "status": "partial", "mode": "live", "version": "5f3d7b1", "cost_usd": 0.074, "duration_s": 312.0, "requested": 3, "returned": 3, "fill_rate": 1.0, "usd_per_person": 0.0247, "critical": 1, "warning": 4, "top_problem": "O8 외부 툴 차단 — instagram_profile", "verify_runs": 8, "verified_candidates": 7, "fb_up": 1, "fb_down": 2}];

export const opsFeedback = {
 "items": [
  {
   "event_id": "evt_x145",
   "ts": "2026-09-28T03:58:57.602+00:00",
   "mission_id": "m_7f3a2c91d0e4",
   "request": "국내에서 뜨고 있는 IT 리뷰 유튜버 3명, 협찬 사례 있는 사람 위주로",
   "handle": "UC_mock_gadgetlab",
   "score": 1,
   "reason": "",
   "reason_label": "",
   "agent": "",
   "condition_id": "",
   "comment": "",
   "version": ""
  },
  {
   "event_id": "evt_x146",
   "ts": "2026-09-28T03:58:57.602+00:00",
   "mission_id": "m_7f3a2c91d0e4",
   "request": "국내에서 뜨고 있는 IT 리뷰 유튜버 3명, 협찬 사례 있는 사람 위주로",
   "handle": "UC_mock_tiny",
   "score": 0,
   "reason": "wrong_person",
   "reason_label": "다른 사람 · 계정 오인",
   "agent": "account-linker",
   "condition_id": "",
   "comment": "동명이인 — 다른 사람 인스타가 붙음",
   "version": ""
  },
  {
   "event_id": "evt_x147",
   "ts": "2026-09-28T03:58:57.602+00:00",
   "mission_id": "m_7f3a2c91d0e4",
   "request": "국내에서 뜨고 있는 IT 리뷰 유튜버 3명, 협찬 사례 있는 사람 위주로",
   "handle": "UC_mock_homecafe",
   "score": 0,
   "reason": "wrong_condition",
   "reason_label": "조건 판정이 틀림",
   "agent": "verifier",
   "condition_id": "c3",
   "comment": "최근 협찬 있는데 없다고 판정",
   "version": ""
  },
  {
   "event_id": "evt_fbmock0",
   "ts": "2026-09-26T18:00:00+00:00",
   "mission_id": "m_17a5c0de91f",
   "request": "뷰티 인스타 마이크로 인플루언서 15명",
   "handle": "@cafe.moment",
   "score": 0,
   "reason": "wrong_condition",
   "reason_label": "조건 판정이 틀림",
   "agent": "verifier",
   "condition_id": "c2",
   "comment": "최근 3개월 커피 협찬 2건 있음",
   "version": "5f3d7b1"
  },
  {
   "event_id": "evt_fbmock4",
   "ts": "2026-09-26T09:00:00+00:00",
   "mission_id": "m_16a5c0de91f",
   "request": "홈카페 인스타 인플루언서 1만~20만 10명",
   "handle": "@latte.note",
   "score": 0,
   "reason": "wrong_condition",
   "reason_label": "조건 판정이 틀림",
   "agent": "verifier",
   "condition_id": "c3",
   "comment": "단점 언급 없음 — 전부 칭찬",
   "version": "5f3d7b1"
  },
  {
   "event_id": "evt_fbmock1",
   "ts": "2026-09-26T00:00:00+00:00",
   "mission_id": "m_15a5c0de91f",
   "request": "홈카페 인스타 인플루언서 1만~20만 10명",
   "handle": "@brew.diary",
   "score": 0,
   "reason": "not_fit",
   "reason_label": "조건은 맞지만 캠페인에 안 맞음",
   "agent": "query-planner",
   "condition_id": "",
   "comment": "톤이 너무 광고 위주",
   "version": "5f3d7b1"
  },
  {
   "event_id": "evt_fbmock2",
   "ts": "2026-09-25T15:00:00+00:00",
   "mission_id": "m_14a5c0de91f",
   "request": "뷰티 인스타 마이크로 인플루언서 15명",
   "handle": "@tech.jun",
   "score": 0,
   "reason": "wrong_person",
   "reason_label": "다른 사람 · 계정 오인",
   "agent": "account-linker",
   "condition_id": "",
   "comment": "유튜브랑 인스타가 다른 사람",
   "version": "5f3d7b1"
  },
  {
   "event_id": "evt_fbmock3",
   "ts": "2026-09-24T21:00:00+00:00",
   "mission_id": "m_12a5c0de91f",
   "request": "IT 리뷰 유튜버 5만~50만 협업 안 한 사람 5명",
   "handle": "@homebarista.k",
   "score": 0,
   "reason": "wrong_info",
   "reason_label": "정보가 틀리거나 오래됨",
   "agent": "web-researcher",
   "condition_id": "",
   "comment": "팔로워 수가 반년 전 숫자",
   "version": "5f3d7b1"
  },
  {
   "event_id": "evt_fbmocku2",
   "ts": "2026-09-23T00:00:00+00:00",
   "mission_id": "m_07a5c0de91f",
   "request": "뷰티 인스타 마이크로 인플루언서 15명",
   "handle": "@camp.jin",
   "score": 1,
   "reason": "",
   "reason_label": "",
   "agent": "",
   "condition_id": "",
   "comment": "",
   "version": "a1c9e02"
  },
  {
   "event_id": "evt_fbmocku1",
   "ts": "2026-09-22T15:00:00+00:00",
   "mission_id": "m_06a5c0de91f",
   "request": "뷰티 인스타 마이크로 인플루언서 15명",
   "handle": "@gear.review",
   "score": 1,
   "reason": "",
   "reason_label": "",
   "agent": "",
   "condition_id": "",
   "comment": "",
   "version": "a1c9e02"
  },
  {
   "event_id": "evt_fbmocku0",
   "ts": "2026-09-22T06:00:00+00:00",
   "mission_id": "m_05a5c0de91f",
   "request": "IT 리뷰 유튜버 5만~50만 협업 안 한 사람 5명",
   "handle": "@slow.brew",
   "score": 1,
   "reason": "",
   "reason_label": "",
   "agent": "",
   "condition_id": "",
   "comment": "",
   "version": "a1c9e02"
  }
 ],
 "summary": {
  "total": 11,
  "up": 4,
  "down": 7,
  "fit_rate": 0.364,
  "reasons": [
   {
    "reason": "wrong_condition",
    "label": "조건 판정이 틀림",
    "agent": "verifier",
    "count": 3
   },
   {
    "reason": "wrong_person",
    "label": "다른 사람 · 계정 오인",
    "agent": "account-linker",
    "count": 2
   },
   {
    "reason": "not_fit",
    "label": "조건은 맞지만 캠페인에 안 맞음",
    "agent": "query-planner",
    "count": 1
   },
   {
    "reason": "wrong_info",
    "label": "정보가 틀리거나 오래됨",
    "agent": "web-researcher",
    "count": 1
   }
  ],
  "agents": [
   {
    "agent": "verifier",
    "count": 3
   },
   {
    "agent": "account-linker",
    "count": 2
   },
   {
    "agent": "query-planner",
    "count": 1
   },
   {
    "agent": "web-researcher",
    "count": 1
   }
  ],
  "updated_at": "2026-09-28T08:19:02Z"
 },
 "reasons": [
  {
   "reason": "wrong_person",
   "label": "다른 사람 · 계정 오인",
   "agent": "account-linker"
  },
  {
   "reason": "wrong_condition",
   "label": "조건 판정이 틀림",
   "agent": "verifier"
  },
  {
   "reason": "not_fit",
   "label": "조건은 맞지만 캠페인에 안 맞음",
   "agent": "query-planner"
  },
  {
   "reason": "wrong_info",
   "label": "정보가 틀리거나 오래됨",
   "agent": "web-researcher"
  },
  {
   "reason": "other",
   "label": "기타",
   "agent": ""
  }
 ]
} as unknown as OpsFeedback;
