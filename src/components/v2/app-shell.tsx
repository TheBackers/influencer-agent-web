"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Activity, ListTree, Network, Stethoscope, ThumbsUp, Gauge, ClipboardCheck, BadgeCheck } from "lucide-react";
import { USE_MOCK } from "@/lib/api-v2";

const NAV = [
  { href: "/", label: "인플루언서 검색", icon: Search, exact: true },
  { group: "AgentOps" },
  { href: "/ops", label: "개요", icon: Activity, exact: true },
  { href: "/ops/trace", label: "검색 추적", icon: ListTree },
  { href: "/ops/observe", label: "관측 (SLO)", icon: Gauge },
  { href: "/ops/eval", label: "품질 평가", icon: ClipboardCheck },
  { href: "/ops/feedback", label: "사람 평가", icon: ThumbsUp },
  { href: "/ops/golden", label: "골든셋", icon: BadgeCheck },
  { href: "/ops/agents", label: "에이전트", icon: Network },
  { href: "/ops/diagnose", label: "진단", icon: Stethoscope },
] as const;

/** 대시보드 셸 — 왼쪽 메뉴 + 본문. 좁은 화면에서는 위쪽 가로 메뉴 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen lg:flex">
      <aside className="min-w-0 lg:w-[208px] lg:shrink-0 lg:border-r border-b lg:border-b-0 border-[var(--border)] bg-[var(--panel)] lg:sticky lg:top-0 lg:h-screen flex lg:flex-col">
        <div className="px-4 h-[52px] flex items-center font-semibold text-[14px] shrink-0">influencer-agent</div>
        <nav aria-label="주 메뉴" className="flex lg:flex-col gap-0.5 px-2 pb-2 lg:pb-2 min-w-0 relative overflow-x-auto lg:overflow-visible items-center lg:items-stretch">
          {NAV.map((n, i) => {
            if ("group" in n) {
              return <div key={i} className="hidden lg:block px-2 pt-4 pb-1 text-[11.5px] font-medium text-[var(--dim)]">{n.group}</div>;
            }
            const on = "exact" in n && n.exact ? path === n.href : path.startsWith(n.href);
            const Icon = n.icon;
            return (
              <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined}
                className={`flex items-center gap-2 px-2.5 h-[32px] rounded-md text-[13px] no-underline whitespace-nowrap ${
                  on ? "bg-[var(--soft)] text-[var(--foreground)] font-semibold" : "text-[var(--ink-2)] hover:bg-[var(--soft)]"
                }`}>
                <Icon aria-hidden size={15} strokeWidth={1.8} className={on ? "text-[var(--accent)]" : "text-[var(--dim)]"} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        {USE_MOCK && (
          <p className="hidden lg:block mt-auto m-0 px-4 py-3 text-[11.5px] leading-snug text-[var(--dim)] border-t border-[var(--border)]">
            목업 데이터로 동작 중입니다. 인물은 모두 예시입니다.
          </p>
        )}
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
