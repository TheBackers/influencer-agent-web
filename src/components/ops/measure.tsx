"use client";

/**
 * 측정 부품 — /api/ops/measure (PRD 10~13장: 평가 · 관측 · 진단 · 게이트).
 * 상태는 색만으로 구분하지 않게 아이콘과 글자를 함께 둔다. '측정 안 함'은 회색 + 어떻게 재는지.
 */
import { AlertTriangle, CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import type { MStatus, OpsGate, OpsSLO } from "@/types/v2";

const MS: Record<MStatus, { label: string; color: string; bg: string; Icon: typeof CheckCircle2 }> = {
  ok: { label: "충족", color: "var(--pass)", bg: "var(--pass-bg)", Icon: CheckCircle2 },
  warn: { label: "경계", color: "var(--unknown)", bg: "var(--unknown-bg)", Icon: AlertTriangle },
  fail: { label: "미달", color: "var(--fail)", bg: "var(--fail-bg)", Icon: XCircle },
  none: { label: "측정 안 함", color: "var(--dim)", bg: "var(--soft)", Icon: MinusCircle },
};

export function MChip({ s, label }: { s: MStatus; label?: string }) {
  const m = MS[s] ?? MS.none;
  return (
    <span className="inline-flex items-center gap-1 h-[22px] px-1.5 rounded-md text-[11.5px] font-medium whitespace-nowrap"
      style={{ color: m.color, background: m.bg }}>
      <m.Icon size={12} aria-hidden />{label ?? m.label}
    </span>
  );
}

export const pct = (v: number | null | undefined, d = 0) => (v == null ? "—" : `${(v * 100).toFixed(d)}%`);

export function fmt(v: number | null, f: OpsSLO["format"]) {
  if (v == null) return "—";
  if (f === "pct") return pct(v, v < 0.1 && v > 0 ? 1 : 0);
  if (f === "s") return `${Math.round(v)}초`;
  if (f === "ratio") return `${v.toFixed(2)}배`;
  return v >= 10000 ? `${Math.round(v / 1000).toLocaleString()}K` : v.toLocaleString();
}

export function fmtTarget(s: OpsSLO) {
  const op = s.better === "low" ? "≤" : "≥";
  return `${op} ${fmt(s.target, s.format)}`;
}

const GV = {
  DEPLOY: { label: "배포 가능", color: "var(--pass)", bg: "var(--pass-bg)" },
  DEBUG: { label: "디버그 필요", color: "var(--unknown)", bg: "var(--unknown-bg)" },
  IMPROVE: { label: "개선 필요", color: "var(--fail)", bg: "var(--fail-bg)" },
} as const;

/** 게이트 — 13장 판정 순서(운영 진단 → 이 버전 평가 → 품질 → SLO)를 한 줄씩 */
export function GateCard({ g, version, build, window: win }: { g: OpsGate; version: string; build?: string; window: string }) {
  const v = GV[g.verdict];
  return (
    <section className="rounded-lg border px-4 py-3" style={{ borderColor: v.color, background: v.bg }} aria-labelledby="gate-title">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="gate-title" className="m-0 text-[14px] font-semibold">배포 판정</h2>
        <span className="text-[15px] font-bold" style={{ color: v.color }}>{v.label}</span>
        <span className="text-[12.5px] text-[var(--ink-2)]">{g.why}</span>
        <span className="ml-auto text-[12px] text-[var(--dim)]" translate="no" title="지문 = 코드 · 프롬프트 · 규칙 · 모델로 계산 — 같으면 같은 동작">버전 {version || "—"}{build ? ` · 지문 ${build}` : ""} · {win}</span>
      </div>
      <ol className="m-0 mt-2 p-0 list-none grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
        {g.steps.map((s) => (
          <li key={s.step} className="flex items-start gap-1.5 text-[12.5px] bg-[var(--panel)] rounded-md px-2 py-1.5 min-w-0">
            {s.ok ? <CheckCircle2 size={14} aria-hidden className="mt-0.5 shrink-0 text-[var(--pass)]" />
              : <XCircle size={14} aria-hidden className="mt-0.5 shrink-0 text-[var(--fail)]" />}
            <span className="min-w-0"><b className="font-semibold">{s.step}</b> <span className="text-[var(--dim)] break-words">{s.detail}</span></span>
          </li>
        ))}
      </ol>
      {(g.reasons.length > 0 || g.action) && (
        <div className="mt-2 text-[12.5px]">
          {g.reasons.length > 0 && <p className="m-0">사유: {g.reasons.slice(0, 4).join(" · ")}</p>}
          {g.action && <p className="m-0 mt-0.5"><b>할 일</b> {g.action}</p>}
        </div>
      )}
    </section>
  );
}
