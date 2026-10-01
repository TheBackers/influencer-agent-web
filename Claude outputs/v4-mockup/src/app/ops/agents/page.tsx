"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AgentCard } from "@/components/ops/agent-map";
import { Flow, type FlowNode } from "@/components/ops/flow-simple";
import { StatusLines, Tabs } from "@/components/v4/bits";
import { getOpsAgents } from "@/lib/api-v2";
import { getWorkers } from "@/lib/api-v4";
import type { OpsCatalog } from "@/types/v2";
import type { WorkerStatus } from "@/types/v4";

type Tab = "structure" | "search" | "ingest";

const INGEST: FlowNode[] = [
  { key: "plan", label: "계획", sub: "하루 200명 · 분야 25% · 7일 갱신" },
  { key: "seed", label: "씨앗", workers: ["seed-harvester"] },
  { key: "collect", label: "수집 · 뽑기", workers: ["collector", "extractor"] },
  { key: "classify", label: "분류", workers: ["classifier"] },
  { key: "enrich", label: "웹 보강", workers: ["web-enricher"] },
];
const SEARCH: FlowNode[] = [
  { key: "plan", label: "조건 설계", sub: "승인 전", workers: ["query-planner"] },
  { key: "retrieve", label: "DB에서 거르기", sub: "SQL", workers: ["catalog-retriever"] },
  { key: "measure", label: "코드로 재기", workers: ["profiler"] },
  { key: "verify", label: "조건 판정", sub: "이전 판정 먼저", workers: ["verifier", "account-linker"] },
  { key: "save", label: "저장", sub: "모자라면 탐색 요청" },
];
const LIVE: FlowNode[] = [
  { key: "scout", label: "실시간 발굴", workers: ["scout"], muted: true },
  { key: "research", label: "조사", workers: ["web-researcher", "ig-researcher", "yt-researcher"], muted: true },
];
const AI_KO = { agent: "에이전트 — LLM이 툴을 골라 가며 일함", llm: "LLM을 한 번 부름", code: "코드만 — AI 없음" } as const;

