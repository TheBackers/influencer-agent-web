"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import PageHeader from "@/components/v2/app-header";
import { btn } from "@/components/v2/ui";
import { ErrorLine } from "@/components/catalog/bits";
import { AddTopicForm, ErrorsList, RunsTable, SectionTitle, StageFlow, Tiles, TopicsTable, WorkersTable } from "@/components/catalog/ingest-parts";
import { addTopic, getIngest, patchTopic } from "@/lib/api-catalog";
import type { IngestStatus, TopicPatch } from "@/types/catalog";

/** 적재 현황 — 1시간마다 크론이 적재 그래프(LangGraph)를 한 번 돈다. 사람은 분야 · 낱말을 관리하고 막힌 것을 본다 */
export default function IngestPage() {
  const [s, setS] = useState<IngestStatus | null>(null);
  const [err, setErr] = useState("");
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState("");

  const load = useCallback(() => getIngest().then((x) => { setS(x); setErr(""); }).catch((e) => setErr(String(e?.message || e))), []);
  useEffect(() => { load(); }, [load]);

  const onPatch = async (name: string, p: TopicPatch) => {
    try {
      const before = s?.topics.find((t) => t.name === name)?.keywords.length ?? 0;
      const next = await patchTopic(name, p);
      setS(next);
      // 이미 있는 낱말은 서버가 뺀다 — 실제로 늘어난 수를 알린다
      const added = (next.topics.find((t) => t.name === name)?.keywords.length ?? 0) - before;
      setNote(p.add_keywords
        ? (added > 0 ? `‘${name}’에 낱말 ${added}개를 더했습니다 — 다음 적재부터 씁니다` : `‘${name}’에 이미 있는 낱말입니다`)
        : `‘${name}’ 적재를 ${p.enabled ? "켰" : "껐"}습니다`);
    } catch (e) {
      setNote(`고치지 못했습니다 — ${String((e as Error)?.message || e)}`);
    }
  };
  const onAdd = async (name: string, keywords: string[], target: number) => {
    setS(await addTopic({ name, keywords, target }));
    setAdding(false);
    setNote(`‘${name}’ 분야를 더했습니다 — 다음 적재부터 씨앗을 모읍니다`);
  };

  const next = s?.next_run_at ? new Date(s.next_run_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "";
  const off = !!s && !s.next_run_at;   // 워커가 모두 꺼져 있음 — 분야 · 낱말만 미리 준비

  return (
    <>
      <PageHeader
        title="적재 현황"
        description={off
          ? "적재가 아직 꺼져 있습니다 — 켜면 1시간마다 크론이 적재 그래프를 한 번 돕니다. 지금은 분야 · 검색 낱말을 미리 준비해 둘 수 있습니다."
          : `1시간마다 크론이 적재 그래프를 한 번 돕니다(최대 50분 · 몫을 넘으면 그 단계만 쉼).${next ? ` 다음 실행 ${next}` : ""}`}
        actions={<button type="button" className={btn.secondary} onClick={() => setAdding(true)}><Plus size={14} aria-hidden />분야 추가</button>}
      />
      {err && <ErrorLine msg={err} />}
      <p aria-live="polite" className="m-0 min-h-0 text-[13px]" style={{ color: note.startsWith("고치지") ? "var(--fail)" : "var(--pass)" }}>{note}</p>
      {adding && <AddTopicForm onAdd={onAdd} onCancel={() => setAdding(false)} />}
      {s && (
        <>
          <Tiles s={s} />
          <section className="surface" aria-label="분야">
            <SectionTitle title="분야" hint="검색 1회당 새 계정이 2명 아래로 떨어지면 그 분야 낱말을 더하세요. 검색 결과의 ‘DB에 M명뿐’에서도 더할 수 있습니다(D25)." />
            <TopicsTable topics={s.topics} onPatch={onPatch} />
          </section>
          <section className="surface" aria-label="적재 그래프 단계">
            <SectionTitle title="적재 그래프 — 단계별 대기 · 실패" hint="pick_jobs가 작업 표에서 이번 판을 꺼내 단계 노드로 보내고, 노드가 순서 파일(ingest.yaml)대로 워커를 부른다. 실행 사이 상태는 작업 표가 가진다(D31)." />
            <StageFlow stages={s.stages} />
          </section>
          <section className="surface" aria-label="적재 워커">
            <SectionTitle title={`적재 워커 ${s.workers.filter((w) => w.status !== "shadow").length}개`} hint="LLM은 씨앗 낱말 넓히기 · 브랜드 정리 · 분류 · 웹 뽑아 적기 4곳에서 1회씩만 부른다. shadow는 운영 결과에 섞지 않고 비교만 한다." />
            <WorkersTable workers={s.workers} />
          </section>
          <div className="grid lg:grid-cols-2 gap-4">
            <section className="surface min-w-0" aria-label="최근 오류">
              <SectionTitle title="최근 오류" hint="왜 났는지와 할 일" />
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
