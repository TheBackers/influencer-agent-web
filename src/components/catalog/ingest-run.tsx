"use client";

/**
 * 적재 현황 — '지금 한 번 돌리기' (설계서 7-1 · 14장)
 *   RunConfirm  누르기 전 화면 안 확인 — 얼마나 돌릴지 · 무엇을 모으는지 · 스위치가 꺼져 있어도 이번 한 번만(시험)
 *   RunBanner   도는 동안 · 끝난 뒤 — 시작 · 지난 시간 · 지금까지 끝낸 작업 · 결과 한 줄
 */
import { useState } from "react";
import { Play } from "lucide-react";
import { btn } from "@/components/v2/ui";
import type { IngestManual, IngestStatus } from "@/types/catalog";

const CHOICES = [5, 10, 30];
const hhmm = (iso: string) => (iso ? new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "");
export const doneSum = (s: IngestStatus) => s.stages.reduce((n, x) => n + x.done_24h, 0);
export const failSum = (s: IngestStatus) => s.stages.reduce((n, x) => n + x.failed_24h, 0);

export function RunConfirm({ s, onRun, onCancel }: { s: IngestStatus; onRun: (minutes: number) => Promise<void>; onCancel: () => void }) {
  const [minutes, setMinutes] = useState(10);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const on = s.topics.filter((t) => t.enabled);
  const left = Math.max(0, s.cost.cap_usd - s.cost.month_usd);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try { await onRun(minutes); } catch (x) { setErr(String((x as Error)?.message || x)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="surface px-4 py-3 flex flex-col gap-2.5" style={{ borderColor: "var(--accent)" }} aria-labelledby="run-title">
      <div>
        <p id="run-title" className="m-0 text-[13.5px] font-semibold">적재 한 번 돌리기</p>
        <p className="m-0 mt-1 text-[12.5px] text-[var(--ink-2)] max-w-[72ch]">
          서버가 지금 적재 그래프를 한 번 돕니다 — 작업 꺼내기 → 씨앗 줍기 · 수집 · 뽑기 · 분류 · 웹 보강 → 세고 멈출지 보기를 정한 시간 안에서 되풀이합니다.
          {!s.enabled && <> 적재 스위치가 <b>꺼져 있어도 이번 한 번만</b> 돌고(시험), 1시간마다 도는 크론은 그대로 꺼져 있습니다.</>}
        </p>
      </div>
      <ul className="m-0 pl-4 text-[12.5px] text-[var(--ink-2)] grid gap-0.5">
        <li><b>실제로 모읍니다</b> — 인스타 · 유튜브 · 네이버 블로그 · 웹 검색. 켜진 분야 {on.length}개{on.length ? `(${on.map((t) => t.name).join(" · ")})` : " — 분야를 먼저 고르세요"}.</li>
        <li>몫을 넘으면 그 단계만 쉽니다 — 인스타 이번 시간 {s.quota.instagram_calls_hour}/{s.quota.instagram_cap_hour} · 유튜브 오늘 {s.quota.youtube_units_today.toLocaleString()}/{s.quota.youtube_cap.toLocaleString()}유닛 · 웹 검색 오늘 {s.quota.web_searches_today.toLocaleString()}/{s.quota.web_cap.toLocaleString()}.</li>
        <li>AI 비용은 한 번 최대 $1 · 이번 달 남은 몫 ${left.toFixed(2)} 안에서만 씁니다(분류 · 낱말 넓히기).</li>
        <li>한 번에 하나만 돕니다 — 크론이 돌고 있으면 끝난 뒤에 누르세요.</li>
      </ul>
      <fieldset className="m-0 p-0 border-0 flex flex-wrap items-center gap-1.5">
        <legend className="float-left mr-2 text-[12.5px] text-[var(--dim)]">얼마나</legend>
        {CHOICES.map((m) => (
          <label key={m} className={`h-[30px] px-3 inline-flex items-center rounded-md border text-[13px] cursor-pointer ${minutes === m ? "border-[var(--foreground)] font-semibold" : "border-[var(--border-strong)] text-[var(--dim)]"}`}>
            <input type="radio" name="minutes" value={m} checked={minutes === m} onChange={() => setMinutes(m)} className="sr-only" />최대 {m}분
          </label>
        ))}
        <span className="text-[12px] text-[var(--dim)]">할 일이 없으면 더 일찍 끝납니다</span>
      </fieldset>
      {err && <p role="alert" className="m-0 text-[12.5px] text-[var(--fail)]">돌리지 못했습니다 — {err}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={btn.primary} disabled={busy || !on.length}><Play size={14} aria-hidden />{busy ? "시작하는 중…" : `${minutes}분 돌리기`}</button>
        <button type="button" className={btn.secondary} onClick={onCancel} disabled={busy}>취소</button>
      </div>
    </form>
  );
}

export function RunBanner({ s, base, now }: { s: IngestStatus; base: { done: number; failed: number } | null; now: number }) {
  const m: IngestManual | null | undefined = s.manual;
  const running = !!(s.running || m?.alive);
  if (!running && !m) return null;
  if (running) {
    const t0 = m?.started_at ? new Date(m.started_at).getTime() : now;
    const sec = Math.max(0, Math.round((now - t0) / 1000));
    const cap = (m?.minutes || 50) * 60;
    const done = base ? doneSum(s) - base.done : null, failed = base ? failSum(s) - base.failed : null;
    return (
      <section className="surface px-4 py-3 flex flex-col gap-2" style={{ borderColor: "var(--accent)" }} aria-live="polite" aria-label="적재 도는 중">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--accent)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" aria-hidden />적재가 도는 중</span>
          <span className="text-[12.5px] tabular text-[var(--ink-2)]">
            {m?.alive ? `버튼으로 ${hhmm(m.started_at)} 시작 · 최대 ${m.minutes}분` : "크론 실행"} · {Math.floor(sec / 60)}분 {sec % 60}초 지남
            {done != null && <> · 지금까지 끝낸 작업 {done}{failed ? ` · 실패 ${failed}` : ""}</>}
          </span>
          <span className="text-[12px] text-[var(--dim)]">5초마다 새로 고침 — 아래 단계 숫자가 바뀝니다</span>
        </div>
        {m?.alive && (
          <div className="h-[6px] rounded-full bg-[var(--soft)] overflow-hidden" role="progressbar" aria-label="정한 시간 중 지난 시간"
            aria-valuemin={0} aria-valuemax={cap} aria-valuenow={Math.min(sec, cap)}>
            <div className="h-full bg-[var(--accent)]" style={{ width: `${Math.min(100, (sec / cap) * 100)}%` }} />
          </div>
        )}
      </section>
    );
  }
  const r = m!.result;
  const bad = !!m!.error || (r?.status && !["ok", "stopped"].includes(r.status));
  return (
    <section className="surface px-4 py-2.5 text-[13px]" aria-live="polite" aria-label="마지막 버튼 실행"
      style={{ borderColor: bad ? "var(--fail)" : "var(--pass)" }}>
      <b className={bad ? "text-[var(--fail)]" : "text-[var(--pass)]"}>{bad ? "버튼 실행이 끝나지 못했습니다" : "버튼 실행이 끝났습니다"}</b>
      <span className="ml-2 tabular text-[var(--ink-2)]">
        {hhmm(m!.started_at)} ~ {hhmm(m!.finished_at)}
        {r && r.status === "busy" && " · 다른 적재 실행이 돌고 있어 시작하지 않았습니다"}
        {r && r.jobs_done != null && ` · 처리 ${r.jobs_done} · 새 인물 ${r.people_added ?? 0} · 실패 ${r.jobs_failed ?? 0} · AI $${(r.llm_usd ?? 0).toFixed(3)}`}
        {r?.stopped && ` · 멈춘 까닭: ${r.stopped}`}
        {m!.error && ` · ${m!.error}`}
      </span>
      {!bad && <span className="ml-2 text-[12px] text-[var(--dim)]">아래 최근 실행 · 인플루언서 목록에서 모인 사람을 보세요</span>}
    </section>
  );
}
