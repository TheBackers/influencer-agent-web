"use client";

import type { Profile, SoftCondition, ConditionCheck } from "@/types/api";

const n = (v: number) => (v ?? 0).toLocaleString();

function VerdictBadge({ verdict }: { verdict: string }) {
  const cls =
    verdict === "pass" ? "text-[var(--pass)] bg-[var(--pass-bg)]"
    : verdict === "fail" ? "text-[var(--fail)] bg-[var(--fail-bg)]"
    : "text-[var(--unknown)] bg-[var(--unknown-bg)]";
  const label = verdict === "pass" ? "통과" : verdict === "fail" ? "실패" : "확인 못 함";
  return (
    <span className={`text-[11px] font-bold px-[7px] py-[1px] rounded whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}

function ConditionTable({ conditions, checks }: { conditions: SoftCondition[]; checks: ConditionCheck[] }) {
  if (!conditions.length) return null;
  const byId = Object.fromEntries(checks.map((c) => [c.id, c]));

  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            <th className="text-left p-1.5 border-t border-[var(--border)] text-[var(--dim)] font-semibold text-[11px]">조건</th>
            <th className="text-left p-1.5 border-t border-[var(--border)] text-[var(--dim)] font-semibold text-[11px]">판정</th>
            <th className="text-left p-1.5 border-t border-[var(--border)] text-[var(--dim)] font-semibold text-[11px]">근거</th>
            <th className="text-left p-1.5 border-t border-[var(--border)] text-[var(--dim)] font-semibold text-[11px]">출처</th>
          </tr>
        </thead>
        <tbody>
          {conditions.map((c) => {
            const chk = byId[c.id] || { verdict: "unknown", evidence: "판정 없음", source_url: "", source_title: "" };
            return (
              <tr key={c.id}>
                <td className="p-1.5 border-t border-[var(--border)] align-top">
                  <span className={`text-[10px] font-bold mr-1 ${c.weight === "must" ? "text-[var(--accent)]" : "text-[var(--dim)]"}`}>
                    {c.weight}
                  </span>
                  {c.text}
                </td>
                <td className="p-1.5 border-t border-[var(--border)] align-top">
                  <VerdictBadge verdict={chk.verdict} />
                </td>
                <td className="p-1.5 border-t border-[var(--border)] align-top">{chk.evidence}</td>
                <td className="p-1.5 border-t border-[var(--border)] align-top">
                  {chk.source_url ? (
                    <a href={chk.source_url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)]">
                      {(chk.source_title || "근거 보기").slice(0, 60)}
                    </a>
                  ) : chk.verdict === "pass" ? (
                    <span className="text-[var(--unknown)] bg-[var(--unknown-bg)] text-[11px] font-bold px-[7px] py-[1px] rounded">
                      근거 링크 없음
                    </span>
                  ) : "—"}
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
    <div className="border border-[var(--border)] rounded-[9px] p-3.5 mb-2.5">
      {/* 프로필 헤더 */}
      <div className="flex items-center gap-2.5 mb-1">
        {p.avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.avatar}
            alt=""
            className="w-11 h-11 rounded-full object-cover shrink-0 border border-[var(--border)]"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold m-0">
            #{rank} {p.name}{" "}
            <span className="text-[12px] text-[var(--dim)] font-normal">{p.handle}</span>
          </h3>
          {p._weak && (
            <span className="text-[var(--unknown)] bg-[var(--unknown-bg)] text-[11px] font-bold px-[7px] py-[1px] rounded" title={p._weak}>
              근거 미확인
            </span>
          )}
        </div>
      </div>

      {/* 귀속 불가 경고 */}
      {p.attributable === false && (
        <p className="text-[12px] text-[var(--dim)] m-0 mb-2">
          <VerdictBadge verdict="unknown" /> 이름 확인 실패 — 아이디만 확인됐습니다. 웹 기사는 근거로 쓰지 않고 계정 내부 게시물·영상만 근거로 판정했습니다.
        </p>
      )}

      {/* 이름 확정 정보 */}
      {p.identity?.name && p.identity?.evidence && (
        <p className="text-[12px] text-[var(--dim)] m-0 mb-2">
          이름 확정: <b>{p.identity.name}</b> (신뢰도 {p.identity.confidence}) — {p.identity.evidence}
          {p.identity.source_url && (
            <> <a href={p.identity.source_url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)]">출처</a></>
          )}
        </p>
      )}

      {/* 근거 약함 경고 */}
      {p._weak && (
        <p className="text-[12px] text-[var(--dim)] m-0 mb-2">
          {p._weak} — 정원을 채우려 포함했습니다. 직접 확인이 필요합니다.
        </p>
      )}

      {/* 메타 정보 */}
      <div className="text-[12px] text-[var(--dim)] mb-2.5">
        {p.platform} · {p.limited ? "팔로워 —" : `팔로워 ${n(p.followers)}`} ·{" "}
        {p.limited ? (
          <><VerdictBadge verdict="unknown" /> <span className="text-[12px]">지표 확인 불가 · 개인 계정 (웹 근거로만 판정)</span></>
        ) : p.engagement_known === false ? (
          <><VerdictBadge verdict="unknown" /> <span className="text-[12px]">참여율 판정 불가 ({p.engagement_basis})</span></>
        ) : (
          <>참여율 {p.engagement_rate}% <span className="text-[12px]">({p.engagement_basis})</span></>
        )} ·{" "}
        <span title={p.identity_evidence || p.identity?.evidence || "근거 미기재"}>
          동일인물 {p.identity_confidence}{(p.identity_evidence || p.identity?.evidence) ? " \u24D8" : ""}
        </span> · 필수 {must}/{must}
        {nice > 0 && ` · 선택 ${p._nice_pass ?? 0}/${nice}`}
        {(p._nice_unknown ?? 0) > 0 && (
          <> <VerdictBadge verdict="unknown" /> 근거 없음 {p._nice_unknown}개</>
        )}
      </div>

      {/* 활동 요약 */}
      <p className="text-sm m-0 mb-2.5">{p.activity_summary}</p>

      {/* 배경 정보 */}
      {(p.background || []).length > 0 && (
        <details open>
          <summary className="cursor-pointer text-[12px] text-[var(--dim)]">
            이 사람에 대해 ({p.background.length})
          </summary>
          <table className="w-full border-collapse text-[12.5px] mt-1">
            <tbody>
              {p.background.map((b, i) => (
                <tr key={i}>
                  <td className="p-1 whitespace-nowrap align-top">
                    <span className="text-[10px] font-bold px-1.5 py-[1px] rounded border border-current text-[var(--dim)]">{b.kind || "기타"}</span>
                  </td>
                  <td className="p-1 align-top">{b.fact}</td>
                  <td className="p-1 align-top">
                    {b.url ? (
                      <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)]">
                        {(b.source_title || "출처").slice(0, 40)}
                      </a>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      {/* 조건 판정 테이블 */}
      <ConditionTable conditions={conditions} checks={p.checks} />

      {/* 확인된 계정 */}
      {(p.sources || []).length > 0 && (
        <p className="text-[12px] text-[var(--dim)] mt-2.5 m-0">
          확인된 계정:{" "}
          {p.sources.map((s, i) => (
            <span key={i}>
              {i > 0 && " · "}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)]">{s.platform}</a>
            </span>
          ))}
        </p>
      )}

      {/* 확인 못 한 항목 */}
      {(p.missing_info || []).length > 0 && (
        <p className="text-[12px] text-[var(--dim)] mt-1 m-0">
          확인 못 함: {p.missing_info.join(", ")}
        </p>
      )}

      {/* 툴 호출 트레이스 */}
      {(p._trace || []).length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[12px] text-[var(--dim)]">
            툴 호출 {p._trace!.length}회
          </summary>
          <pre className="m-0 max-h-[220px] overflow-auto font-mono text-[12px] leading-[1.7] whitespace-pre-wrap text-[var(--dim)]">
            {p._trace!.map((t) => t.tool + " " + JSON.stringify(t.args)).join("\n")}
          </pre>
        </details>
      )}
    </div>
  );
}
