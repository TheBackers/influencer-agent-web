"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Plus, X } from "lucide-react";
import { Switch, fmtDate, num, pct, tbl } from "@/components/v2/ui";
import type { IngestError, IngestRun, IngestStatus, IngestWorker, KeywordRow, StageRow, TopicCandidate, TopicPatch, TopicRow } from "@/types/catalog";
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
      <Tile label="14일 안 갱신" value={pct(t.fresh_ratio)} meter={<Meter value={t.fresh_ratio} max={1} goal />}
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

const SOURCE_KO: Record<KeywordRow["source"], string> = { seed: "후보 기본 낱말", manual: "사람이 넣음", auto_tag: "자동 — 모은 사람들의 해시태그", auto_llm: "자동 — AI가 넓힘" };
const kwTitle = (k: KeywordRow) =>
  `${SOURCE_KO[k.source]} · 검색 ${k.queries}번 · 새 사람 ${k.added}명${k.classified ? ` · 분야 적중 ${k.hits}/${k.classified}` : ""}`;
const SHOW = 8;

/** 한 분야의 낱말 — 켜진 낱말은 칩(자동 표시 · ✕ 빼기), 꺼진 낱말은 이유와 함께 접어 둔다(D40) */
function Keywords({ t, busy, onPatch }: { t: TopicRow; busy: boolean; onPatch: (p: TopicPatch) => Promise<void> }) {
  const [all, setAll] = useState(false);
  const [adding, setAdding] = useState(false);
  const [kw, setKw] = useState("");
  const on = t.keyword_rows.filter((k) => k.status === "active");
  const off = t.keyword_rows.filter((k) => k.status === "off");
  const shown = all ? on : on.slice(0, SHOW);
  const add = async () => {
    const words = kw.split(/[,·]/).map((w) => w.trim()).filter(Boolean);
    if (!words.length) return;
    await onPatch({ add_keywords: words });
    setKw(""); setAdding(false);
  };
  return (
    <div className="flex flex-col gap-1.5">
      {on.length ? (
        <ul className="m-0 p-0 list-none flex flex-wrap gap-1" aria-label={`${t.name} 켜진 낱말`}>
          {shown.map((k) => (
            <li key={k.word} title={kwTitle(k)}
              className="inline-flex items-center gap-1 h-[22px] pl-2 pr-0.5 rounded-full border border-[var(--border)] bg-[var(--soft)] text-[12px] whitespace-nowrap">
              {k.word}
              {(k.source === "auto_tag" || k.source === "auto_llm") && <span className="text-[10.5px] text-[var(--accent)]">자동</span>}
              <button type="button" aria-label={`낱말 빼기: ${k.word}`} disabled={busy}
                className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-transparent border-0 text-[var(--dim)] hover:bg-[var(--border)] hover:text-[var(--foreground)] disabled:opacity-40"
                onClick={() => onPatch({ remove_keywords: [k.word] })}>
                <X size={11} aria-hidden />
              </button>
            </li>
          ))}
          {on.length > SHOW && (
            <li><button type="button" className="h-[22px] px-1.5 bg-transparent border-0 text-[12px] text-[var(--accent)]" onClick={() => setAll(!all)}>
              {all ? "접기" : `+${on.length - SHOW}개`}
            </button></li>
          )}
        </ul>
      ) : (
        <p className="m-0 text-[12px] text-[var(--dim)]">낱말 없음 — 첫 적재에서 자동으로 만듭니다</p>
      )}
      {off.length > 0 && (
        <details className="text-[12px]">
          <summary className="cursor-pointer text-[var(--dim)]">꺼진 낱말 {off.length}개</summary>
          <ul className="m-0 mt-1 p-0 list-none flex flex-col gap-0.5">
            {off.map((k) => (
              <li key={k.word} className="flex flex-wrap items-center gap-x-1.5">
                <span className="line-through text-[var(--dim)]">{k.word}</span>
                <span className="text-[var(--ink-2)]">{k.off_reason || "성과 없음"}</span>
                <button type="button" disabled={busy} className="p-0 bg-transparent border-0 text-[var(--accent)] disabled:opacity-40"
                  onClick={() => onPatch({ add_keywords: [k.word] })}>다시 켜기</button>
              </li>
            ))}
          </ul>
        </details>
      )}
      {adding ? (
        <form className="flex gap-1.5" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <label className="sr-only" htmlFor={`kw-${t.name}`}>더할 검색 낱말</label>
          <input id={`kw-${t.name}`} autoFocus className={`${input} flex-1`} placeholder="쉼표로 여러 개" value={kw} onChange={(e) => setKw(e.target.value)} />
          <button type="submit" className={small} disabled={busy || !kw.trim()}>더하기</button>
          <button type="button" className={small} onClick={() => { setAdding(false); setKw(""); }}>취소</button>
        </form>
      ) : (
        <button type="button" className="self-start p-0 bg-transparent border-0 text-[12px] text-[var(--dim)] hover:text-[var(--accent)] inline-flex items-center gap-1" onClick={() => setAdding(true)}>
          <Plus size={12} aria-hidden />직접 더하기 (안 해도 됨)
        </button>
      )}
    </div>
  );
}

