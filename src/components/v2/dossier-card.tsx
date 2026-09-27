"use client";

import { ChevronRight } from "lucide-react";
import type { Dossier } from "@/types/v2";
import { Avatar, compact } from "./ui";

/** 좁은 화면용 결과 한 줄 (표 대신) */
export default function DossierRow({ d, rank, onOpen }: { d: Dossier; rank: number; onOpen: () => void }) {
  return (
    <li>
      <button type="button" onClick={onOpen} className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-[var(--soft)]">
        <span className="text-[12px] text-[var(--dim)] w-[18px] text-right tabular">{rank}</span>
        <Avatar name={d.name} hue={d.avatar_hue} src={d.avatar} size={32} />
        <span className="min-w-0 flex-1">
          <span className="block font-medium truncate">{d.name}</span>
          <span className="block text-[12.5px] text-[var(--dim)] tabular truncate">
            인스타 {d.instagram ? compact(d.instagram.followers) : "—"}, 유튜브 {d.youtube ? compact(d.youtube.followers) : "—"}
            {d.sponsored_count ? `, 협찬 ${d.sponsored_count}건` : ""}
          </span>
        </span>
        <ChevronRight aria-hidden size={16} className="text-[var(--dim)]" />
      </button>
    </li>
  );
}
