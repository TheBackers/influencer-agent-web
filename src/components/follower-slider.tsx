"use client";

import { useState, useCallback } from "react";

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

  const label =
    minIdx === 0 && maxIdx === LAST
      ? "제한 없음 (전체)"
      : minIdx === 0
        ? `${SCALE[maxIdx].t} 이하`
        : maxIdx === LAST
          ? `${SCALE[minIdx].t} 이상`
          : `${SCALE[minIdx].t} ~ ${SCALE[maxIdx].t}`;

  const handleMin = useCallback(
    (val: number) => {
      const a = Math.min(val, maxIdx - 1);
      setMinIdx(a);
      onChange(SCALE[a].v, maxIdx < LAST ? SCALE[maxIdx].v : 0);
    },
    [maxIdx, onChange]
  );

  const handleMax = useCallback(
    (val: number) => {
      const b = Math.max(val, minIdx + 1);
      setMaxIdx(b);
      onChange(SCALE[minIdx].v, b < LAST ? SCALE[b].v : 0);
    },
    [minIdx, onChange]
  );

  const barLeft = (minIdx / LAST) * 100;
  const barWidth = ((maxIdx - minIdx) / LAST) * 100;

  return (
    <div className="mt-4">
      <div className="flex items-baseline gap-2 mb-2">
        <label className="text-[11px] text-[var(--dim)]">팔로워 범위</label>
        <span className="font-semibold text-sm tabular-nums">{label}</span>
      </div>

      {/* bar */}
      <div className="relative h-1.5 rounded-full bg-[var(--border)] mx-0.5 mb-2.5">
        <i
          className="absolute top-0 bottom-0 rounded-full bg-[var(--accent)]"
          style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
        />
      </div>

      {/* sliders */}
      <div className="grid gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--dim)] w-6 shrink-0">최소</span>
          <input
            type="range"
            min={0}
            max={LAST - 1}
            value={minIdx}
            onChange={(e) => handleMin(Number(e.target.value))}
            className="flex-1 h-5 accent-[var(--accent)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--dim)] w-6 shrink-0">최대</span>
          <input
            type="range"
            min={1}
            max={LAST}
            value={maxIdx}
            onChange={(e) => handleMax(Number(e.target.value))}
            className="flex-1 h-5 accent-[var(--accent)]"
          />
        </div>
      </div>

      {/* marks */}
      <div className="relative h-3.5 text-[10px] text-[var(--dim)] mx-0.5 mt-1">
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
