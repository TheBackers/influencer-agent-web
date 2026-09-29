"use client";

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ExternalLink, Lock, Pencil, X } from "lucide-react";
import { Avatar, VerdictBadge, compact, fmtDate, num } from "@/components/v2/ui";
import { getPerson, patchPerson } from "@/lib/api-catalog";
import type { Person, PersonPatch } from "@/types/catalog";
import {
  CONTACT_KO, Confidence, ContactStateDot, Dot, Empty, FreshDot, LINK_KO, OriginTag, PLATFORM_KO, StatusNote, TYPE_KO, agoText,
} from "./bits";
import PersonEdit from "./person-edit";

type Tab = "summary" | "activity" | "deals" | "contacts" | "mentions" | "verdicts" | "history";
const TABS: { key: Tab; label: string }[] = [
  { key: "summary", label: "요약" },
  { key: "activity", label: "활동" },
  { key: "deals", label: "협찬" },
  { key: "contacts", label: "연락처" },
  { key: "mentions", label: "외부 언급" },
  { key: "verdicts", label: "판정 이력" },
  { key: "history", label: "기록" },
];

interface Props {
  id: string;
  /** 정보 고치기에서 고를 분야 목록 */
  topics: string[];
  onClose: () => void;
  /** 고친 뒤 목록을 다시 불러오게 알린다 */
  onChanged?: (p: Person) => void;
}

/** 인물 상세 — 오른쪽 패널(좁은 화면은 전체 화면). 인물이 바뀌면 부모가 key 로 새로 만든다 */
export default function PersonDrawer({ id, topics, onClose, onChanged }: Props) {
  const [p, setP] = useState<Person | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<Tab>("summary");
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const load = useCallback(() => getPerson(id).then(setP).catch((e) => setErr(String(e?.message || e))), [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async (patch: PersonPatch) => {
    const np = await patchPerson(id, patch);
    setP(np);
    onChanged?.(np);
    return np;
  };

  return (
    <aside ref={ref} tabIndex={-1} aria-label={p ? `${p.name} 상세` : "인물 상세"} style={{ outline: "none" }}
      className="fixed inset-0 z-30 md:inset-y-0 md:left-auto md:right-0 md:w-[500px] bg-[var(--panel)] md:border-l border-[var(--border)] flex flex-col outline-none focus-visible:outline-none [overscroll-behavior:contain]">
      <header className="flex items-center gap-3 px-5 h-[64px] shrink-0 border-b border-[var(--border)]">
        {p && <Avatar name={p.name} hue={p.avatar_hue} size={36} />}
        <div className="min-w-0">
          <h2 className="m-0 text-[15px] font-semibold truncate">{p?.name ?? "불러오는 중…"}</h2>
          {p && (
            <p className="m-0 text-[12.5px] text-[var(--dim)] truncate flex items-center gap-2">
              <span>{p.handle}</span><span aria-hidden>·</span><span>{TYPE_KO[p.account_type]}</span><StatusNote s={p.status} />
            </p>
          )}
        </div>
        <button type="button" onClick={onClose} aria-label="닫기" className="ml-auto p-1.5 rounded-md text-[var(--dim)] hover:bg-[var(--soft)]">
          <X size={18} aria-hidden />
        </button>
      </header>

      {err && <p role="alert" className="m-0 px-5 py-4 text-[13px]" style={{ color: "var(--fail)" }}>불러오지 못했습니다 — {err}</p>}

      {p && editing && (
        <div className="flex-1 overflow-y-auto px-5 py-4 text-[13.5px]">
          <PersonEdit p={p} topics={topics} onSave={save} onDone={() => setEditing(false)} />
        </div>
      )}

      {p && !editing && (
        <>
          <div role="tablist" aria-label="정보" className="flex gap-4 px-5 border-b border-[var(--border)] shrink-0 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.key} role="tab" type="button" id={`ptab-${t.key}`} aria-selected={tab === t.key} aria-controls="person-panel"
                onClick={() => setTab(t.key)}
                className={`h-[40px] text-[13px] whitespace-nowrap border-b-2 -mb-px ${tab === t.key ? "border-[var(--foreground)] font-semibold" : "border-transparent text-[var(--dim)] hover:text-[var(--foreground)]"}`}>
                {t.label}
                {t.key === "contacts" && p.contact_state === "needs_human" && <span aria-label="못 찾음" className="ml-1 inline-block w-[6px] h-[6px] rounded-full align-middle" style={{ background: "var(--unknown)" }} />}
              </button>
            ))}
          </div>
          <div role="tabpanel" id="person-panel" aria-labelledby={`ptab-${tab}`} className="flex-1 overflow-y-auto px-5 py-4 text-[13.5px]">
            <TabBoundary key={`${p.id}:${tab}`}>
              {tab === "summary" && <Summary p={p} />}
              {tab === "activity" && <Activities p={p} />}
              {tab === "deals" && <Deals p={p} />}
              {tab === "contacts" && <Contacts p={p} />}
              {tab === "mentions" && <Mentions p={p} />}
              {tab === "verdicts" && <Verdicts p={p} />}
              {tab === "history" && <History p={p} />}
            </TabBoundary>
          </div>
        </>
      )}

      {p && !editing && (
        <footer className="border-t border-[var(--border)] px-5 py-3 shrink-0 flex flex-wrap items-center gap-x-3 gap-y-2">
          <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center justify-center gap-1.5 h-[32px] px-3 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[13px] hover:bg-[var(--soft)]">
            <Pencil size={14} aria-hidden />정보 고치기
          </button>
          <span className="text-[12px] text-[var(--dim)]">고친 칸은 잠겨 적재가 덮어쓰지 않고, 골든셋 후보가 됩니다</span>
        </footer>
      )}
    </aside>
  );
}

