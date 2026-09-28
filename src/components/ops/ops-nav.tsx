"use client";

import { usePathname } from "next/navigation";
import PageHeader from "@/components/v2/app-header";

const TITLES: Record<string, { title: string; description: string }> = {
  "/ops": { title: "AgentOps 개요", description: "지금 막힌 것, 최근 검색에서 난 문제, 에이전트 상태를 봅니다." },
  "/ops/trace": { title: "검색 추적", description: "검색 한 건이 그래프의 어느 노드를 어떻게 지났고, 어느 후보의 어느 단계에서 문제가 났는지 봅니다." },
  "/ops/feedback": { title: "사람 평가", description: "결과 카드에 남긴 맞음 · 안 맞음과 그 이유입니다. 이유마다 먼저 볼 에이전트를 알려 줍니다." },
  "/ops/golden": { title: "골든셋 · 계정 연결", description: "다른 플랫폼 계정을 제대로 붙였는지 사람이 정답을 확인해 모으고, 운영 기록의 연결 정확도를 잽니다." },
  "/ops/agents": { title: "에이전트", description: "그래프 구성과 에이전트 명세, 최근 성적입니다." },
  "/ops/eval": { title: "품질 평가", description: "PRD 평가 9개(치명 4 · 점수 5)와 단위 평가입니다. 운영 기록으로 잰 것, 대리 지표, 아직 못 재는 것을 나눠 보여 줍니다." },
  "/ops/observe": { title: "관측 (SLO)", description: "지연 · 첫 결과 · 토큰 · 비용 · 오류 · 재시도 · 쿼터 · 캐시 · 부분 결과 SLO와 단계별 품질입니다." },
  "/ops/diagnose": { title: "진단", description: "건강진단 H1~H10 — 키 · 연결 · 쿼터 · 평가 신선도 · 회귀 · SLO · 오류 군집 · 드리프트 · 감독관 개입 · 기록 무결성." },
  "/ops/gates": { title: "배포 판정", description: "진단 → 평가 → SLO 순서로 읽어 배포 가능 · 디버그 필요 · 개선 필요 중 하나를 냅니다." },
};

/** Ops 페이지 제목 — 메뉴는 왼쪽 사이드바가 맡는다 */
export default function OpsNav() {
  const path = usePathname();
  const t = TITLES[path] ?? TITLES["/ops"];
  return <PageHeader title={t.title} description={t.description} />;
}
