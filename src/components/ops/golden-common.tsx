/** 골든셋 화면 세 탭이 같이 쓰는 작은 조각 */
import type { LinkPlatform } from "@/types/v2";

export const PK: Record<LinkPlatform, string> = { youtube: "유튜브", instagram: "인스타" };

export const profileUrl = (p: LinkPlatform, h?: string | null) => {
  if (!h) return "";
  const x = h.replace(/^@/, "");
  if (p === "instagram") return `https://www.instagram.com/${x}/`;
  return x.startsWith("UC") && x.length >= 20 ? `https://www.youtube.com/channel/${x}` : `https://www.youtube.com/@${x}`;
};
export const shownHandle = (p: LinkPlatform, h?: string | null) => (!h ? "" : p === "youtube" && h.startsWith("UC") ? h : `@${h.replace(/^@/, "")}`);

export const SOURCE_KO: Record<string, string> = { run: "실행 기록", feedback: "사람 평가 👎", manual: "직접 입력", draft: "1차 초안" };

export const btn = "h-[28px] px-2.5 rounded-md border text-[12.5px] whitespace-nowrap";
export const inp = "h-[30px] px-2 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[12.5px]";

/** 글 속 주소를 링크로 */
export function Linkify({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)·,]+)/g);
  return <>{parts.map((x, i) => (x.startsWith("http")
    ? <a key={i} href={x} target="_blank" rel="noopener noreferrer" className="break-all">{x.replace(/^https?:\/\/(www\.)?/, "").slice(0, 48)}</a>
    : <span key={i}>{x}</span>))}</>;
}

export function StatusTabs<T extends string>({ value, onChange, counts, labels }: {
  value: T; onChange: (v: T) => void; counts: Record<T, number>; labels: Record<T, string>;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label="보기">
      {(Object.keys(labels) as T[]).map((k) => (
        <button key={k} type="button" onClick={() => onChange(k)} aria-pressed={value === k}
          className={`h-[28px] px-2.5 rounded-md border text-[12.5px] ${value === k ? "border-[var(--foreground)] font-medium" : "border-[var(--border-strong)] text-[var(--dim)]"}`}>
          {labels[k]} {counts[k] ?? 0}
        </button>
      ))}
    </div>
  );
}

export function Tile({ k, v, sub, bad }: { k: string; v: string; sub: string; bad?: boolean }) {
  return (
    <div className="surface px-4 py-3 min-w-0">
      <div className="text-[12px] text-[var(--dim)]">{k}</div>
      <div className={`text-[22px] font-semibold tabular ${bad ? "text-[var(--fail)]" : ""}`}>{v}</div>
      <div className="text-[11.5px] text-[var(--dim)] break-words">{sub}</div>
    </div>
  );
}
