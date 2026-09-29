"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Switch, fmtDate, num, pct, tbl } from "@/components/v2/ui";
import type { IngestError, IngestRun, IngestStatus, IngestWorker, StageRow, TopicPatch, TopicRow } from "@/types/catalog";
import { Dot, Meter, agoText } from "./bits";

const input = "h-[30px] px-2.5 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[13px] min-w-0";
const small = "inline-flex items-center justify-center gap-1 h-[30px] px-2.5 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[12.5px] hover:bg-[var(--soft)] disabled:opacity-50";

export function SectionTitle({ title, hint, right }: { title: string; hint?: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-1 px-4 pt-3 pb-2">
      <div className="min-w-0">
        <h2 className="m-0 text-[14px] font-semibold">{title}</h2>
        {hint && <p className="m-0 mt-0.5 text-[12px] text-[var(--dim)]">{hint}</p>}
      </div>
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}

function Tile({ label, value, sub, meter, href }: { label: string; value: ReactNode; sub?: ReactNode; meter?: ReactNode; href?: string }) {
  const body = (
    <>
      <p className="m-0 text-[12px] text-[var(--dim)]">{label}</p>
      <p className="m-0 mt-0.5 text-[20px] font-semibold tabular leading-tight">{value}</p>
      {meter && <div className="mt-2">{meter}</div>}
      {sub && <p className="m-0 mt-1.5 text-[12px] text-[var(--dim)] tabular">{sub}</p>}
    </>
  );
  return href
    ? <Link href={href} className="surface px-4 py-3 no-underline text-[var(--foreground)] hover:border-[var(--border-strong)]">{body}</Link>
    : <div className="surface px-4 py-3">{body}</div>;
}

/** 위 타일 — 인물 · 신선도 · 이번 달 비용 · 오늘 쿼터 · 사람이 볼 것 */
export function Tiles({ s }: { s: IngestStatus }) {
  const t = s.totals, c = s.cost, qt = s.quota;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <Tile label="인물" value={num(t.people)} sub={<>개인 크리에이터 {num(t.creators)} · 7일 새로 +{num(t.new_7d)}</>} />
      <Tile label="14일 안 갱신" value={pct(t.fresh_ratio)} meter={<Meter value={t.fresh_ratio} max={1} warnAt={2} />}
        sub={t.fresh_ratio >= 0.9 ? "목표 90% 이상" : "목표 90% 미달"} />
      <Tile label="이번 달 적재 비용" value={`$${c.month_usd.toFixed(2)}`} meter={<Meter value={c.month_usd} max={c.cap_usd} />}
        sub={<>상한 ${c.cap_usd} · 오늘 ${c.today_usd.toFixed(2)} · 1명 ${c.per_person_usd.toFixed(4)}</>} />
      <div className="surface px-4 py-3 flex flex-col gap-1.5">
        <p className="m-0 text-[12px] text-[var(--dim)]">오늘 쿼터</p>
        {([
          ["유튜브", qt.youtube_units_today, qt.youtube_cap, "유닛"],
          ["인스타 (시간당)", qt.instagram_calls_hour, qt.instagram_cap_hour, "회"],
          ["웹 검색", qt.web_searches_today, qt.web_cap, "회"],
        ] as const).map(([k, v, m, u]) => (
          <div key={k}>
            <p className="m-0 text-[12px] flex tabular"><span>{k}</span><span className="ml-auto">{num(v)} / {num(m)}{u}</span></p>
            <Meter value={v} max={m} />
          </div>
        ))}
      </div>
      <div className="surface px-4 py-3 flex flex-col gap-1">
        <p className="m-0 text-[12px] text-[var(--dim)]">사람이 볼 것</p>
        <Link href="/catalog?contact=missing" className="text-[13px] flex tabular"><span>연락처 못 찾음</span><b className="ml-auto">{num(t.contact_missing)}</b></Link>
        <span className="text-[13px] flex tabular"><span>계정 연결 확인 필요</span><b className="ml-auto">{num(t.needs_review)}</b></span>
        <Link href="/catalog?hidden=1" className="text-[13px] flex tabular"><span>숨김</span><b className="ml-auto">{num(t.hidden)}</b></Link>
      </div>
    </div>
  );
}

