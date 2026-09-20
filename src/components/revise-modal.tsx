"use client";

import { useState, useEffect, useRef } from "react";

const CHIPS = [
  "이 조건은 빼줘",
  "필수로 바꿔줘",
  "있으면 좋은 정도로 바꿔줘",
  "이런 조건도 넣어줘: ",
  "분야를 바꿔줘: ",
];

interface ReviseModalProps {
  open: boolean;
  target?: string;
  revisions?: string[];
  onApply: (instruction: string) => void;
  onClose: () => void;
}

export default function ReviseModal({ open, target, revisions, onApply, onClose }: ReviseModalProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setText(target ? `"${target}" ` : "");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, target]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleApply = () => {
    const v = text.trim();
    if (!v) {
      inputRef.current?.focus();
      return;
    }
    onApply(v);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center p-4 z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-[18px] w-full max-w-[520px] max-h-[88vh] overflow-auto shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-[15px] font-semibold mb-1">조건 고치기</h3>
        <p className="text-[12px] text-[var(--dim)] m-0">
          고칠 내용을 말로 적으세요. 지시한 곳만 바뀌고 나머지 조건은 그대로 둡니다.
        </p>

        {target && (
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-2 my-2.5 text-[12.5px]">
            고칠 조건 — {target}
          </div>
        )}

        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="예) 참여율 조건은 빼줘 · 서울 지역만 · 단점 언급은 필수로"
          className="w-full min-h-[72px] resize-y p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleApply();
          }}
        />

        <div className="flex gap-1.5 flex-wrap mt-2.5">
          {CHIPS.map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setText((prev) => (prev.trim() + " " + chip).trim());
                inputRef.current?.focus();
              }}
              className="text-[11.5px] px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--dim)] cursor-pointer hover:text-[var(--foreground)] hover:border-[var(--accent)] h-auto"
            >
              {chip}
            </button>
          ))}
        </div>

        {revisions && revisions.length > 0 && (
          <p className="text-[12px] text-[var(--dim)] mt-2.5">
            지금까지 고친 것: {revisions.join(" → ")}
          </p>
        )}

        <div className="flex gap-2 justify-end mt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-[38px] px-[18px] rounded-lg border border-[var(--border)] bg-[var(--panel)] cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="h-[38px] px-[18px] rounded-lg bg-[var(--accent)] text-white font-semibold border-0 cursor-pointer"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
