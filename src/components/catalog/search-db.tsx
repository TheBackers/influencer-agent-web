"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Info, Radar } from "lucide-react";
import { num } from "@/components/v2/ui";
import type { CatalogResultInfo, CatalogShortfall } from "@/types/catalog";

/**
 * 인플루언서 검색 결과에 붙는 DB 칸(설계서 10장 · D42) — 결과에 catalog 요약이 있을 때만 보인다.
 * 검색은 DB에서 먼저 찾고, 모자라면 실시간으로 채운다. 실시간으로 찾은 사람은 DB에 들어간다.
 */

/** 한 줄 요약 — DB에서 몇 명 · 실시간으로 몇 명 · 판정 재사용 · 정보가 얼마나 새것인가 */
export function DbResultSummary({ info }: { info: CatalogResultInfo }) {
  const live = info.from_live ?? 0;
  const saved = info.saved?.found_new ?? 0;
  if (info.enabled === false || !info.topic) {
    return (
      <p className="m-0 surface px-3.5 py-2.5 text-[12.5px] text-[var(--ink-2)] flex flex-wrap items-center gap-x-4 gap-y-1 tabular">
        <span className="inline-flex items-center gap-1.5 text-[var(--foreground)] font-medium"><Radar size={13} aria-hidden />실시간으로 찾음</span>
        <span>{info.enabled === false ? "인플루언서 DB가 연결되지 않아" : `요청 분야가 인플루언서 DB에 없어`} DB를 건너뛰었습니다</span>
        {saved > 0 && <span>찾은 {num(saved)}명은 DB에 넣었습니다(다음 적재가 정보를 모읍니다)</span>}
        {info.enabled !== false && <Link href="/catalog/ingest">분야 추가하기</Link>}
      </p>
    );
  }
  return (
    <p className="m-0 surface px-3.5 py-2.5 text-[12.5px] text-[var(--ink-2)] flex flex-wrap items-center gap-x-4 gap-y-1 tabular">
      <span className="inline-flex items-center gap-1.5 text-[var(--foreground)] font-medium"><Database size={13} aria-hidden />인플루언서 DB에서 {num(info.from_db ?? 0)}명</span>
      {live > 0 && <span className="inline-flex items-center gap-1.5"><Radar size={13} aria-hidden />모자라서 실시간으로 {num(live)}명 더{saved ? ` · 새 인물 ${num(saved)}명 DB에 저장` : ""}</span>}
      <span>‘{info.topic}’ 개인 크리에이터 {num(info.db_pool)}명 → 걸러서 {num(info.db_candidates)}명 판정</span>
      <span title="같은 조건 · 같은 버전 · 30일(기간이 붙은 조건 14일) 안의 이전 판정을 다시 썼다 (D35)">판정 재사용 {num(info.verdict_reused)}/{num(info.verdict_total)}</span>
      <span>정보 기준 최대 {info.max_info_age_days}일 전{info.rechecked ? ` · ${info.rechecked}명은 지표를 방금 다시 조회` : ""}</span>
    </p>
  );
}

