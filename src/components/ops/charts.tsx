"use client";

/**
 * Ops 차트 3종 — 라이브러리 없이 SVG.
 * dataviz 원칙: 한 축 · 단일 계열은 accent 한 색 · 기준선은 점선 + 글자 · 모든 마크에 hover 툴팁 · 표 보기 제공.
 */
import { useState } from "react";
import type { TraceEvent } from "@/types/v2";

type Tip = { x: number | string; y: number; text: string } | null;

function Tooltip({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div role="status" className="pointer-events-none absolute z-10 text-[12px] leading-snug bg-[var(--foreground)] text-[var(--background)] px-2 py-1 rounded-md whitespace-pre shadow"
      style={{ left: tip.x, top: tip.y, transform: "translate(-50%, calc(-100% - 8px))" }}>
      {tip.text}
    </div>
  );
}

/** 가로 막대 + 목표선(에이전트별 p95 vs SLO 등). 목표를 넘은 막대만 위험색 */
export function BarList({ rows, unit, format = (v) => String(v) }: {
  rows: { label: string; value: number; target?: number; sub?: string }[];
  unit: string;
  format?: (v: number) => string;
}) {
  const [tip, setTip] = useState<Tip>(null);
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => Math.max(r.value, r.target ?? 0))) * 1.08 || 1;
  const W = 560, rowH = 30, left = 130, right = 70;
  const H = rows.length * rowH + 22;
  const sx = (v: number) => left + (v / max) * (W - left - right);
  const ticks = [0, max / 2, max].map((t) => Math.round(t * 10) / 10);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="에이전트별 막대 그래프" onMouseLeave={() => setTip(null)}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={sx(t)} x2={sx(t)} y1={4} y2={H - 18} stroke="var(--border)" strokeWidth={1} />
            <text x={sx(t)} y={H - 4} textAnchor="middle" fontSize={10.5} fill="var(--dim)">{format(t)}{unit}</text>
          </g>
        ))}
        {rows.map((r, i) => {
          const y = 6 + i * rowH;
          const over = r.target !== undefined && r.value > r.target;
          return (
            <g key={r.label}>
              <text x={left - 8} y={y + 14} textAnchor="end" fontSize={12} fill="var(--foreground)">{r.label}</text>
              <rect x={left} y={y + 4} width={Math.max(2, sx(r.value) - left)} height={14} rx={4}
                fill={over ? "var(--fail)" : "var(--accent)"}
                onMouseMove={(e) => {
                  const b = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setTip({ x: e.clientX - b.left, y: e.clientY - b.top, text: `${r.label}\n${format(r.value)}${unit}${r.target !== undefined ? ` (목표 ${format(r.target)}${unit})` : ""}${r.sub ? `\n${r.sub}` : ""}` });
                }} />
              <rect x={left} y={y} width={W - left - right} height={rowH - 4} fill="transparent"
                onMouseMove={(e) => {
                  const b = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setTip({ x: e.clientX - b.left, y: e.clientY - b.top, text: `${r.label}\n${format(r.value)}${unit}${r.target !== undefined ? ` (목표 ${format(r.target)}${unit})` : ""}${r.sub ? `\n${r.sub}` : ""}` });
                }} />
              {r.target !== undefined && (
                <line x1={sx(r.target)} x2={sx(r.target)} y1={y + 1} y2={y + 21} stroke="var(--foreground)" strokeWidth={1.5} strokeDasharray="3 2" />
              )}
              <text x={Math.max(sx(r.value), r.target !== undefined ? sx(r.target) : 0) + 6} y={y + 15} fontSize={11.5} fill="var(--dim)" className="tabular">{format(r.value)}{unit}</text>
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tip} />
      <p className="m-0 text-[11.5px] text-[var(--dim)]">점선 = 에이전트 명세의 목표(SLO). 목표를 넘은 막대는 빨간색.</p>
    </div>
  );
}

/** 종합점수 추세 — 한 계열 선 + 기준선 0.80. hover 시 세로 보조선과 값 */
export function TrendLine({ points, threshold }: { points: { date: string; value: number; version: string }[]; threshold: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 560, H = 190, l = 38, r = 16, t = 14, b = 26;
  const lo = 0.7, hi = 0.9;
  const sx = (i: number) => l + (i / (points.length - 1)) * (W - l - r);
  const sy = (v: number) => t + (1 - (v - lo) / (hi - lo)) * (H - t - b);
  const d = points.map((p, i) => `${i ? "L" : "M"}${sx(i)},${sy(p.value)}`).join(" ");
  const last = points.length - 1;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="최근 14일 종합점수 추세"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const bx = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - bx.left) / bx.width) * W;
          setHover(Math.max(0, Math.min(last, Math.round(((x - l) / (W - l - r)) * last))));
        }}>
        {[0.7, 0.8, 0.9].map((v) => (
          <g key={v}>
            <line x1={l} x2={W - r} y1={sy(v)} y2={sy(v)} stroke="var(--border)" />
            <text x={l - 6} y={sy(v) + 4} textAnchor="end" fontSize={10.5} fill="var(--dim)">{v.toFixed(2)}</text>
          </g>
        ))}
        <line x1={l} x2={W - r} y1={sy(threshold)} y2={sy(threshold)} stroke="var(--foreground)" strokeDasharray="4 3" strokeWidth={1.2} />
        <text x={W - r} y={sy(threshold) - 5} textAnchor="end" fontSize={10.5} fill="var(--ink-2)">배포 기준 {threshold.toFixed(2)}</text>
        {points.map((p, i) => i % 2 === 0 && (
          <text key={p.date} x={sx(i)} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--dim)">{p.date}</text>
        ))}
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <circle cx={sx(last)} cy={sy(points[last].value)} r={5} fill={points[last].value < threshold ? "var(--fail)" : "var(--accent)"} stroke="var(--panel)" strokeWidth={2} />
        <text x={sx(last) - 8} y={sy(points[last].value) + 16} textAnchor="end" fontSize={11} fontWeight={700} fill="var(--foreground)">{points[last].value.toFixed(2)}</text>
        {hover !== null && (
          <g>
            <line x1={sx(hover)} x2={sx(hover)} y1={t} y2={H - b} stroke="var(--dim)" strokeWidth={1} />
            <circle cx={sx(hover)} cy={sy(points[hover].value)} r={4} fill="var(--accent)" stroke="var(--panel)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {hover !== null && (
        <Tooltip tip={{ x: `${(sx(hover) / W) * 100}%`, y: 20, text: `${points[hover].date} · ${points[hover].value.toFixed(2)}\n버전 ${points[hover].version}` }} />
      )}
    </div>
  );
}

