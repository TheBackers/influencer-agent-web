"use client";

import type { ReactNode } from "react";
import type { ConditionSpec, ConditionPatch } from "@/types/v2";

interface Props {
  c: ConditionSpec;
  disabled?: boolean;
  onPatch: (cid: string, patch: ConditionPatch) => void;
}

const AGENT_KO: Record<string, string> = {
  scout: "발굴", "ig-researcher": "인스타", "yt-researcher": "유튜브", "web-researcher": "웹", "account-linker": "계정 연결",
  verifier: "판정", profiler: "정리", "query-planner": "조건",
};

/**
 * 조건 한 줄을 펼쳤을 때 — 측정 방법 · 숫자 조정 · 한계 · 대안.
 * 숫자와 대안 변경은 코드가 바로 다시 검증한다(AI 호출 없음).
 */
export default function ConditionDetail({ c, disabled, onPatch }: Props) {
  const on = c.signals?.filter((s) => s.enabled).length ?? 0;
  const lock = disabled || !!c.dropped;

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_240px] text-[13px]">
      <div className="flex flex-col gap-3 min-w-0">
        {c.signals?.length ? (
          <fieldset className="border-0 p-0 m-0">
            <legend className="mb-2 text-[var(--ink-2)]">
              아래 신호 중{" "}
              <select aria-label="충족해야 할 신호 수" value={c.k} disabled={lock}
                onChange={(e) => onPatch(c.id, { k: Number(e.target.value) })}
                className="h-[26px] px-1 rounded border border-[var(--border-strong)] tabular">
                {Array.from({ length: on }, (_, i) => i + 1).map((k) => <option key={k} value={k}>{k}개</option>)}
              </select>{" "}
              이상을 충족하면 통과
            </legend>
            <ul className="m-0 p-0 list-none space-y-1.5">
              {c.signals.map((s) => {
                const [pre, post] = s.label.split("{x}");
                return (
                  <li key={s.id} className="flex items-center gap-2">
                    <input id={`${s.id}-on`} type="checkbox" checked={s.enabled} disabled={lock || (s.enabled && on <= 1)}
                      onChange={(e) => onPatch(c.id, { signal: { id: s.id, enabled: e.target.checked } })}
                      className="accent-[var(--accent)] w-[15px] h-[15px]" />
                    <label htmlFor={`${s.id}-on`} className={s.enabled ? "" : "text-[var(--dim)]"}>
                      {pre}
                      {s.param && (
                        <input aria-label="기준 배수" type="number" inputMode="decimal" value={s.param.value} min={s.param.min} max={s.param.max} step={s.param.step}
                          disabled={lock || !s.enabled}
                          onChange={(e) => onPatch(c.id, { signal: { id: s.id, value: Number(e.target.value) } })}
                          className="w-[56px] h-[26px] mx-1 px-1.5 rounded border border-[var(--border-strong)] bg-[var(--panel)] tabular text-center" />
                      )}
                      {post}
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ) : (
          <p className="m-0"><span className="text-[var(--dim)]">측정 방법</span><br />{c.how}</p>
        )}

        {c.rubric && <RubricBlock c={c} lock={lock} onPatch={onPatch} />}

        {c.caveat && <p className="m-0 text-[var(--ink-2)]"><span className="text-[var(--dim)]">한계</span><br />{c.caveat}</p>}

        {c.alternatives && c.alternatives.length > 0 && (
          <fieldset className="border-0 p-0 m-0">
            <legend className="mb-1.5 text-[var(--dim)]">{c.feasibility === "infeasible" ? "대신 이렇게 할 수 있습니다" : "다른 방법"}</legend>
            <div className="space-y-1">
              {c.feasibility !== "infeasible" && (
                <Radio name={c.id} id="orig" label="제안대로 사용" checked={!c.chosen_alternative} disabled={disabled}
                  onChange={() => onPatch(c.id, { chosen_alternative: null })} />
              )}
              {c.alternatives.map((a) => (
                <Radio key={a.id} name={c.id} id={a.id} label={a.label} checked={c.chosen_alternative === a.id} disabled={disabled}
                  onChange={() => onPatch(c.id, { chosen_alternative: a.id, dropped: false })} />
              ))}
              <Radio name={c.id} id="drop" label="이 조건 빼기" checked={c.chosen_alternative === "drop"} disabled={disabled}
                onChange={() => onPatch(c.id, { chosen_alternative: "drop" })} />
            </div>
          </fieldset>
        )}

        {!c.alternatives?.length && (
          <button type="button" disabled={disabled} onClick={() => onPatch(c.id, { dropped: !c.dropped })}
            className="text-[13px] text-[var(--accent)] hover:underline disabled:opacity-50 p-0">
            {c.dropped ? "이 조건 다시 넣기" : "이 조건 빼기"}
          </button>
        )}
      </div>

      <dl className="m-0 space-y-2 text-[12.5px] text-[var(--dim)] md:border-l md:border-[var(--border)] md:pl-4">
        <div><dt>요청의 표현</dt><dd className="m-0 text-[var(--ink-2)]">{c.source_phrase}</dd></div>
        <div><dt>이렇게 읽었습니다</dt><dd className="m-0 text-[var(--ink-2)]">{c.intent}</dd></div>
        <div><dt>이유</dt><dd className="m-0 text-[var(--ink-2)]">{c.why}</dd></div>
        {c.agents.length > 0 && <div><dt>확인하는 곳</dt><dd className="m-0 text-[var(--ink-2)]">{c.agents.map((a) => AGENT_KO[a] ?? a).join(", ")}</dd></div>}
        <div>
          <dt>측정식</dt>
          <dd className="m-0"><code translate="no" className="text-[11.5px] break-all">{c.expr}</code></dd>
        </div>
      </dl>
    </div>
  );
}

const READ_KO = { posts: "본인 게시물 · 영상", web: "기사 · 후기" } as const;

/** 기준표 — 추상 조건을 이렇게 판정한다는 약속. 확인하고, 다르면 '말로 고치기'로 바꾼다 */
function RubricBlock({ c, lock, onPatch }: { c: ConditionSpec; lock: boolean; onPatch: Props["onPatch"] }) {
  const r = c.rubric!;
  const exclude = c.polarity === "exclude";
  return (
    <div className="rounded-md border border-[var(--border)] p-3 space-y-2">
      <p className="m-0 text-[var(--dim)]">판정 기준표 <span className="text-[11.5px]">— 검증 에이전트가 이 기준대로 글을 읽고 판정합니다</span></p>
      <p className="m-0 text-[var(--ink)]">{r.criterion}</p>
      <dl className="m-0 grid grid-cols-[88px_1fr] gap-x-3 gap-y-1.5 text-[12.5px]">
        <dt className="text-[var(--dim)]">읽는 곳</dt>
        <dd className="m-0">{r.read.map((x) => READ_KO[x]).join(" · ")} · 최근 {r.window_days}일</dd>
        {r.pass_signals.length > 0 && (<>
          <dt className="text-[var(--dim)]">{exclude ? "탈락 신호" : "충족 신호"}</dt>
          <dd className="m-0 flex flex-wrap gap-1">{r.pass_signals.map((x) => <Chip key={x}>{x}</Chip>)}</dd>
        </>)}
        {r.fail_signals.length > 0 && (<>
          <dt className="text-[var(--dim)]">반대 신호</dt>
          <dd className="m-0 flex flex-wrap gap-1">{r.fail_signals.map((x) => <Chip key={x} muted>{x}</Chip>)}</dd>
        </>)}
        <dt className="text-[var(--dim)]">판정</dt>
        <dd className="m-0">
          {exclude ? (
            <>해당하는 콘텐츠 · 기사를 1건이라도 찾으면 탈락 · 범위를 다 찾아도 없으면 통과</>
          ) : (
            <>
              신호가 보인 콘텐츠{" "}
              <input aria-label="충족에 필요한 건수" type="number" inputMode="numeric" min={1} max={10} value={r.min_hits}
                disabled={lock} onChange={(e) => onPatch(c.id, { min_hits: Number(e.target.value) })}
                className="w-[48px] h-[24px] px-1 rounded border border-[var(--border-strong)] bg-[var(--panel)] tabular text-center" />
              건 이상이면 충족 · {r.min_read}건 이상 읽고 0건이면 미충족
            </>
          )}
        </dd>
      </dl>
    </div>
  );
}

function Chip({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <span className={`inline-flex items-center h-[20px] px-1.5 rounded text-[11.5px] border ${muted
      ? "border-[var(--border)] text-[var(--dim)]" : "border-[var(--border-strong)] text-[var(--ink-2)]"}`}>{children}</span>
  );
}

function Radio(p: { name: string; id: string; label: string; checked: boolean; disabled?: boolean; onChange: () => void }) {
  const id = `${p.name}-${p.id}`;
  return (
    <div className="flex items-center gap-2">
      <input id={id} type="radio" name={`${p.name}-alt`} checked={p.checked} disabled={p.disabled} onChange={p.onChange}
        className="accent-[var(--accent)] w-[15px] h-[15px]" />
      <label htmlFor={id}>{p.label}</label>
    </div>
  );
}