/** 분야 표 — 켜기/끄기 · 인원/목표 · 낱말(자동 · 빼기만) */
export function TopicsTable({ topics, onPatch }: { topics: TopicRow[]; onPatch: (name: string, p: TopicPatch) => Promise<void> }) {
  const [busy, setBusy] = useState("");
  const patch = async (name: string, p: TopicPatch) => { setBusy(name); try { await onPatch(name, p); } finally { setBusy(""); } };
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px] min-w-[980px]">
        <thead>
          <tr>
            <th className={tbl.th}>분야</th><th className={tbl.th}>적재</th><th className={`${tbl.th} w-[170px]`}>인원 / 목표</th>
            <th className={`${tbl.th} text-right`}>개인 크리에이터</th><th className={`${tbl.th} text-right`}>신선도</th>
            <th className={`${tbl.th} text-right`}>7일 새로</th><th className={`${tbl.th} text-right`} title="소개글 검색 1회에 새로 들어온 계정 수">검색 1회당 새 계정</th>
            <th className={`${tbl.th} w-[360px]`}>검색 낱말 <span className="font-normal text-[var(--dim)]">— 자동</span></th><th className={tbl.th}>마지막 실행</th>
          </tr>
        </thead>
        <tbody>
          {topics.map((t) => (
            <tr key={t.name}>
              <td className={`${tbl.td} whitespace-nowrap`}>
                <p className="m-0 font-medium">{t.name}</p>
                {t.origin === "candidate" && <p className="m-0 text-[11.5px] text-[var(--dim)]">후보에서 고름</p>}
              </td>
              <td className={tbl.td}>
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  <Switch id={`topic-${t.name}`} checked={t.enabled} label={`${t.name} 적재`} disabled={busy === t.name}
                    onChange={(v) => patch(t.name, { enabled: v })} />
                  <span className="text-[12px] text-[var(--dim)]">{t.enabled ? "켜짐" : "꺼짐"}</span>
                </span>
              </td>
              <td className={tbl.td}>
                <p className="m-0 tabular text-[12.5px]">{num(t.people)} / {num(t.target)}</p>
                <Meter value={t.people} max={t.target} goal />
              </td>
              <td className={`${tbl.td} text-right tabular`}>{num(t.creators)}</td>
              <td className={`${tbl.td} text-right tabular`}>{t.people ? pct(t.fresh_ratio) : "—"}</td>
              <td className={`${tbl.td} text-right tabular`}>+{num(t.new_7d)}</td>
              <td className={`${tbl.td} text-right tabular`}>
                {t.queries_used ? (t.yield_per_query < 2 ? <Dot color="var(--unknown)" strong title="새 계정이 줄고 있습니다 — 다음 실행에서 낱말을 자동으로 늘립니다">{t.yield_per_query.toFixed(1)}명</Dot> : `${t.yield_per_query.toFixed(1)}명`) : "—"}
              </td>
              <td className={`${tbl.td} max-w-[360px]`}>
                <Keywords t={t} busy={busy === t.name} onPatch={(p) => patch(t.name, p)} />
              </td>
              <td className={`${tbl.td} whitespace-nowrap text-[12.5px] text-[var(--dim)]`}>{t.last_run_at ? agoText(t.last_run_at) : "다음 실행부터"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 분야 고르기 — 후보를 체크하면 끝(D39). 낱말은 후보 기본 낱말로 시작하고 적재가 알아서 늘린다(D40) */
export function TopicPicker({ candidates, onAdd, onCancel }: {
  candidates: TopicCandidate[] | null;
  onAdd: (names: string[], target: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [own, setOwn] = useState("");
  const [target, setTarget] = useState(1000);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const ownNames = own.split(/[,·]/).map((w) => w.trim()).filter(Boolean);
  const names = [...new Set([...picked, ...ownNames])];
  const toggle = (n: string) => setPicked((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try { await onAdd(names, target); } catch (x) { setErr(String((x as Error)?.message || x)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="surface px-4 py-3 flex flex-col gap-2.5">
      <div>
        <p className="m-0 text-[13px] font-semibold">분야 고르기</p>
        <p className="m-0 mt-0.5 text-[12px] text-[var(--dim)]">체크만 하면 다음 실행부터 알아서 모읍니다. 검색 낱말은 후보 기본 낱말로 시작해 해시태그 · AI로 자동으로 늘고, 성과 없는 낱말은 저절로 꺼집니다.</p>
      </div>
      {candidates === null ? (
        <p className="m-0 text-[12.5px] text-[var(--dim)]">후보를 불러오는 중…</p>
      ) : candidates.length ? (
        <fieldset className="m-0 p-0 border-0">
          <legend className="sr-only">분야 후보</legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
            {candidates.map((c) => {
              const on = picked.includes(c.name);
              return (
                <label key={c.name} title={c.keywords.join(" · ")}
                  className={`flex items-start gap-2 rounded-md border px-2.5 py-2 cursor-pointer ${on ? "border-[var(--accent)] bg-[var(--soft)]" : "border-[var(--border)] hover:border-[var(--border-strong)]"}`}>
                  <input type="checkbox" className="mt-0.5 accent-[var(--accent)]" checked={on} onChange={() => toggle(c.name)} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium">{c.name}</span>
                    <span className="block text-[11.5px] text-[var(--dim)] truncate">{c.note}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <p className="m-0 text-[12.5px] text-[var(--dim)]">후보를 모두 넣었습니다 — 아래에 직접 적으세요.</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="nt-own">직접 입력할 분야</label>
        <input id="nt-own" className={`${input} flex-1 min-w-[220px]`} placeholder="후보에 없는 분야 — 이름만 (예: 미니어처, 보드게임)" value={own} onChange={(e) => setOwn(e.target.value)} />
        <label className="text-[12px] text-[var(--dim)] inline-flex items-center gap-1.5" htmlFor="nt-target">분야당 목표
          <input id="nt-target" type="number" min={100} step={100} className={`${input} w-[90px] tabular`} value={target} onChange={(e) => setTarget(Number(e.target.value) || 0)} />명
        </label>
        <button type="submit" className={small} disabled={busy || !names.length}>{names.length ? `${names.length}개 분야 추가` : "분야를 고르세요"}</button>
        <button type="button" className={small} onClick={onCancel}>닫기</button>
      </div>
      <p aria-live="polite" className="m-0 min-h-[16px] text-[12px]" style={{ color: err ? "var(--fail)" : "var(--dim)" }}>
        {err || (names.length ? `${names.join(" · ")} — 첫 적재는 분야당 1~2주 걸립니다` : "")}
      </p>
    </form>
  );
}

/** 적재 그래프 — 단계(노드)별 대기 · 24시간 처리 · 실패 */
export function StageFlow({ stages }: { stages: StageRow[] }) {
  return (
    <ol className="m-0 px-4 pb-4 list-none grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
      {stages.map((st, i) => (
        <li key={st.key} className="relative rounded-md border border-[var(--border)] px-3 py-2.5" style={st.llm ? { borderColor: "var(--border-strong)" } : undefined}>
          <p className="m-0 text-[12px] text-[var(--dim)] flex items-start gap-1 min-h-[34px]">
            <span className="tabular">{i + 1}</span><span className="font-medium text-[var(--foreground)] leading-snug">{st.label}</span>
            {st.llm && <span className="ml-auto text-[11px] text-[var(--accent)]" title="이 단계에만 AI 호출이 있다">AI</span>}
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
  seed: "씨앗", collect: "수집 · 뽑기", classify: "분류", enrich: "웹 보강", store: "저장",
};

/** 적재 워커 5개 — 한 가지 일만 하고 능력(capability)으로 불린다(D41). 툴은 코드가 직접 부른다 */
export function WorkersTable({ workers }: { workers: IngestWorker[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px] min-w-[900px]">
        <thead>
          <tr>
            <th className={tbl.th}>워커</th><th className={tbl.th}>단계</th><th className={tbl.th}>하는 일</th><th className={tbl.th}>AI</th>
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
                <p className="m-0 text-[11.5px] text-[var(--dim)]">쓰는 툴 · 코드: {w.reuses}</p>
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

/** 최근 실행 — 크론 1시간마다 한 번. '할 일 없음' · '마감 5분 전'은 정상, '몫 소진'은 쿼터 · 비용 몫을 다 쓴 것 */
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
