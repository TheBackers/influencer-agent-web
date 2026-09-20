"use client";

import { useState, useCallback, useRef } from "react";

const SCALE = [
  { v: 0, t: "제한 없음" }, { v: 1000, t: "1천" }, { v: 3000, t: "3천" },
  { v: 5000, t: "5천" }, { v: 10000, t: "1만" }, { v: 20000, t: "2만" },
  { v: 30000, t: "3만" }, { v: 50000, t: "5만" }, { v: 100000, t: "10만" },
  { v: 200000, t: "20만" }, { v: 300000, t: "30만" }, { v: 500000, t: "50만" },
  { v: 1000000, t: "100만" }, { v: 2000000, t: "200만" }, { v: 5000000, t: "500만" },
  { v: 0, t: "무제한" },
];
const LAST = SCALE.length - 1;
const MARKS = [
  [0, "제한 없음"], [4, "1만"], [7, "5만"], [8, "10만"], [11, "50만"], [LAST, "무제한"],
] as const;

interface FollowerSliderProps {
  onChange: (min: number, max: number) => void;
}

export default function FollowerSlider({ onChange }: FollowerSliderProps) {
  const [minIdx, setMinIdx] = useState(0);
  const [maxIdx, setMaxIdx] = useState(LAST);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"min" | "max" | null>(null);

  const label =
    minIdx === 0 && maxIdx === LAST
      ? "제한 없음 (전체)"
      : minIdx === 0
        ? `${SCALE[maxIdx].t} 이하`
        : maxIdx === LAST
          ? `${SCALE[minIdx].t} 이상`
          : `${SCALE[minIdx].t} ~ ${SCALE[maxIdx].t}`;

  const fire = useCallback((a: number, b: number) => {
    onChange(SCALE[a].v, b < LAST ? SCALE[b].v : 0);
  }, [onChange]);

  const idxFromX = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * LAST);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const idx = idxFromX(e.clientX);
    // 가까운 핸들을 잡는다
    const distMin = Math.abs(idx - minIdx);
    const distMax = Math.abs(idx - maxIdx);
    const which = distMin <= distMax ? "min" : "max";
    dragging.current = which;

    if (which === "min") {
      const a = Math.min(idx, maxIdx - 1);
      setMinIdx(a);
      fire(a, maxIdx);
    } else {
      const b = Math.max(idx, minIdx + 1);
      setMaxIdx(b);
      fire(minIdx, b);
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [idxFromX, minIdx, maxIdx, fire]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const idx = idxFromX(e.clientX);

    if (dragging.current === "min") {
      const a = Math.max(0, Math.min(idx, maxIdx - 1));
      setMinIdx(a);
      fire(a, maxIdx);
    } else {
      const b = Math.min(LAST, Math.max(idx, minIdx + 1));
      setMaxIdx(b);
      fire(minIdx, b);
    }
  }, [idxFromX, minIdx, maxIdx, fire]);

  const handlePointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  const barLeft = (minIdx / LAST) * 100;
  const barWidth = ((maxIdx - minIdx) / LAST) * 100;
  const thumbSize = 16;

  return (
    <div className="mt-4 select-none">
      <div className="flex items-baseline gap-2 mb-3">
        <label className="text-[11px] text-[var(--dim)]">팔로워 범위</label>
        <span className="font-semibold text-sm tabular-nums">{label}</span>
      </div>

      {/* 단일 트랙 + 두 핸들 */}
      <div
        ref={trackRef}
        className="relative h-8 cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: "none" }}
      >
        {/* 트랙 배경 */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-[var(--border)]" />

        {/* 활성 범위 바 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-[var(--accent)]"
          style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
        />

        {/* 최소 핸들 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white border-2 border-[var(--accent)] shadow-sm transition-shadow hover:shadow-md"
          style={{
            width: thumbSize,
            height: thumbSize,
            left: `calc(${barLeft}% - ${thumbSize / 2}px)`,
          }}
        />

        {/* 최대 핸들 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white border-2 border-[var(--accent)] shadow-sm transition-shadow hover:shadow-md"
          style={{
            width: thumbSize,
            height: thumbSize,
            left: `calc(${(maxIdx / LAST) * 100}% - ${thumbSize / 2}px)`,
          }}
        />
      </div>

      {/* 눈금 */}
      <div className="relative h-3.5 text-[10px] text-[var(--dim)] mx-0.5 mt-0.5">
        {MARKS.map(([i, t]) => (
          <b
            key={i}
            className="absolute font-normal whitespace-nowrap"
            style={
              i === 0
                ? { left: 0 }
                : i === LAST
                  ? { right: 0 }
                  : { left: `${(i / LAST) * 100}%`, transform: "translateX(-50%)" }
            }
          >
            {t}
          </b>
        ))}
      </div>
    </div>
  );
}

export { SCALE, LAST };
