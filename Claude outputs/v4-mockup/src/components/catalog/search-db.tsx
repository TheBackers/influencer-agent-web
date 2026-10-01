"use client";

import Link from "next/link";
import { Database, Info, Radar } from "lucide-react";
import { num } from "@/components/v2/ui";
import type { CatalogResultInfo, CatalogShortfall } from "@/types/catalog";

/**
 * 인플루언서 검색 결과에 붙는 DB 칸(설계서 10장 · D42) — 결과에 catalog 요약이 있을 때만 보인다.
 * v4: 검색은 DB에서만 찾는다. 모자라면 탐색 요청을 적재에 넣고, 급하면 관리자가 '실시간으로 더 찾기'를 누른다(D51).
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
      {live > 0 && <span className="inline-flex items-center gap-1.5"><Radar size={13} aria-hidden />버튼으로 실시간 {num(live)}명 더{saved ? ` · 새 인물 ${num(saved)}명 DB에 저장` : ""}</span>}
      {info.text_search && <span>분야를 못 맞춰 소개 · 요약 · 해시태그 글자 검색으로 찾음</span>}
      <span>‘{info.topic}’ 개인 크리에이터 {num(info.db_pool)}명 → 걸러서 {num(info.db_candidates)}명 판정</span>
      <span title="같은 조건 · 같은 버전 · 30일(기간이 붙은 조건 14일) 안의 이전 판정을 다시 썼다 (D35)">판정 재사용 {num(info.verdict_reused)}/{num(info.verdict_total)}</span>
      <span>정보 기준 최대 {info.max_info_age_days}일 전{info.rechecked ? ` · ${info.rechecked}명은 지표를 방금 다시 조회` : ""}</span>
    </p>
  );
}

/** v4(D51) — DB로 모자라면 탐색 요청을 자동으로 넣었다고 알리고, 급하면 '실시간으로 더 찾기'(버튼 검색). 조건마다 빠진 인원 */
export function Shortfall({ sf, liveBusy, onLive }: { sf: CatalogShortfall; liveBusy: boolean; onLive: () => void }) {
  const max = Math.max(...sf.dropped.map((d) => d.removed), 1);
  const short = sf.requested - sf.found;
  const lv = sf.live;
  return (
    <section className="rounded-lg border px-4 py-3 flex flex-col gap-3" style={{ borderColor: "var(--unknown)", background: "var(--unknown-bg)" }} aria-label="인원 모자람">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[14px] font-semibold" style={{ color: "var(--unknown)" }}>조건 맞는 사람 {sf.found}명 — {short}명 모자랍니다 (요청 {sf.requested}명)</p>
          <p className="m-0 mt-0.5 text-[12.5px] text-[var(--ink-2)]">
            탐색 요청 <span translate="no">{sf.request_id}</span>을 넣었습니다 — 다음 적재(매시 7분)부터 ‘{sf.topic}’ · {sf.suggest_keywords.join(" · ")}을(를) 먼저 찾습니다. <Link href="/catalog/ingest">적재에서 보기</Link>
          </p>
          {lv?.done != null && (
            <p className="m-0 mt-1 text-[12.5px] text-[var(--ink-2)]">
              <Radar size={12} aria-hidden className="inline -mt-0.5 mr-1" />실시간으로 {lv.done}명 더 찾았습니다(${lv.usd?.toFixed(2)}) · 아직 {short}명은 탐색 요청이 계속 찾습니다.
            </p>
          )}
        </div>
        {lv && lv.done == null && (
          <div className="flex flex-col items-end gap-1">
            <button type="button" onClick={onLive} disabled={liveBusy}
              className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3.5 rounded-md bg-[var(--accent)] text-[var(--accent-ink)] text-[13px] font-semibold hover:opacity-90 disabled:opacity-50">
              <Radar size={14} aria-hidden />{liveBusy ? "실시간으로 찾는 중…" : `실시간으로 ${short}명 더 찾기`}
            </button>
            <span className="text-[11.5px] text-[var(--dim)] tabular">예상 ${lv.usd_min.toFixed(1)}~${lv.usd_max.toFixed(1)} · {lv.minutes} · 웹 · 인스타 · 유튜브 발굴</span>
          </div>
        )}
      </div>
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
