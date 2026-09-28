"use client";

/**
 * 검색 추이 — 최근 N건을 시간순으로 작은 차트 여러 개(한 차트 = 한 지표 · 한 축).
 * 한 건씩 보면 안 보이는 퇴행(배포 뒤 비용 증가 · 결과 수 감소 · 👎 증가)을 잡는다.
 * dataviz: 단일 계열은 accent 한 색 · 상태색은 문제(심각/경고)에만 · 세로 점선 = 버전이 바뀐 지점 ·
 *          마우스를 올리면 모든 차트에 같은 검색이 표시되고 위 줄에 값이 나온다 · 표 보기 제공.
 */
import { useState } from "react";
import type { OpsTrendRow } from "@/types/v2";
import { StatusChip, usd } from "./live";

type Key = "cost" | "per" | "time" | "fill" | "problems" | "down";
const PANELS: { key: Key; title: string; sub: string; kind: "line" | "bar" }[] = [
  { key: "cost", title: "검색 1회 비용", sub: "달러", kind: "line" },
  { key: "per", title: "결과 1명당 비용", sub: "인원이 달라도 비교됩니다", kind: "line" },
  { key: "time", title: "걸린 시간", sub: "초", kind: "line" },
  { key: "fill", title: "결과 채움률", sub: "찾은 인원 ÷ 요청 인원", kind: "line" },
  { key: "problems", title: "문제", sub: "심각 · 경고 건수", kind: "bar" },
  { key: "down", title: "사람 평가 '안 맞음'", sub: "후보 수", kind: "bar" },
];

