"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import PageHeader from "@/components/v2/app-header";
import { btn, num } from "@/components/v2/ui";
import PeopleTable from "@/components/catalog/people-table";
import PersonDrawer from "@/components/catalog/person-drawer";
import { Empty, ErrorLine, TYPE_KO } from "@/components/catalog/bits";
import { getPeople } from "@/lib/api-catalog";
import { USE_MOCK } from "@/lib/api-v2";
import type { AccountType, CatalogPlatform, PeoplePage, PeopleQuery, PeopleSort, SponsorFilter } from "@/types/catalog";

const FOLLOWERS: { k: string; label: string; min: number | null; max: number | null }[] = [
  { k: "any", label: "팔로워 전체", min: null, max: null },
  { k: "lt1", label: "1만 미만", min: null, max: 9_999 },
  { k: "1-20", label: "1만 ~ 20만", min: 10_000, max: 200_000 },
  { k: "1-5", label: "1만 ~ 5만", min: 10_000, max: 50_000 },
  { k: "5-20", label: "5만 ~ 20만", min: 50_000, max: 200_000 },
  { k: "gt20", label: "20만 이상", min: 200_000, max: null },
];
const SORTS: { k: PeopleSort; label: string }[] = [
  { k: "refreshed", label: "최근 갱신 순" },
  { k: "followers", label: "팔로워 많은 순" },
  { k: "activity", label: "활동 많은 순" },
  { k: "sponsored", label: "협찬 많은 순" },
];
const sel = "h-[32px] px-2 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[13px]";