/** 에이전트 (v4 · 0930 목업 고침) — 추적 화면의 실행 그래프처럼 단계 상자 → 상자로만 보인다. 자세한 것은 워커를 눌러서 · 접힌 칸에서 */
export default function AgentsPage() {
  const [ws, setWs] = useState<WorkerStatus[]>([]);
  const [cat, setCat] = useState<OpsCatalog | null>(null);
  const [tab, setTab] = useState<Tab>("structure");
  const [sel, setSel] = useState("");
  useEffect(() => { getWorkers().then(setWs); getOpsAgents().then(setCat).catch(() => {}); }, []);
  const firstBad = useMemo(() => ws.find((w) => [w.accuracy.tone, w.deploy.tone, w.ops.tone].includes("fail"))?.name ?? "", [ws]);
  const cur = ws.find((w) => w.name === (sel || firstBad));

  const legend = <p className="m-0 text-[12px] text-[var(--dim)]">칩의 점 셋 = 정확도 · 배포 · 운영 (초록 괜찮음 · 노랑 측정 부족 · 빨강 문제 · 회색 해당 없음) · * = 에이전트 · 칩을 누르면 아래에 상태</p>;
  const panel = cur && <WorkerPanel w={cur} spec={cat?.agents.find((a) => a.name === cur.name)} />;

  return (
    <>
      <Tabs tabs={[{ k: "structure", label: "전체 구조" }, { k: "search", label: "검색" }, { k: "ingest", label: "적재" }]} value={tab} onChange={setTab} label="에이전트" />

      {tab === "structure" && (
        <>
          <section className="surface px-4 py-3 flex flex-col gap-3" aria-label="전체 구조">
            <Row title="적재" when="매시 7분 · 크론"><Flow nodes={INGEST} ws={ws} sel={cur?.name} onPick={setSel} label="적재 흐름" /></Row>
            <div className="rounded-md bg-[var(--soft)] px-3 py-2 text-[12.5px] flex flex-wrap gap-x-4 gap-y-1">
              <b>인플루언서 DB · 후보 풀</b>
              <span className="text-[var(--ink-2)]">↑ 적재가 저장 · 스노볼 후보</span>
              <span className="text-[var(--ink-2)]">↓ 검색이 먼저 읽음 · 판정 재사용</span>
              <span className="text-[var(--ink-2)]">↑ 검색이 판정 · 탐색 요청 저장</span>
            </div>
            <Row title="검색" when="요청마다"><Flow nodes={SEARCH} ws={ws} sel={cur?.name} onPick={setSel} label="검색 흐름" /></Row>
            <Row title="버튼일 때만" when="‘실시간으로 더 찾기’"><Flow nodes={LIVE} ws={ws} sel={cur?.name} onPick={setSel} label="버튼 검색 흐름" /></Row>
            {legend}
          </section>
          {panel}
          <Folded title={`감독관 규칙 ${cat?.overseer.length ?? 9}개 · 공용 부품`}>
            <p className="m-0 mb-2 text-[12.5px] text-[var(--ink-2)]">모든 워커는 툴 게이트웨이(캐시 · 몫 · 재시도 · 막힌 툴)를 거쳐 바깥을 부르고, 감독관(코드 규칙)이 넘치면 멈추거나 되돌립니다. 워커끼리는 직접 부르지 않습니다.</p>
            <ul className="m-0 p-0 list-none grid gap-1 sm:grid-cols-2 text-[12.5px]">
              {(cat?.overseer ?? []).map((r) => <li key={r.rule}><b className="tabular">{r.rule}</b> {r.name} <span className="text-[var(--dim)]">— {r.where}</span></li>)}
            </ul>
          </Folded>
          <Folded title="다음 단계 — 꺼짐 4개">
            <p className="m-0 text-[12.5px] text-[var(--ink-2)]">캠페인 기획 · DM 작성 · 검수 · 답장 대응 — 자리만 있고 아직 어느 흐름에서도 부르지 않습니다.</p>
          </Folded>
        </>
      )}

      {tab === "search" && (
        <>
          <section className="surface px-4 py-3 flex flex-col gap-3" aria-label="검색 흐름">
            <Flow nodes={SEARCH} ws={ws} sel={cur?.name} onPick={setSel} label="검색 흐름" />
            <Row title="버튼일 때만" when="‘실시간으로 더 찾기’"><Flow nodes={LIVE} ws={ws} sel={cur?.name} onPick={setSel} label="버튼 검색 흐름" /></Row>
            {legend}
          </section>
          {panel}
          <p className="m-0 text-[12.5px] text-[var(--dim)]">한 건이 실제로 어떻게 돌았는지는 <Link href="/ops/trace">추적 › 검색</Link>에서 봅니다.</p>
        </>
      )}

      {tab === "ingest" && (
        <>
          <section className="surface px-4 py-3 flex flex-col gap-3" aria-label="적재 흐름">
            <Flow nodes={INGEST} ws={ws} sel={cur?.name} onPick={setSel} label="적재 흐름" />
            {legend}
          </section>
          {panel}
          <p className="m-0 text-[12.5px] text-[var(--dim)]">실행 한 번의 노드별 숫자 · 작업 · 호출은 <Link href="/ops/trace?tab=ingest">추적 › 적재</Link>에서 봅니다.</p>
        </>
      )}
    </>
  );
}

function Row({ title, when, children }: { title: string; when: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="m-0 text-[12.5px]"><b>{title}</b> <span className="text-[var(--dim)]">· {when}</span></p>
      {children}
    </div>
  );
}

function Folded({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="surface px-4 py-2.5">
      <summary className="cursor-pointer text-[13px] font-semibold">{title}</summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}

/** 워커 하나의 상태 — 누른 칩(처음에는 빨간 워커). 더 자세한 역할 지표 · 툴 · 예산은 접어 둔다 */
function WorkerPanel({ w, spec }: { w: WorkerStatus; spec?: OpsCatalog["agents"][number] }) {
  return (
    <section className="surface px-4 py-3 flex flex-col gap-2" aria-label={`워커 ${w.ko}`}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2 className="m-0 text-[14px] font-semibold">{w.ko}</h2>
        <span className="text-[12px] text-[var(--dim)]" translate="no">{w.name}</span>
        <span className="text-[12px] text-[var(--dim)]">· {AI_KO[w.ai]}</span>
      </div>
      <StatusLines w={w} />
      <p className="m-0 text-[12.5px] flex flex-wrap gap-x-3">
        <Link href="/ops/quality">정확도 자세히</Link><Link href="/ops/release">배포 자세히</Link><Link href="/ops/trace">최근 실행 추적</Link>
      </p>
      {spec && (
        <details className="text-[12.5px]">
          <summary className="cursor-pointer text-[var(--accent)]">역할 지표 · 툴 · 예산</summary>
          <div className="mt-2"><AgentCard a={spec} recentLabel="최근 5건" /></div>
        </details>
      )}
    </section>
  );
}
