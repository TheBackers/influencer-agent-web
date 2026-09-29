"use client";

import { Avatar, compact, tbl } from "@/components/v2/ui";
import type { PersonSummary } from "@/types/catalog";
import { ContactStateDot, FreshDot, StatusNote, TYPE_KO, agoText } from "./bits";

/** 인플루언서 목록 표 — 행을 누르면 오른쪽 패널 */
export default function PeopleTable({ items, selected, onOpen }: { items: PersonSummary[]; selected?: string; onOpen: (id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px] min-w-[820px]">
        <thead>
          <tr>
            <th className={tbl.th}>인물</th>
            <th className={tbl.th}>계정 종류</th>
            <th className={`${tbl.th} text-right`}>인스타</th>
            <th className={`${tbl.th} text-right`}>유튜브</th>
            <th className={tbl.th}>최근 30일</th>
            <th className={tbl.th}>협찬 (90일)</th>
            <th className={tbl.th}>연락처</th>
            <th className={tbl.th}>갱신</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => {
            const creator = p.account_type === "creator";
            return (
              <tr key={p.id} onClick={() => onOpen(p.id)} aria-selected={selected === p.id}
                className={`cursor-pointer hover:bg-[var(--soft)] ${selected === p.id ? "bg-[var(--accent-bg)]" : ""}`}>
                <td className={tbl.td}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={p.name} hue={p.avatar_hue} size={30} />
                    <div className="min-w-0">
                      <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(p.id); }}
                        className="p-0 bg-transparent border-0 text-left font-medium text-[var(--foreground)] hover:underline">
                        {p.name}
                      </button>
                      <p className="m-0 text-[12px] text-[var(--dim)] truncate max-w-[240px]">
                        {p.handle} · {p.topics.join(" · ")}{p.blog ? " · 블로그" : ""}
                      </p>
                    </div>
                    <span className="ml-1"><StatusNote s={p.status} /></span>
                  </div>
                </td>
                <td className={`${tbl.td} whitespace-nowrap ${creator ? "" : "text-[var(--dim)]"}`} title={creator ? undefined : "검색 후보가 아님"}>{TYPE_KO[p.account_type]}</td>
                <td className={`${tbl.td} text-right tabular whitespace-nowrap`}>
                  {p.instagram ? (p.instagram.followers === null ? <span className="text-[12px] text-[var(--dim)]">조회 불가</span> : compact(p.instagram.followers)) : <span className="text-[var(--dim)]">—</span>}
                </td>
                <td className={`${tbl.td} text-right tabular whitespace-nowrap`}>
                  {p.youtube ? compact(p.youtube.subscribers) : <span className="text-[var(--dim)]">—</span>}
                </td>
                <td className={`${tbl.td} tabular whitespace-nowrap`}>
                  {p.posts_30d}개
                  <span className="block text-[12px] text-[var(--dim)]">마지막 {agoText(p.last_post_at)}</span>
                </td>
                <td className={tbl.td}>
                  <span className="tabular">{p.sponsored_90d}건</span>
                  {p.top_brands.length > 0 && <span className="block text-[12px] text-[var(--dim)] whitespace-nowrap">{p.top_brands.join(" · ")}</span>}
                </td>
                <td className={`${tbl.td} whitespace-nowrap`}><ContactStateDot s={p.contact_state} /></td>
                <td className={`${tbl.td} whitespace-nowrap`}><FreshDot f={p.freshness} at={p.refreshed_at} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
