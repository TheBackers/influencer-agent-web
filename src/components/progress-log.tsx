"use client";

interface LogEntry {
  time?: string;
  text: string;
}

interface ProgressLogProps {
  logs: LogEntry[];
  status: "idle" | "running" | "paused" | "done" | "error";
}

export default function ProgressLog({ logs, status }: ProgressLogProps) {
  if (logs.length === 0 && status === "idle") return null;

  return (
    <div className="panel">
      <h2 className="text-[13px] font-semibold text-[var(--dim)] mb-3">진행</h2>
      <pre className="m-0 max-h-[220px] overflow-auto font-mono text-[12px] leading-[1.7] whitespace-pre-wrap text-[var(--dim)]">
        {logs.map((l, i) => (
          <span key={i}>
            {l.time && <span>{l.time}  </span>}
            {l.text}
            {"\n"}
          </span>
        ))}
      </pre>
    </div>
  );
}
