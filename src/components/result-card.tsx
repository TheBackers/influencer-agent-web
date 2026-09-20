"use client";

import type { Profile, SoftCondition, ConditionCheck } from "@/types/api";

function VerdictBadge({ verdict }: { verdict: string }) {
  const styles = {
    pass: "text-pass bg-pass-bg",
    fail: "text-fail bg-fail-bg",
    unknown: "text-unknown bg-unknown-bg",
  };
  const labels = { pass: "통과", fail: "실패", unknown: "확인 못 함" };
  const key = verdict as keyof typeof styles;
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${styles[key] || styles.unknown}`}>
      {labels[key] || verdict}
    </span>
  );
}

function ConditionTable({
  conditions,
  checks,
}: {
  conditions: SoftCondition[];
  checks: ConditionCheck[];
}) {
  if (!conditions.length) return null;
  const byId = Object.fromEntries(checks.map((c) => [c.id, c]));

  return (
    <div className="overflow-x-auto mt-3">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-dim border-b border-border">
            <th className="py-1 pr-2">조건</th>
            <th className="py-1 pr-2">판정</th>
            <th className="py-1 pr-2">근거</th>
            <th className="py-1">출처</th>
          </tr>
        </thead>
        <tbody>
          {conditions.map((c) => {
            const chk = byId[c.id] || { verdict: "unknown", evidence: "판정 없음" };
            return (
              <tr key={c.id} className="border-b border-border/50">
                <td className="py-1.5 pr-2">
                  <span className={`text-xs mr-1 ${c.weight === "must" ? "text-accent font-semibold" : "text-dim"}`}>
                    {c.weight}
                  </span>
                  {c.text}
                </td>
                <td className="py-1.5 pr-2">
                  <VerdictBadge verdict={chk.verdict} />
                </td>
                <td className="py-1.5 pr-2 max-w-[200px] truncate">{chk.evidence}</td>
                <td className="py-1.5">
                  {chk.source_url ? (
                    <a
                      href={chk.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      {(chk.source_title || "근거 보기").slice(0, 40)}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface ResultCardProps {
  profile: Profile;
  conditions: SoftCondition[];
  rank: number;
}

export default function ResultCard({ profile: p, conditions, rank }: ResultCardProps) {
  const must = conditions.filter((c) => c.weight === "must").length;
  const nice = conditions.filter((c) => c.weight === "nice").length;

  return (
    <div className="bg-panel border border-border rounded-xl p-4">
      <div className="flex items-start gap-3">
        {p.avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.avatar}
            alt=""
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-dim">#{rank}</span>
            <h3 className="font-semibold truncate">{p.name}</h3>
            <span className="text-xs text-dim">{p.handle}</span>
            {p._weak && (
              <span className="text-xs px-1.5 py-0.5 rounded text-unknown bg-unknown-bg">
                근거 미확인
              </span>
            )}
          </div>

          <div className="text-xs text-dim mt-0.5">
            {p.platform} ·{" "}
            {p.limited ? "팔로워 —" : `팔로워 ${p.followers.toLocaleString()}`} ·{" "}
            {p.limited
              ? "지표 확인 불가 (개인 계정)"
              : p.engagement_known === false
                ? "참여율 판정 불가"
                : `참여율 ${p.engagement_rate}%`}{" "}
            · 동일인물 {p.identity_confidence} · 필수 {must}/{must}
            {nice > 0 && ` · 선택 ${p._nice_pass ?? 0}/${nice}`}
          </div>
        </div>
      </div>

      {p.activity_summary && (
        <p className="text-sm mt-2">{p.activity_summary}</p>
      )}

      {p.background?.length > 0 && (
        <details className="mt-2" open>
          <summary className="text-xs text-dim cursor-pointer">
            이 사람에 대해 ({p.background.length})
          </summary>
          <div className="mt-1 space-y-0.5">
            {p.background.map((b, i) => (
              <p key={i} className="text-xs">
                <span className="text-accent">[{b.kind}]</span> {b.fact}
                {b.url && (
                  <>
                    {" "}
                    <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      {(b.source_title || "출처").slice(0, 30)}
                    </a>
                  </>
                )}
              </p>
            ))}
          </div>
        </details>
      )}

      <ConditionTable conditions={conditions} checks={p.checks} />

      {p.sources?.length > 0 && (
        <p className="text-xs text-dim mt-2">
          확인된 계정:{" "}
          {p.sources.map((s, i) => (
            <span key={i}>
              {i > 0 && " · "}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                {s.platform}
              </a>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
