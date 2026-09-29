"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { MChip, pct } from "@/components/ops/measure";
import { addGoldenVerdict, decideGoldenVerdict, getGoldenVerdicts, harvestGoldenVerdicts } from "@/lib/api-v2";
import type { LinkPlatform, VerdictAnswer, VerdictConsole, VerdictItem } from "@/types/v2";
import { Linkify, PK, SOURCE_KO, StatusTabs, Tile, btn, inp, profileUrl, shownHandle } from "./golden-common";

const ANS: Record<VerdictAnswer, string> = { pass: "충족", fail: "미충족", unknown: "판단 불가" };
const ANS_S: Record<string, "ok" | "fail" | "warn" | "none"> = { pass: "ok", fail: "fail", unknown: "warn" };
const TARGET = 75;
const th = "px-3 py-1.5 font-semibold whitespace-nowrap";
const td = "px-3 py-2 align-top";
const lines = (s: string) => s.split(/[\n,\s]+/).map((x) => x.trim()).filter((x) => x.startsWith("http"));

function Links({ links }: { links: { url: string }[] }) {
  if (!links.length) return <span className="text-[var(--dim)]">근거 링크 없음</span>;
  return <>{links.map((l, i) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="mr-2 inline-flex items-center gap-0.5">근거 {i + 1}<ExternalLink size={11} aria-hidden /></a>)}</>;
}

function Answer({ onSubmit, init }: { onSubmit: (b: { expect: VerdictAnswer; evidence: string[]; scope: string; note: string }) => void; init?: VerdictItem }) {
  const [ans, setAns] = useState<VerdictAnswer | "">(init?.expect || "");
  const [ev, setEv] = useState((init?.evidence || []).map((x) => x.url).join("\n"));
  const [scope, setScope] = useState(init?.scope || "");
  const [note, setNote] = useState(init?.note || "");
  return (
    <div className="flex flex-col gap-1.5 text-[12.5px]">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="정답">
        {(Object.keys(ANS) as VerdictAnswer[]).map((k) => (
          <button key={k} type="button" aria-pressed={ans === k} onClick={() => setAns(k)}
            className={`${btn} ${ans === k ? "border-[var(--foreground)] font-semibold" : "border-[var(--border-strong)] hover:bg-[var(--soft)]"}`}>{ANS[k]}</button>
        ))}
      </div>
      <textarea aria-label="근거 링크" rows={2} value={ev} onChange={(e) => setEv(e.target.value)} name="verdict-evidence"
        placeholder="직접 확인한 근거 링크 (한 줄에 하나) — 조건을 보여 주는 게시물 · 영상 · 기사"
        className="w-full px-2 py-1 rounded-md border border-[var(--border-strong)] bg-[var(--panel)]" />
      <input aria-label="읽은 범위" value={scope} onChange={(e) => setScope(e.target.value)} autoComplete="off" name="verdict-scope"
        placeholder="링크로 못 보일 때 — 읽어 본 계정 · 기간 (예: 인스타 최근 30개 · 2026-06~09)" className={`${inp} w-full`} />
      <div className="flex flex-wrap gap-1.5 items-center">
        <input aria-label="메모" value={note} onChange={(e) => setNote(e.target.value)} autoComplete="off" placeholder="메모 (헷갈린 점)" className={`${inp} w-[200px]`} />
        <button type="button" disabled={!ans} onClick={() => ans && onSubmit({ expect: ans, evidence: lines(ev), scope, note })}
          className={`${btn} border-[var(--pass)] text-[var(--pass)] hover:bg-[var(--pass-bg)] disabled:opacity-50`}>확정</button>
      </div>
    </div>
  );
}

