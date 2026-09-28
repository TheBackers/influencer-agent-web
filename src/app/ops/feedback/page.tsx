"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { getOpsFeedback } from "@/lib/api-v2";
import type { FeedbackReason, OpsFeedback } from "@/types/v2";

const AGENT_KO: Record<string, string> = {
  "query-planner": "조건 설계", scout: "발굴", "web-researcher": "웹 조사", "account-linker": "계정 연결",
  verifier: "조건 판정", profiler: "정리",
};
const when = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return iso;
  }
};

/** 사람 평가 — 결과 카드의 맞음 / 안 맞음 + 이유. 정확도의 정답 데이터이자 '어디부터 고칠지'의 출발점 */
export default function FeedbackPage() {
  const [data, setData] = useState<OpsFeedback | null>(null);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState<"down" | "all" | FeedbackReason>("down");

  useEffect(() => { getOpsFeedback().then(setData).catch((e) => setErr(String(e?.message || e))); }, []);

  const items = useMemo(() => (data?.items ?? []).filter((r) =>
    filter === "all" ? true : filter === "down" ? r.score === 0 : r.score === 0 && r.reason === filter), [data, filter]);

  if (err) return <p className="m-0 text-[13px] text-[var(--fail)]">불러오지 못했습니다: {err}</p>;
  if (!data) return <p className="m-0 text-[13px] text-[var(--dim)]">불러오는 중…</p>;
  const s = data.summary;
  const maxReason = Math.max(1, ...s.reasons.map((r) => r.count));

  return (
    <>
      <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <section className="surface px-4 py-3" aria-label="요약">
          <dl className="m-0 grid grid-cols-3 gap-3 tabular">
            <Tile k="평가한 후보" v={`${s.total}`} />
            <Tile k="맞음률" v={s.fit_rate == null ? "—" : `${Math.round(s.fit_rate * 100)}%`} />
            <Tile k="안 맞음" v={`${s.down}`} bad={s.down > 0} />
          </dl>
          <p className="m-0 mt-3 text-[12px] text-[var(--dim)]">검색 결과의 인물 상세 아래 &lsquo;캠페인에 맞나요?&rsquo;에서 모입니다. 같은 후보를 다시 누르면 마지막 평가만 셉니다.</p>
        </section>

        <section className="surface px-4 py-3" aria-labelledby="r-title">
          <h2 id="r-title" className="m-0 mb-2 text-[14px] font-semibold">안 맞는 이유 <span className="font-normal text-[var(--dim)]">누르면 아래 목록이 그 이유만 보입니다</span></h2>
          {!s.reasons.length && <p className="m-0 text-[13px] text-[var(--dim)]">아직 &lsquo;안 맞음&rsquo; 평가가 없습니다.</p>}
          <ul className="m-0 p-0 list-none space-y-1.5">
            {s.reasons.map((r) => (
              <li key={r.reason}>
                <button type="button" onClick={() => setFilter(filter === r.reason ? "down" : r.reason)} aria-pressed={filter === r.reason}
                  className={`w-full grid grid-cols-[minmax(0,210px)_minmax(0,1fr)_auto] items-center gap-3 text-left text-[12.5px] rounded-md px-1.5 py-1 ${filter === r.reason ? "bg-[var(--soft)]" : "hover:bg-[var(--soft)]"}`}>
                  <span className="truncate">{r.label}{r.agent && <span className="text-[var(--dim)]"> → {AGENT_KO[r.agent] ?? r.agent}</span>}</span>
                  <span className="h-[10px] rounded-[3px] bg-[var(--soft)] overflow-hidden" aria-hidden>
                    <span className="block h-full rounded-[3px] bg-[var(--accent)]" style={{ width: `${(r.count / maxReason) * 100}%` }} />
                  </span>
                  <span className="tabular">{r.count}건</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="surface" aria-labelledby="l-title">
        <div className="flex flex-wrap items-center gap-2 px-4 pt-3.5 pb-2">
          <h2 id="l-title" className="m-0 text-[14px] font-semibold">평가 목록</h2>
          <div className="ml-auto flex gap-1" role="group" aria-label="보기">
            {([["down", "안 맞음만"], ["all", "전체"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setFilter(k)} aria-pressed={filter === k}
                className={`h-[28px] px-2.5 rounded-md border text-[12.5px] ${filter === k ? "border-[var(--foreground)] font-medium" : "border-[var(--border-strong)] text-[var(--dim)]"}`}>{l}</button>
            ))}
          </div>
        </div>
        {!items.length ? <p className="m-0 px-4 pb-3 text-[13px] text-[var(--dim)]">해당하는 평가가 없습니다.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px] tabular min-w-[860px]">
              <thead>
                <tr className="text-left text-[11.5px] text-[var(--dim)] bg-[var(--soft)]">
                  {["시각", "검색", "후보", "평가", "이유 · 조건", "메모", "먼저 볼 곳", "버전"].map((h) => <th key={h} scope="col" className="px-3 py-1.5 font-semibold whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.event_id} className="border-t border-[var(--border)] align-top">
                    <td className="px-3 py-2 whitespace-nowrap">{when(r.ts)}</td>
                    <td className="px-3 py-2 max-w-[260px]">
                      <Link href={`/ops/trace?m=${r.mission_id}`} className="block truncate" title={r.request}>{r.request || r.mission_id}</Link>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap" translate="no">{r.handle}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.score === 1
                        ? <span className="inline-flex items-center gap-1 text-[var(--pass)]"><ThumbsUp size={13} aria-hidden />맞음</span>
                        : <span className="inline-flex items-center gap-1 text-[var(--fail)]"><ThumbsDown size={13} aria-hidden />안 맞음</span>}
                    </td>
                    <td className="px-3 py-2">{r.reason_label || "—"}{r.condition_id && <span className="text-[var(--dim)]"> · {r.condition_id}</span>}</td>
                    <td className="px-3 py-2 max-w-[240px] break-words">{r.comment || <span className="text-[var(--dim)]">—</span>}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.agent ? AGENT_KO[r.agent] ?? r.agent : "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-[var(--dim)]" translate="no">{r.version && r.version !== "unknown" ? r.version.slice(0, 7) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Tile({ k, v, bad }: { k: string; v: string; bad?: boolean }) {
  return (
    <div>
      <dt className="text-[11.5px] text-[var(--dim)]">{k}</dt>
      <dd className={`m-0 text-[20px] font-semibold ${bad ? "text-[var(--fail)]" : ""}`}>{v}</dd>
    </div>
  );
}
