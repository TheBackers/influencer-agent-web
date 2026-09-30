"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import PageHeader from "@/components/v2/app-header";
import { btn } from "@/components/v2/ui";
import { Dot, ErrorLine } from "@/components/catalog/bits";
import { ErrorsList, RunsTable, SectionTitle, StageFlow, Tiles, TopicPicker, TopicsTable, WorkersTable } from "@/components/catalog/ingest-parts";
import { addTopic, getIngest, getTopicCandidates, patchTopic } from "@/lib/api-catalog";
import type { IngestStatus, TopicCandidate, TopicPatch } from "@/types/catalog";

/** 적재 현황 — 1시간마다 크론이 적재 그래프(LangGraph)를 한 번 돈다. 사람은 분야를 고르고, 막힌 것을 본다(낱말은 자동 · D39 · D40) */
export default function IngestPage() {
  const [s, setS] = useState<IngestStatus | null>(null);
  const [err, setErr] = useState("");
  const [picking, setPicking] = useState(false);
  const [cands, setCands] = useState<TopicCandidate[] | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(() => getIngest().then((x) => { setS(x); setErr(""); }).catch((e) => setErr(String(e?.message || e))), []);
  useEffect(() => { load(); }, [load]);

  const openPicker = () => {
    setPicking(true);
    setCands(null);
    getTopicCandidates().then(setCands).catch((e) => { setCands([]); setNote(`후보를 불러오지 못했습니다 — ${String(e?.message || e)}`); });
  };

  const onPatch = async (name: string, p: TopicPatch) => {
    try {
      const words = (x: IngestStatus | null) => x?.topics.find((t) => t.name === name)?.keywords ?? [];
      const before = new Set(words(s));
      const next = await patchTopic(name, p);
      setS(next);
      if (p.remove_keywords?.length) setNote(`‘${name}’에서 ‘${p.remove_keywords.join(", ")}’을(를) 뺐습니다 — 자동으로 다시 넣지 않습니다`);
      else if (p.add_keywords?.length) {
        const added = words(next).filter((w) => !before.has(w)).length;   // 이미 켜진 낱말은 서버가 뺀다
        setNote(added > 0 ? `‘${name}’에 낱말 ${added}개를 켰습니다 — 다음 적재부터 씁니다` : `‘${name}’에 이미 있는 낱말입니다`);
      } else if (p.enabled !== undefined) setNote(`‘${name}’ 적재를 ${p.enabled ? "켰" : "껐"}습니다`);
    } catch (e) {
      setNote(`고치지 못했습니다 — ${String((e as Error)?.message || e)}`);
    }
  };
  const onAdd = async (names: string[], target: number) => {
    const done: string[] = [];
    let last: IngestStatus | null = null;
    try {
      for (const name of names) {                       // 하나씩 — 중간에 실패하면 넣은 것까지는 남는다
        last = await addTopic({ name, target });
        done.push(name);
      }
    } finally {
      if (last) setS(last);
    }
    setPicking(false);
    setNote(`${done.join(" · ")} 분야를 더했습니다 — ${s?.enabled ? "다음 실행부터 모읍니다" : "적재 스위치를 켜면 바로 모읍니다"}`);
  };

  const next = s?.next_run_at ? new Date(s.next_run_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <>
      <PageHeader
        title="적재 현황"
        description={s && !s.enabled
          ? "적재 스위치가 꺼져 있습니다(INGEST_ENABLED) — 법 · 약관 확인 뒤 켜면 1시간마다 크론이 적재 그래프를 한 번 돕니다. 지금 분야를 골라 두면 켜는 즉시 모읍니다."
          : `1시간마다 크론이 적재 그래프를 한 번 돕니다(최대 50분 · 몫을 넘으면 그 단계만 쉼).${next ? ` 다음 실행 ${next}` : ""}`}
        actions={
          <>
            {s && <Dot color={s.enabled ? "var(--pass)" : "var(--border-strong)"} strong={s.enabled}>{s.enabled ? "적재 켜짐" : "적재 꺼짐"}</Dot>}
            <button type="button" className={btn.secondary} onClick={openPicker}><Plus size={14} aria-hidden />분야 고르기</button>
          </>
        }
      />
      {err && <ErrorLine msg={err} />}
      <p aria-live="polite" className="m-0 min-h-0 text-[13px]" style={{ color: note.includes("못했습니다") ? "var(--fail)" : "var(--pass)" }}>{note}</p>
      {picking && <TopicPicker candidates={cands} onAdd={onAdd} onCancel={() => setPicking(false)} />}
      {s && (
        <>
          <Tiles s={s} />
          <section className="surface" aria-label="분야">
            <SectionTitle title="분야" hint="검색 낱말은 자동입니다 — 모은 사람들의 해시태그 · AI로 늘리고, 새 사람이 3번 연속 0명이거나 분야 적중률이 30% 아래면 끕니다. 사람은 ✕로 빼기만 하면 됩니다(D40)." />
            <TopicsTable topics={s.topics} onPatch={onPatch} />
          </section>
          <section className="surface" aria-label="적재 그래프 단계">
            <SectionTitle title="적재 그래프 — 단계별 대기 · 실패" hint="pick이 작업 표에서 이번 판을 꺼내 단계 노드로 보내고, 노드가 워커를 능력으로 부른다. 실행 사이 상태는 작업 표가 가진다(D31)." />
            <StageFlow stages={s.stages} />
          </section>
          <section className="surface" aria-label="적재 워커">
            <SectionTitle title={`적재 워커 ${s.workers.filter((w) => w.status !== "shadow").length}개`} hint="AI는 씨앗 낱말 넓히기 · 분류 두 곳에서만 부릅니다. 나머지는 코드가 툴을 정해진 순서로 직접 부릅니다 — 검색 때의 툴콜링 루프는 쓰지 않습니다(D41)." />
            <WorkersTable workers={s.workers} />
          </section>
          <div className="grid lg:grid-cols-2 gap-4">
            <section className="surface min-w-0" aria-label="최근 오류">
              <SectionTitle title="최근 오류" hint="3번 실패해 멈춘 작업 — 왜 났는지와 할 일" />
              <ErrorsList errors={s.errors} />
            </section>
            <section className="surface min-w-0" aria-label="최근 실행">
              <SectionTitle title="최근 실행" />
              <RunsTable runs={s.runs} />
            </section>
          </div>
        </>
      )}
    </>
  );
}