function Row({ it, onSaved }: { it: VerdictItem; onSaved: () => void }) {
  const [msg, setMsg] = useState("");
  const decide = async (b: Parameters<typeof decideGoldenVerdict>[1]) => {
    try { await decideGoldenVerdict(it.id, b); setMsg(""); onSaved(); } catch (e) { setMsg(String((e as Error)?.message || e)); }
  };
  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-2 text-[12.5px]">
        <div className="w-[200px] min-w-[180px]">
          <div className="text-[11px] text-[var(--dim)]">{PK[it.platform]}</div>
          <a href={profileUrl(it.platform, it.handle)} target="_blank" rel="noopener noreferrer" className="font-medium inline-flex items-center gap-1 break-all" translate="no">
            {shownHandle(it.platform, it.handle)}<ExternalLink size={11} aria-hidden /></a>
          {it.name && <div className="text-[11.5px] text-[var(--dim)]">{it.name}</div>}
          <div className="text-[11px] text-[var(--dim)]">{SOURCE_KO[it.source] || it.source}{it.mission_id && <> · <a href={`/ops/trace?m=${it.mission_id}`}>검색 추적</a></>}</div>
        </div>
        <div className="flex-1 min-w-[260px]">
          <div className="text-[13.5px] font-semibold">{it.phrase}{it.cond.topic && <span className="ml-1 text-[11.5px] font-normal text-[var(--dim)]">분야 확인</span>}</div>
          {it.cond.criterion && <div className="text-[12px] text-[var(--ink-2)]">충족 기준 · {it.cond.criterion}{it.cond.min_hits ? ` (신호 ${it.cond.min_hits}건 이상)` : ""}{it.cond.days ? ` · 최근 ${it.cond.days}일` : ""}</div>}
          {it.request && <div className="text-[11.5px] text-[var(--dim)]">요청 · {it.request}</div>}
          {it.got_verdict && (
            <div className="mt-1">
              <span className="text-[11.5px] text-[var(--dim)]">그때 판정 </span><MChip s={ANS_S[it.got_verdict] ?? "none"} label={ANS[it.got_verdict as VerdictAnswer] ?? it.got_verdict} />{" "}
              <Links links={it.got_links || []} />
              {it.got_evidence && <div className="text-[11.5px] text-[var(--ink-2)] break-words">{it.got_evidence}</div>}
            </div>
          )}
          {it.why && <div className="mt-1 text-[12px] text-[var(--ink-2)]">후보가 된 이유 · {it.why}</div>}
          {it.hint && <div className="mt-1 text-[12px] text-[var(--ink-2)] bg-[var(--soft)] rounded px-2 py-1 break-words"><b>초안 메모</b> · <Linkify text={it.hint} /></div>}
        </div>
        <div className="w-[320px] min-w-[260px]">
          {it.status === "confirmed" ? (
            <div className="flex flex-col gap-1">
              <div><MChip s={ANS_S[it.expect || ""] ?? "none"} label={`정답 ${ANS[it.expect as VerdictAnswer] ?? "—"}`} />
                <span className="ml-1 text-[11.5px] text-[var(--dim)]">{it.checked_at} 확인 · {it.split === "holdout" ? "확인용" : "개발용"}</span></div>
              <div><Links links={it.evidence || []} /></div>
              {it.scope && <div className="text-[11.5px] text-[var(--dim)]">읽은 범위 · {it.scope}</div>}
              {it.note && <div className="text-[11.5px] text-[var(--dim)]">메모 · {it.note}</div>}
              <button type="button" onClick={() => decide({ status: "pending" })} className="self-start text-[12px] text-[var(--accent)] hover:underline">다시 판정</button>
            </div>
          ) : (
            <>
              <Answer onSubmit={(b) => decide({ status: "confirmed", ...b })} />
              {it.status === "pending" && <button type="button" onClick={() => decide({ status: "skipped" })} className="mt-1 text-[12px] text-[var(--dim)] hover:underline">헷갈림 · 건너뜀</button>}
            </>
          )}
          {msg && <div className="mt-1 text-[12px] text-[var(--fail)]" role="status">{msg}</div>}
        </div>
      </div>
    </li>
  );
}

