"use client";

import { useState, useCallback } from "react";
import FollowerSlider from "./follower-slider";

interface SearchFormProps {
  onSubmit: (request: string, filters: Record<string, unknown>) => void;
  disabled?: boolean;
  statusText?: string;
}

export default function SearchForm({ onSubmit, disabled, statusText }: SearchFormProps) {
  const [request, setRequest] = useState("");
  const [followerMin, setFollowerMin] = useState(0);
  const [followerMax, setFollowerMax] = useState(0);
  const [count, setCount] = useState(10);
  const [candidateTarget, setCandidateTarget] = useState("");
  const [screenKeep, setScreenKeep] = useState("");
  const [activeDays, setActiveDays] = useState("");

  const handleFollowerChange = useCallback((min: number, max: number) => {
    setFollowerMin(min);
    setFollowerMax(max);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) return;
    const filters: Record<string, unknown> = {
      follower_min: followerMin,
      follower_max: followerMax,
    };
    if (count > 0) filters.count = count;
    if (candidateTarget) filters.candidate_target = Number(candidateTarget);
    if (screenKeep) filters.screen_keep = Number(screenKeep);
    if (activeDays) filters.active_within_days = Number(activeDays);
    onSubmit(request.trim(), filters);
  };

  return (
    <form onSubmit={handleSubmit} className="panel">
      <textarea
        value={request}
        onChange={(e) => setRequest(e.target.value)}
        placeholder="예) 홈카페 콘텐츠 하는 인플루언서 중 최근에 커피 브랜드 협업 안 했고, 제품 단점도 솔직하게 말하는 사람 10명"
        className="w-full min-h-[72px] resize-y p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm"
        disabled={disabled}
      />

      <FollowerSlider onChange={handleFollowerChange} />

      <div className="flex gap-2.5 mt-4 flex-wrap items-end">
        <div className="w-[120px]">
          <label className="block text-[11px] text-[var(--dim)] mb-1">찾을 인원</label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            min={1}
            max={50}
            className="w-full h-[38px] px-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm"
            disabled={disabled}
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !request.trim()}
          className="h-[38px] px-[18px] bg-[var(--accent)] text-white font-semibold rounded-lg border-0 disabled:opacity-50 cursor-pointer disabled:cursor-default inline-flex items-center gap-1.5"
        >
          {disabled && (
            <span className="inline-block w-[14px] h-[14px] border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          {disabled ? "실행 중…" : "실행"}
        </button>
        {statusText && (
          <span className="text-[12px] text-[var(--dim)] pb-2.5">
            {(disabled) && (
              <span className="inline-block w-[11px] h-[11px] border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mr-1 align-middle" />
            )}
            {statusText}
          </span>
        )}
      </div>

      {/* 고급 설정 */}
      <details className="mt-2">
        <summary className="cursor-pointer text-[12px] text-[var(--dim)]">
          고급 — 규모와 루프 상한
        </summary>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2.5 mt-2.5">
          <div>
            <label className="block text-[11px] text-[var(--dim)] mb-1">발굴 후보 수 (핸들만 모음)</label>
            <input
              type="number"
              value={candidateTarget}
              onChange={(e) => setCandidateTarget(e.target.value)}
              placeholder="80"
              className="w-full h-[38px] px-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-[11px] text-[var(--dim)] mb-1">조건 확인 인원 ★비용 90%</label>
            <input
              type="number"
              value={screenKeep}
              onChange={(e) => setScreenKeep(e.target.value)}
              placeholder="25"
              className="w-full h-[38px] px-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-[11px] text-[var(--dim)] mb-1">최근 활동 기준 (일)</label>
            <input
              type="number"
              value={activeDays}
              onChange={(e) => setActiveDays(e.target.value)}
              placeholder="90"
              className="w-full h-[38px] px-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm"
              disabled={disabled}
            />
          </div>
        </div>
        <p className="text-[12px] text-[var(--dim)] mt-2.5">
          발굴한 후보 전원을 조사하지 않습니다 — <b>팔로워 범위와 주제로 걸러낸 뒤 &apos;조건 확인 인원&apos;만큼만</b> 조건을 확인합니다.
          이 값이 비용의 90%입니다 (10명 ≈ 140원 · 25명 ≈ 300원 · 50명 ≈ 570원 · 1회 기준).
        </p>
      </details>
    </form>
  );
}