/** 분야 표 — 켜기/끄기 · 인원/목표 · 검색 낱말 더하기 */
export function TopicsTable({ topics, onPatch }: { topics: TopicRow[]; onPatch: (name: string, p: TopicPatch) => Promise<void> }) {
  const [adding, setAdding] = useState<string | null>(null);
  const [kw, setKw] = useState("");
  const [busy, setBusy] = useState("");
  const add = async (name: string) => {
    const words = kw.split(/[,·]/).map((w) => w.trim()).filter(Boolean);
    if (!words.length) return;
    setBusy(name);
    try { await onPatch(name, { add_keywords: words }); setKw(""); setAdding(null); } finally { setBusy(""); }
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px] min-w-[900px]">
        <thead>
          <tr>
            <th className={tbl.th}>분야</th><th className={tbl.th}>적재</th><th className={`${tbl.th} w-[190px]`}>인원 / 목표</th>
            <th className={`${tbl.th} text-right`}>개인 크리에이터</th><th className={`${tbl.th} text-right`}>신선도</th>
            <th className={`${tbl.th} text-right`}>7일 새로</th><th className={`${tbl.th} text-right`} title="소개글 검색 1회에 새로 들어온 계정 수">검색 1회당 새 계정</th>
            <th className={tbl.th}>검색 낱말</th><th className={tbl.th}>마지막 실행</th>
          </tr>
        </thead>
        <tbody>
          {topics.map((t) => (
            <tr key={t.name}>
              <td className={`${tbl.td} font-medium whitespace-nowrap`}>{t.name}</td>
              <td className={tbl.td}>
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  <Switch id={`topic-${t.name}`} checked={t.enabled} label={`${t.name} 적재`} disabled={busy === t.name}
                    onChange={async (v) => { setBusy(t.name); try { await onPatch(t.name, { enabled: v }); } finally { setBusy(""); } }} />
                  <span className="text-[12px] text-[var(--dim)]">{t.enabled ? "켜짐" : "꺼짐"}</span>
                </span>
              </td>
              <td className={tbl.td}>
                <p className="m-0 tabular text-[12.5px]">{num(t.people)} / {num(t.target)}</p>
                <Meter value={t.people} max={t.target} warnAt={2} />
              </td>
              <td className={`${tbl.td} text-right tabular`}>{num(t.creators)}</td>
              <td className={`${tbl.td} text-right tabular`}>{t.people ? pct(t.fresh_ratio) : "—"}</td>
              <td className={`${tbl.td} text-right tabular`}>+{num(t.new_7d)}</td>
              <td className={`${tbl.td} text-right tabular`}>
                {t.queries_used ? (t.yield_per_query < 2 ? <Dot color="var(--unknown)" strong title="새 계정이 줄고 있습니다 — 검색 낱말을 더하세요">{t.yield_per_query.toFixed(1)}명</Dot> : `${t.yield_per_query.toFixed(1)}명`) : "—"}
              </td>
              <td className={`${tbl.td} max-w-[300px]`}>
                <p className="m-0 text-[12.5px] text-[var(--ink-2)] line-clamp-2" title={t.keywords.join(" · ")}>{t.keywords.join(" · ")}</p>
                {adding === t.name ? (
                  <form className="mt-1.5 flex gap-1.5" onSubmit={(e) => { e.preventDefault(); add(t.name); }}>
                    <label className="sr-only" htmlFor={`kw-${t.name}`}>더할 검색 낱말</label>
                    <input id={`kw-${t.name}`} autoFocus className={`${input} flex-1`} placeholder="쉼표로 여러 개" value={kw} onChange={(e) => setKw(e.target.value)} />
                    <button type="submit" className={small} disabled={busy === t.name || !kw.trim()}>더하기</button>
                    <button type="button" className={small} onClick={() => { setAdding(null); setKw(""); }}>취소</button>
                  </form>
                ) : (
                  <button type="button" className="mt-1 p-0 bg-transparent border-0 text-[12px] text-[var(--accent)] inline-flex items-center gap-1" onClick={() => { setAdding(t.name); setKw(""); }}>
                    <Plus size={12} aria-hidden />낱말 더하기
                  </button>
                )}
              </td>
              <td className={`${tbl.td} whitespace-nowrap text-[12.5px] text-[var(--dim)]`}>{t.last_run_at ? agoText(t.last_run_at) : "다음 실행부터"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 분야 추가 — 이름 · 검색 낱말 5~10개 · 목표 인원. 첫 적재는 분야당 1~2주 */
export function AddTopicForm({ onAdd, onCancel }: { onAdd: (name: string, keywords: string[], target: number) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [kw, setKw] = useState("");
  const [target, setTarget] = useState(1000);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const words = kw.split(/[,·]/).map((w) => w.trim()).filter(Boolean);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try { await onAdd(name.trim(), words, target); } catch (x) { setErr(String((x as Error)?.message || x)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="surface px-4 py-3 flex flex-col gap-2">
      <p className="m-0 text-[13px] font-semibold">분야 추가</p>
      <p className="m-0 text-[12px] text-[var(--dim)]">검색 낱말 5~10개를 넣으세요. 씨앗이 이 낱말로 소개글 속 인스타 계정 · 유튜브 채널을 모읍니다. 첫 적재는 분야당 1~2주 걸립니다.</p>
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="nt-name">분야 이름</label>
        <input id="nt-name" className={`${input} w-[160px]`} placeholder="분야 이름 (예: 캠핑)" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="sr-only" htmlFor="nt-kw">검색 낱말</label>
        <input id="nt-kw" className={`${input} flex-1 min-w-[240px]`} placeholder="검색 낱말 — 쉼표로 (예: 캠핑, 백패킹, 캠핑 장비 리뷰)" value={kw} onChange={(e) => setKw(e.target.value)} />
        <label className="sr-only" htmlFor="nt-target">목표 인원</label>
        <input id="nt-target" type="number" min={100} step={100} className={`${input} w-[100px] tabular`} value={target} onChange={(e) => setTarget(Number(e.target.value) || 0)} />
        <button type="submit" className={small} disabled={busy || !name.trim() || words.length < 1}>추가</button>
        <button type="button" className={small} onClick={onCancel}>취소</button>
      </div>
      <p aria-live="polite" className="m-0 min-h-[16px] text-[12px]" style={{ color: err ? "var(--fail)" : "var(--dim)" }}>
        {err || (words.length ? `낱말 ${words.length}개${words.length < 5 ? " — 5개 이상을 권합니다" : ""}` : "")}
      </p>
    </form>
  );
}

/** 적재 그래프 — 단계(노드)별 대기 · 24시간 처리 · 실패 */
export function StageFlow({ stages }: { stages: StageRow[] }) {
  return (
    <ol className="m-0 px-4 pb-4 list-none grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
      {stages.map((st, i) => (
        <li key={st.key} className="relative rounded-md border border-[var(--border)] px-3 py-2.5" style={st.llm ? { borderColor: "var(--border-strong)" } : undefined}>
          <p className="m-0 text-[12px] text-[var(--dim)] flex items-start gap-1 min-h-[34px]">
            <span className="tabular">{i + 1}</span><span className="font-medium text-[var(--foreground)] leading-snug">{st.label}</span>
            {st.llm && <span className="ml-auto text-[11px] text-[var(--accent)]" title="이 단계에 LLM 1회 호출이 있다">LLM</span>}
          </p>
          <p className="m-0 mt-1 text-[18px] font-semibold tabular leading-tight">{num(st.waiting)}<span className="text-[12px] font-normal text-[var(--dim)]"> 대기</span></p>
          <p className="m-0 text-[12px] text-[var(--dim)] tabular">24시간 {num(st.done_24h)}{st.failed_24h ? <> · <span style={{ color: "var(--fail)" }}>실패 {st.failed_24h}</span></> : ""}</p>
          {i < stages.length - 1 && <ArrowRight aria-hidden size={13} className="hidden xl:block absolute -right-[11px] top-1/2 -translate-y-1/2 text-[var(--dim)] bg-[var(--panel)]" />}
        </li>
      ))}
    </ol>
  );
}

const STATUS: Record<IngestWorker["status"], { label: string; color: string }> = {
  active: { label: "켜짐", color: "var(--pass)" },
  shadow: { label: "shadow — 비교만", color: "var(--unknown)" },
  canary: { label: "canary 20%", color: "var(--accent)" },
  disabled: { label: "꺼짐", color: "var(--border-strong)" },
};
const STAGE_KO: Record<IngestWorker["stage"], string> = {
  seed: "씨앗", collect: "수집", extract: "뽑기", classify: "분류", enrich: "웹 · 연락처", store: "저장", search: "검색",
};

/** 적재 워커 — 한 가지 일만 하고 능력(capability)으로 불린다. 새 출처 = 워커 1개 + 순서 파일 한 줄 */
export function WorkersTable({ workers }: { workers: IngestWorker[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px] min-w-[900px]">
        <thead>
          <tr>
            <th className={tbl.th}>워커</th><th className={tbl.th}>단계</th><th className={tbl.th}>하는 일</th><th className={tbl.th}>LLM</th>
            <th className={tbl.th}>상태</th><th className={`${tbl.th} text-right`}>24시간</th><th className={`${tbl.th} text-right`}>성공률</th><th className={`${tbl.th} text-right`}>평균 비용</th>
          </tr>
        </thead>
        <tbody>
          {workers.map((w) => (
            <tr key={w.name} className={w.status === "shadow" ? "text-[var(--ink-2)]" : undefined}>
              <td className={tbl.td}>
                <p className="m-0 font-medium whitespace-nowrap">{w.label}</p>
                <p className="m-0 text-[11.5px] text-[var(--dim)] font-mono whitespace-nowrap">{w.name} · {w.capability}</p>
              </td>
              <td className={`${tbl.td} whitespace-nowrap`}>{STAGE_KO[w.stage]}</td>
              <td className={`${tbl.td} max-w-[360px]`}>
                <p className="m-0 text-[12.5px]">{w.does}</p>
                <p className="m-0 text-[11.5px] text-[var(--dim)]">가져오는 것: {w.reuses}</p>
              </td>
              <td className={`${tbl.td} whitespace-nowrap text-[12.5px] ${w.llm === "없음" ? "text-[var(--dim)]" : "text-[var(--accent)]"}`}>{w.llm}</td>
              <td className={tbl.td}><Dot color={STATUS[w.status].color}>{STATUS[w.status].label}</Dot></td>
              <td className={`${tbl.td} text-right tabular`}>{num(w.runs_24h)}</td>
              <td className={`${tbl.td} text-right tabular`}>
                {w.success_rate === null ? "—" : w.success_rate < 0.8 ? <span style={{ color: "var(--unknown)" }} title="못 찾은 것도 실패로 센다">{pct(w.success_rate)}</span> : pct(w.success_rate)}
              </td>
              <td className={`${tbl.td} text-right tabular whitespace-nowrap`}>{w.avg_usd ? `$${w.avg_usd.toFixed(4)}` : "0"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 최근 오류 — 왜 · 할 일 */
export function ErrorsList({ errors }: { errors: IngestError[] }) {
  if (!errors.length) return <p className="m-0 px-4 pb-3 text-[13px] text-[var(--dim)]">최근 오류가 없습니다.</p>;
  return (
    <ul className="m-0 px-4 pb-3 list-none flex flex-col divide-y divide-[var(--border)]">
      {errors.map((e, i) => (
        <li key={i} className="py-2.5 grid gap-0.5">
          <p className="m-0 flex flex-wrap items-center gap-x-2 text-[13px]">
            <b>{e.title}</b><span className="text-[12px] text-[var(--dim)]">{e.worker} · {e.target} · {agoText(e.at)}</span>
          </p>
          <p className="m-0 text-[12.5px] text-[var(--ink-2)]"><span className="text-[var(--dim)]">왜 </span>{e.why}</p>
          <p className="m-0 text-[12.5px]"><span className="text-[var(--dim)]">할 일 </span>{e.todo}</p>
        </li>
      ))}
    </ul>
  );
}

/** 최근 실행 — 크론 1시간마다 한 번. 멈춘 이유가 '몫'이면 그 단계만 쉰 것 */
export function RunsTable({ runs }: { runs: IngestRun[] }) {
  if (!runs.length) return <p className="m-0 px-4 pb-3 text-[13px] text-[var(--dim)]">아직 실행 기록이 없습니다 — 적재가 켜지면 한 번 돌 때마다 여기에 쌓입니다.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px] min-w-[640px]">
        <thead>
          <tr>
            <th className={tbl.th}>실행</th><th className={tbl.th}>시작</th><th className={`${tbl.th} text-right`}>분</th>
            <th className={`${tbl.th} text-right`}>처리</th><th className={`${tbl.th} text-right`}>새로</th><th className={`${tbl.th} text-right`}>실패</th>
            <th className={`${tbl.th} text-right`}>비용</th><th className={tbl.th}>멈춘 이유</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id}>
              <td className={`${tbl.td} font-mono text-[12px]`}>{r.id}</td>
              <td className={`${tbl.td} tabular whitespace-nowrap`}>{fmtDate(r.started_at)} {new Date(r.started_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</td>
              <td className={`${tbl.td} text-right tabular`}>{r.minutes}</td>
              <td className={`${tbl.td} text-right tabular`}>{num(r.processed)}</td>
              <td className={`${tbl.td} text-right tabular`}>+{num(r.added)}</td>
              <td className={`${tbl.td} text-right tabular`}>{r.failed}</td>
              <td className={`${tbl.td} text-right tabular`}>${r.usd.toFixed(3)}</td>
              <td className={`${tbl.td} text-[12.5px] text-[var(--ink-2)]`}>{r.stopped}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
