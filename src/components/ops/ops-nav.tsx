"use client";

import { usePathname } from "next/navigation";
import PageHeader from "@/components/v2/app-header";

const TITLES: Record<string, { title: string; description: string }> = {
  "/ops": { title: "AgentOps 개요", description: "지금 버전을 운영에 내보내도 되는지 한눈에 봅니다." },
  "/ops/trace": { title: "추적", description: "검색 한 건이 어떤 순서로 무엇을 했는지 이벤트 단위로 봅니다." },
  "/ops/eval": { title: "평가", description: "평가 데이터셋으로 잰 점수와 배포 기준을 비교합니다." },
  "/ops/observe": { title: "관측", description: "에이전트별 응답 시간, 토큰, 비용을 봅니다." },
  "/ops/diagnose": { title: "진단", description: "키, 쿼터, 품질 회귀 등 10가지 상태를 점검합니다." },
  "/ops/gates": { title: "배포 판정", description: "버전마다 내린 판정과 그 이유입니다." },
};

/** Ops 페이지 제목 — 메뉴는 왼쪽 사이드바가 맡는다 */
export default function OpsNav() {
  const path = usePathname();
  const t = TITLES[path] ?? TITLES["/ops"];
  return <PageHeader title={t.title} description={t.description} />;
}
