"use client";

interface LogEntry {
  time?: string;
  text: string;
}

interface ProgressLogProps {
  logs: LogEntry[];
  status: "idle" | "running" | "paused" | "done" | "error";
  statusText?: string;
}

export default function ProgressLog({ logs, status, statusText }: ProgressLogProps) {
  if (logs.length === 0 && status === "idle") return null;

  return (
    <div className="bg-panel border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {status === "running" && (
          <span className="inline-block w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        )}
        <h2 className="text-sm font-semibold text-dim">
          {statusText || (status === "running" ? "리서치 중" : status === "done" ? "완료" : status === "error" ? "오류" : "진행 상황")}
        </h2>
      </div>
      <pre className="text-xs text-dim font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
        {logs.map((l, i) => (
          <span key={i}>
            {l.time && <span className="text-dim">{l.time}  </span>}
            {l.text}
            {"\n"}
          </span>
        ))}
      </pre>
    </div>
  );
}