/** 인플루언서 목록 — 적재가 DB에 모은 인플루언서를 거르고, 행을 눌러 상세 · 정보 고치기 */
export default function CatalogPage() {
  const [q, setQ] = useState<PeopleQuery>({ sort: "refreshed", account_type: "creator" });
  const [text, setText] = useState("");
  const [fk, setFk] = useState("any");
  const [page, setPage] = useState<PeoplePage | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [allTopics, setAllTopics] = useState<string[]>([]);

  const load = useCallback(() => getPeople(q).then((p) => { setPage(p); setErr(""); }).catch((e) => setErr(String(e?.message || e))), [q]);
  useEffect(() => { load(); }, [load]);
  // 분야 목록(정보 고치기용)은 필터와 상관없이 한 번
  useEffect(() => { getPeople({ limit: 1 }).then((p) => setAllTopics(p.topics.map((t) => t.name))).catch(() => {}); }, []);

  // 목업 검토용 바로가기: /catalog?person=p04 · ?contact=missing · ?hidden=1
  useEffect(() => {
    const s = new URLSearchParams(window.location.search);
    const person = s.get("person"), contact = s.get("contact"), hidden = s.get("hidden");
    const t = setTimeout(() => {
      if (contact === "missing" || contact === "has") setQ((cur) => ({ ...cur, contact }));
      if (hidden === "1") setQ((cur) => ({ ...cur, hidden: true, account_type: "any" }));
      if (person) setOpen(person);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const set = (patch: Partial<PeopleQuery>) => setQ((cur) => ({ ...cur, ...patch }));
  const toggleTopic = (t: string) => set({ topics: q.topics?.includes(t) ? q.topics.filter((x) => x !== t) : [...(q.topics ?? []), t] });
  const submitText = (e: React.FormEvent) => { e.preventDefault(); set({ q: text.trim() || undefined }); };
  const reset = () => { setText(""); setFk("any"); setQ({ sort: "refreshed", account_type: "creator" }); };

  return (
    <>
      <PageHeader
        title="인플루언서 목록"
        description="적재가 인플루언서 DB에 모은 사람들입니다. 행을 누르면 계정 · 활동 · 협찬 · 연락처 · 외부 언급 · 판정 이력을 보고 고칠 수 있습니다."
        actions={<Link href="/catalog/ingest" className={`${btn.secondary} no-underline text-[var(--foreground)]`}>적재 현황</Link>}
      />

      <section className="surface px-4 py-3 flex flex-col gap-3" aria-label="필터">
        <form onSubmit={submitText} className="flex flex-wrap gap-2 items-center">
          <label htmlFor="people-q" className="sr-only">이름 · 아이디 · 브랜드</label>
          <div className="relative flex-1 min-w-[200px] max-w-[360px]">
            <Search size={14} aria-hidden className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--dim)]" />
            <input id="people-q" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="이름 · 아이디 · 브랜드"
              className="w-full h-[32px] pl-8 pr-2.5 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[13px]" />
          </div>
          <label className="sr-only" htmlFor="f-platform">플랫폼</label>
          <select id="f-platform" className={sel} value={q.platform ?? "any"} onChange={(e) => set({ platform: e.target.value as CatalogPlatform | "any" })}>
            <option value="any">플랫폼 전체</option><option value="instagram">인스타</option><option value="youtube">유튜브</option><option value="blog">블로그</option>
          </select>
          <label className="sr-only" htmlFor="f-followers">팔로워</label>
          <select id="f-followers" className={sel} value={fk} onChange={(e) => { const f = FOLLOWERS.find((x) => x.k === e.target.value)!; setFk(f.k); set({ followers_min: f.min, followers_max: f.max }); }}>
            {FOLLOWERS.map((f) => <option key={f.k} value={f.k}>{f.label}</option>)}
          </select>
          <label className="sr-only" htmlFor="f-type">계정 종류</label>
          <select id="f-type" className={sel} value={q.account_type ?? "any"} onChange={(e) => set({ account_type: e.target.value as AccountType | "any" })}>
            <option value="any">계정 종류 전체</option>
            {(Object.keys(TYPE_KO) as AccountType[]).filter((k) => k !== "unknown").map((k) => <option key={k} value={k}>{TYPE_KO[k]}</option>)}
          </select>
          <label className="sr-only" htmlFor="f-sponsor">협찬</label>
          <select id="f-sponsor" className={sel} value={q.sponsor ?? "any"} onChange={(e) => set({ sponsor: e.target.value as SponsorFilter })}>
            <option value="any">협찬 전체</option><option value="none_90d">최근 90일 협찬 없음</option><option value="has_90d">최근 90일 협찬 있음</option>
          </select>
          <label className="sr-only" htmlFor="f-contact">연락처</label>
          <select id="f-contact" className={sel} value={q.contact ?? "any"} onChange={(e) => set({ contact: e.target.value as PeopleQuery["contact"] })}>
            <option value="any">연락처 전체</option><option value="has">연락처 있음</option><option value="missing">연락처 못 찾음 (채울 목록)</option>
          </select>
        </form>
        <div className="flex flex-wrap items-center gap-1.5">
          {(page?.topics ?? []).map((t) => {
            const on = q.topics?.includes(t.name) ?? false;
            return (
              <button key={t.name} type="button" aria-pressed={on} onClick={() => toggleTopic(t.name)}
                className={`h-[26px] px-2.5 rounded-full border text-[12.5px] whitespace-nowrap ${on ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)] font-medium" : "border-[var(--border-strong)] text-[var(--ink-2)] hover:bg-[var(--soft)]"}`}>
                {t.name} <span className="tabular text-[var(--dim)]">{t.count}</span>
              </button>
            );
          })}
          <span className="mx-1 h-[16px] w-px bg-[var(--border)]" aria-hidden />
          <label className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--ink-2)]">
            <input type="checkbox" checked={!!q.fresh_only} onChange={(e) => set({ fresh_only: e.target.checked || undefined })} />14일 안 갱신만
          </label>
          <label className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--ink-2)]">
            <input type="checkbox" checked={!!q.hidden} onChange={(e) => set({ hidden: e.target.checked || undefined })} />숨긴 사람
          </label>
          <button type="button" onClick={reset} className={`${btn.ghost} ml-auto`}>필터 초기화</button>
        </div>
      </section>

      {err && <ErrorLine msg={err} />}

      <section className="surface" aria-label="인플루언서 목록">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 h-[44px] border-b border-[var(--border)]">
          <p className="m-0 text-[13px] tabular">
            {page ? <><b>{num(page.matched)}명</b> <span className="text-[var(--dim)]">/ DB 전체 {num(page.total)}명{USE_MOCK ? " (목업은 예시 인물만)" : ""}</span></> : "불러오는 중…"}
          </p>
          <label className="sr-only" htmlFor="f-sort">정렬</label>
          <select id="f-sort" className={`${sel} ml-auto`} value={q.sort ?? "refreshed"} onChange={(e) => set({ sort: e.target.value as PeopleSort })}>
            {SORTS.map((s) => <option key={s.k} value={s.k}>{s.label}</option>)}
          </select>
        </div>
        {page && page.items.length === 0 ? <Empty>조건에 맞는 사람이 없습니다.</Empty> : page && <PeopleTable items={page.items} selected={open ?? undefined} onOpen={setOpen} />}
      </section>

      {open && <PersonDrawer key={open} id={open} topics={allTopics} onClose={() => setOpen(null)} onChanged={() => load()} />}
    </>
  );
}