function AddForm({ onAdded }: { onAdded: () => void }) {
  const [f, setF] = useState({ platform: "instagram" as LinkPlatform, handle: "", name: "", phrase: "", criterion: "" });
  const [msg, setMsg] = useState("");
  const [ans, setAns] = useState<VerdictAnswer | "">("");
  const [ev, setEv] = useState("");
  const [scope, setScope] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addGoldenVerdict({ ...f, expect: ans || null, evidence: lines(ev), scope });
      setMsg(ans ? "확정했습니다" : "확인 대기에 넣었습니다"); setF({ ...f, handle: "", name: "" }); setEv(""); setScope(""); setAns(""); onAdded();
    } catch (err) { setMsg(String((err as Error)?.message || err)); }
  };
  return (
    <details className="surface px-4 py-3">
      <summary className="cursor-pointer text-[14px] font-semibold">사람 × 조건 직접 넣기 <span className="font-normal text-[12.5px] text-[var(--dim)]">미리 만드는 문제 — 충족 · 미충족이 반반이 되게</span></summary>
      <form onSubmit={submit} className="mt-2 flex flex-col gap-2 text-[12.5px]">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-0.5">플랫폼
            <select className={inp} value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value as LinkPlatform })}>
              <option value="instagram">인스타</option><option value="youtube">유튜브</option></select></label>
          <label className="flex flex-col gap-0.5">계정<input className={`${inp} w-[180px]`} required value={f.handle} onChange={(e) => setF({ ...f, handle: e.target.value })} placeholder="인스타 아이디 · @핸들 · UC…" autoComplete="off" /></label>
          <label className="flex flex-col gap-0.5">이름 (선택)<input className={`${inp} w-[130px]`} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="off" /></label>
          <label className="flex flex-col gap-0.5">조건 구절<input className={`${inp} w-[200px]`} required value={f.phrase} onChange={(e) => setF({ ...f, phrase: e.target.value })} placeholder="예: 제품 단점도 말하는" autoComplete="off" /></label>
          <label className="flex flex-col gap-0.5 flex-1 min-w-[220px]">충족 기준 한 문장<input className={`${inp} w-full`} value={f.criterion} onChange={(e) => setF({ ...f, criterion: e.target.value })} placeholder="무엇이 보이면 충족인가" autoComplete="off" /></label>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span>정답</span>
          {(["", "pass", "fail", "unknown"] as const).map((k) => (
            <button key={k} type="button" aria-pressed={ans === k} onClick={() => setAns(k)}
              className={`${btn} ${ans === k ? "border-[var(--foreground)] font-semibold" : "border-[var(--border-strong)]"}`}>{k ? ANS[k] : "아직 (확인 대기)"}</button>
          ))}
        </div>
        {ans && (
          <div className="flex flex-wrap gap-2">
            <textarea aria-label="근거 링크" rows={2} value={ev} onChange={(e) => setEv(e.target.value)} placeholder="근거 링크 (한 줄에 하나)"
              className="flex-1 min-w-[240px] px-2 py-1 rounded-md border border-[var(--border-strong)] bg-[var(--panel)]" />
            <input aria-label="읽은 범위" value={scope} onChange={(e) => setScope(e.target.value)} placeholder="링크로 못 보이면 읽은 계정 · 기간" className={`${inp} flex-1 min-w-[220px]`} autoComplete="off" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <button type="submit" className="h-[30px] px-3 rounded-md border border-[var(--foreground)]">넣기</button>
          {msg && <span className="text-[var(--dim)]" role="status">{msg}</span>}
        </div>
      </form>
    </details>
  );
}

