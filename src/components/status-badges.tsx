"use client";

import { useEffect, useState } from "react";
import { getEnvStatus, type EnvStatus } from "@/lib/api";

export default function StatusBadges() {
  const [env, setEnv] = useState<EnvStatus | null>(null);

  useEffect(() => {
    getEnvStatus().then(setEnv).catch(() => {});
  }, []);

  if (!env) return null;

  const Badge = ({ on, label }: { on: boolean; label: string }) => (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border ${
        on
          ? "text-pass bg-pass-bg border-transparent"
          : "text-unknown bg-unknown-bg border-transparent"
      }`}
    >
      {label} {on ? "✓" : "mock"}
    </span>
  );

  return (
    <div className="flex gap-1.5 flex-wrap">
      <Badge on={!env.mock_llm} label="LLM" />
      <Badge on={env.tools.web_search} label="웹검색" />
      <Badge on={env.tools.youtube} label="YouTube" />
      <Badge on={env.tools.instagram} label="Instagram" />
    </div>
  );
}
