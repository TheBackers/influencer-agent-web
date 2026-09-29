"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import type { Dossier } from "@/types/v2";
import { Avatar, UnconfirmedBadge, compact, tbl } from "./ui";
import DossierRow from "./dossier-card";

export type SortKey = "score" | "ig" | "yt" | "trend" | "sponsored";

const COLS: { key: SortKey | null; label: string; align?: "right" }[] = [
  { key: null, label: "인플루언서" },
  { key: "ig", label: "인스타 팔로워", align: "right" },
  { key: "yt", label: "유튜브 구독자", align: "right" },
  { key: "trend", label: "최근 90일 흐름", align: "right" },
  { key: "sponsored", label: "협찬", align: "right" },
  { key: "score", label: "조건", align: "right" },
];

interface Props {
  list: Dossier[];
  sort: SortKey;
  onSort: (k: SortKey) => void;
  onOpen: (d: Dossier) => void;
  selected?: string;
}

/** 결과 표 — 기본 보기. 머리글을 눌러 정렬, 행을 눌러 상세. 좁은 화면에서는 목록으로 바뀐다 */
export default function DossierTable({ list, sort, onSort, onOpen, selected }: Props) {
  return (
    <>
      <div className="surface relative overflow-x-auto hidden md:block">
        <table className="w-full border-collapse text-[13.5px] tabular">
          <thead>
            <tr>
              <th scope="col" className={`${tbl.th} w-[44px] text-right`}>#</th>
              {COLS.map((c) => (
                <th key={c.label} scope="col" className={`${tbl.th} ${c.align === "right" ? "text-right" : ""}`}
                  aria-sort={c.key && sort === c.key ? "descending" : undefined}>
                  {c.key ? (
                    <button type="button" onClick={() => onSort(c.key!)} className={`inline-flex items-center gap-1 hover:text-[var(--foreground)] ${sort === c.key ? "text-[var(--foreground)]" : ""}`}>
                      {c.label}
                      {sort === c.key ? <ArrowDown size={12} aria-hidden /> : <ArrowUp size={12} aria-hidden className="opacity-0" />}
                    </button>
                  ) : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((d, i) => {
              const yt = d.youtube, ig = d.instagram;
              const on = selected === d.handle;
              return (
                <tr key={d.handle} onClick={() => onOpen(d)} className={`cursor-pointer ${on ? "bg-[var(--accent-bg)]" : "hover:bg-[var(--soft)]"}`}>
                  <td className={`${tbl.td} text-right text-[var(--dim)]`}>{i + 1}</td>
                  <td className={tbl.td}>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(d); }} className="flex items-center gap-2.5 text-left min-w-0">
                      <Avatar name={d.name} hue={d.avatar_hue} src={d.avatar} size={28} />
                      <span className="min-w-0">
                        <span className="block font-medium truncate">{d.name}</span>
                        <span className="block text-[12px] text-[var(--dim)] truncate">{d.handle}</span>
                        <UnconfirmedBadge d={d} />
                      </span>
                    </button>
                  </td>
                  <td className={`${tbl.td} text-right`}>
                    {ig ? compact(ig.followers) : "—"}
                    <span className="block text-[12px] text-[var(--dim)]">{ig ? (ig.engagement_known ? `참여 ${ig.engagement_rate}%` : "지표 비공개") : ""}</span>
                  </td>
                  <td className={`${tbl.td} text-right`}>
                    {yt ? compact(yt.followers) : "—"}
                    <span className="block text-[12px] text-[var(--dim)]">{yt?.engagement_known ? `조회율 ${yt.engagement_rate}%` : ""}</span>
                  </td>
                  <td className={`${tbl.td} text-right`}>{yt?.trend?.known ? `${yt.trend.ratio.toFixed(2)}배` : "—"}</td>
                  <td className={`${tbl.td} text-right`}>{d.sponsored_count ? `${d.sponsored_count}건` : <span className="text-[var(--dim)]">없음</span>}</td>
                  <td className={`${tbl.td} text-right whitespace-nowrap`}>
                    <span className={d.score.must_pass === d.score.must_total ? "" : "text-[var(--unknown)]"}>필수 {d.score.must_pass}/{d.score.must_total}</span>
                    <span className="block text-[12px] text-[var(--dim)]">참고 {d.score.nice_pass}/{d.score.nice_total}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="md:hidden m-0 p-0 list-none surface divide-y divide-[var(--border)]">
        {list.map((d, i) => <DossierRow key={d.handle} d={d} rank={i + 1} onOpen={() => onOpen(d)} />)}
      </ul>
    </>
  );
}
