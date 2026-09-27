"use client";

import { useState } from "react";
import { btn, Spinner } from "./ui";

const EXAMPLES = [
  { label: "패션 30명", text: "최근 3개월 동안 국내에서 뜨고 있는 20~30대 여성 패션 인플루언서를 찾아줘. 인스타와 유튜브를 둘 다 운영하고, 브랜드 협찬 사례가 있는 사람 위주로 30명 정리해줘." },
  { label: "홈카페 10명", text: "홈카페 인스타 인플루언서 중 팔로워 1만~20만, 최근 커피 브랜드 협업 안 했고 제품 단점도 말하는 사람 10명" },
  { label: "IT 리뷰 10명", text: "IT 리뷰 유튜버 중 구독자 5만 이상, 스마트폰 비교 영상을 올리는 사람 10명" },
];

interface Props {
  busy: boolean;
  locked: boolean;
  onCompile: (request: string, count: number) => void;
}

/** 요청 입력 — 한 덩어리. 인원은 요청문에서도 읽지만 여기 값이 우선 */
export default function RequestComposer({ busy, locked, onCompile }: Props) {
  const [text, setText] = useState(EXAMPLES[0].text);
  const [count, setCount] = useState(30);

  return (
    <form
      className="surface p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) onCompile(text.trim(), count);
      }}
    >
      <label htmlFor="req" className="sr-only">찾을 인플루언서 조건</label>
      <textarea
        id="req"
        name="request"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={locked}
        rows={2}
        autoComplete="off"
        className="w-full resize-none px-1 py-1 bg-transparent text-[14.5px] leading-relaxed outline-none focus-visible:outline-none"
        placeholder="찾고 싶은 인플루언서를 말하듯 적어 주세요…"
      />
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center gap-1.5 text-[12.5px] text-[var(--dim)]">
          예시
          {EXAMPLES.map((ex) => (
            <button key={ex.label} type="button" disabled={locked} onClick={() => setText(ex.text)}
              className="px-1.5 py-0.5 rounded text-[var(--ink-2)] hover:bg-[var(--soft)] underline decoration-[var(--border-strong)] underline-offset-2">
              {ex.label}
            </button>
          ))}
        </div>
        <label htmlFor="count" className="ml-auto flex items-center gap-2 text-[12.5px] text-[var(--dim)]">
          인원
          <input id="count" name="count" type="number" inputMode="numeric" min={1} max={50} value={count} disabled={locked}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-[64px] h-[34px] px-2 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[13px] text-[var(--foreground)] tabular" />
        </label>
        <button type="submit" disabled={busy || locked || !text.trim()} className={btn.primary}>
          {busy && <Spinner />}
          {busy ? "조건 만드는 중…" : "조건 만들기"}
        </button>
      </div>
    </form>
  );
}