/** 탭 하나가 깨져도 패널 전체가 넘어가지 않게 막는다 */
class TabBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <Empty>이 탭을 그리지 못했습니다. 다른 탭은 볼 수 있습니다.</Empty> : this.props.children;
  }
}

function Note({ tone, children }: { tone: "warn" | "info"; children: ReactNode }) {
  return (
    <div role="note" className="rounded-md border border-[var(--border)] bg-[var(--soft)] p-3 text-[12.5px] leading-relaxed">
      <p className="m-0" style={tone === "warn" ? { color: "var(--unknown)" } : undefined}>{children}</p>
    </div>
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

function Locked({ on }: { on: boolean }) {
  return on ? <Lock size={12} aria-label="사람이 고친 칸 — 적재가 덮어쓰지 않음" className="inline text-[var(--accent)] ml-1" /> : null;
}

const H = ({ children }: { children: ReactNode }) => <h3 className="m-0 mb-2 text-[12.5px] font-semibold text-[var(--dim)]">{children}</h3>;

function Summary({ p }: { p: Person }) {
  const ig = p.instagram, yt = p.youtube;
  return (
    <div className="flex flex-col gap-5">
      {p.status === "hidden" && <Note tone="info">숨긴 사람입니다 — 인플루언서 목록 · 검색에서 빠지고 갱신하지 않습니다(D26). 되돌리려면 &lsquo;정보 고치기 → 숨김 해제&rsquo;.</Note>}
      {p.status === "needs_review" && <Note tone="warn">연결된 계정 중 같은 사람인지 확실하지 않은 것이 있습니다(확신도 0.6 미만 · O9). 판정 · 측정에는 쓰지 않습니다.</Note>}
      {p.contact_state === "needs_human" && (
        <Note tone="warn">연락처를 못 찾았습니다 — 본인 계정에도, 검색 결과(나무위키 요약 · 기사 · 블로그)에도 이 사람의 인스타 · 이메일이 없었습니다. 확인한 곳이 있으면 &lsquo;정보 고치기 → 연락처 넣기&rsquo;로 넣어 주세요.</Note>
      )}
      <p className="m-0 leading-relaxed text-[var(--ink-2)]">{p.summary}</p>
      <dl className="m-0 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
        {ig && <Stat label="인스타 팔로워" value={ig.followers === null ? "조회 불가" : compact(ig.followers)} sub={ig.state === "unavailable" ? "개인 계정 — 30일 뒤 다시" : undefined} />}
        {yt && <Stat label="유튜브 구독자" value={compact(yt.subscribers)} />}
        <Stat label="최근 30일 게시물" value={num(p.posts_30d)} sub={`마지막 ${agoText(p.last_post_at)}`} />
        <Stat label="협찬 표시 (90일)" value={`${p.sponsored_90d}건`} sub={p.top_brands.join(" · ") || undefined} />
        <div>
          <dt className="text-[12px] text-[var(--dim)]">갱신</dt>
          <dd className="m-0 mt-1"><FreshDot f={p.freshness} at={p.refreshed_at} /></dd>
        </div>
        <div>
          <dt className="text-[12px] text-[var(--dim)]">연락처</dt>
          <dd className="m-0 mt-1"><ContactStateDot s={p.contact_state} /></dd>
        </div>
      </dl>

      <section>
        <H>분야 · 계정 종류</H>
        <p className="m-0">{p.topics.join(" · ")}<Locked on={p.locked.includes("topics")} /></p>
        <p className="m-0 mt-1 text-[var(--ink-2)]">{TYPE_KO[p.account_type]}<Locked on={p.locked.includes("account_type")} />
          {p.account_type !== "creator" && <span className="text-[var(--dim)]"> — 개인 크리에이터가 아니라 검색 후보에서 빠집니다</span>}
        </p>
      </section>

      <section>
        <H>계정 <Locked on={p.locked.includes("links")} /></H>
        <ul className="m-0 p-0 list-none flex flex-col divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {p.accounts.map((a) => (
            <li key={`${a.platform}:${a.handle}`} className="py-2.5 flex flex-col gap-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-[52px] text-[12px] text-[var(--dim)]">{PLATFORM_KO[a.platform]}</span>
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="font-medium inline-flex items-center gap-1">{a.handle}<ExternalLink size={11} aria-hidden /></a>
                {a.followers !== null && <span className="tabular text-[12.5px] text-[var(--dim)]">{compact(a.followers)}</span>}
                {a.state === "unavailable" && <span className="text-[12px] text-[var(--dim)]">조회 불가</span>}
                <span className="ml-auto"><Confidence v={a.link.confidence} /></span>
              </div>
              <p className="m-0 pl-[60px] text-[12px] text-[var(--dim)]">
                {LINK_KO[a.link.how]}{a.link.note ? ` — ${a.link.note}` : ""}
                {a.link.evidence_url && <> · <a href={a.link.evidence_url} target="_blank" rel="noopener noreferrer">근거</a></>}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Activities({ p }: { p: Person }) {
  if (!p.activities.length) return <Empty>모은 활동이 없습니다.</Empty>;
  return (
    <ul className="m-0 p-0 list-none flex flex-col divide-y divide-[var(--border)]">
      {p.activities.map((a) => (
        <li key={a.id} className="py-3 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[12px] text-[var(--dim)]">
            <span>{PLATFORM_KO[a.platform]} · {a.kind === "video" ? "영상" : a.kind === "blog" ? "블로그 글" : "게시물"}</span>
            <span className="tabular">{fmtDate(a.posted_at)}</span>
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1">열기<ExternalLink size={11} aria-hidden /></a>
          </div>
          <p className="m-0 leading-relaxed line-clamp-2">{a.text}</p>
          <p className="m-0 text-[12px] text-[var(--dim)] tabular flex flex-wrap gap-x-3">
            {a.views !== null && <span>조회 {compact(a.views)}</span>}
            {a.likes !== null && <span>좋아요 {compact(a.likes)}</span>}
            {a.comments !== null && <span>댓글 {num(a.comments)}</span>}
            {a.sponsored && <Dot color="var(--accent)" strong>협찬 표시 {a.signals.join(" · ")}{a.brands.length ? ` — ${a.brands.join(" · ")}` : ""}</Dot>}
          </p>
          {a.text_expires_at && <p className="m-0 text-[11.5px] text-[var(--dim)]">제목 · 설명은 {fmtDate(a.text_expires_at)}에 지웁니다(유튜브 API 정책 · D30)</p>}
        </li>
      ))}
    </ul>
  );
}

function Deals({ p }: { p: Person }) {
  if (!p.deals.length) return <Empty>협찬 표시가 있는 게시물이 없습니다. 표시 없이 한 협업은 보이지 않습니다.</Empty>;
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-[12.5px] text-[var(--dim)]">게시물의 #광고 · #협찬 · #제공 · 유료 광고 표시와 언급 브랜드로 만든 이력입니다.</p>
      {p.deals.map((d) => (
        <div key={d.brand} className="rounded-md border border-[var(--border)] p-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <b>{d.brand}</b><span className="text-[12px] text-[var(--dim)]">{d.category}</span>
            <span className="ml-auto tabular text-[12.5px]">{d.count}건 · 마지막 {fmtDate(d.last_seen)}</span>
          </div>
          <ul className="m-0 mt-1.5 p-0 list-none flex flex-col gap-0.5 text-[12.5px]">
            {d.evidence.slice(0, 3).map((e) => (
              <li key={e.url} className="flex gap-2">
                <span className="tabular text-[var(--dim)]">{fmtDate(e.posted_at)}</span>
                <a href={e.url} target="_blank" rel="noopener noreferrer">{PLATFORM_KO[e.platform]} {e.signal}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Contacts({ p }: { p: Person }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-[12.5px] text-[var(--dim)] leading-relaxed">
        인스타는 DM 창구입니다. 본인 계정에 없으면 검색(나무위키 요약 · 기사 · 블로그)에서 찾고, 그 글에 이 사람의 계정 주소가 함께 있을 때만 받습니다(D24 · D34). 전화번호는 모으지 않습니다.
      </p>
      {p.contacts.length === 0 ? (
        <Note tone="warn">연락처를 못 찾았습니다. &lsquo;정보 고치기 → 연락처 넣기&rsquo;로 넣으면 골든셋 후보도 됩니다.</Note>
      ) : (
        <ul className="m-0 p-0 list-none flex flex-col divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {p.contacts.map((c, i) => (
            <li key={`${c.kind}:${c.value}:${i}`} className="py-2.5 flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-[76px] text-[12px] text-[var(--dim)]">{CONTACT_KO[c.kind]}</span>
                {c.kind === "email"
                  ? <a href={`mailto:${c.value}`} className="font-medium break-all">{c.value}</a>
                  : c.kind === "instagram"
                    ? <span className="font-medium">{c.value}</span>
                    : <a href={c.value} target="_blank" rel="noopener noreferrer" className="font-medium break-all">{c.value}</a>}
                {c.label && <span className="text-[12px] text-[var(--dim)]">{c.label}</span>}
                <span className="ml-auto"><OriginTag o={c.origin} /></span>
              </div>
              <p className="m-0 pl-[84px] text-[12px] text-[var(--dim)]">
                어디서: {c.source_url ? <a href={c.source_url} target="_blank" rel="noopener noreferrer">{c.source_label}</a> : c.source_label} · {fmtDate(c.found_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Mentions({ p }: { p: Person }) {
  if (!p.mentions.length) return <Empty>모은 외부 언급이 없습니다(개인 크리에이터만 90일마다 찾습니다).</Empty>;
  return (
    <ul className="m-0 p-0 list-none flex flex-col divide-y divide-[var(--border)]">
      {p.mentions.map((m) => (
        <li key={m.url} className="py-3 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[12px] text-[var(--dim)]">
            {m.about === "본인 확인" ? <Dot color="var(--pass)" strong>본인 확인</Dot> : <Dot color="var(--unknown)" strong title="이름만 같음 — 참고용">이름 일치</Dot>}
            <span>{m.kind}</span><span className="tabular">{fmtDate(m.date)}</span>
          </div>
          <a href={m.url} target="_blank" rel="noopener noreferrer" className="font-medium">{m.title}</a>
          <p className="m-0 text-[12.5px] text-[var(--ink-2)] line-clamp-2">{m.snippet}</p>
        </li>
      ))}
    </ul>
  );
}

function Verdicts({ p }: { p: Person }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-[12.5px] text-[var(--dim)] leading-relaxed">
        검색에서 이 사람을 판정한 기록입니다. 같은 조건 · 같은 버전(동작 지문)이면 30일(기간이 붙은 조건은 14일) 안에는 다시 판정하지 않고 재사용합니다(D35).
      </p>
      {p.verdicts.length === 0 ? <Empty>아직 검색에서 판정한 적이 없습니다.</Empty> : (
        <ul className="m-0 p-0 list-none flex flex-col divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {p.verdicts.map((v, i) => (
            <li key={`${v.mission_id}:${i}`} className="py-2.5 flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-medium">{v.condition}</span>
                <span className="ml-auto"><VerdictBadge v={v.verdict} /></span>
              </div>
              <p className="m-0 text-[12px] text-[var(--dim)] tabular">
                {fmtDate(v.checked_at)} · 근거 {v.links.length}개 · 지문 <code>{v.build}</code>{v.source === "human" ? " · 사람 확정" : ""}
              </p>
              <p className="m-0 text-[12px] text-[var(--dim)] truncate" title={v.request}>요청: {v.request}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function History({ p }: { p: Person }) {
  return (
    <ol className="m-0 p-0 list-none flex flex-col gap-3">
      {p.history.map((h, i) => (
        <li key={i} className="grid grid-cols-[84px_1fr] gap-3">
          <span className="text-[12px] text-[var(--dim)] tabular">{fmtDate(h.at)}</span>
          <div>
            <p className="m-0"><span className="text-[12px] text-[var(--dim)] mr-1.5">{h.by}</span>{h.what}</p>
            {h.detail && <p className="m-0 text-[12px] text-[var(--dim)]">{h.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
