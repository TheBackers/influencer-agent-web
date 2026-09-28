"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GateCard } from "@/components/ops/measure";
import { HealthDot } from "@/components/v2/ui";
import { getOpsMeasure } from "@/lib/api-v2";
import type { OpsMeasure } from "@/types/v2";

/** 배포 판정 — PRD 13장. 진단(H1~H10) → 평가 → SLO 순서로 읽은 결과와 그 재료 */
export default function GatesPage() {
  const [m, setM] = useState<OpsMeasure | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { getOpsMeasure().then(setM).catch((e) => setErr(String(e?.message || e))); }, []);
  if (err) return <p className="m-0 text-[13px] text-[var(--fail)]">불러오지 못했습니다: {err}</p>;
  if (!m) return <p className="m-0 text-[13px] text-[var(--dim)]">재는 중…</p>;
  return (
    <>
      <GateCard g={m.gate} version={m.version} window={m.window} />
      <section className="surface px-4 py-3" aria-labelledby="in-title">
        <h2 id="in-title" className="m-0 mb-2 text-[14px] font-semibold">판정 재료</h2>
        <ul className="m-0 p-0 list-none grid gap-1.5 sm:grid-cols-2 text-[12.5px]">
          {m.checks.map((c) => (
            <li key={c.id} className="flex items-start gap-2">
              <HealthDot h={c.status} withLabel />
              <span className="min-w-0"><b>{c.id} {c.label}</b> <span className="text-[var(--dim)]">({c.kind})</span> — {c.value}</span>
            </li>
          ))}
        </ul>
        <p className="m-0 mt-3 text-[12px] text-[var(--dim)]">
          자세히: <Link href="/ops/diagnose">진단</Link> · <Link href="/ops/eval">품질 평가</Link> · <Link href="/ops/observe">관측(SLO)</Link>.
          노랑은 배포를 막지 않고 기록만 합니다. 판정 기록 저장 · 자동 배포는 아직 없습니다.
        </p>
      </section>
    </>
  );
}
