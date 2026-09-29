/**
 * 인물 DB 화면 공용 조각. 원칙은 v2 ui.tsx 와 같다 — 상태는 점 + 글자, 값은 그냥 글자, 숫자는 tabular.
 */
import type { AccountType, CatalogPlatform, ContactKind, ContactOrigin, ContactState, Freshness, LinkHow, PersonStatus } from "@/types/catalog";

export const TYPE_KO: Record<AccountType, string> = {
  creator: "개인 크리에이터", brand: "브랜드", store: "매장", media: "매체", institution: "기관", unknown: "모름",
};
export const PLATFORM_KO: Record<CatalogPlatform, string> = { instagram: "인스타", youtube: "유튜브", blog: "블로그" };
export const CONTACT_KO: Record<ContactKind, string> = { instagram: "인스타 DM", email: "이메일", link: "링크모음", kakao: "카카오 채널", site: "웹사이트" };
export const ORIGIN_KO: Record<ContactOrigin, string> = { self: "본인 공개", external: "외부 글", human: "관리자" };
export const LINK_KO: Record<LinkHow, string> = {
  discovered: "주 계정", anchor: "소개 · 설명란 링크", web: "외부 글에 함께 적힘", llm: "검색 중 LLM 연결", human: "관리자 확인",
};

/** 점 + 글자 — 상태 표시 한 가지 모양 */
export function Dot({ color, children, strong = false, title }: { color: string; children: React.ReactNode; strong?: boolean; title?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] ${strong ? "font-medium" : ""}`} style={strong ? { color } : undefined} title={title}>
      <span aria-hidden className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: color }} />
      {children}
    </span>
  );
}

const DAY = 86_400_000;
/** '오늘' · 'N일 전' — 목업 기준 시각과 가까운 날짜만 쓰므로 브라우저 시각 기준으로 센다 */
export function daysAgo(iso?: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : Math.max(0, Math.floor((Date.now() - t) / DAY));
}
export function agoText(iso?: string | null): string {
  const d = daysAgo(iso);
  return d === null ? "—" : d === 0 ? "오늘" : `${d}일 전`;
}

const FRESH: Record<Freshness, { label: string; color: string }> = {
  fresh: { label: "신선", color: "var(--pass)" },
  stale: { label: "14일 넘음", color: "var(--unknown)" },
  expired: { label: "30일 넘음", color: "var(--fail)" },
};
/** 갱신일 — 14일 안이면 신선(초록), 넘으면 노랑, 30일 넘으면 빨강(유튜브 글은 지워짐) */
export function FreshDot({ f, at }: { f: Freshness; at: string }) {
  return <Dot color={FRESH[f].color} title={FRESH[f].label}>{agoText(at)}</Dot>;
}

const CSTATE: Record<ContactState, { label: string; color: string }> = {
  found: { label: "있음", color: "var(--pass)" },
  pending: { label: "찾기 전", color: "var(--border-strong)" },
  needs_human: { label: "못 찾음", color: "var(--unknown)" },
};
export function ContactStateDot({ s }: { s: ContactState }) {
  return <Dot color={CSTATE[s].color} strong={s === "needs_human"}>{CSTATE[s].label}</Dot>;
}

export function StatusNote({ s }: { s: PersonStatus }) {
  if (s === "active") return null;
  return s === "hidden"
    ? <Dot color="var(--dim)" strong>숨김</Dot>
    : <Dot color="var(--unknown)" strong>확인 필요</Dot>;
}

/** 출처 — 값이 아니라 '어디서 왔나'라서 테두리 글자(배지 아님) */
export function OriginTag({ o }: { o: ContactOrigin }) {
  const color = o === "self" ? "var(--ink-2)" : o === "external" ? "var(--unknown)" : "var(--accent)";
  return (
    <span className="inline-flex items-center h-[20px] px-1.5 rounded border text-[11.5px] whitespace-nowrap" style={{ color, borderColor: "var(--border-strong)" }}>
      {ORIGIN_KO[o]}
    </span>
  );
}

/** 확신도 — 0.6 미만은 판정에 쓰지 않는다(O9) */
export function Confidence({ v }: { v: number }) {
  const color = v >= 0.85 ? "var(--pass)" : v >= 0.6 ? "var(--ink-2)" : "var(--unknown)";
  return <span className="tabular text-[12.5px]" style={{ color }} title={v < 0.6 ? "0.6 미만 — 판정에 쓰지 않음(O9)" : undefined}>{v.toFixed(2)}{v < 0.6 ? " · 확인 필요" : ""}</span>;
}

/** 빈 칸 · 불러오는 중 · 오류 한 줄 */
export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="m-0 py-6 text-center text-[13px] text-[var(--dim)]">{children}</p>;
}
export function ErrorLine({ msg }: { msg: string }) {
  return <p role="alert" className="m-0 surface px-4 py-3 text-[13px]" style={{ color: "var(--fail)" }}>불러오지 못했습니다 — {msg}</p>;
}

/** 막대 한 줄 — 값 / 상한 */
export function Meter({ value, max, warnAt = 0.8 }: { value: number; max: number; warnAt?: number }) {
  const r = max > 0 ? Math.min(1, value / max) : 0;
  const color = r >= 1 ? "var(--fail)" : r >= warnAt ? "var(--unknown)" : "var(--accent)";
  return (
    <span aria-hidden className="block h-[5px] w-full rounded-full bg-[var(--soft)] overflow-hidden">
      <span className="block h-full rounded-full" style={{ width: `${r * 100}%`, background: color }} />
    </span>
  );
}
