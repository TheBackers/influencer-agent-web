"use client";

import { Download } from "lucide-react";
import type { Dossier, MissionResult } from "@/types/v2";
import { btn } from "./ui";

/** 결과 제목 줄 — 인원 · 걸린 시간 · 비용 · CSV 내보내기 */
export default function ResultsToolbar({ result, list }: { result: MissionResult; list: Dossier[] }) {
  const min = Math.floor(result.elapsed_s / 60);
  const exportCsv = () => {
    const rows = [
      ["순위", "이름", "핸들", "인스타 팔로워", "인스타 참여율", "유튜브 구독자", "유튜브 참여율", "최근 90일 흐름", "협찬", "필수", "참고"],
      ...list.map((d, i) => [
        i + 1, d.name, d.handle, d.instagram?.followers ?? "", d.instagram?.engagement_known ? d.instagram.engagement_rate : "",
        d.youtube?.followers ?? "", d.youtube?.engagement_rate ?? "", d.youtube?.trend?.ratio ?? "", d.sponsored_count,
        `${d.score.must_pass}/${d.score.must_total}`, `${d.score.nice_pass}/${d.score.nice_total}`,
      ]),
    ];
    const csv = "﻿" + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `${result.mission_id}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
      <div>
        <h2 className="m-0 text-[15px] font-semibold tabular">결과 {list.length}명</h2>
        <p className="m-0 mt-0.5 text-[12.5px] text-[var(--dim)] tabular">
          {min}분 {Math.round(result.elapsed_s % 60)}초 걸렸고 비용은 ${result.cost.usd.toFixed(2)}입니다.
          {result.extra_passed > 0 && ` 조건을 통과한 ${result.extra_passed}명이 더 있습니다.`}
        </p>
      </div>
      <button type="button" onClick={exportCsv} className={`${btn.secondary} ml-auto`}>
        <Download size={14} aria-hidden />CSV 내보내기
      </button>
    </div>
  );
}
