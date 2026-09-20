"use client";

import { useEffect, useState } from "react";
import type { EnvStatus } from "@/types/api";
import { getEnvStatus } from "@/lib/api";

export default function StatusBadges() {
  const [env, setEnv] = useState<EnvStatus | null>(null);
  const [engText, setEngText] = useState("");

  useEffect(() => {
    getEnvStatus()
      .then((e) => {
        setEnv(e);
        setEngText(
          `참여율은 계산해서 보여주기만 하고 탈락 조건으로 쓰지 않습니다. ` +
            `표본 ${e.engagement?.min_sample ?? 3}개 미만이면 "판정 불가"로 표시합니다.`
        );
      })
      .catch(() => {});
  }, []);

  if (!env) return null;

  const Badge = ({ on, label }: { on: boolean; label: string }) => (
    <span
      className={`text-[11px] px-2 py-[2px] rounded-full border ${
        on
          ? "text-[var(--pass)] bg-[var(--pass-bg)] border-transparent"
          : "text-[var(--unknown)] bg-[var(--unknown-bg)] border-transparent"
      }`}
    >
      {label} {on ? "실동작" : "mock"}
    </span>
  );

  const searchLabel =
    "웹검색" +
    (env.tools.search_provider
      ? ` (${env.tools.search_provider.replace(/_.*/, "").toLowerCase()})`
      : "");

  return (
    <>
      <div className="flex gap-1.5 flex-wrap">
        <Badge on={!env.mock_llm} label={env.mock_llm ? "LLM" : env.model} />
        <Badge on={env.tools.web_search} label={searchLabel} />
        <Badge on={env.tools.youtube} label="유튜브" />
        <Badge on={env.tools.instagram} label="인스타" />
      </div>
      {engText && (
        <p className="text-[12px] text-[var(--dim)] mt-1">{engText}</p>
      )}
    </>
  );
}
