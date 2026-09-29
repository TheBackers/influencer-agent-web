"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { MChip, pct } from "@/components/ops/measure";
import { addGolden, decideGolden, getGolden, harvestGolden } from "@/lib/api-v2";
import type { GoldenConsole, GoldenItem, LinkPlatform } from "@/types/v2";
import GoldenConditions from "@/components/ops/golden-conditions";
import GoldenVerdicts from "@/components/ops/golden-verdicts";
import { Linkify, PK, Tile, profileUrl as profile, shownHandle as shown } from "@/components/ops/golden-common";

const SRC: Record<GoldenItem["source"], string> = { run: "실행 기록", feedback: "사람 평가 '다른 사람'", manual: "직접 입력", draft: "1차 초안" };
const th = "px-3 py-1.5 font-semibold whitespace-nowrap";
const td = "px-3 py-2 align-top";

type Tab = "links" | "conditions" | "verdicts";
const TABS: { k: Tab; label: string; what: string }[] = [
  { k: "conditions", label: "조건", what: "요청문 → 나와야 할 조건 카드 (query-planner)" },
  { k: "links", label: "계정 연결", what: "계정 → 다른 플랫폼 정답 계정 · 없음 (account-linker)" },
  { k: "verdicts", label: "판정", what: "사람 × 조건 → 충족 · 미충족 · 판단 불가 (verifier)" },
];

/** 골든셋 — 사람이 확인한 정답 모음 세 가지. 미리 만들고(직접 추가 · 1차 초안) 운영하면서 키운다(후보 가져오기) */
export default function GoldenPage() {
  const [tab, setTab] = useState<Tab>("conditions");
  const pick = setTab;
  return (
    <>
      <section className="surface px-4 py-3">
        <p className="m-0 text-[13px]">
          골든셋은 <b>사람이 확인한 정답이 붙은 시험지</b>입니다. 에이전트를 고칠 때마다 같은 문제로 다시 채점해 정확도를 숫자로 보고 버전을 비교합니다.
          처음에는 <b>미리 만들고</b>(직접 추가 · 1차 초안), 운영하면서는 틀린 사례를 <b>후보 가져오기</b>로 모아 주 1회 확정합니다.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5" role="tablist" aria-label="골든셋 종류">
          {TABS.map((t) => (
            <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} onClick={() => pick(t.k)} title={t.what}
              className={`h-[30px] px-3 rounded-md border text-[13px] ${tab === t.k ? "border-[var(--foreground)] font-semibold" : "border-[var(--border-strong)] text-[var(--dim)] hover:bg-[var(--soft)]"}`}>
              {t.label}
            </button>
          ))}
          <span className="self-center text-[12px] text-[var(--dim)]">{TABS.find((t) => t.k === tab)?.what}</span>
        </div>
      </section>
      {tab === "links" && <LinksTab />}
      {tab === "conditions" && <GoldenConditions />}
      {tab === "verdicts" && <GoldenVerdicts />}
    </>
  );
}

