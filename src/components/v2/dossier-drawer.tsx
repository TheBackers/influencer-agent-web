"use client";

import { useEffect, useRef, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import type { ConditionSpec, Dossier, PlatformCard, WebItem, WebKind } from "@/types/v2";
import { Avatar, VerdictBadge, compact, num, pct } from "./ui";
import FeedbackBar, { type FeedbackInput } from "./feedback-bar";

type Tab = "summary" | "instagram" | "youtube" | "web" | "checks";
const TABS: { key: Tab; label: string }[] = [
  { key: "summary", label: "요약" },
  { key: "checks", label: "조건" },
  { key: "instagram", label: "인스타그램" },
  { key: "youtube", label: "유튜브" },
  { key: "web", label: "웹" },
];

interface Props {
  d: Dossier;
  conditions: ConditionSpec[];
  missionId: string;
  traceUrl: string;
  feedback?: 0 | 1;
  onFeedback: (f: FeedbackInput) => Promise<void>;
  onClose: () => void;
}

/** 인물 상세 — 오른쪽 패널(좁은 화면은 전체 화면). 인물이 바뀌면 부모가 key 로 새로 만든다 */
export default function DossierDrawer({ d, conditions, traceUrl, feedback, onFeedback, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("summary");
  const ref = useRef<HTMLElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside ref={ref} tabIndex={-1} aria-label={`${d.name} 상세`}
      className="fixed inset-0 z-30 md:inset-y-0 md:left-auto md:right-0 md:w-[460px] bg-[var(--panel)] md:border-l border-[var(--border)] flex flex-col outline-none focus-visible:outline-none [overscroll-behavior:contain]">
      <header className="flex items-center gap-3 px-5 h-[64px] shrink-0 border-b border-[var(--border)]">
        <Avatar name={d.name} hue={d.avatar_hue} src={d.avatar} size={36} />
        <div className="min-w-0">
          <h2 className="m-0 text-[15px] font-semibold truncate">{d.name}</h2>
          <p className="m-0 text-[12.5px] text-[var(--dim)] truncate">{d.handle}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="닫기" className="ml-auto p-1.5 rounded-md text-[var(--dim)] hover:bg-[var(--soft)]">
          <X size={18} aria-hidden />
        </button>
      </header>

      <div role="tablist" aria-label="정보" className="flex gap-4 px-5 border-b border-[var(--border)] shrink-0 relative overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} role="tab" type="button" id={`tab-${t.key}`} aria-selected={tab === t.key} aria-controls="drawer-panel"
            onClick={() => setTab(t.key)}
            className={`h-[40px] text-[13px] whitespace-nowrap border-b-2 -mb-px ${tab === t.key ? "border-[var(--foreground)] font-semibold" : "border-transparent text-[var(--dim)] hover:text-[var(--foreground)]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="drawer-panel" aria-labelledby={`tab-${tab}`} className="flex-1 overflow-y-auto px-5 py-4 text-[13.5px]">
        {tab === "summary" && <Summary d={d} />}
        {tab === "checks" && <Checks d={d} conditions={conditions} />}
        {tab === "instagram" && <PlatformTab p={d.instagram} kind="instagram" />}
        {tab === "youtube" && <PlatformTab p={d.youtube} kind="youtube" />}
        {tab === "web" && <WebTab items={d.web} />}
      </div>

      <footer className="border-t border-[var(--border)] px-5 py-3.5 shrink-0 space-y-2.5">
        <FeedbackBar key={d.handle} value={feedback} conditions={conditions} onSubmit={onFeedback} />
        <p className="m-0 text-[12px] text-[var(--dim)] tabular flex flex-wrap gap-x-3">
          <span>조사 비용 ${d.usage.cost_usd.toFixed(3)}, 도구 {d.usage.tool_calls}회, {d.usage.latency_s}초</span>
          <a href={traceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">실행 기록 보기<ExternalLink size={11} aria-hidden /></a>
        </p>
      </footer>
    </aside>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <dt className="text-[12px] text-[var(--dim)]">{label}</dt>
      <dd className="m-0 text-[17px] font-semibold tabular">{value}</dd>
      {sub && <dd className="m-0 text-[12px] text-[var(--dim)] tabular">{sub}</dd>}
    </div>
  );
}

function Summary({ d }: { d: Dossier }) {
  const ig = d.instagram, yt = d.youtube;
  return (
    <div className="flex flex-col gap-5">
      <p className="m-0 leading-relaxed text-[var(--ink-2)]">{d.summary}</p>
      <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-4">
        <Stat label="인스타 팔로워" value={ig ? compact(ig.followers) : "—"} sub={ig ? (ig.engagement_known ? `참여율 ${ig.engagement_rate}%` : "지표 비공개") : "계정 없음"} />
        <Stat label="유튜브 구독자" value={yt ? compact(yt.followers) : "—"} sub={yt ? `조회율 ${yt.engagement_rate}%` : "계정 없음"} />
        <Stat label="최근 90일 조회수 흐름" value={yt?.trend?.known ? `${yt.trend.ratio.toFixed(2)}배` : "—"} sub="이전 90일 대비" />
        <Stat label="협찬 표시 콘텐츠" value={`${d.sponsored_count}건`} sub="최근 1년" />
      </dl>
      {d.background.length > 0 && (
        <div>
          <h3 className="m-0 mb-1.5 text-[13px] font-semibold">알려진 정보</h3>
          <ul className="m-0 pl-4 space-y-1">
            {d.background.map((b, i) => (
              <li key={i}>{b.fact} {b.url && <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-[12.5px]">출처</a>}</li>
            ))}
          </ul>
        </div>
      )}
      {d.missing.length > 0 && <p className="m-0 text-[12.5px] text-[var(--dim)]">찾지 못한 정보: {d.missing.join(", ")}</p>}
    </div>
  );
}

function Checks({ d, conditions }: { d: Dossier; conditions: ConditionSpec[] }) {
  const byId = Object.fromEntries(d.checks.map((c) => [c.id, c]));
  return (
    <ul className="m-0 p-0 list-none divide-y divide-[var(--border)]">
      {conditions.filter((c) => !c.dropped).map((c) => {
        const chk = byId[c.id];
        return (
          <li key={c.id} className="py-3 first:pt-0">
            <div className="flex items-baseline gap-2">
              <span className="font-medium">{c.source_phrase}</span>
              <span className="text-[12px] text-[var(--dim)]">{c.weight === "must" ? "필수" : "참고"}</span>
              <span className="ml-auto"><VerdictBadge v={chk?.verdict ?? "unknown"} /></span>
            </div>
            <p className="m-0 mt-1 text-[13px] text-[var(--ink-2)]">{chk?.evidence ?? "판정 없음"}</p>
            <EvidenceLinks chk={chk} />
          </li>
        );
      })}
    </ul>
  );
}

/** 근거 — 판정에 쓴 게시물 · 영상을 하나씩. 계정 주소만 있으면 '프로필'로 따로 표시한다(게시물 근거가 아님) */
function EvidenceLinks({ chk }: { chk?: Dossier["checks"][number] }) {
  if (!chk) return null;
  const posts = chk.links?.length ? chk.links
    : chk.source_url && chk.source_kind !== "profile" ? [{ url: chk.source_url, title: chk.source_title }] : [];
  if (posts.length) {
    return (
      <ul className="m-0 mt-1 p-0 list-none flex flex-col gap-0.5">
        {posts.map((x, i) => (
          <li key={x.url} className="min-w-0">
            <a href={x.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12.5px] max-w-full">
              <span className="text-[var(--dim)] shrink-0">근거 게시물 {i + 1}</span>
              <span className="truncate">{x.title || x.url.replace(/^https?:\/\/(www\.)?/, "")}</span><ExternalLink size={11} aria-hidden className="shrink-0" />
            </a>
          </li>
        ))}
      </ul>
    );
  }
  if (chk.source_url) {
    return (
      <a href={chk.source_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12px] text-[var(--dim)] max-w-full">
        <span className="truncate">프로필 보기 (게시물 근거 없음)</span><ExternalLink size={11} aria-hidden className="shrink-0" />
      </a>
    );
  }
  return null;
}

function PlatformTab({ p, kind }: { p: PlatformCard | null; kind: "instagram" | "youtube" }) {
  if (!p) return <p className="m-0 text-[var(--dim)]">{kind === "instagram" ? "인스타그램" : "유튜브"} 계정을 찾지 못했습니다.</p>;
  const yt = kind === "youtube";
  return (
    <div className="flex flex-col gap-4">
      {p.link && <LinkBox p={p} />}
      <dl className="m-0 grid grid-cols-[120px_1fr] gap-y-1.5 text-[13px]">
        <dt className="text-[var(--dim)]">계정</dt>
        <dd className="m-0"><a href={p.url} target="_blank" rel="noopener noreferrer">{p.handle}</a></dd>
        <dt className="text-[var(--dim)]">{yt ? "구독자" : "팔로워"}</dt><dd className="m-0 tabular">{num(p.followers)}</dd>
        <dt className="text-[var(--dim)]">{p.platform === "youtube" ? "조회율" : "참여율"}</dt>
        <dd className="m-0 tabular">{p.engagement_known ? `${p.engagement_rate}%` : "개인 계정이라 읽을 수 없음"}
          {p.engagement_known && <span className="block text-[12px] text-[var(--dim)]">{p.engagement_basis}</span>}</dd>
        <dt className="text-[var(--dim)]">최근 90일 흐름</dt>
        <dd className="m-0 tabular">{p.trend?.known ? `이전 90일의 ${p.trend.ratio.toFixed(2)}배` : "확인 못 함"}</dd>
        {p.uploads_90d !== undefined && (<><dt className="text-[var(--dim)]">업로드</dt><dd className="m-0 tabular">최근 90일 {p.uploads_90d}건, 이전 {p.uploads_prev_90d}건</dd></>)}
        <dt className="text-[var(--dim)]">같은 사람일 확률</dt><dd className="m-0 tabular">{pct(p.identity_confidence)}</dd>
      </dl>
      {p.recent.length > 0 && (
        <div>
          <h3 className="m-0 mb-1 text-[13px] font-semibold">최근 {yt ? "영상" : "게시물"}</h3>
          <ul className="m-0 p-0 list-none divide-y divide-[var(--border)]">
            {p.recent.map((m, i) => (
              <li key={i} className="py-2">
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-[13px] leading-snug">{m.title}</a>
                <div className="text-[12px] text-[var(--dim)] tabular mt-0.5">
                  {new Intl.DateTimeFormat("ko-KR").format(new Date(m.date))}
                  {m.views !== undefined && `, 조회 ${compact(m.views)}`}
                  {m.likes !== undefined && `, 좋아요 ${compact(m.likes)}`}
                  {m.sponsored && ", 협찬 표시"}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** 다른 플랫폼 계정 — 어떻게 찾았고 왜 같은 사람으로 봤는지. 확신도가 낮아도 보여 주고 '확인 필요'로 표시한다 */
function LinkBox({ p }: { p: PlatformCard }) {
  const l = p.link!;
  return (
    <div className={`rounded-md border p-3 text-[12.5px] space-y-1.5 ${p.needs_review
      ? "border-[var(--unknown)]" : "border-[var(--border)]"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-[13px]">찾은 경로</span>
        <span className="tabular text-[var(--ink-2)]">같은 사람일 확률 {pct(p.identity_confidence)}</span>
        {p.needs_review && (
          <span className="inline-flex h-[20px] items-center rounded px-1.5 text-[11.5px] border border-[var(--unknown)] text-[var(--unknown)]">
            확인 필요 · 판정에 안 씀
          </span>
        )}
        {!l.verified && <span className="text-[var(--dim)]">API 미확인</span>}
      </div>
      <p className="m-0 text-[var(--ink-2)]">{l.how_found}</p>
      {l.identity_evidence.length > 0 && (
        <ul className="m-0 pl-4 text-[var(--ink-2)]">{l.identity_evidence.map((x, i) => <li key={i}>{x}</li>)}</ul>
      )}
      {l.counter_evidence.length > 0 && (
        <p className="m-0 text-[var(--dim)]">다른 사람일 수 있는 이유: {l.counter_evidence.join(" · ")}</p>
      )}
      {l.lookup_note && <p className="m-0 text-[var(--dim)]">{l.lookup_note}</p>}
      {l.link_source && (
        <a href={l.link_source} target="_blank" rel="noopener noreferrer" className="break-all">근거 글 열기</a>
      )}
    </div>
  );
}

const KIND_ORDER: WebKind[] = ["언론", "본인계정", "위키", "커뮤니티", "링크모음", "쇼핑", "기타"];

function WebTab({ items }: { items: WebItem[] }) {
  const rank = (w: WebItem) => (w.about === "이름 일치" ? 1 : 0);
  const sorted = [...items].sort((a, b) => rank(a) - rank(b) || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
  return (
    <div>
      <p className="m-0 mb-2 text-[12.5px] text-[var(--dim)]">
        아이디나 채널이 적힌 글만 &apos;본인 확인&apos;입니다. 이름만 같은 글은 동명이인일 수 있어 표시해 둡니다.
      </p>
      <ul className="m-0 p-0 list-none divide-y divide-[var(--border)]">
        {sorted.map((w, i) => (
          <li key={i} className="py-2.5">
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--dim)]">
              <span>{w.kind}{w.date ? `, ${new Intl.DateTimeFormat("ko-KR").format(new Date(w.date))}` : ""}</span>
              {w.about === "본인 확인" && <span className="text-[var(--ink-2)]">본인 확인</span>}
              {w.about === "이름 일치" && (
                <span className="inline-flex h-[20px] items-center rounded px-1.5 text-[11.5px] border border-[var(--unknown)] text-[var(--unknown)]">
                  이름만 일치 · 동명이인 주의
                </span>
              )}
            </div>
            <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-[13px] leading-snug">{w.title}</a>
            <div className="text-[12.5px] text-[var(--ink-2)] mt-0.5">{w.snippet}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
