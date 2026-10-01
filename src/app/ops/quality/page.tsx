"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { pct, tbl } from "@/components/v2/ui";
import { Pill, Tabs, ToneDot } from "@/components/v4/bits";
import GoldenPage from "@/app/ops/golden/page";
import FeedbackPage from "@/app/ops/feedback/page";
import { getWorkers } from "@/lib/api-v4";
import type { WorkerStatus } from "@/types/v4";

type Tab = "scores" | "golden" | "human";
const TABS: { k: Tab; label: string }[] = [
  { k: "scores", label: "워커 점수" },
  { k: "golden", label: "골든셋 확정" },
  { k: "human", label: "사람 평가" },
];

/** 정확도 (v4 · B8) — 옛 품질 평가 · 골든셋 · 사람 평가를 한 화면 탭으로 */
export default function QualityPage() {
  return <Suspense fallback={<p className="text-[var(--dim)]">불러오는 중…</p>}><Quality /></Suspense>;
}

function Quality() {
  const q = useSearchParams();
  const router = useRouter();
  const tab = (q.get("tab") as Tab) || "scores";
  const go = (k: Tab) => router.replace(`/ops/quality?tab=${k}`);
  return (
    <>
      <HowItWorks onGo={go} />
      <Tabs tabs={TABS} value={tab} onChange={go} label="정확도" />
      {tab === "scores" && <Scores />}
      {tab === "golden" && (
        <>
          <GoldenSets />
          <GoldenPage />
        </>
      )}
      {tab === "human" && <FeedbackPage />}
    </>
  );
}

const SIDE_KO = { ingest: "적재", search: "검색", button: "버튼 검색" } as const;
const AI_KO = { agent: "에이전트", llm: "LLM 1회", code: "코드" } as const;

