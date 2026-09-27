import type { AgentScore } from "@/types/v2";
import { HealthDot, tbl } from "@/components/v2/ui";

const STATUS_KO: Record<AgentScore["status"], string> = { active: "운영", shadow: "섀도", canary: "카나리", disabled: "미사용" };

/** 에이전트 점수표 — 레지스트리의 모든 에이전트(미사용 슬롯 포함) */
export default function AgentScoreboard({ agents }: { agents: AgentScore[] }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse text-[13px] tabular">
        <thead>
          <tr>
            {["에이전트", "버전", "상태", "점수", "p95 / 목표", "비용/검색", "오류율", "건강"].map((h, i) => (
              <th key={h} scope="col" className={`${tbl.th} ${i >= 3 && i <= 6 ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => {
            const off = a.status === "disabled";
            const bad = a.health === "red";
            return (
              <tr key={a.agent} className={off ? "text-[var(--dim)]" : ""}>
                <td className={`${tbl.td} whitespace-nowrap font-medium`} translate="no">{a.agent}</td>
                <td className={`${tbl.td} whitespace-nowrap`}>{a.version}</td>
                <td className={`${tbl.td} whitespace-nowrap`}>{STATUS_KO[a.status]}</td>
                <td className={`${tbl.td} text-right ${bad ? "text-[var(--fail)] font-semibold" : ""}`}>{off ? "—" : a.score.toFixed(2)}</td>
                <td className={`${tbl.td} text-right whitespace-nowrap`}>{off ? "—" : `${a.p95_s}초 / ${a.slo_p95_s}초`}</td>
                <td className={`${tbl.td} text-right`}>{off ? "—" : `$${a.cost_per_mission.toFixed(3)}`}</td>
                <td className={`${tbl.td} text-right`}>{off ? "—" : `${(a.error_rate * 100).toFixed(1)}%`}</td>
                <td className={tbl.td}>{off ? "—" : <HealthDot h={a.health} withLabel />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
