"use client";

import { useState } from "react";

interface SearchFormProps {
  onSubmit: (request: string, filters: Record<string, unknown>) => void;
  disabled?: boolean;
}

export default function SearchForm({ onSubmit, disabled }: SearchFormProps) {
  const [request, setRequest] = useState("");
  const [followerMin, setFollowerMin] = useState(0);
  const [followerMax, setFollowerMax] = useState(0);
  const [count, setCount] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) return;
    const filters: Record<string, unknown> = {};
    if (followerMin > 0) filters.follower_min = followerMin;
    if (followerMax > 0) filters.follower_max = followerMax;
    if (count > 0) filters.count = count;
    onSubmit(request.trim(), filters);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-panel border border-border rounded-xl p-4">
      <textarea
        value={request}
        onChange={(e) => setRequest(e.target.value)}
        placeholder="예: 홈카페 유튜버 중 제품 단점도 솔직하게 말하는 사람 5명"
        className="w-full min-h-[72px] resize-y p-3 bg-background border border-border rounded-lg text-sm"
        disabled={disabled}
      />
      <div className="flex gap-3 mt-3 flex-wrap items-end">
        <div>
          <label className="block text-xs text-dim mb-1">팔로워 최소</label>
          <input
            type="number"
            value={followerMin || ""}
            onChange={(e) => setFollowerMin(Number(e.target.value))}
            placeholder="0"
            className="w-28 h-9 px-2 bg-background border border-border rounded-lg text-sm"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs text-dim mb-1">팔로워 최대</label>
          <input
            type="number"
            value={followerMax || ""}
            onChange={(e) => setFollowerMax(Number(e.target.value))}
            placeholder="제한 없음"
            className="w-28 h-9 px-2 bg-background border border-border rounded-lg text-sm"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs text-dim mb-1">인원</label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            min={1}
            max={20}
            className="w-20 h-9 px-2 bg-background border border-border rounded-lg text-sm"
            disabled={disabled}
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !request.trim()}
          className="h-9 px-5 bg-accent text-white font-semibold rounded-lg disabled:opacity-50 cursor-pointer disabled:cursor-default"
        >
          검색 시작
        </button>
      </div>
    </form>
  );
}