const LANE_ORDER = ["총괄", "조건 컴파일", "사람 확인", "발굴", "인스타 ×75", "유튜브 ×75", "웹 ×75", "감독관", "판정", "도시에"];

/** 검색 타임라인(워터폴) — 레인 = 에이전트. 사람 대기는 회색 빗금, 부분 성공은 주황, 점 이벤트는 마름모 */
export function MissionTimeline({ events, onPick }: { events: TraceEvent[]; onPick?: (e: TraceEvent) => void }) {
  const [tip, setTip] = useState<Tip>(null);
  if (!events.length) return null;
  const lanes = LANE_ORDER.filter((l) => events.some((e) => e.lane === l));
  const end = Math.max(...events.map((e) => e.ts + (e.dur ?? 0)));
  const W = 760, left = 110, right = 16, rowH = 26, top = 8;
  const H = top + lanes.length * rowH + 24;
  const sx = (s: number) => left + (s / end) * (W - left - right);
  const color = (e: TraceEvent) =>
    e.type === "hitl.requested" ? "url(#hatch)" : e.status === "partial" ? "var(--unknown)" : e.status === "failed" ? "var(--fail)" : "var(--accent)";
  const show = (ev: React.MouseEvent, e: TraceEvent) => {
    const b = ((ev.currentTarget as SVGElement).ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    setTip({
      x: ev.clientX - b.left, y: ev.clientY - b.top,
      text: `${e.type} · ${e.agent}\n${e.label}\n${e.ts.toFixed(1)}s${e.dur ? ` → ${(e.ts + e.dur).toFixed(1)}s (${e.dur.toFixed(1)}s)` : ""}${e.tokens_in ? `\n토큰 ${e.tokens_in.toLocaleString()} / ${e.tokens_out?.toLocaleString()} · $${e.cost_usd?.toFixed(3)}` : ""}`,
    });
  };
  return (
    <div className="relative overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[900px] min-w-[640px] h-auto" role="img" aria-label="검색 이벤트 타임라인" onMouseLeave={() => setTip(null)}>
        <defs>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="var(--soft)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--dim)" strokeWidth="1.2" />
          </pattern>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={sx(end * f)} x2={sx(end * f)} y1={top} y2={H - 20} stroke="var(--border)" />
            <text x={sx(end * f)} y={H - 6} textAnchor="middle" fontSize={10.5} fill="var(--dim)">{Math.round(end * f)}s</text>
          </g>
        ))}
        {lanes.map((lane, i) => (
          <text key={lane} x={left - 8} y={top + i * rowH + 16} textAnchor="end" fontSize={11.5} fill="var(--ink-2)">{lane}</text>
        ))}
        {events.map((e) => {
          const y = top + lanes.indexOf(e.lane) * rowH;
          if (!e.dur) {
            const cx = sx(e.ts), cy = y + 12;
            return (
              <path key={e.event_id} d={`M${cx},${cy - 6} L${cx + 6},${cy} L${cx},${cy + 6} L${cx - 6},${cy} Z`}
                fill={e.type === "overseer.intervened" ? "var(--unknown)" : "var(--dim)"} stroke="var(--panel)" strokeWidth={1.5}
                className="cursor-pointer" onMouseMove={(ev) => show(ev, e)} onClick={() => onPick?.(e)} />
            );
          }
          return (
            <rect key={e.event_id} x={sx(e.ts)} y={y + 5} width={Math.max(3, sx(e.ts + e.dur) - sx(e.ts))} height={14} rx={4}
              fill={color(e)} stroke="var(--panel)" strokeWidth={1.5} className="cursor-pointer"
              onMouseMove={(ev) => show(ev, e)} onClick={() => onPick?.(e)} />
          );
        })}
      </svg>
      <Tooltip tip={tip} />
      <div className="flex flex-wrap gap-4 text-[11.5px] text-[var(--dim)] mt-1">
        <span className="inline-flex items-center gap-1"><i className="inline-block w-3 h-2.5 rounded-sm bg-[var(--accent)]" />정상</span>
        <span className="inline-flex items-center gap-1"><i className="inline-block w-3 h-2.5 rounded-sm bg-[var(--unknown)]" />부분 성공</span>
        <span className="inline-flex items-center gap-1"><i className="inline-block w-3 h-2.5 rounded-sm bg-[var(--soft)] border border-[var(--dim)]" />사람 대기 (지연에서 제외)</span>
        <span>◆ 점 이벤트 (감독관 개입은 주황)</span>
      </div>
    </div>
  );
}
