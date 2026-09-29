"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Trash2, Wand2 } from "lucide-react";
import { MChip } from "@/components/ops/measure";
import { addGoldenCondition, decideGoldenCondition, draftGoldenCondition, getGoldenConditions, harvestGoldenConditions } from "@/lib/api-v2";
import type { CondCase, CondConsole, CondItem, ExpectCard, LinkPlatform } from "@/types/v2";
import { Linkify, SOURCE_KO, StatusTabs, btn, inp } from "./golden-common";

type View = "pending" | "confirmed" | "skipped" | "file";
const METHOD_KO: Record<string, string> = { metric: "숫자로 잼", rubric: "기준표로 읽음", evidence: "근거 · 추정" };
// 유형마다 적을 칸 — 적은 칸만 채점한다(agentops/eval/decompose.py matches)
const FIELDS: Record<string, (keyof ExpectCard)[]> = {
  규모: ["min", "max"], 참여율: ["min"], 활동: ["days"], 성장: ["days"], 콘텐츠: ["keywords"], 협찬: ["keywords", "days"],
  인물: ["attribute", "value"], 지역언어: ["value"], 팔로워층: ["value"], 사실: ["value"], 평판: ["value"], 기타: ["value"], 성향: [], 플랫폼: ["platforms"],
};
const FIELD_KO: Partial<Record<keyof ExpectCard, string>> = { min: "이상", max: "이하", days: "기간(일)", keywords: "낱말(하나라도)", attribute: "속성", value: "포함할 말", platforms: "플랫폼" };
const TARGET = 60;

export function cardText(e: ExpectCard): string {
  const b: string[] = [e.type];
  if (e.min != null || e.max != null) b.push(`${e.min ?? ""}~${e.max ?? ""}`);
  if (e.days != null) b.push(`${e.days}일`);
  if (e.attribute) b.push(e.attribute);
  if (e.value) b.push(`'${e.value}'`);
  if (e.keywords?.length) b.push(e.keywords.join("/"));
  if (e.platforms?.length) b.push(e.platforms.join("+"));
  if (e.negate) b.push("없어야 함");
  if (e.must === false) b.push("참고");
  if (e.rubric) b.push("기준표");
  if (e.method) b.push(METHOD_KO[e.method]);
  return b.join(" · ");
}

function Cards({ cards }: { cards: ExpectCard[] }) {
  if (!cards.length) return <span className="text-[var(--dim)]">기대 카드 없음 — 분야 · 인원 말고 조건이 없는 요청</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {cards.map((c, i) => <span key={i} className="px-1.5 py-0.5 rounded bg-[var(--soft)] text-[12px]">{cardText(c)}</span>)}
    </span>
  );
}

/** 기대 카드 편집 — 유형을 고르면 그 유형의 칸만 보인다 */
function ExpectEditor({ value, onChange, types }: { value: ExpectCard[]; onChange: (v: ExpectCard[]) => void; types: string[] }) {
  const set = (i: number, patch: Partial<ExpectCard>) => onChange(value.map((c, j) => (j === i ? clean({ ...c, ...patch }) : c)));
  const clean = (c: ExpectCard) => Object.fromEntries(Object.entries(c).filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && !v.length))) as ExpectCard;
  const num = (v: string) => (v.trim() === "" ? undefined : Number(v));
  return (
    <div className="flex flex-col gap-1.5">
      {value.map((c, i) => (
        <div key={i} className="flex flex-wrap items-center gap-1.5 text-[12.5px] border-l-2 border-[var(--border-strong)] pl-2">
          <select aria-label="유형" className={inp} value={c.type} onChange={(e) => onChange(value.map((x, j) => (j === i ? { type: e.target.value } : x)))}>
            {types.filter((t) => t !== "분야" && t !== "인원").map((t) => <option key={t}>{t}</option>)}
          </select>
          {(FIELDS[c.type] || []).map((f) => f === "platforms" ? (
            <span key={f} className="inline-flex items-center gap-1">
              {(["instagram", "youtube"] as LinkPlatform[]).map((p) => (
                <label key={p} className="inline-flex items-center gap-0.5"><input type="checkbox" checked={!!c.platforms?.includes(p)}
                  onChange={(e) => set(i, { platforms: e.target.checked ? [...(c.platforms || []), p] : (c.platforms || []).filter((x) => x !== p) })} />{p === "instagram" ? "인스타" : "유튜브"}</label>
              ))}
            </span>
          ) : (
            <input key={f} aria-label={FIELD_KO[f]} placeholder={FIELD_KO[f]} autoComplete="off"
              className={`${inp} ${f === "keywords" || f === "value" ? "w-[150px]" : "w-[84px]"}`}
              value={f === "keywords" ? (c.keywords || []).join(", ") : String(c[f] ?? "")}
              onChange={(e) => set(i, f === "keywords" ? { keywords: e.target.value.split(",").map((w) => w.trim()) }
                : f === "min" || f === "max" || f === "days" ? { [f]: num(e.target.value) } : { [f]: e.target.value })} />
          ))}
          <select aria-label="필수 여부" className={inp} value={c.must === undefined ? "" : c.must ? "must" : "nice"}
            onChange={(e) => set(i, { must: e.target.value === "" ? undefined : e.target.value === "must" })}>
            <option value="">필수/참고 안 봄</option><option value="must">필수</option><option value="nice">참고 (위주로 · 가능하면)</option>
          </select>
          <label className="inline-flex items-center gap-1"><input type="checkbox" checked={!!c.negate} onChange={(e) => set(i, { negate: e.target.checked || undefined })} />없어야 함</label>
          <select aria-label="재는 방식" className={inp} value={c.method || ""} onChange={(e) => set(i, { method: (e.target.value || undefined) as ExpectCard["method"] })}>
            <option value="">재는 방식 안 봄</option><option value="metric">숫자로 잼</option><option value="rubric">기준표로 읽음</option><option value="evidence">근거 · 추정</option>
          </select>
          <button type="button" aria-label="카드 빼기" onClick={() => onChange(value.filter((_, j) => j !== i))} className="p-1 text-[var(--dim)] hover:text-[var(--fail)]"><Trash2 size={14} /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { type: "콘텐츠" }])} className="self-start inline-flex items-center gap-1 text-[12.5px] text-[var(--accent)]">
        <Plus size={13} aria-hidden />카드 추가</button>
    </div>
  );
}

