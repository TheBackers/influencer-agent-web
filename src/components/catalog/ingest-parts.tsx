/** 적재 화면 칸 머리 — src/app/catalog/ingest/page.tsx (v4) */
import type { ReactNode } from "react";

export function SectionTitle({ title, hint, right }: { title: string; hint?: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-1 px-4 pt-3 pb-2">
      <div className="min-w-0">
        <h2 className="m-0 text-[14px] font-semibold">{title}</h2>
        {hint && <p className="m-0 mt-0.5 text-[12px] text-[var(--dim)]">{hint}</p>}
      </div>
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}
