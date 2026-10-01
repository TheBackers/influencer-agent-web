"use client";

import { usePathname } from "next/navigation";
import PageHeader from "@/components/v2/app-header";

const TITLES: Record<string, { title: string; description: string }> = {
  "/ops": { title: "AgentOps 개요", description: "지금 괜찮은가 — 배포 뒤 확인 · 지금 빌드 · 오늘 적재 · 최근 검색 · 빨간 것만. 줄마다 그 화면으로 갑니다." },
  "/ops/agents": { title: "에이전트", description: "단계와 워커를 한눈에 봅니다. 칩의 점 셋이 정확도 · 배포 · 운영입니다." },
  "/ops/trace": { title: "추적", description: "문제를 따라갑니다 — 검색은 인물 한 명의 길까지, 적재는 실행 → 노드 → 작업 → 호출까지. 끝은 LangSmith 트레이스." },
  "/ops/quality": { title: "정확도", description: "사람이 확정한 정답(골든셋)과 워커의 답을 맞춰 봅니다. 이 점수가 배포를 막고, 무엇을 고칠지 알려 줍니다." },
  "/ops/release": { title: "배포", description: "빌드마다 바뀐 워커 · CI 채점 · 게이트 · 배포 뒤 24시간 확인. 떨어진 빌드는 배포되지 않습니다(D56)." },
  "/ops/observe": { title: "관측", description: "SLO · 비용(모델 · CI · LangSmith) · 진단 H1~H10." },
};

/** Ops 페이지 제목 — 메뉴는 왼쪽 사이드바가 맡는다 */
export default function OpsNav() {
  const path = usePathname();
  const t = TITLES[path] ?? TITLES["/ops"];
  return <PageHeader title={t.title} description={t.description} />;
}