function Meta({ count, platforms, onCount, onPlatforms }: { count: number | null | undefined; platforms: LinkPlatform[]; onCount: (n: number | null) => void; onPlatforms: (p: LinkPlatform[]) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
      <label className="inline-flex items-center gap-1">인원
        <input aria-label="인원" className={`${inp} w-[64px]`} value={count ?? ""} inputMode="numeric" autoComplete="off"
          onChange={(e) => onCount(e.target.value.trim() ? Number(e.target.value) : null)} /></label>
      <span className="inline-flex items-center gap-1">플랫폼
        {(["instagram", "youtube"] as LinkPlatform[]).map((p) => (
          <label key={p} className="inline-flex items-center gap-0.5"><input type="checkbox" checked={platforms.includes(p)}
            onChange={(e) => onPlatforms(e.target.checked ? [...platforms, p] : platforms.filter((x) => x !== p))} />{p === "instagram" ? "인스타" : "유튜브"}</label>
        ))}
        <span className="text-[var(--dim)]">(둘 다 비우면 안 봄)</span>
      </span>
    </div>
  );
}

function Row({ it, types, onSaved }: { it: CondItem; types: string[]; onSaved: () => void }) {
  const [expect, setExpect] = useState<ExpectCard[]>(it.expect || []);
  const [count, setCount] = useState<number | null>(it.count ?? null);
  const [plats, setPlats] = useState<LinkPlatform[]>(it.platforms || []);
  const [note, setNote] = useState(it.note || "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async (status: CondItem["status"]) => {
    try { await decideGoldenCondition(it.id, status === "confirmed" ? { status, expect, count, platforms: plats, note } : { status, note }); setMsg(""); onSaved(); }
    catch (e) { setMsg(String((e as Error)?.message || e)); }
  };
  const draft = async () => {
    setBusy(true);
    try {
      const d = await draftGoldenCondition(it.request);
      setExpect(d.expect); setCount(d.count); setPlats(d.platforms);
      setMsg("지금 버전이 만든 카드입니다 — 틀린 곳을 고친 뒤 확정하세요" + (d.notes.length ? ` · 메모: ${d.notes.join(" / ")}` : ""));
    } catch (e) { setMsg(String((e as Error)?.message || e)); }
    setBusy(false);
  };
  const done = it.status !== "pending";
  return (
    <li className="px-4 py-3 flex flex-col gap-1.5">
      <div className="flex flex-wrap items-start gap-2">
        <span className="text-[13.5px] font-medium flex-1 min-w-[260px]">{it.request}</span>
        {it.status === "confirmed" && <MChip s="ok" label={`확정 · ${it.split === "holdout" ? "확인용" : "개발용"}`} />}
        <span className="text-[11.5px] text-[var(--dim)]">{SOURCE_KO[it.source] || it.source} · g{it.id}{it.mission_id && <> · <a href={`/ops/trace?m=${it.mission_id}`}>검색 추적</a></>}</span>
      </div>
      {it.why && <div className="text-[12px] text-[var(--ink-2)]">후보가 된 이유 · {it.why}</div>}
      {it.hint && <div className="text-[12px] text-[var(--ink-2)] bg-[var(--soft)] rounded px-2 py-1 break-words"><b>확인할 점</b> · <Linkify text={it.hint} /></div>}
      {done ? (
        <div className="text-[12.5px] flex flex-wrap items-center gap-2">
          <Cards cards={it.expect || []} />
          <span className="text-[var(--dim)]">인원 {it.count ?? "안 봄"} · 플랫폼 {(it.platforms || []).join("+") || "안 봄"}</span>
          {it.note && <span className="text-[var(--dim)]">메모 · {it.note}</span>}
          <button type="button" onClick={() => save("pending")} className="text-[12px] text-[var(--accent)] hover:underline">다시 확인 대기로</button>
        </div>
      ) : (
        <>
          <Meta count={count} platforms={plats} onCount={setCount} onPlatforms={setPlats} />
          <ExpectEditor value={expect} onChange={setExpect} types={types} />
          <div className="flex flex-wrap items-center gap-1.5 text-[12.5px]">
            <button type="button" onClick={draft} disabled={busy} className={`${btn} border-[var(--border-strong)] hover:bg-[var(--soft)] inline-flex items-center gap-1 disabled:opacity-60`}>
              <Wand2 size={13} aria-hidden />지금 버전 카드 불러오기</button>
            <input aria-label="메모" className={`${inp} w-[220px]`} placeholder="메모 (왜 이렇게 정했나)" value={note} onChange={(e) => setNote(e.target.value)} autoComplete="off" />
            <button type="button" onClick={() => save("confirmed")} className={`${btn} border-[var(--pass)] text-[var(--pass)] hover:bg-[var(--pass-bg)]`}>이 카드로 확정</button>
            <button type="button" onClick={() => save("skipped")} className={`${btn} border-transparent text-[var(--dim)]`}>건너뜀 (애매함)</button>
          </div>
        </>
      )}
      {msg && <div className="text-[12px] text-[var(--dim)]" role="status">{msg}</div>}
    </li>
  );
}