/** 판정 골든셋 — 사람 × 조건 → 충족 · 미충족 · 판단 불가 + 근거. 운영 기록의 그때 판정과 맞춰 정확도를 잰다 */
export default function GoldenVerdicts() {
  const [d, setD] = useState<VerdictConsole | null>(null);
  const [err, setErr] = useState("");
  const [view, setView] = useState<VerdictItem["status"]>("pending");
  const [busy, setBusy] = useState("");
  const load = useCallback(() => getGoldenVerdicts().then(setD).catch((e) => setErr(String(e?.message || e))), []);
  useEffect(() => { load(); }, [load]);
  const harvest = async () => {
    setBusy("harvest");
    try { const r = await harvestGoldenVerdicts(); setErr(""); await load(); setBusy(`후보 ${r.added}건을 모았습니다`); }
    catch (e) { setErr(String((e as Error)?.message || e)); setBusy(""); }
  };
  if (!d && !err) return <p className="m-0 text-[13px] text-[var(--dim)]">불러오는 중…</p>;
  if (!d) return <p className="m-0 text-[13px] text-[var(--fail)]">불러오지 못했습니다: {err}</p>;
  const a = d.accuracy;
  const mixText = (Object.keys(ANS) as VerdictAnswer[]).map((k) => `${ANS[k]} ${a.mix[k]}(${pct(a.golden ? a.mix[k] / a.golden : null)} · 목표 ${pct(a.target_mix[k])})`).join(" · ");
  const list = d.items.filter((x) => x.status === view);
  return (
    <>
      <section className="surface px-4 py-3">
        <p className="m-0 text-[13px]">
          <b>이 사람이 이 조건을 충족하나</b>의 정답입니다. 시스템이 붙인 근거 링크를 열어 보고, 충족 기준 한 문장에 맞춰 정답과 근거를 남깁니다(기준은 운영 가이드 4-2).
          <b>미충족 문제가 꼭 있어야</b> 무조건 &lsquo;충족&rsquo;이라고 답하는 판정기를 잡습니다 — 후보는 미충족 · 판단 불가가 위에 옵니다.
          지금은 검색 때의 판정과 맞춰 봅니다. 다시 돌려 재는 <code translate="no">eval-verify</code>는 다음 단계입니다.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px]">
          <button type="button" onClick={harvest} disabled={busy === "harvest"}
            className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-md border border-[var(--border-strong)] hover:bg-[var(--soft)] disabled:opacity-60">
            <RefreshCw size={13} aria-hidden className={busy === "harvest" ? "animate-spin" : ""} />운영에서 후보 가져오기 (검색의 판정 · 👎 조건 틀림)
          </button>
          <span className="text-[var(--dim)]" role="status" aria-live="polite">
            {busy && busy !== "harvest" ? busy : `판정 기록 ${d.observations}건 · 검색 ${d.searches}건`}
          </span>
          {err && <span className="text-[var(--fail)]">{err}</span>}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile k="확정한 정답" v={`${a.golden} / ${TARGET}`} sub={`${mixText} · 확인용 ${a.holdout}`} />
        <Tile k="충족 정밀도 (잘못 추천 안 하나)" v={pct(a.pass_precision)} sub={`충족이라 한 것 중 정답도 충족 · 잘못 추천 ${a.wrong_pass}건`} bad={a.wrong_pass > 0} />
        <Tile k="충족 재현율 (안 놓치나)" v={pct(a.pass_recall)} sub={`정답이 충족인데 못 찾음 ${a.missed_pass}건`} />
        <Tile k="판정 일치 · 판단 불가" v={pct(a.agree)} sub={`판단 불가로 둔 비율 ${pct(a.unknown_rate)} · 맞춰 본 판정 ${a.observations}건`} />
      </div>

      {a.mistakes.length > 0 && (
        <section className="surface" aria-labelledby="vm-title">
          <h2 id="vm-title" className="m-0 px-4 pt-3.5 pb-2 text-[14px] font-semibold">정답과 다른 판정 {a.mistakes.length}건</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px] min-w-[680px]">
              <thead><tr className="text-left text-[11.5px] text-[var(--dim)] bg-[var(--soft)]">
                {["사람", "조건", "그때 판정", "정답", ""].map((h, i) => <th key={i} scope="col" className={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {a.mistakes.map((m, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td className={td} translate="no">{PK[m.platform]} {shownHandle(m.platform, m.handle)}</td>
                    <td className={td}>{m.phrase}</td>
                    <td className={`${td} ${m.got_verdict === "pass" && m.expect === "fail" ? "text-[var(--fail)] font-semibold" : ""}`}>{ANS[m.got_verdict as VerdictAnswer] ?? m.got_verdict}</td>
                    <td className={td}>{ANS[m.expect as VerdictAnswer] ?? m.expect}</td>
                    <td className={td}><a href={`/ops/trace?m=${m.mission_id}`} className="text-[12px]">검색 추적</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="surface" aria-labelledby="gv-title">
        <div className="flex flex-wrap items-center gap-2 px-4 pt-3.5 pb-2">
          <h2 id="gv-title" className="m-0 text-[14px] font-semibold">판정 정답</h2>
          <StatusTabs value={view} onChange={setView} counts={d.counts} labels={{ pending: "확인 대기", confirmed: "확정", skipped: "건너뜀" }} />
          <span className="text-[12px] text-[var(--dim)]">기간이 붙은 조건은 확인 날짜에서 3개월이 지나면 다시 봅니다</span>
        </div>
        {!list.length && <p className="m-0 px-4 pb-3 text-[13px] text-[var(--dim)]">{view === "pending" ? "확인할 후보가 없습니다 — 위 버튼으로 가져오거나 아래에서 직접 넣으세요." : "없습니다."}</p>}
        <ul className="m-0 p-0 list-none divide-y divide-[var(--border)]">
          {list.map((it) => <Row key={`${it.id}-${it.status}`} it={it} onSaved={load} />)}
        </ul>
      </section>
      <AddForm onAdded={load} />
    </>
  );
}
