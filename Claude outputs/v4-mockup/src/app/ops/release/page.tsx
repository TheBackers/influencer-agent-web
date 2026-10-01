"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { pct, tbl } from "@/components/v2/ui";
import { Pill, TONE, ToneDot, ago, usd } from "@/components/v4/bits";
import { getBuilds } from "@/lib/api-v4";
import type { Build, EvalRow, Tone } from "@/types/v4";

const GATE: Record<Build["gate"], { tone: Tone; label: string }> = {
  pass: { tone: "pass", label: "통과" },
  blocked: { tone: "fail", label: "막힘 — 배포 안 됨" },
  skip: { tone: "warn", label: "측정 부족 · eval-skip" },
};
const EVAL: Record<EvalRow["state"], { tone: Tone; label: string }> = {
  pass: { tone: "pass", label: "통과" }, blocked: { tone: "fail", label: "막음" }, thin: { tone: "warn", label: "측정 부족" }, unit: { tone: "pass", label: "통과" },
};
const G_TONE: Record<Build["gates"][number]["state"], Tone> = { pass: "pass", fail: "fail", warn: "warn", na: "none" };

/** 배포 (v4 · B8 · 설계서 13-4) — 빌드 목록 → 빌드 하나(바뀐 워커 · 채점 · 게이트 · 배포 뒤 확인) */
export default function ReleasePage() {
  const [builds, setBuilds] = useState<Build[] | null>(null);
  const [sel, setSel] = useState("");
  useEffect(() => { getBuilds().then((b) => { setBuilds(b); setSel(b[0]?.id ?? ""); }); }, []);
  if (!builds) return <p className="m-0 text-[13px] text-[var(--dim)]">불러오는 중…</p>;
  const b = builds.find((x) => x.id === sel) ?? builds[0];

  return (
    <>
      <p className="m-0 text-[12.5px] text-[var(--ink-2)]">
        main에 push하면 GitHub Actions가 바뀐 워커만 채점합니다. 치명 1건 · 기준 대비 2%p 넘는 하락 · 새로 틀림이 새로 맞음보다 2개 이상 많으면 실패 → Railway가 배포하지 않습니다(Wait for CI). 배포 뒤 24시간 운영 지표가 괜찮으면 기준 버전이 됩니다.
      </p>
      <section className="surface" aria-label="빌드 목록">
        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse text-[13px] min-w-[760px]">
            <thead><tr>{["빌드", "커밋 메시지", "언제", "게이트", "배포", "배포 뒤 확인", "CI 비용"].map((h) => <th key={h} scope="col" className={tbl.th}>{h}</th>)}</tr></thead>
            <tbody>
              {builds.map((x) => (
                <tr key={x.id} onClick={() => setSel(x.id)} className={`cursor-pointer ${x.id === b.id ? "bg-[var(--accent-bg)]" : "hover:bg-[var(--soft)]"}`}>
                  <td className={`${tbl.td} whitespace-nowrap`}>
                    <button type="button" className="bg-transparent border-0 p-0 text-[var(--accent)] font-medium" aria-pressed={x.id === b.id} onClick={() => setSel(x.id)} translate="no">{x.id}</button>
                    {x.current && <span className="ml-1.5 text-[11px] text-[var(--dim)]">지금</span>}
                    {x.baseline && <span className="ml-1.5 text-[11px] text-[var(--pass)]">기준 버전</span>}
                  </td>
                  <td className={`${tbl.td} max-w-[320px] truncate`} title={x.message}>{x.message}</td>
                  <td className={`${tbl.td} whitespace-nowrap`}>{ago(x.at)}</td>
                  <td className={`${tbl.td} whitespace-nowrap`}><Pill tone={GATE[x.gate].tone}>{GATE[x.gate].label}</Pill></td>
                  <td className={`${tbl.td} whitespace-nowrap`}>{x.deployed ? "배포됨" : "안 됨"}</td>
                  <td className={`${tbl.td} whitespace-nowrap`}>
                    {x.post ? <Pill tone={x.post.state === "red" ? "fail" : x.post.state === "green" ? "pass" : "warn"}>{x.post.state === "red" ? `빨강 · ${x.post.hours}시간째` : x.post.state === "green" ? "통과 → 기준 버전" : "보는 중"}</Pill> : <span className="text-[var(--dim)]">—</span>}
                  </td>
                  <td className={`${tbl.td} tabular`}>{usd(x.ci_usd, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <BuildDetail b={b} />
    </>
  );
}

function BuildDetail({ b }: { b: Build }) {
  return (
    <section className="surface px-4 py-4 flex flex-col gap-4" aria-label={`빌드 ${b.id}`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="m-0 text-[16px] font-semibold" translate="no">빌드 {b.id}</h2>
        <Pill tone={GATE[b.gate].tone}>{GATE[b.gate].label}</Pill>
        <span className="text-[12.5px] text-[var(--dim)]" translate="no">git {b.git} · {ago(b.at)}</span>
      </div>
      <p className="m-0 text-[13px] text-[var(--ink-2)]">{b.message}</p>
      {b.skip_reason && <p className="m-0 text-[12.5px] rounded-md px-3 py-2" style={{ background: "var(--unknown-bg)" }}><b>eval-skip 이유(기록됨):</b> {b.skip_reason}</p>}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-4">
        <div className="min-w-0">
          <h3 className="m-0 mb-1.5 text-[13px] font-semibold">바뀐 워커 (워커 지문이 기준 버전과 다름)</h3>
          <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
            {b.changed.map((c) => (
              <li key={c.worker} className="text-[12.5px]"><b translate="no">{c.worker}</b>
                <ul className="m-0 pl-4 text-[var(--dim)]">{c.files.map((f) => <li key={f} translate="no" className="break-all">{f}</li>)}</ul>
              </li>
            ))}
          </ul>
          <h3 className="m-0 mt-4 mb-1.5 text-[13px] font-semibold">게이트 ①~④</h3>
          <ol className="m-0 p-0 list-none flex flex-col gap-1">
            {b.gates.map((g) => (
              <li key={g.n} className="flex items-start gap-2 text-[12.5px]">
                <ToneDot tone={G_TONE[g.state]} />
                <span className="shrink-0 w-[120px]">{"①②③④"[g.n - 1]} {g.label}</span>
                <span className="text-[var(--ink-2)] min-w-0">{g.why}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="min-w-0">
          <h3 className="m-0 mb-1.5 text-[13px] font-semibold">CI 채점 (같은 입력 · LLM 워커는 3회)</h3>
          <div className="relative overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px] min-w-[520px]">
              <thead><tr>{["워커 · 채점", "문제", "개발용", "기준", "확인용", "결과"].map((h) => <th key={h} scope="col" className={tbl.th}>{h}</th>)}</tr></thead>
              <tbody>
                {b.evals.map((e) => {
                  const diff = e.dev != null && e.base != null ? e.dev - e.base : null;
                  return (
                    <tr key={e.worker + e.suite}>
                      <td className={tbl.td}><b translate="no">{e.worker}</b><br /><span className="text-[var(--dim)]" translate="no">{e.suite}</span></td>
                      <td className={`${tbl.td} tabular whitespace-nowrap`} style={{ color: e.n < e.min ? "var(--unknown)" : undefined }}>{e.n}{e.min ? ` / 최소 ${e.min}` : ""}</td>
                      <td className={`${tbl.td} tabular whitespace-nowrap`}>{e.dev != null ? pct(e.dev) : "—"}{e.ci ? <span className="text-[var(--dim)]"> ±{Math.round(e.ci * 100)}</span> : null}</td>
                      <td className={`${tbl.td} tabular whitespace-nowrap`}>{e.base != null ? pct(e.base) : "—"}
                        {diff != null && Math.abs(diff) >= 0.005 && <span style={{ color: diff < 0 ? "var(--fail)" : "var(--pass)" }}> {diff < 0 ? "▼" : "▲"}{Math.round(Math.abs(diff) * 100)}%p</span>}
                      </td>
                      <td className={`${tbl.td} tabular`}>{e.holdout != null ? pct(e.holdout) : "—"}</td>
                      <td className={`${tbl.td} whitespace-nowrap`}><Pill tone={EVAL[e.state].tone}>{EVAL[e.state].label}</Pill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {b.evals.some((e) => e.new_wrong.length) && (
            <div className="mt-3">
              <h3 className="m-0 mb-1.5 text-[13px] font-semibold" style={{ color: "var(--fail)" }}>
                새로 틀림 {b.evals.reduce((a, e) => a + e.new_wrong.length, 0)} · 새로 맞음 {b.evals.reduce((a, e) => a + e.new_right, 0)} — 기준 버전은 맞혔는데 이 빌드가 틀린 문제
              </h3>
              <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
                {b.evals.flatMap((e) => e.new_wrong).map((c) => (
                  <li key={c.id} className="rounded-md border border-[var(--border)] px-3 py-2 text-[12.5px]">
                    <p className="m-0 font-medium">{c.id} · {c.label}</p>
                    <p className="m-0 text-[var(--ink-2)]">정답 <b>{c.expected}</b> → 이 빌드 <b style={{ color: "var(--fail)" }}>{c.got}</b></p>
                    <a href={c.trace_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px]">이 문제의 LangSmith 트레이스<ExternalLink size={11} aria-hidden /></a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {b.post && (
        <div>
          <h3 className="m-0 mb-1.5 text-[13px] font-semibold">배포 뒤 확인 — {b.post.hours}시간째 {b.post.state === "red" ? "· 빨강" : b.post.state === "green" ? "· 통과(기준 버전이 됨)" : ""}</h3>
          <div className="relative overflow-x-auto">
            <table className="w-full border-collapse text-[12.5px] min-w-[560px]">
              <thead><tr>{["쪽", "지표", "기준 버전", "이 빌드", "표본", ""].map((h, i) => <th key={i} scope="col" className={tbl.th}>{h}</th>)}</tr></thead>
              <tbody>
                {b.post.metrics.map((m) => (
                  <tr key={m.name}>
                    <td className={tbl.td}>{m.side}</td>
                    <td className={tbl.td}>{m.name}</td>
                    <td className={`${tbl.td} tabular`}>{m.base}</td>
                    <td className={`${tbl.td} tabular font-semibold`} style={{ color: m.red ? "var(--fail)" : undefined }}>{m.now}</td>
                    <td className={`${tbl.td} text-[var(--dim)]`}>{m.sample}</td>
                    <td className={tbl.td}><ToneDot tone={m.red ? "fail" : "pass"} title={m.red ? "빨강" : "괜찮음"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {b.post.state === "red" && (
            <p className="m-0 mt-2 text-[12.5px] rounded-md px-3 py-2" style={{ background: TONE.fail.bg }}>
              <b style={{ color: "var(--fail)" }}>되돌릴지 정해 주세요.</b> 기준 버전으로 되돌리려면 Railway › 서비스 › Deployments › 이전 배포 › Redeploy. 되돌리지 않으면 분류 골든셋을 50개까지 채운 뒤 다시 채점합니다.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