function FileRow({ c }: { c: CondCase }) {
  return (
    <li className="px-4 py-2 text-[12.5px] flex flex-wrap items-start gap-2">
      <span className="w-[42px] text-[var(--dim)]" translate="no">{c.id}</span>
      <span className="flex-1 min-w-[260px]">{c.request}<div className="mt-1"><Cards cards={c.expect || []} /></div></span>
      {c.split === "holdout" && <span className="text-[11.5px] text-[var(--dim)]">확인용 — 고칠 때 보지 않음</span>}
    </li>
  );
}

function AddForm({ types, onAdded }: { types: string[]; onAdded: () => void }) {
  const [request, setRequest] = useState("");
  const [expect, setExpect] = useState<ExpectCard[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [plats, setPlats] = useState<LinkPlatform[]>([]);
  const [msg, setMsg] = useState("");
  const add = async (confirm: boolean) => {
    if (!request.trim()) return;
    try { await addGoldenCondition({ request, expect, count, platforms: plats, confirm }); setMsg(confirm ? "확정했습니다" : "확인 대기에 넣었습니다"); setRequest(""); setExpect([]); onAdded(); }
    catch (e) { setMsg(String((e as Error)?.message || e)); }
  };
  const draft = async () => {
    if (!request.trim()) return;
    try { const d = await draftGoldenCondition(request); setExpect(d.expect); setCount(d.count); setPlats(d.platforms); setMsg("지금 버전이 만든 카드입니다 — 고친 뒤 넣으세요"); }
    catch (e) { setMsg(String((e as Error)?.message || e)); }
  };
  return (
    <details className="surface px-4 py-3">
      <summary className="cursor-pointer text-[14px] font-semibold">요청문 직접 넣기 <span className="font-normal text-[12.5px] text-[var(--dim)]">미리 만드는 문제 · 관리자가 실제로 쓸 법한 요청</span></summary>
      <div className="mt-2 flex flex-col gap-2">
        <textarea aria-label="요청문" value={request} onChange={(e) => setRequest(e.target.value)} rows={2} name="golden-request"
          placeholder="예: 캠핑 장비 리뷰하는 인스타 인플루언서, 팔로워 3천~5만, 광고 티 안 나는 사람 15명"
          className="w-full px-2 py-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[13px]" />
        <Meta count={count} platforms={plats} onCount={setCount} onPlatforms={setPlats} />
        <ExpectEditor value={expect} onChange={setExpect} types={types} />
        <div className="flex flex-wrap gap-1.5 items-center text-[12.5px]">
          <button type="button" onClick={draft} className={`${btn} border-[var(--border-strong)] inline-flex items-center gap-1`}><Wand2 size={13} aria-hidden />지금 버전 카드 불러오기</button>
          <button type="button" onClick={() => add(false)} className={`${btn} border-[var(--border-strong)]`}>확인 대기로 넣기</button>
          <button type="button" onClick={() => add(true)} className={`${btn} border-[var(--foreground)]`}>바로 확정</button>
          {msg && <span className="text-[var(--dim)]" role="status">{msg}</span>}
        </div>
      </div>
    </details>
  );
}

/** 조건 골든셋 — 요청문 → 나와야 할 조건 카드. 파일 문제(yaml)는 읽기만, 화면 문제는 확인 대기 → 확정 */
export default function GoldenConditions() {
  const [d, setD] = useState<CondConsole | null>(null);
  const [err, setErr] = useState("");
  const [view, setView] = useState<View>("pending");
  const [busy, setBusy] = useState("");
  const load = useCallback(() => getGoldenConditions().then(setD).catch((e) => setErr(String(e?.message || e))), []);
  useEffect(() => { load(); }, [load]);
  const harvest = async () => {
    setBusy("harvest");
    try { const r = await harvestGoldenConditions(); setErr(""); await load(); setBusy(`후보 ${r.added}건을 모았습니다`); }
    catch (e) { setErr(String((e as Error)?.message || e)); setBusy(""); }
  };
  if (!d && !err) return <p className="m-0 text-[13px] text-[var(--dim)]">불러오는 중…</p>;
  if (!d) return <p className="m-0 text-[13px] text-[var(--fail)]">불러오지 못했습니다: {err}</p>;
  const hold = d.file_cases.filter((c) => c.split === "holdout").length + d.items.filter((x) => x.status === "confirmed" && x.split === "holdout").length;
  const total = d.file_cases.length + d.counts.confirmed;
  const list = view === "file" ? [] : d.items.filter((x) => x.status === view);
  return (
    <>
      <section className="surface px-4 py-3">
        <p className="m-0 text-[13px]">
          요청문만 넣고 조건 카드가 <b>빠짐없이 · 맞게 · 지어내지 않고</b> 나오는지 봅니다. 검색은 하지 않습니다.
          기대 카드에는 <b>확인하고 싶은 칸만</b> 적습니다(적은 칸만 채점). 분야 · 인원은 코드가 따로 보므로 적지 않습니다.
          채점은 <code translate="no">python -m agentops eval</code> — 파일 문제와 여기서 확정한 문제(g번호)를 함께 봅니다.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px]">
          <button type="button" onClick={harvest} disabled={busy === "harvest"}
            className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-md border border-[var(--border-strong)] hover:bg-[var(--soft)] disabled:opacity-60">
            <RefreshCw size={13} aria-hidden className={busy === "harvest" ? "animate-spin" : ""} />운영에서 후보 가져오기 (👎 조건 틀림 · 코드가 바로잡은 요청)
          </button>
          <span className="text-[var(--dim)]" role="status" aria-live="polite">
            {busy && busy !== "harvest" ? busy : `문제 ${total}개 / 목표 ${TARGET} · 확인용 ${hold}개(약 1/3)`}
          </span>
          {err && <span className="text-[var(--fail)]">{err}</span>}
        </div>
      </section>
      <section className="surface" aria-labelledby="gc-title">
        <div className="flex flex-wrap items-center gap-2 px-4 pt-3.5 pb-2">
          <h2 id="gc-title" className="m-0 text-[14px] font-semibold">조건 정답</h2>
          <StatusTabs value={view} onChange={setView} counts={{ ...d.counts, file: d.file_cases.length }}
            labels={{ pending: "확인 대기", confirmed: "확정", skipped: "건너뜀", file: "파일 문제" }} />
        </div>
        {view === "file" ? (
          <>
            <p className="m-0 px-4 pb-2 text-[12px] text-[var(--dim)]">agentops/eval/decompose_cases.yaml — 고치려면 파일을 고쳐 커밋합니다(이력이 git에 남습니다).</p>
            <ul className="m-0 p-0 list-none divide-y divide-[var(--border)]">{d.file_cases.map((c) => <FileRow key={c.id} c={c} />)}</ul>
          </>
        ) : (
          <>
            {!list.length && <p className="m-0 px-4 pb-3 text-[13px] text-[var(--dim)]">{view === "pending" ? "확인할 문제가 없습니다 — 위 버튼으로 운영에서 가져오거나 아래에서 직접 넣으세요." : "없습니다."}</p>}
            <ul className="m-0 p-0 list-none divide-y divide-[var(--border)]">
              {list.map((it) => <Row key={`${it.id}-${it.status}-${it.updated_at}`} it={it} types={d.types} onSaved={load} />)}
            </ul>
          </>
        )}
      </section>
      <AddForm types={d.types} onAdded={load} />
    </>
  );
}
