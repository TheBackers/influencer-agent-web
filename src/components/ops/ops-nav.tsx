"use client";

import { usePathname } from "next/navigation";
import PageHeader from "@/components/v2/app-header";

const TITLES: Record<string, { title: string; description: string }> = {
  "/ops": { title: "AgentOps 개요", description: "지금 막힌 것, 최근 검색에서 난 문제, 에이전트 상태를 봅니다." },
  "/ops/trace": { title: "검색 추적", description: "검색 한 건이 그래프의 어느 노드를 어떻게 지났고, 어느 후보의 어느 단계에서 문제가 났는지 봅니다." },
  "/ops/feedback": { title: "사람 평가", description: "결과 카드에 남긴 맞음 · 안 맞음과 그 이유입니다. 이유마다 먼저 볼 에이전트를 알려 줍니다." },
  "/ops/agents": { title: "에이전트", description: "그래프 구성과 에이전트 명세, 최근 성적입니다." },
  "/ops/eval": { title: "평가", description: "평가 데이터셋으로 잰 점수와 배포 기준을 비교합니다." },
  "/ops/observe": { title: "관측", description: "에이전트별 응답 시간, 토큰, 비용을 봅니다." },
  "/ops/diagnose": { title: "진단", description: "키 · 토큰, 외부 연결, 기록 무결성을 점검합니다." },
  "/ops/gates": { title: "배포 판정", description: "버전마다 내린 판정과 그 이유입니다." },
};

/** Ops 페이지 제목 — 메뉴는 왼쪽 사이드바가 맡는다 */
export default function OpsNav() {
  const path = usePathname();
  const t = TITLES[path] ?? TITLES["/ops"];
  return <PageHeader title={t.title} description={t.description} />;
}