const val = (r: OpsTrendRow, k: Key): number | null => {
  switch (k) {
    case "cost": return r.cost_usd;
    case "per": return r.usd_per_person;
    case "time": return r.duration_s;
    case "fill": return r.fill_rate == null ? null : r.fill_rate * 100;
    case "problems": return r.critical + r.warning;
    case "down": return r.fb_down;
  }
};
const fmt = (k: Key, v: number | null) => {
  if (v == null) return "—";
  if (k === "cost" || k === "per") return usd(v);
  if (k === "time") return `${Math.round(v)}초`;
  if (k === "fill") return `${Math.round(v)}%`;
  return `${v}건`;
};
const when = (s: string) => {
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const short = (v: string) => (v && v !== "unknown" ? v.slice(0, 7) : "");

const W = 320, H = 118, L = 44, R = 10, T = 14, B = 20;

export function TrendPanels({ rows, onPick }: { rows: OpsTrendRow[]; onPick: (mid: string) => void }) {
  const [hi, setHi] = useState<number | null>(null);
  if (!rows.length) return <p className="m-0 text-[13px] text-[var(--dim)]">아직 끝난 검색이 없습니다.</p>;
  const n = rows.length;
  const x = (i: number) => (n === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (n - 1));
  const deploys = rows.map((r, i) => i > 0 && short(r.version) && short(rows[i - 1].version) && short(r.version) !== short(rows[i - 1].version) ? i : -1).filter((i) => i >= 0);
  const cur = rows[hi ?? n - 1];

  const pickIndex = (e: React.MouseEvent<SVGSVGElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - b.left) / b.width) * W;
    let best = 0;
    for (let i = 1; i < n; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    return best;
  };

  return (
    <div>
      {/* 읽기 줄 — 마우스를 올린 검색(없으면 가장 최근) */}
      <div className="mb-2 min-h-[40px] text-[12.5px] tabular" aria-live="polite">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[var(--dim)]">{hi == null ? "가장 최근" : `${hi + 1}/${n}번째`} · {when(cur.started_at)}</span>
          <StatusChip s={cur.status === "ok" ? "ok" : cur.status === "failed" ? "failed" : cur.status === "running" ? "running" : "partial"} small />
          {cur.mode === "mock" && <span className="text-[var(--dim)]">모의 실행</span>}
          {short(cur.version) && <span className="text-[var(--dim)]" translate="no">버전 {short(cur.version)}</span>}
          <span>{usd(cur.cost_usd)} · {fmt("time", cur.duration_s)} · {cur.returned ?? "—"}/{cur.requested ?? "—"}명</span>
          <span>문제 심각 {cur.critical} · 경고 {cur.warning}</span>
          <span>평가 맞음 {cur.fb_up} · 안 맞음 {cur.fb_down}</span>
        </div>
        <p className="m-0 mt-0.5 truncate text-[var(--ink-2)]" title={cur.request}>{cur.request || "(요청문 없음)"}{cur.top_problem && <span className="text-[var(--dim)]"> — {cur.top_problem}</span>}</p>
      </div>

      <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
        {PANELS.map((p, pi) => {
          const vs = rows.map((r) => val(r, p.key));
          const max = Math.max(p.key === "fill" ? 100 : p.kind === "bar" ? 1 : 0, ...vs.map((v) => v ?? 0)) * 1.1 || 1;
          const y = (v: number) => T + (1 - v / max) * (H - T - B);
          const pts = vs.map((v, i) => (v == null ? null : [x(i), y(v)] as const));
          const segs: string[] = [];
          let d = "";
          pts.forEach((pt) => {
            if (!pt) { if (d) segs.push(d); d = ""; return; }
            d += `${d ? "L" : "M"}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`;
          });
          if (d) segs.push(d);
          const bw = Math.max(3, Math.min(12, ((W - L - R) / Math.max(1, n)) * 0.6));
          return (
            <figure key={p.key} className="m-0 min-w-0">
              <figcaption className="text-[12.5px]"><span className="font-semibold">{p.title}</span> <span className="text-[var(--dim)]">{p.sub}</span></figcaption>
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-pointer select-none" role="img"
                aria-label={`${p.title} 추이 — 최근 ${fmt(p.key, vs[n - 1])}`}
                onMouseMove={(e) => setHi(pickIndex(e))} onMouseLeave={() => setHi(null)}
                onClick={(e) => onPick(rows[pickIndex(e)].mission_id)}>
                {(p.kind === "bar" ? [0, Math.max(1, Math.round(max / 1.1))] : [0, max / 2 / 1.1, max / 1.1]).map((t, i) => (
                  <g key={i}>
                    <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
                    <text x={L - 6} y={y(t) + 3.5} textAnchor="end" fontSize={10} fill="var(--dim)">{fmt(p.key, t)}</text>
                  </g>
                ))}
                {p.key === "fill" && <line x1={L} x2={W - R} y1={y(100)} y2={y(100)} stroke="var(--dim)" strokeDasharray="3 3" strokeWidth={1} />}
                {deploys.map((i) => (
                  <g key={i}>
                    <line x1={x(i) - 0.5} x2={x(i) - 0.5} y1={T - 6} y2={H - B} stroke="var(--dim)" strokeDasharray="2 3" strokeWidth={1} />
                    {pi === 0 && <text x={x(i) + 3} y={T - 4} fontSize={9.5} fill="var(--dim)">배포 {short(rows[i].version)}</text>}
                  </g>
                ))}
                {hi != null && <line x1={x(hi)} x2={x(hi)} y1={T - 6} y2={H - B} stroke="var(--foreground)" strokeWidth={1} opacity={0.35} />}
                {p.kind === "line" ? (
                  <>
                    {segs.map((s, i) => <path key={i} d={s} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />)}
                    {pts.map((pt, i) => pt && (
                      <circle key={i} cx={pt[0]} cy={pt[1]} r={hi === i ? 4.5 : 3.5}
                        fill={rows[i].mode === "mock" ? "var(--panel)" : "var(--accent)"} stroke={rows[i].mode === "mock" ? "var(--accent)" : "var(--panel)"} strokeWidth={rows[i].mode === "mock" ? 1.5 : 1.5} />
                    ))}
                  </>
                ) : p.key === "problems" ? (
                  rows.map((r, i) => {
                    const c = r.critical, w = r.warning;
                    const y0 = y(0), yc = y(c), yw = y(c + w);
                    return (
                      <g key={i} opacity={hi == null || hi === i ? 1 : 0.55}>
                        {c > 0 && <rect x={x(i) - bw / 2} y={yc} width={bw} height={Math.max(1, y0 - yc)} rx={2} fill="var(--fail)" />}
                        {w > 0 && <rect x={x(i) - bw / 2} y={yw} width={bw} height={Math.max(1, yc - yw - (c > 0 ? 2 : 0))} rx={2} fill="var(--unknown)" />}
                      </g>
                    );
                  })
                ) : (
                  rows.map((r, i) => r.fb_down > 0 && (
                    <rect key={i} x={x(i) - bw / 2} y={y(r.fb_down)} width={bw} height={Math.max(1, y(0) - y(r.fb_down))} rx={2}
                      fill="var(--accent)" opacity={hi == null || hi === i ? 1 : 0.55} />
                  ))
                )}
                <text x={L} y={H - 5} fontSize={10} fill="var(--dim)">{when(rows[0].started_at)}</text>
                {n > 1 && <text x={W - R} y={H - 5} fontSize={10} fill="var(--dim)" textAnchor="end">{when(rows[n - 1].started_at)}</text>}
              </svg>
              {p.key === "problems" && (
                <div className="flex gap-3 text-[11.5px] text-[var(--dim)]" aria-hidden>
                  <span className="inline-flex items-center gap-1"><i className="inline-block w-2.5 h-2.5 rounded-sm bg-[var(--fail)]" />심각</span>
                  <span className="inline-flex items-center gap-1"><i className="inline-block w-2.5 h-2.5 rounded-sm bg-[var(--unknown)]" />경고</span>
                </div>
              )}
            </figure>
          );
        })}
      </div>
      <p className="m-0 mt-2 text-[12px] text-[var(--dim)]">점을 누르면 그 검색의 추적으로 갑니다 · 빈 점 = 모의 실행 · 세로 점선 = 코드 버전이 바뀐 지점</p>

      <details className="mt-2">
        <summary className="cursor-pointer text-[12.5px] text-[var(--dim)]">표로 보기</summary>
        <div className="overflow-x-auto mt-1">
          <table className="w-full border-collapse text-[12px] tabular min-w-[720px]">
            <thead>
              <tr className="text-left text-[11.5px] text-[var(--dim)] bg-[var(--soft)]">
                {["시각", "요청", "버전", "비용", "1명당", "시간", "결과", "심각 · 경고", "맞음 · 안 맞음"].map((h) => <th key={h} scope="col" className="px-2 py-1 font-semibold whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...rows].reverse().map((r) => (
                <tr key={r.mission_id} className="border-t border-[var(--border)]">
                  <td className="px-2 py-1 whitespace-nowrap"><a href={`/ops/trace?m=${r.mission_id}`}>{when(r.started_at)}</a>{r.mode === "mock" && <span className="text-[var(--dim)]"> 모의</span>}</td>
                  <td className="px-2 py-1 max-w-[280px] truncate" title={r.request}>{r.request}</td>
                  <td className="px-2 py-1" translate="no">{short(r.version) || "—"}</td>
                  <td className="px-2 py-1">{usd(r.cost_usd)}</td>
                  <td className="px-2 py-1">{usd(r.usd_per_person)}</td>
                  <td className="px-2 py-1">{fmt("time", r.duration_s)}</td>
                  <td className="px-2 py-1">{r.returned ?? "—"}/{r.requested ?? "—"}</td>
                  <td className="px-2 py-1">{r.critical} · {r.warning}</td>
                  <td className="px-2 py-1">{r.fb_up} · {r.fb_down}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
