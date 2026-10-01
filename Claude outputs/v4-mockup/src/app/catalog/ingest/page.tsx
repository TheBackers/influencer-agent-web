"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Play, Plus, X } from "lucide-react";
import PageHeader from "@/components/v2/app-header";
import { btn, num, pct, tbl } from "@/components/v2/ui";
import { Dot, ErrorLine, Meter } from "@/components/catalog/bits";
import { SectionTitle } from "@/components/catalog/ingest-parts";
import { ORIGIN_KO, Pill, SOURCE_HINT, SOURCE_KO, ago, hhmm, usd } from "@/components/v4/bits";
import { addTopicName, dropRequest, getIngestV4, removeKeyword, setTopicStatus } from "@/lib/api-v4";
import type { IngestV4, TopicMapRow } from "@/types/v4";

/**
 * 적재 (v4 · PRD 2-3 · 설계서 7장) — 조건 없이 스스로 넓히며 모은다. 사람은 보고, 이상한 분야 · 낱말만 뺀다.
 * 위에서 아래로: 상태 줄 → 타일 6 → 분야 지도 → 출처 · 후보 풀 → 탐색 요청 → 실행 · 오류
 */
export default function IngestPage() {
  const [s, setS] = useState<IngestV4 | null>(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);
  const [running, setRunning] = useState(false);

  const load = useCallback(() => getIngestV4().then((x) => { setS(x); setErr(""); }).catch((e) => setErr(String(e?.message || e))), []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<IngestV4>, ok: string) => {
    try { setS(await fn()); setNote(ok); } catch (e) { setNote(`하지 못했습니다 — ${String((e as Error)?.message || e)}`); }
  };
  const run = (m: number) => {
    setAsking(false); setRunning(true); setNote("");
    setTimeout(() => { setRunning(false); setNote(`시험 실행 ${m}분 — 처리 94 · 새 인물 8 · 실패 0 · AI $0.005 · 멈춘 까닭: 목업이라 짧게`); }, 2500);
  };

  return (
    <>
      <PageHeader
        title="적재"
        description="조건을 걸지 않아도 분야 지도 전체를 돌며 매일 새 인물을 모으고, 활동 중인 사람은 7일마다 새로 합니다. 사람은 이상한 분야 · 낱말만 뺍니다."
        actions={
          <>
            {s && <Dot color={s.enabled ? "var(--pass)" : "var(--border-strong)"} strong={s.enabled}>{s.enabled ? "적재 켜짐" : "적재 꺼짐"}</Dot>}
            {s && <span className="text-[12.5px] text-[var(--dim)] tabular">다음 실행 {hhmm(s.next_run_at)}</span>}
            <button type="button" className={btn.primary} disabled={!s || running} onClick={() => setAsking(true)}>
              <Play size={14} aria-hidden />{running ? "도는 중…" : "지금 한 번 돌리기"}
            </button>
          </>
        }
      />
      {err && <ErrorLine msg={err} />}
      {asking && (
        <section className="surface px-4 py-3 flex flex-wrap items-center gap-2" aria-label="지금 한 번 돌리기">
          <p className="m-0 text-[13px] min-w-0 flex-1">실제 인스타 · 유튜브 · 웹에서 모읍니다. 하루 몫 · 다양성 몫 · AI 비용 상한은 그대로 지킵니다.</p>
          {[5, 10, 30].map((m) => <button key={m} type="button" className={btn.secondary} onClick={() => run(m)}>{m}분</button>)}
          <button type="button" className={btn.ghost} onClick={() => setAsking(false)}>그만두기</button>
        </section>
      )}
      <p aria-live="polite" className="m-0 text-[13px]" style={{ color: note.includes("못했습니다") ? "var(--fail)" : "var(--pass)" }}>{note}</p>

      {s && (
        <>
          <Tiles s={s} />
          <TopicMap s={s}
            onStatus={(n, st) => act(() => setTopicStatus(n, st), st === "excluded" ? `‘${n}’을(를) 뺐습니다 — 씨앗 · 분야 몫에서 빠지고 이미 모은 사람은 그대로 둡니다` : `‘${n}’을(를) 다시 넣었습니다`)}
            onAdd={(n) => act(() => addTopicName(n), `‘${n}’ 분야를 더했습니다 — 낱말은 첫 씨앗에서 자동으로 만듭니다`)}
            onKw={(t, w) => act(() => removeKeyword(t, w), `‘${t}’에서 ‘${w}’을(를) 뺐습니다 — 자동으로 다시 넣지 않습니다`)} />
          <Sources s={s} />
          <Requests s={s} onDrop={(id) => act(() => dropRequest(id), "탐색 요청을 그만뒀습니다")} />
          <div className="grid lg:grid-cols-2 gap-4">
            <section className="surface min-w-0" aria-label="최근 실행">
              <SectionTitle title="최근 실행" hint="실행 번호를 누르면 추적 › 적재에서 노드 · 작업 · 호출을 봅니다" />
              <div className="relative overflow-x-auto">
                <table className="w-full border-collapse text-[12.5px] min-w-[520px]">
                  <thead><tr>{["실행", "시작", "처리", "새 인물", "실패", "AI", "멈춘 까닭", "빌드"].map((h) => <th key={h} scope="col" className={tbl.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {s.runs.map((r) => (
                      <tr key={r.id}>
                        <td className={tbl.td}><Link href={`/ops/trace?tab=ingest&run=${r.id}`} translate="no">{r.id}</Link></td>
                        <td className={`${tbl.td} tabular whitespace-nowrap`}>{hhmm(r.started_at)} · {r.minutes}분</td>
                        <td className={`${tbl.td} tabular`}>{r.done}</td>
                        <td className={`${tbl.td} tabular`}>+{r.new_people}</td>
                        <td className={`${tbl.td} tabular`} style={{ color: r.failed ? "var(--fail)" : undefined }}>{r.failed}</td>
                        <td className={`${tbl.td} tabular`}>{usd(r.usd, 3)}</td>
                        <td className={`${tbl.td} whitespace-nowrap`}>{r.stopped}</td>
                        <td className={`${tbl.td} tabular`} translate="no">{r.build}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="surface min-w-0" aria-label="단계 · 오류">
              <SectionTitle title="단계별 대기 · 최근 오류" />
              <ul className="m-0 px-4 pb-2 list-none grid grid-cols-2 sm:grid-cols-4 gap-2">
                {s.stages.map((g) => (
                  <li key={g.kind} className="rounded-md bg-[var(--soft)] px-2.5 py-2 text-[12px] tabular">
                    <p className="m-0 font-semibold text-[12.5px]">{g.ko}</p>
                    <p className="m-0 text-[var(--dim)]">대기 {num(g.queued)} · 24시간 {num(g.done24)}</p>
                    <p className="m-0" style={{ color: g.failed24 ? "var(--fail)" : "var(--dim)" }}>실패 {g.failed24}</p>
                  </li>
                ))}
              </ul>
              <ul className="m-0 px-4 pb-3 list-none flex flex-col gap-2">
                {s.errors.map((e) => (
                  <li key={e.key} className="text-[12.5px] border-t border-[var(--border)] pt-2">
                    <p className="m-0"><b>{e.kind}</b> · <span translate="no">{e.key}</span> <span className="text-[var(--dim)]">· {ago(e.at)}</span></p>
                    <p className="m-0 text-[var(--ink-2)]">{e.why}</p>
                    <p className="m-0 text-[var(--dim)]">할 일: {e.todo}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <section className="surface" aria-label="적재 워커">
            <SectionTitle title="적재 워커 5개" hint="에이전트(LLM이 툴을 고르는 것)는 없습니다 — 코드가 툴을 순서대로 부르고, AI는 분류 · 낱말 넓히기에서만 한 번씩(D41)" />
            <ul className="m-0 px-4 pb-3 list-none grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {s.workers.map((w) => (
                <li key={w.name} className="rounded-md border border-[var(--border)] px-3 py-2 text-[12px]">
                  <p className="m-0 font-semibold text-[12.5px]">{w.ko} <span className="font-normal text-[var(--dim)]" translate="no">{w.name}</span></p>
                  <p className="m-0 text-[var(--dim)]">AI: {w.ai}</p>
                  <p className="m-0 mt-1 text-[var(--ink-2)]">{w.metric}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}

function Tile({ label, value, sub, children, tone }: { label: string; value: ReactNode; sub?: ReactNode; children?: ReactNode; tone?: "warn" | "fail" }) {
  return (
    <div className="surface px-4 py-3 min-w-0">
      <p className="m-0 text-[12px] text-[var(--dim)]">{label}</p>
      <p className="m-0 mt-0.5 text-[20px] font-semibold tabular leading-tight" style={{ color: tone === "fail" ? "var(--fail)" : tone === "warn" ? "var(--unknown)" : undefined }}>{value}</p>
      {children && <div className="mt-2">{children}</div>}
      {sub && <p className="m-0 mt-1.5 text-[12px] text-[var(--dim)] tabular">{sub}</p>}
    </div>
  );
}

/** 타일 6 — 오늘 새 인물 · 7일 안 갱신 · 갱신 밀림 · 비용 · 쿼터 · DB 크기 */
function Tiles({ s }: { s: IngestV4 }) {
  const t = s.today, max = Math.max(t.target, ...t.days7.map((d) => d.n));
  const q = s.quota;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
      <div className="surface px-4 py-3 col-span-2 min-w-0">
        <p className="m-0 text-[12px] text-[var(--dim)]">오늘 새 인물 (서울 시간)</p>
        <p className="m-0 mt-0.5 text-[20px] font-semibold tabular leading-tight">{t.new_people}<span className="text-[14px] text-[var(--dim)] font-normal"> / {t.target}</span></p>
        <div className="mt-2 flex items-end gap-1.5 h-[46px]" role="img" aria-label={`최근 7일 새 인물: ${t.days7.map((d) => `${d.date} ${d.n}명`).join(", ")}`}>
          {t.days7.map((d, i) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
              <span className="block w-full rounded-sm" style={{ height: `${(d.n / max) * 34}px`, background: i === t.days7.length - 1 ? "var(--accent)" : "var(--border-strong)" }} />
              <span className="text-[10px] text-[var(--dim)] tabular">{d.date}</span>
            </div>
          ))}
        </div>
        <p className="m-0 mt-1 text-[12px] text-[var(--dim)] tabular">7일 평균 {t.avg7}명 · 목표 180 이상 · 같은 계정 두 인물 0</p>
      </div>
      <Tile label="7일 안 갱신 (활동 중 크리에이터)" value={pct(s.fresh.ratio)} sub={`${num(s.fresh.fresh7)} / ${num(s.fresh.active_creators)}명 · 쉬는 사람 ${num(s.fresh.idle_creators)}명은 30일`}>
        <Meter value={s.fresh.ratio} max={1} goal />
      </Tile>
      <Tile label="갱신 밀림" value={`${s.fresh.deferred}명`} sub={s.fresh.deferred ? "인스타 몫이 모자라 14일로 늦춘 사람" : "인스타 몫 안 — 밀린 사람 없음"} />
      <Tile label="이번 달 AI 비용" value={usd(s.cost.month_usd)} sub={`상한 $${s.cost.cap_usd} · 오늘 ${usd(s.cost.today_usd)}`}>
        <Meter value={s.cost.month_usd} max={s.cost.cap_usd} />
      </Tile>
      <Tile label="DB 크기" value={`${s.db.mb}MB`} tone={s.db.mb >= s.db.warn_mb ? "warn" : undefined}
        sub={s.db.mb >= s.db.warn_mb ? "400MB 넘음 — Pro 또는 보관 줄이기를 정할 때(D53)" : `${s.db.warn_mb}MB에서 경고 · 무료 ${s.db.cap_mb}MB`}>
        <Meter value={s.db.mb} max={s.db.cap_mb} />
      </Tile>
      <div className="surface px-4 py-3 col-span-2 lg:col-span-6 grid sm:grid-cols-3 gap-x-6 gap-y-2">
        {([
          ["인스타 (이번 시간)", q.instagram_hour, q.instagram_cap, "회 — 새 인물 약 17 + 갱신 약 83"],
          ["유튜브 (오늘)", q.youtube_units, q.youtube_cap, "유닛 — 검색 몫 6,000은 따로"],
          ["웹 검색 (오늘)", q.web_today, q.web_cap, "회 — 네이버 → 카카오"],
        ] as const).map(([k, v, m, u]) => (
          <div key={k} className="min-w-0">
            <p className="m-0 text-[12px] flex tabular gap-2"><span>{k}</span><span className="ml-auto">{num(v)} / {num(m)}</span></p>
            <Meter value={v} max={m} />
            <p className="m-0 mt-0.5 text-[11.5px] text-[var(--dim)]">{u}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 분야 지도 — 기본 23개 + 자동으로 생긴 분야. 사람은 빼기 · 다시 넣기 · 이름만 더하기(D44 · D49) */
function TopicMap({ s, onStatus, onAdd, onKw }: { s: IngestV4; onStatus: (n: string, st: "active" | "excluded") => void; onAdd: (n: string) => void; onKw: (t: string, w: string) => void }) {
  const [name, setName] = useState("");
  const [all, setAll] = useState(false);
  const active = s.topics.filter((t) => t.status === "active").sort((a, b) => b.new7 - a.new7);
  const shown = all ? active : [...active.slice(0, 10), ...active.slice(10).filter((t) => t.is_new)];
  const off = s.topics.filter((t) => t.status === "excluded");
  const row = (t: TopicMapRow) => {
    const over = t.share7 > 0.25;
    return (
      <tr key={t.name} className={t.status === "excluded" ? "opacity-55" : undefined}>
        <td className={`${tbl.td} whitespace-nowrap`}>
          <span className="font-medium">{t.name}</span>
          {t.origin !== "seed" && t.origin !== "candidate" && <span className="ml-1.5 text-[11px] text-[var(--accent)]">{ORIGIN_KO[t.origin]}</span>}
          {t.is_new && <span className="ml-1 text-[11px] text-[var(--pass)]">새로</span>}
        </td>
        <td className={`${tbl.td} tabular text-right`}>{num(t.people)}</td>
        <td className={`${tbl.td} tabular text-right`}>+{t.new7}</td>
        <td className={`${tbl.td} w-[150px]`}>
          <span className="relative block h-[6px] rounded-full bg-[var(--soft)]" aria-label={`7일 비중 ${pct(t.share7)}`}>
            <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(1, t.share7 / 0.3) * 100}%`, background: over ? "var(--fail)" : "var(--accent)" }} />
            <span aria-hidden className="absolute -top-[3px] -bottom-[3px] w-px bg-[var(--fail)]" style={{ left: `${(0.25 / 0.3) * 100}%` }} />
          </span>
          <span className="text-[11px] text-[var(--dim)] tabular">{pct(t.share7, 1)}</span>
        </td>
        <td className={`${tbl.td} tabular text-right`}>{t.today}</td>
        <td className={tbl.td}>
          <ul className="m-0 p-0 list-none flex flex-wrap gap-1">
            {t.keywords.slice(0, 5).map((k) => (
              <li key={k.word} className="inline-flex items-center gap-0.5 h-[22px] pl-2 pr-0.5 rounded-full border border-[var(--border)] bg-[var(--soft)] text-[12px] whitespace-nowrap">
                {k.word}{k.auto && <span className="text-[10.5px] text-[var(--accent)] ml-0.5">자동</span>}
                <button type="button" aria-label={`낱말 빼기: ${k.word}`} onClick={() => onKw(t.name, k.word)}
                  className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-transparent border-0 text-[var(--dim)] hover:bg-[var(--border)]"><X size={11} aria-hidden /></button>
              </li>
            ))}
            {t.keywords.length > 5 && <li className="text-[12px] text-[var(--dim)] self-center">+{t.keywords.length - 5}</li>}
          </ul>
        </td>
        <td className={`${tbl.td} text-right`}>
          {t.status === "active"
            ? <button type="button" className={btn.ghost} onClick={() => onStatus(t.name, "excluded")}>빼기</button>
            : <button type="button" className={btn.ghost} onClick={() => onStatus(t.name, "active")}>다시 넣기</button>}
        </td>
      </tr>
    );
  };
  return (
    <section className="surface" aria-label="분야 지도">
      <SectionTitle title={`분야 지도 ${s.totals.topics}개`} hint={`기본 23 + 자동 ${s.totals.auto_topics} — 모두 적재가 스스로 돕니다. 한 분야는 하루 새 인물의 25%까지(빨간 선), 인원이 적은 분야에 몫을 더 줍니다.`}
        right={
          <form className="flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { onAdd(name.trim()); setName(""); } }}>
            <label htmlFor="topic-add" className="sr-only">분야 이름</label>
            <input id="topic-add" value={name} onChange={(e) => setName(e.target.value)} placeholder="분야 이름만 적기"
              className="h-[30px] px-2.5 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[13px] w-[150px]" />
            <button type="submit" className={btn.secondary} disabled={!name.trim()}><Plus size={13} aria-hidden />더하기</button>
          </form>
        } />
      {s.proposals.length > 0 && (
        <p className="m-0 px-4 pb-2 text-[12px] text-[var(--dim)]">
          분야 제안(분류가 낸 새 이름 · 30일 안 5명이면 자동으로 분야가 됩니다): {s.proposals.map((p) => `${p.name} ${p.people}/${p.need}`).join(" · ")}
        </p>
      )}
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-[13px] min-w-[860px]">
          <thead><tr>
            {[["분야", ""], ["인원", "text-right"], ["7일 새로", "text-right"], ["7일 비중", ""], ["오늘", "text-right"], ["검색 낱말", ""], ["", ""]].map(([h, c], i) => <th key={i} scope="col" className={`${tbl.th} ${c}`}>{h}</th>)}
          </tr></thead>
          <tbody>{shown.map(row)}{all && off.map(row)}</tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-[12.5px]">
        <button type="button" className={btn.ghost} onClick={() => setAll(!all)}>{all ? "접기" : `분야 ${active.length}개 모두 보기 (7일 새로 많은 10개 + 자동으로 새로 생긴 것만 보는 중)`}</button>
        {!all && off.length > 0 && <span className="text-[var(--dim)]">뺀 분야: {off.map((t) => t.name).join(" · ")}</span>}
      </div>
    </section>
  );
}

/** 출처 · 후보 풀 — 출처마다 대기 후보 · 오늘 새 인물 / 하루 몫 · 개인 크리에이터 비율(D46 · D48) */
function Sources({ s }: { s: IngestV4 }) {
  return (
    <section className="surface" aria-label="출처 · 후보 풀">
      <SectionTitle title="출처 · 후보 풀" hint="모든 출처가 찾은 계정은 먼저 후보 풀에 들어가고(계정마다 한 번), 수집에 성공하면 인물이 됩니다. 조회 안 되는 계정은 인물로 만들지 않고 90일 뒤 한 번 더." />
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-[13px] min-w-[680px]">
          <thead><tr>{["출처", "어떻게 찾나", "대기 후보", "오늘 새 인물 / 하루 몫", "개인 크리에이터 비율(7일)"].map((h) => <th key={h} scope="col" className={tbl.th}>{h}</th>)}</tr></thead>
          <tbody>
            {s.sources.map((r) => (
              <tr key={r.source}>
                <td className={`${tbl.td} font-medium whitespace-nowrap`}>{SOURCE_KO[r.source]}</td>
                <td className={`${tbl.td} text-[12.5px] text-[var(--ink-2)]`}>{SOURCE_HINT[r.source]}</td>
                <td className={`${tbl.td} tabular text-right`}>{num(r.waiting)}</td>
                <td className={`${tbl.td} tabular whitespace-nowrap`}>{r.today_new}{r.day_cap ? ` / ${r.day_cap}` : " / 나머지"}</td>
                <td className={`${tbl.td} whitespace-nowrap`}>
                  {r.today_new || r.waiting ? <Pill tone={r.creator_ratio < 0.5 ? "fail" : r.creator_ratio < 0.65 ? "warn" : "pass"}>{pct(r.creator_ratio)}</Pill> : <span className="text-[var(--dim)]">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 px-4 py-2 text-[12px] text-[var(--dim)]">스노볼 60% · 씨앗 30% 이상 · 탐색 요청 20%까지(D48). 한 출처의 크리에이터 비율이 50% 아래로 떨어지면 그 출처의 점수 규칙을 고칩니다.</p>
    </section>
  );
}

/** 탐색 요청 — 검색이 모자랄 때 들어온 것. 다음 적재가 먼저 찾는다(D51) */
function Requests({ s, onDrop }: { s: IngestV4; onDrop: (id: string) => void }) {
  return (
    <section className="surface" aria-label="탐색 요청">
      <SectionTitle title={`탐색 요청 ${s.requests.filter((r) => r.status === "open").length}건 열림`} hint="검색 결과가 모자라면 그 요청의 분야 · 낱말이 여기로 들어옵니다. 하루 새 인물의 20%까지 먼저 꺼냅니다." />
      <ul className="m-0 px-4 pb-3 list-none flex flex-col gap-2">
        {s.requests.map((r) => (
          <li key={r.id} className="border-t border-[var(--border)] pt-2 flex flex-wrap items-start gap-x-3 gap-y-1">
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[13px]">
                <Pill tone={r.status === "open" ? "warn" : r.status === "done" ? "pass" : "none"}>{r.status === "open" ? "찾는 중" : r.status === "done" ? "채움" : "그만둠"}</Pill>
                <span className="ml-2 font-medium">{r.topic}</span>{r.topic_created && <span className="ml-1 text-[11px] text-[var(--accent)]">분야 새로 만듦</span>}
                <span className="ml-2 text-[var(--dim)] text-[12px]">{ago(r.at)} · <Link href="/" translate="no">{r.mission_id}</Link></span>
              </p>
              <p className="m-0 mt-0.5 text-[12.5px] text-[var(--ink-2)] break-words">{r.request}</p>
              <p className="m-0 mt-0.5 text-[12px] text-[var(--dim)]">낱말 {r.words.join(" · ")} · 모자란 {r.short}명 · 이 요청으로 새 인물 {r.added}명</p>
            </div>
            {r.status === "open" && <button type="button" className={btn.ghost} onClick={() => onDrop(r.id)}>그만두기</button>}
          </li>
        ))}
      </ul>
    </section>
  );
}
