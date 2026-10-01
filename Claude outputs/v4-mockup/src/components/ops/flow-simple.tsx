"use client";

/**
 * 단순 흐름 그림 — 추적 화면의 '실행 그래프'와 같은 모양(상자 → 상자). 에이전트 화면의 전체 구조 · 검색 · 적재 탭이 쓴다.
 * 상자 = 단계(이름 + 한 줄), 안의 칩 = 그 단계가 부르는 워커(점 셋 = 정확도 · 배포 · 운영). 칩을 누르면 워커 상태를 연다.
 */
import { TONE } from "@/components/v4/bits";
import type { WorkerStatus } from "@/types/v4";

export type FlowNode = { key: string; label: string; sub?: string; workers?: string[]; muted?: boolean };

export function WorkerChip({ w, on, onPick }: { w?: WorkerStatus; on?: boolean; onPick?: (n: string) => void }) {
  if (!w) return null;
  const tones = [w.accuracy.tone, w.deploy.tone, w.ops.tone];
  const bad = tones.includes("fail");
  return (
    <button type="button" onClick={() => onPick?.(w.name)} aria-pressed={on}
      title={`정확도: ${w.accuracy.label}\n배포: ${w.deploy.label}\n운영: ${w.ops.label}`}
      className={`inline-flex items-center gap-1.5 h-[24px] px-2 rounded-md border text-[12px] font-medium whitespace-nowrap bg-[var(--accent-bg)] text-[var(--accent)] ${on ? "ring-2 ring-[var(--accent)]" : ""}`}
      style={{ borderColor: bad ? "var(--fail)" : "var(--accent)" }}>
      {w.ko}{w.ai === "agent" ? "*" : ""}
      <span className="inline-flex gap-[3px]" aria-label={`정확도 ${TONE[tones[0]].label} · 배포 ${TONE[tones[1]].label} · 운영 ${TONE[tones[2]].label}`}>
        {tones.map((t, i) => <span key={i} aria-hidden className="w-[6px] h-[6px] rounded-full" style={{ background: TONE[t].color }} />)}
      </span>
    </button>
  );
}

export function Flow({ nodes, ws, sel, onPick, label }: { nodes: FlowNode[]; ws: WorkerStatus[]; sel?: string; onPick?: (n: string) => void; label: string }) {
  const by = Object.fromEntries(ws.map((w) => [w.name, w]));
  return (
    <ol className="m-0 p-0 list-none flex flex-wrap items-center gap-1.5" aria-label={label}>
      {nodes.map((n, i) => (
        <li key={n.key} className="flex items-center gap-1.5">
          <div className={`rounded-md border px-2.5 py-1.5 min-w-[112px] ${n.muted ? "border-dashed border-[var(--border-strong)] bg-[var(--soft)]" : "border-[var(--border-strong)] bg-[var(--panel)]"}`}>
            <p className="m-0 text-[12.5px] font-semibold">{n.label}</p>
            {n.sub && <p className="m-0 text-[11.5px] text-[var(--dim)]">{n.sub}</p>}
            {!!n.workers?.length && (
              <div className="mt-1 flex flex-wrap gap-1">{n.workers.map((k) => <WorkerChip key={k} w={by[k]} on={sel === k} onPick={onPick} />)}</div>
            )}
          </div>
          {i < nodes.length - 1 && <span aria-hidden className="text-[var(--dim)]">→</span>}
        </li>
      ))}
    </ol>
  );
}