/** 계정 연결 — 다른 플랫폼 계정 연결의 정답을 사람이 확인해 모으고, 운영 기록의 연결이 맞았는지 잰다 */
function LinksTab() {
  const [d, setD] = useState<GoldenConsole | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<GoldenItem["status"]>("pending");
  const [busy, setBusy] = useState("");
  const load = useCallback(() => getGolden().then(setD).catch((e) => setErr(String(e?.message || e))), []);
  useEffect(() => { load(); }, [load]);

  const harvest = async () => {
    setBusy("harvest");
    try { const r = await harvestGolden(); setErr(""); await load(); setBusy(`후보 ${r.added}건을 모았습니다`); }
    catch (e) { setErr(String((e as Error)?.message || e)); setBusy(""); }
  };
  const decide = async (it: GoldenItem, body: Parameters<typeof decideGolden>[1]) => {
    try { await decideGolden(it.id, body); await load(); } catch (e) { setErr(String((e as Error)?.message || e)); }
  };

  if (!d && !err) return <p className="m-0 text-[13px] text-[var(--dim)]">불러오는 중…</p>;
  if (!d) return <p className="m-0 text-[13px] text-[var(--fail)]">불러오지 못했습니다: {err}</p>;
  const a = d.accuracy;
  const list = d.items.filter((x) => x.status === tab);

  return (
    <>
      <section className="surface px-4 py-3">
        <p className="m-0 text-[13px]">
          검색 중 계정 연결 에이전트가 붙인 다른 플랫폼 계정을 <b>사람이 맞는지 확인해 정답(골든)으로 모읍니다</b>.
          확정한 정답과 운영 기록을 대조해 정확도를 재고, <code translate="no">python -m agentops eval-link</code> 는 확정 쌍으로 지금 버전을 다시 돌려 잽니다.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px]">
          <button type="button" onClick={harvest} disabled={busy === "harvest"}
            className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-md border border-[var(--border-strong)] hover:bg-[var(--soft)] disabled:opacity-60">
            <RefreshCw size={13} aria-hidden className={busy === "harvest" ? "animate-spin" : ""} />실행 기록에서 확인할 후보 가져오기
          </button>
          <span className="text-[var(--dim)]" role="status" aria-live="polite">
            {busy && busy !== "harvest" ? busy : `최근 검색 ${d.searches}건 · 연결 관측 ${d.observations}건`}
          </span>
          {err && <span className="text-[var(--fail)]">{err}</span>}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Tile k="확정한 정답" v={`${a.golden}쌍`} sub={`계정 있음 ${a.golden_exists} · 없음 ${a.golden - a.golden_exists}`} />
        <Tile k="정밀도 (붙인 것 중 맞음)" v={pct(a.precision)} sub="기준 ≥ 95% · 틀리게 붙이면 남의 정보가 섞입니다" bad={a.precision != null && a.precision < 0.95} />
        <Tile k="재현율 (있는 계정을 찾음)" v={pct(a.recall)} sub="기준 ≥ 70%" bad={a.recall != null && a.recall < 0.7} />
        <Tile k="오연결 (치명)" v={`${a.wrong_link}건`} sub={`놓침 ${a.missed}건 · '없음' 맞힘 ${pct(a.none_accuracy)}`} bad={a.wrong_link > 0} />
        <Tile k={`판정 기준 ${a.at_cutoff.cutoff} 이상 정밀도`} v={pct(a.at_cutoff.precision)}
          sub={a.suggest ? `제안: ${a.suggest.cutoff} 이상이면 정밀도 95% (연결의 ${pct(a.suggest.kept_rate)} 유지)` : "제안하려면 확정 관측이 더 필요합니다(5건+)"} />
      </div>
      {a.observations === 0 && (
        <p className="m-0 text-[12.5px] text-[var(--dim)]">
          아직 정답과 맞춰 볼 관측이 없습니다 — 아래 &lsquo;확인 대기&rsquo;에서 몇 건을 확정하면 정확도가 계산됩니다. 확정할수록(목표 20쌍+) 숫자가 믿을 만해집니다.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface" aria-labelledby="band-title">
          <h2 id="band-title" className="m-0 px-4 pt-3.5 pb-2 text-[14px] font-semibold">확신도는 믿을 만한가 <span className="font-normal text-[12.5px] text-[var(--dim)]">구간별 정밀도 — 확신도가 높을수록 맞아야 정상</span></h2>
          <table className="w-full border-collapse text-[12.5px] tabular">
            <thead><tr className="text-left text-[11.5px] text-[var(--dim)] bg-[var(--soft)]">
              {["확신도", "연결 수", "정밀도", ""].map((h, i) => <th key={i} scope="col" className={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {a.bands.map((b) => (
                <tr key={b.from} className="border-t border-[var(--border)]">
                  <td className={td}>{b.from.toFixed(1)} ~ {b.to.toFixed(1)}{b.from < 0.6 && <span className="text-[var(--dim)]"> · 판정에 안 씀</span>}</td>
                  <td className={td}>{b.n}</td>
                  <td className={`${td} font-semibold`}>{pct(b.precision)}</td>
                  <td className={`${td} w-[40%]`}>
                    <span className="block h-[10px] rounded-[3px] bg-[var(--soft)] overflow-hidden" aria-hidden>
                      <span className="block h-full rounded-[3px] bg-[var(--accent)]" style={{ width: `${(b.precision ?? 0) * 100}%` }} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="surface" aria-labelledby="ver-title">
          <h2 id="ver-title" className="m-0 px-4 pt-3.5 pb-2 text-[14px] font-semibold">버전별 <span className="font-normal text-[12.5px] text-[var(--dim)]">프롬프트 · 모델을 바꾼 뒤 나빠졌는지</span></h2>
          <table className="w-full border-collapse text-[12.5px] tabular">
            <thead><tr className="text-left text-[11.5px] text-[var(--dim)] bg-[var(--soft)]">
              {["버전", "관측", "정밀도", "재현율", "오연결"].map((h) => <th key={h} scope="col" className={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {a.by_version.map((v) => (
                <tr key={v.version} className="border-t border-[var(--border)]">
                  <td className={td} translate="no">{v.version}</td><td className={td}>{v.observations}</td>
                  <td className={td}>{pct(v.precision)}</td><td className={td}>{pct(v.recall)}</td>
                  <td className={`${td} ${v.wrong_link ? "text-[var(--fail)] font-semibold" : ""}`}>{v.wrong_link}</td>
                </tr>
              ))}
              {!a.by_version.length && <tr><td colSpan={5} className={`${td} text-[var(--dim)]`}>아직 없습니다.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>

      {a.mistakes.length > 0 && (
        <section className="surface" aria-labelledby="mis-title">
          <h2 id="mis-title" className="m-0 px-4 pt-3.5 pb-2 text-[14px] font-semibold">틀린 연결 · 놓친 계정 {a.mistakes.length}건</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px] min-w-[720px]">
              <thead><tr className="text-left text-[11.5px] text-[var(--dim)] bg-[var(--soft)]">
                {["후보", "붙인 계정", "정답", "확신도", "찾은 경로", ""].map((h, i) => <th key={i} scope="col" className={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {a.mistakes.map((m, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td className={td} translate="no">{PK[m.from_platform as LinkPlatform]} {shown(m.from_platform as LinkPlatform, m.from_handle)}</td>
                    <td className={`${td} ${m.verdict === "wrong" ? "text-[var(--fail)] font-medium" : "text-[var(--dim)]"}`} translate="no">{m.got_id ? shown(m.to_platform as LinkPlatform, m.got_id) : "못 찾음"}</td>
                    <td className={td} translate="no">{m.expect_id ? shown(m.to_platform as LinkPlatform, m.expect_id) : "계정 없음"}</td>
                    <td className={td}>{m.confidence == null ? "—" : Number(m.confidence).toFixed(2)}</td>
                    <td className={`${td} text-[var(--ink-2)] max-w-[280px]`}>{m.how || "—"}</td>
                    <td className={td}><a href={`/ops/trace?m=${m.mission_id}`} className="text-[12px]">검색 추적</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="surface" aria-labelledby="q-title">
        <div className="flex flex-wrap items-center gap-2 px-4 pt-3.5 pb-2">
          <h2 id="q-title" className="m-0 text-[14px] font-semibold">정답 확인</h2>
          <div className="flex gap-1" role="group" aria-label="보기">
            {(["pending", "confirmed", "skipped"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k}
                className={`h-[28px] px-2.5 rounded-md border text-[12.5px] ${tab === k ? "border-[var(--foreground)] font-medium" : "border-[var(--border-strong)] text-[var(--dim)]"}`}>
                {{ pending: "확인 대기", confirmed: "확정", skipped: "건너뜀" }[k]} {d.counts[k]}
              </button>
            ))}
          </div>
          <span className="text-[12px] text-[var(--dim)]">두 계정을 열어 보고 같은 사람인지 판단하세요 — &lsquo;다른 사람&rsquo; 평가가 붙은 것이 위에 있습니다</span>
        </div>
        {!list.length && <p className="m-0 px-4 pb-3 text-[13px] text-[var(--dim)]">{tab === "pending" ? "확인할 후보가 없습니다 — 위 버튼으로 실행 기록에서 가져오세요." : "없습니다."}</p>}
        <ul className="m-0 p-0 list-none divide-y divide-[var(--border)]">
          {list.map((it) => <Row key={it.id} it={it} onDecide={(b) => decide(it, b)} />)}
        </ul>
      </section>

      <AddForm onAdded={load} />
    </>
  );
}

function Row({ it, onDecide }: { it: GoldenItem; onDecide: (b: Parameters<typeof decideGolden>[1]) => void }) {
  const [expect, setExpect] = useState("");
  const [open, setOpen] = useState(false);
  // 증거 — 무엇을 보고 정답으로 정했나(PRD 12-3). ①② 이거나 ③을 직접 봤을 때만 '맞음' · 비슷함만이면 '모르겠음'
  const [grade, setGrade] = useState("");
  const [proof, setProof] = useState("");
  const note = grade ? `증거 ${grade}${proof.trim() ? ` · ${proof.trim()}` : ""}` : proof.trim();
  const confirm = (b: Parameters<typeof decideGolden>[1]) => onDecide({ ...b, note });
  const fromUrl = profile(it.from_platform, it.from_handle);
  const gotUrl = profile(it.to_platform, it.got_id);
  const btn = "h-[28px] px-2.5 rounded-md border text-[12.5px] whitespace-nowrap";
  return (
    <li className="px-4 py-2.5">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-1.5 text-[12.5px]">
        <div className="min-w-[200px]">
          <div className="text-[11px] text-[var(--dim)]">발굴한 {PK[it.from_platform]}</div>
          <a href={fromUrl} target="_blank" rel="noopener noreferrer" className="font-medium inline-flex items-center gap-1" translate="no">
            {shown(it.from_platform, it.from_handle)}<ExternalLink size={11} aria-hidden /></a>
          {it.name && <div className="text-[11.5px] text-[var(--dim)]">{it.name}</div>}
        </div>
        <div className="min-w-[220px] flex-1">
          <div className="text-[11px] text-[var(--dim)]">에이전트가 붙인 {PK[it.to_platform]}{it.got_confidence != null && ` · 확신도 ${Number(it.got_confidence).toFixed(2)}`}</div>
          {it.got_id ? (
            <a href={gotUrl} target="_blank" rel="noopener noreferrer" className="font-medium inline-flex items-center gap-1" translate="no">
              {shown(it.to_platform, it.got_id)}<ExternalLink size={11} aria-hidden /></a>
          ) : <span className="text-[var(--dim)]">못 찾음</span>}
          {it.got_how && <div className="text-[11.5px] text-[var(--ink-2)]">{it.got_how}</div>}
          {it.hint && <div className="mt-0.5 text-[11.5px] text-[var(--ink-2)] bg-[var(--soft)] rounded px-1.5 py-0.5 break-words"><b>초안 메모</b> · <Linkify text={it.hint} /></div>}
          <div className="text-[11px] text-[var(--dim)]">
            {SRC[it.source]}{it.mission_id && <> · <a href={`/ops/trace?m=${it.mission_id}`}>검색 추적</a></>}
            {it.evidence_url && <> · <a href={it.evidence_url} target="_blank" rel="noopener noreferrer">근거 글</a></>}
          </div>
        </div>
        <div className="min-w-[220px]">
          {it.status === "confirmed" ? (
            <div>
              <MChip s="ok" label="확정" />{" "}
              <span translate="no">{it.expect_exists ? `정답 ${shown(it.to_platform, it.expect_id)}` : `${PK[it.to_platform]} 계정 없음`}</span>
              <button type="button" onClick={() => onDecide({ status: "pending" })} className="ml-2 text-[12px] text-[var(--accent)] hover:underline">다시 판정</button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {it.got_id && (
                <button type="button" onClick={() => confirm({ status: "confirmed", exists: true, expect: it.got_id! })}
                  className={`${btn} border-[var(--pass)] text-[var(--pass)] hover:bg-[var(--pass-bg)]`}>맞음 · 같은 사람</button>
              )}
              <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
                className={`${btn} border-[var(--border-strong)] hover:bg-[var(--soft)]`}>{it.got_id ? "틀림 · 정답 입력" : "있음 · 정답 입력"}</button>
              <button type="button" onClick={() => confirm({ status: "confirmed", exists: false })}
                className={`${btn} border-[var(--border-strong)] hover:bg-[var(--soft)]`}>{PK[it.to_platform]} 계정 없음</button>
              {it.status === "pending" && <button type="button" onClick={() => onDecide({ status: "skipped" })} className={`${btn} border-transparent text-[var(--dim)]`}>모르겠음</button>}
            </div>
          )}
          {it.status !== "confirmed" && (
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[12px]">
              <select aria-label="증거 종류" value={grade} onChange={(e) => setGrade(e.target.value)} name="golden-grade"
                className="h-[28px] px-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--panel)]">
                <option value="">증거 (선택)</option>
                <option value="①소개란·설명란이 다른 쪽을 가리킴">① 소개란 · 설명란이 다른 쪽을 가리킴</option>
                <option value="②한 글에 두 계정">② 한 글에 두 계정이 함께</option>
                <option value="③직접 확인">③ 같은 사람 · 콘텐츠를 직접 확인</option>
                <option value="없음 확인">없음 — 소개란 · 검색에 없음</option>
              </select>
              <input aria-label="증거 링크" value={proof} onChange={(e) => setProof(e.target.value)} name="golden-proof" autoComplete="off"
                placeholder="증거 링크 (소개란 · 글 주소)" className="h-[28px] w-[200px] px-2 rounded-md border border-[var(--border-strong)] bg-[var(--panel)]" />
            </div>
          )}
          {it.status === "confirmed" && it.note && <div className="mt-0.5 text-[11.5px] text-[var(--dim)] break-all">{it.note}</div>}
          {open && it.status !== "confirmed" && (
            <form className="mt-1.5 flex gap-1.5" onSubmit={(e) => { e.preventDefault(); if (expect.trim()) confirm({ status: "confirmed", exists: true, expect: expect.trim() }); }}>
              <input aria-label="정답 아이디" value={expect} onChange={(e) => setExpect(e.target.value)} autoComplete="off" name="golden-expect"
                placeholder={it.to_platform === "instagram" ? "인스타 아이디" : "@핸들 또는 UC… 채널 ID"}
                className="h-[28px] w-[180px] px-2 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[12.5px]" />
              <button type="submit" className={`${btn} border-[var(--foreground)]`}>저장</button>
            </form>
          )}
        </div>
      </div>
    </li>
  );
}

function AddForm({ onAdded }: { onAdded: () => void }) {
  const [f, setF] = useState({ from_platform: "youtube", from_handle: "", to_platform: "instagram", exists: true, expect: "" });
  const [msg, setMsg] = useState("");
  const inp = "h-[30px] px-2 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[12.5px]";
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await addGolden(f); setMsg("추가했습니다"); setF({ ...f, from_handle: "", expect: "" }); onAdded(); }
    catch (err) { setMsg(String((err as Error)?.message || err)); }
  };
  return (
    <details className="surface px-4 py-3">
      <summary className="cursor-pointer text-[14px] font-semibold">알고 있는 정답 쌍 직접 넣기</summary>
      <form onSubmit={submit} className="mt-2 flex flex-wrap items-end gap-2 text-[12.5px]">
        <label className="flex flex-col gap-0.5">발굴 플랫폼
          <select className={inp} value={f.from_platform} onChange={(e) => setF({ ...f, from_platform: e.target.value, to_platform: e.target.value === "youtube" ? "instagram" : "youtube" })}>
            <option value="youtube">유튜브</option><option value="instagram">인스타</option>
          </select>
        </label>
        <label className="flex flex-col gap-0.5">발굴한 계정
          <input className={`${inp} w-[190px]`} required value={f.from_handle} onChange={(e) => setF({ ...f, from_handle: e.target.value })} placeholder="@핸들 · UC… · 인스타 아이디" autoComplete="off" name="from-handle" />
        </label>
        <label className="flex items-center gap-1.5 h-[30px]">
          <input type="checkbox" checked={!f.exists} onChange={(e) => setF({ ...f, exists: !e.target.checked })} /> {f.to_platform === "instagram" ? "인스타" : "유튜브"} 계정 없음
        </label>
        {f.exists && (
          <label className="flex flex-col gap-0.5">정답 {f.to_platform === "instagram" ? "인스타" : "유튜브"}
            <input className={`${inp} w-[190px]`} required value={f.expect} onChange={(e) => setF({ ...f, expect: e.target.value })} autoComplete="off" name="expect" />
          </label>
        )}
        <button type="submit" className="h-[30px] px-3 rounded-md border border-[var(--foreground)]">추가</button>
        {msg && <span className="text-[var(--dim)]" role="status">{msg}</span>}
      </form>
    </details>
  );
}