function Scores() {
  const [ws, setWs] = useState<WorkerStatus[]>([]);
  useEffect(() => { getWorkers().then(setWs); }, []);
  return (
    <section className="surface" aria-label="워커 점수">
      <p className="m-0 px-4 pt-3 pb-2 text-[12.5px] text-[var(--ink-2)]">
        워커마다 가장 최근 골든셋 점수 · 기준 버전 대비 · 골든셋 크기입니다. 크기가 최소보다 작으면 ‘측정 부족’ — 그 워커가 바뀐 배포는 이유를 적어야 나갑니다(D57). 코드 워커는 단위 시험 · 고정 사례로 잽니다.
      </p>
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-[13px] min-w-[820px]">
          <thead><tr>{["워커", "쪽", "AI", "채점", "점수", "기준 대비", "골든셋 / 최소", "잰 날", "상태"].map((h) => <th key={h} scope="col" className={tbl.th}>{h}</th>)}</tr></thead>
          <tbody>
            {ws.map((w) => {
              const a = w.accuracy;
              const d = a.score != null && a.base != null ? a.score - a.base : null;
              return (
                <tr key={w.name}>
                  <td className={`${tbl.td} whitespace-nowrap`}><b>{w.ko}</b> <span className="text-[var(--dim)] text-[12px]" translate="no">{w.name}</span></td>
                  <td className={tbl.td}>{SIDE_KO[w.side]}</td>
                  <td className={tbl.td}>{AI_KO[w.ai]}</td>
                  <td className={tbl.td} translate="no">{a.suite ?? <span className="text-[var(--dim)]">단위 시험</span>}</td>
                  <td className={`${tbl.td} tabular`}>{a.score != null ? pct(a.score) : "—"}</td>
                  <td className={`${tbl.td} tabular`}>{d == null ? "—" : Math.abs(d) < 0.005 ? "같음" : <span style={{ color: d < 0 ? "var(--fail)" : "var(--pass)" }}>{d < 0 ? "▼" : "▲"}{Math.round(Math.abs(d) * 100)}%p</span>}</td>
                  <td className={`${tbl.td} tabular`} style={{ color: a.n != null && a.min != null && a.n < a.min ? "var(--unknown)" : undefined }}>{a.n != null ? `${a.n} / ${a.min}` : "—"}</td>
                  <td className={tbl.td}>{a.measured ?? "—"}</td>
                  <td className={`${tbl.td} whitespace-nowrap`}>
                    {a.tone === "none" ? <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--dim)]"><ToneDot tone="none" />{a.label}</span>
                      : <Pill tone={a.tone}>{a.label}</Pill>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** 골든셋 한눈에 — 게이트를 거는 최소 크기까지 얼마나 찼나(워커 상태의 정확도 칸에서). 확정은 아래 탭(조건 · 계정 연결 · 판정) */
function GoldenSets() {
  const [ws, setWs] = useState<WorkerStatus[]>([]);
  useEffect(() => { getWorkers().then(setWs).catch(() => {}); }, []);
  const sets = new Map<string, { n: number; min: number; workers: string[] }>();
  for (const w of ws) {
    const a = w.accuracy;
    if (!a.suite || a.min == null) continue;
    const cur = sets.get(a.suite) ?? { n: a.n ?? 0, min: a.min, workers: [] };
    cur.workers.push(w.name);
    sets.set(a.suite, cur);
  }
  return (
    <section className="surface px-4 py-3 flex flex-col gap-2" aria-label="골든셋 크기">
      <h2 className="m-0 text-[14px] font-semibold">골든셋 — 게이트를 거는 최소 크기</h2>
      <ul className="m-0 p-0 list-none grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {[...sets].map(([suite, x]) => (
          <li key={suite} className="rounded-md bg-[var(--soft)] px-3 py-2 text-[12.5px]">
            <p className="m-0 font-medium" translate="no">{suite}</p>
            <p className="m-0 tabular" style={{ color: x.n < x.min ? "var(--unknown)" : "var(--pass)" }}>{x.n} / {x.min}{x.n < x.min ? " — 측정 부족" : " — 게이트 걸림"}</p>
            <p className="m-0 text-[11.5px] text-[var(--dim)]" translate="no">{x.workers.join(" · ")}</p>
          </li>
        ))}
      </ul>
      <p className="m-0 text-[12px] text-[var(--dim)]">측정 부족인 워커가 바뀐 배포는 커밋 메시지에 <code>[eval-skip: 이유]</code>가 있어야 나갑니다(D57). 분류 · 추출 골든셋 탭과 DB 표본 뽑기는 다음 버전입니다.</p>
    </section>
  );
}

/** 골든셋으로 정확도를 재는 법 · 정확도가 쓰이는 곳 — 네 단계 흐름(추적의 실행 그래프와 같은 모양) + 예시 한 건 */
function HowItWorks({ onGo }: { onGo: (k: Tab) => void }) {
  const steps: { n: string; t: string; d: string; tab?: Tab }[] = [
    { n: "1", t: "정답 모으기", d: "사람이 확정 — 👎 · 정보 고치기 · 표본 뽑기에서 후보가 올라옴", tab: "golden" },
    { n: "2", t: "채점", d: "워커를 바꾸면 CI가 같은 입력으로 워커 답을 정답과 맞춰 봄(LLM은 3번)" },
    { n: "3", t: "점수", d: "맞힌 비율 · 기준 버전 대비 ▲▼ · 새로 틀린 문제", tab: "scores" },
    { n: "4", t: "쓰임", d: "떨어지면 배포를 막고, 틀린 문제가 고칠 곳을 알려 줌" },
  ];
  return (
    <section className="surface px-4 py-3 flex flex-col gap-2.5" aria-label="골든셋으로 정확도를 재는 법">
      <p className="m-0 text-[13px] font-semibold">골든셋으로 정확도를 재는 법</p>
      <ol className="m-0 p-0 list-none flex flex-wrap items-stretch gap-1.5">
        {steps.map((x, i) => (
          <li key={x.n} className="flex items-center gap-1.5">
            <button type="button" disabled={!x.tab} onClick={() => x.tab && onGo(x.tab)}
              className="text-left rounded-md border border-[var(--border-strong)] bg-[var(--panel)] px-2.5 py-1.5 w-[190px] disabled:cursor-default enabled:hover:border-[var(--accent)]">
              <span className="block text-[12.5px] font-semibold">{x.n} {x.t}</span>
              <span className="block text-[11.5px] text-[var(--dim)]">{x.d}</span>
            </button>
            {i < steps.length - 1 && <span aria-hidden className="text-[var(--dim)]">→</span>}
          </li>
        ))}
      </ol>
      <details className="text-[12.5px]">
        <summary className="cursor-pointer text-[var(--accent)]">예시 한 건 · 정확도가 쓰이는 곳</summary>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <div className="rounded-md bg-[var(--soft)] px-3 py-2">
            <p className="m-0 font-semibold">예시 — 조건 판정 워커를 고쳤을 때</p>
            <ol className="m-0 mt-1 pl-4 text-[var(--ink-2)] flex flex-col gap-0.5">
              <li>판정 골든셋 75문제: ‘김○○ × 단점도 말하는’ → 정답 <b>미충족</b> (사람이 글 11개를 보고 확정)</li>
              <li>새 버전이 같은 글을 읽고 <b>충족</b>이라고 답함 → 새로 틀림 1</li>
              <li>75문제 중 61개 맞힘 → 81% (기준 버전 86% · ▼5%p)</li>
              <li>2%p 넘게 떨어짐 → 배포 막힘 · 틀린 6문제의 트레이스를 보고 프롬프트를 고침</li>
            </ol>
          </div>
          <div className="rounded-md bg-[var(--soft)] px-3 py-2">
            <p className="m-0 font-semibold">정확도가 쓰이는 곳</p>
            <ul className="m-0 mt-1 pl-4 text-[var(--ink-2)] flex flex-col gap-0.5">
              <li><b>배포 게이트</b> — 바뀐 워커 점수가 떨어지면 Railway가 배포하지 않음</li>
              <li><b>기준 버전</b> — 배포 뒤 24시간이 괜찮으면 이 점수가 다음 비교의 기준</li>
              <li><b>에이전트 화면의 초록 · 노랑 · 빨강 점</b> — 워커마다 지금 믿을 만한지</li>
              <li><b>고칠 곳 고르기</b> — 새로 틀린 문제 · 👎 이유가 몰린 워커부터</li>
            </ul>
            <p className="m-0 mt-1.5 text-[12px] text-[var(--dim)]">정답이 최소 크기보다 적으면 ‘측정 부족’ — 그 워커는 아직 막지 못하니 정답부터 채웁니다.</p>
          </div>
        </div>
      </details>
    </section>
  );
}
