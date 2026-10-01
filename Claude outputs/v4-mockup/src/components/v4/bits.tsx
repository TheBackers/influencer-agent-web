"use client";

/** v4 화면 공용 조각 — 탭 · 상태 점(초록 · 노랑 · 빨강 · 회색) · 출처 이름. 상태는 색만으로 말하지 않고 글자를 함께 둔다 */
import type { ReactNode } from "react";
import type { Source, Tone, TopicOrigin, WorkerStatus } from "@/types/v4";

export const TONE: Record<Tone, { color: string; bg: string; label: string }> = {
  pass: { color: "var(--pass)", bg: "var(--pass-bg)", label: "통과" },
  warn: { color: "var(--unknown)", bg: "var(--unknown-bg)", label: "주의" },
  fail: { color: "var(--fail)", bg: "var(--fail-bg)", label: "문제" },
  none: { color: "var(--border-strong)", bg: "var(--soft)", label: "해당 없음" },
};

export const SOURCE_KO: Record<Source, string> = {
  web: "웹 씨앗", youtube: "유튜브 검색", snowball: "스노볼", request: "탐색 요청", live: "버튼 검색", human: "관리자",
};
export const SOURCE_HINT: Record<Source, string> = {
  web: "분야 낱말로 블로그 · 기사의 소개글을 찾아 계정을 줍는다",
  youtube: "‘<낱말> 유튜버’ 채널 검색(하루 10회)",
  snowball: "이미 모은 크리에이터의 글에 적힌 @계정 · 유튜브 추천 채널",
  request: "검색이 모자랄 때 넣은 요청 — 먼저 꺼낸다",
  live: "‘실시간으로 더 찾기’에서 선별만 통과한 후보",
  human: "관리자가 넣은 계정",
};
export const ORIGIN_KO: Record<TopicOrigin, string> = { seed: "기본", candidate: "기본", auto: "자동", request: "검색 요청", manual: "관리자" };

export function ToneDot({ tone, size = 8, title }: { tone: Tone; size?: number; title?: string }) {
  return <span aria-hidden title={title} className="inline-block rounded-full shrink-0" style={{ width: size, height: size, background: TONE[tone].color }} />;
}

/** 워커 상태 세 줄 — 정확도 · 배포 · 운영(D60) */
export function StatusLines({ w, compact = false }: { w: WorkerStatus; compact?: boolean }) {
  const rows: [string, Tone, string][] = [
    ["정확도", w.accuracy.tone, w.accuracy.label],
    ["배포", w.deploy.tone, w.deploy.label],
    ["운영", w.ops.tone, w.ops.label],
  ];
  return (
    <ul className={`m-0 p-0 list-none flex flex-col ${compact ? "gap-0.5" : "gap-1"}`}>
      {rows.map(([k, t, label]) => (
        <li key={k} className="flex items-center gap-1.5 text-[12px] min-w-0">
          <ToneDot tone={t} />
          <span className="text-[var(--dim)] w-[36px] shrink-0">{k}</span>
          <span className="min-w-0 truncate" title={label}>{label}</span>
        </li>
      ))}
    </ul>
  );
}

export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full text-[12px] font-medium whitespace-nowrap"
      style={{ color: TONE[tone].color, background: TONE[tone].bg }}>
      <ToneDot tone={tone} size={6} />{children}
    </span>
  );
}

/** 탭 — 화면 안 전환(주소는 ?tab= 로 남긴다) */
export function Tabs<K extends string>({ tabs, value, onChange, label }: { tabs: { k: K; label: string; n?: number }[]; value: K; onChange: (k: K) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 border-b border-[var(--border)] overflow-x-auto">
      {tabs.map((t) => {
        const on = t.k === value;
        return (
          <button key={t.k} role="tab" type="button" aria-selected={on} onClick={() => onChange(t.k)}
            className={`h-[36px] px-3 -mb-px border-0 border-b-2 bg-transparent text-[13px] whitespace-nowrap ${on ? "border-[var(--accent)] text-[var(--foreground)] font-semibold" : "border-transparent text-[var(--ink-2)] hover:text-[var(--foreground)]"}`}>
            {t.label}{t.n !== undefined && <span className="ml-1 tabular text-[var(--dim)] font-normal">{t.n}</span>}
          </button>
        );
      })}
    </div>
  );
}

export const usd = (v: number, d = 2) => `$${v.toFixed(d)}`;
export const hhmm = (iso: string) => new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
export function ago(iso: string): string {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}분 전`;
  if (m < 60 * 24) return `${Math.round(m / 60)}시간 전`;
  return `${Math.round(m / 1440)}일 전`;
}