/** DB와 실시간 검색을 합쳐도 M명뿐 — 조건마다 떨어진 인원과 적재 낱말 더하기(D25). 분야가 DB에 없으면 분야 추가로 안내 */
export function Shortfall({ sf, liveRounds = 0, onAddKeywords }: {
  sf: CatalogShortfall; liveRounds?: number; onAddKeywords: (topic: string, words: string[]) => Promise<void>;
}) {
  const [picked, setPicked] = useState<string[]>(sf.suggest_keywords);
  const [extra, setExtra] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const max = Math.max(...sf.dropped.map((d) => d.removed), 1);
  const words = [...picked, ...extra.split(/[,·]/).map((w) => w.trim()).filter(Boolean)];
  const go = async () => {
    setState("busy");
    try { await onAddKeywords(sf.topic, words); setState("done"); } catch { setState("error"); }
  };
  const head = (
    <div>
      <p className="m-0 text-[14px] font-semibold" style={{ color: "var(--unknown)" }}>조건 맞는 사람을 {sf.found}명 찾았습니다 (요청 {sf.requested}명)</p>
      <p className="m-0 mt-0.5 text-[12.5px] text-[var(--ink-2)]">
        {liveRounds > 0 ? `DB에서 찾고 모자라서 실시간 검색도 ${liveRounds}라운드 했지만 더 나오지 않았습니다. ` : ""}
        {sf.topic ? "조건을 풀거나, 이 분야 검색 낱말을 적재에 더하면 다음 적재부터 DB에 사람이 늘어납니다." : "요청 분야가 인플루언서 DB에 없습니다. 분야를 적재에 추가하면 다음부터 DB에서 먼저 찾습니다."}
      </p>
    </div>
  );
  if (!sf.topic) {
    return (
      <section className="rounded-lg border px-4 py-3 flex flex-col gap-2" style={{ borderColor: "var(--unknown)", background: "var(--unknown-bg)" }} aria-label="인원 모자람">
        {head}
        <p className="m-0 text-[12.5px]"><Link href="/catalog/ingest">적재 현황에서 분야 추가하기</Link></p>
      </section>
    );
  }
  return (
    <section className="rounded-lg border px-4 py-3 flex flex-col gap-3" style={{ borderColor: "var(--unknown)", background: "var(--unknown-bg)" }} aria-label="인원 모자람">
      {head}
      {sf.dropped.length > 0 && <div>
        <p className="m-0 mb-1 text-[12px] text-[var(--dim)]">조건마다 빠진 인원</p>
        <ul className="m-0 p-0 list-none flex flex-col gap-1">
          {sf.dropped.map((d) => (
            <li key={d.phrase} className="grid grid-cols-[minmax(110px,220px)_1fr_auto] items-center gap-2 text-[12.5px]">
              <span className="truncate" title={d.phrase}>{d.phrase}</span>
              <span aria-hidden className="h-[6px] rounded-full bg-[var(--panel)] overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${(d.removed / max) * 100}%`, background: "var(--unknown)" }} /></span>
              <span className="tabular">−{num(d.removed)}명</span>
            </li>
          ))}
        </ul>
      </div>}
      <div className="flex flex-col gap-1.5">
        <p className="m-0 text-[12px] text-[var(--dim)]">‘{sf.topic}’ 적재에 더할 검색 낱말</p>
        <div className="flex flex-wrap gap-1.5 items-center">
          {sf.suggest_keywords.map((k) => {
            const on = picked.includes(k);
            return (
              <button key={k} type="button" aria-pressed={on} disabled={state === "done"}
                onClick={() => setPicked((cur) => (on ? cur.filter((x) => x !== k) : [...cur, k]))}
                className={`h-[28px] px-2.5 rounded-full border text-[12.5px] ${on ? "border-[var(--accent)] bg-[var(--panel)] text-[var(--accent)] font-medium" : "border-[var(--border-strong)] bg-[var(--panel)] text-[var(--dim)]"}`}>
                {on ? "✓ " : ""}{k}
              </button>
            );
          })}
          <label className="sr-only" htmlFor="sf-extra">직접 더할 낱말</label>
          <input id="sf-extra" value={extra} onChange={(e) => setExtra(e.target.value)} disabled={state === "done"} placeholder="직접 더하기 (쉼표)"
            className="h-[28px] px-2.5 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[12.5px] w-[180px]" />
          <button type="button" onClick={go} disabled={!words.length || state === "busy" || state === "done"}
            className="inline-flex items-center justify-center h-[30px] px-3 rounded-md bg-[var(--accent)] text-[var(--accent-ink)] text-[12.5px] font-semibold hover:opacity-90 disabled:opacity-50">
            {state === "done" ? "더했습니다" : `‘${sf.topic}’ 적재에 ${words.length}개 더하기`}
          </button>
        </div>
        <p aria-live="polite" className="m-0 text-[12px]" style={{ color: state === "error" ? "var(--fail)" : "var(--ink-2)" }}>
          {state === "done" ? "다음 적재(1시간 안)부터 이 낱말로 씨앗을 모읍니다. 새로 들어온 사람은 인플루언서 목록에서 볼 수 있습니다." : state === "error" ? "더하지 못했습니다. 적재 현황에서 다시 해 주세요." : ""}
        </p>
      </div>
    </section>
  );
}

/** 필수 조건을 확인 못 한 사람 — 결과 인원에 세지 않고 따로 보인다(D36) */
export function UnconfirmedNote({ n }: { n: number }) {
  return (
    <p className="m-0 text-[12.5px] text-[var(--ink-2)] inline-flex items-start gap-1.5">
      <Info size={13} aria-hidden className="mt-[3px] shrink-0 text-[var(--unknown)]" />
      필수 조건을 확인하지 못한 {n}명입니다. 결과 인원에 세지 않고 따로 보여 줍니다(D36). 근거가 모자라 판단을 보류한 것이지 미충족이 아닙니다.
    </p>
  );
}
