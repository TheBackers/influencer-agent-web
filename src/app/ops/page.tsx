"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { num, pct } from "@/components/v2/ui";
import { Pill, StatusLines, ToneDot, usd } from "@/components/v4/bits";
import { getOverviewV4, getWorkers } from "@/lib/api-v4";
import type { OverviewV4, WorkerStatus } from "@/types/v4";

/** AgentOps 개요 (v4 · B6) — '지금 괜찮은가' 한 장. 배포 뒤 확인 → 빌드 → 적재 → 검색 → 빨간 것만. 줄마다 그 화면으로 */
export default function OpsOverviewPage() {
  const [o, setO] = useState<OverviewV4 | null>(null);
  const [ws, setWs] = useState<WorkerStatus[]>([]);
  useEffect(() => { getOverviewV4().then(setO); getWorkers().then(setWs); }, []);
  if (!o) return <p className="m-0 text-[13px] text-[var(--dim)]">불러오는 중…</p>;
  const bad = ws.filter((w) => [w.accuracy.tone, w.deploy.tone, w.ops.tone].includes("fail"));

  return (
    <>
      {o.alert && (
        <section role="alert" className="rounded-lg border px-4 py-3 flex flex-wrap items-start gap-x-4 gap-y-2" style={{ borderColor: "var(--fail)", background: "var(--fail-bg)" }}>
          <AlertTriangle size={18} aria-hidden className="mt-0.5 shrink-0" style={{ color: "var(--fail)" }} />
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[14px] font-semibold" style={{ color: "var(--fail)" }}>{o.alert.title}</p>
            <p className="m-0 mt-0.5 text-[12.5px] text-[var(--ink-2)]">
              빌드 <span translate="no">{o.alert.build}</span> · 워커 <b translate="no">{o.alert.worker}</b> · {o.alert.detail}
            </p>
            <p className="m-0 mt-1 text-[12.5px] text-[var(--ink-2)]">
              되돌리려면: Railway › 적재 크론 · 웹 서비스 › Deployments › 기준 버전 <span translate="no">{o.build.baseline}</span>의 배포 › Redeploy. 자동으로 되돌리지 않습니다 — 사람이 정합니다(D58).
            </p>
          </div>
          <Link href="/ops/release" className="text-[13px] whitespace-nowrap self-center">배포 화면에서 보기 →</Link>
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <Line title="빌드" href="/ops/release">
          <Kv k="지금 빌드" v={<span translate="no">{o.build.current} · {o.build.deployed_ago}</span>} />
          <Kv k="기준 버전" v={<span translate="no">{o.build.baseline}</span>} />
          <Kv k="이 빌드의 게이트" v={<Pill tone="warn">{o.build.gate}</Pill>} />
        </Line>
        <Line title="오늘 적재" href="/catalog/ingest">
          <Kv k="새 인물" v={`${o.ingest.today} / ${o.ingest.target}`} />
          <Kv k="7일 안 갱신" v={pct(o.ingest.fresh)} />
          <Kv k="이번 달 AI" v={usd(o.ingest.month_usd)} />
          <Kv k="막힌 툴" v={o.ingest.blocked ? <span style={{ color: "var(--fail)" }}>{o.ingest.blocked}</span> : "없음"} />
        </Line>
        <Line title="검색 (24시간)" href="/ops/trace">
          <Kv k="검색" v={`${o.search.n24}건 · p95 ${o.search.p95_s}초`} />
          <Kv k="건당 비용" v={usd(o.search.usd_avg)} />
          <Kv k="DB로 다 채움" v={pct(o.search.db_fill)} />
          <Kv k="👎" v={num(o.search.thumbs_down)} />
        </Line>
        <Line title="빨간 것" href="/ops/agents">
          <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
            {!o.reds.length && <li className="flex items-center gap-2 text-[13px]"><ToneDot tone="pass" />빨간 것 없음</li>}
            {o.reds.map((r) => (
              <li key={r.label} className="flex items-center gap-2 text-[13px] min-w-0">
                <ToneDot tone={r.kind === "쿼터" ? "warn" : "fail"} />
                <span className="text-[var(--dim)] shrink-0 w-[62px]">{r.kind}</span>
                <Link href={r.href} className="min-w-0 truncate">{r.label}</Link>
              </li>
            ))}
          </ul>
        </Line>
      </div>

      <section className="surface" aria-label="빨간 워커">
        <div className="px-4 pt-3 pb-2 flex items-baseline gap-2">
          <h2 className="m-0 text-[14px] font-semibold">문제가 있는 워커 {bad.length}</h2>
          <span className="text-[12.5px] text-[var(--dim)]">정확도 · 배포 · 운영 중 하나라도 빨강 — 전체는 에이전트 화면</span>
          <Link href="/ops/agents" className="ml-auto text-[12.5px] inline-flex items-center gap-1">에이전트 <ArrowRight size={12} aria-hidden /></Link>
        </div>
        <ul className="m-0 px-4 pb-3 list-none grid sm:grid-cols-2 gap-3">
          {bad.map((w) => (
            <li key={w.name} className="rounded-md border border-[var(--border)] px-3 py-2">
              <p className="m-0 mb-1 text-[13px] font-semibold">{w.ko} <span className="font-normal text-[var(--dim)]" translate="no">{w.name}</span></p>
              <StatusLines w={w} compact />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function Line({ title, href, children }: { title: string; href: string; children: ReactNode }) {
  return (
    <section className="surface px-4 py-3 flex flex-col gap-1.5 min-w-0">
      <div className="flex items-baseline">
        <h2 className="m-0 text-[13px] font-semibold">{title}</h2>
        <Link href={href} className="ml-auto text-[12px]">자세히 →</Link>
      </div>
      {children}
    </section>
  );
}
function Kv({ k, v }: { k: string; v: ReactNode }) {
  return <p className="m-0 flex gap-3 text-[13px] tabular"><span className="text-[var(--dim)]">{k}</span><span className="ml-auto text-right">{v}</span></p>;
}
