/**
 * 인플루언서 DB(catalog) API 어댑터 — 인플루언서 목록 · 적재 현황 화면과 검색 결과의 DB 칸은 이 파일만 부른다.
 *
 * NEXT_PUBLIC_USE_MOCK=1 이면 src/mocks/catalog.ts 를 쓰고, 아니면 실제 백엔드를 부른다(설계서 14장).
 * 목업과 실제가 같은 타입(src/types/catalog.ts)을 쓰므로, 1단계 구현 때는 환경변수만 끄면 된다.
 * 목업 모드에서 고친 정보 · 더한 분야는 이 탭 안에서만 남는다(새로고침하면 처음 데이터).
 *
 * 실제 엔드포인트(1단계 · web/app.py):
 *   GET   /api/catalog/people?q&topics&platform&followers_min&followers_max&account_type&sponsor&contact&fresh_only&hidden&sort → PeoplePage
 *   GET   /api/catalog/people/{id}            → Person
 *   PATCH /api/catalog/people/{id}            → Person        (고친 칸은 잠김 · 골든셋 후보 D27 · 숨기기 D26)
 *   GET   /api/catalog/ingest                 → IngestStatus  (running · manual 포함)
 *   POST  /api/catalog/ingest/run             → { started, minutes, switch, manual }  (지금 한 번 돌리기 · 스위치가 꺼져도 시험 실행)
 *   GET   /api/catalog/topics/candidates      → TopicCandidate[]  (분야 후보 · 이미 넣은 분야는 빠짐 D39)
 *   POST  /api/catalog/topics                 → IngestStatus  (분야 추가 — 낱말은 비워도 됨 D39 · D40)
 *   PATCH /api/catalog/topics/{name}          → IngestStatus  (켜기/끄기 · 낱말 더하기 D25 · 낱말 빼기 D40)
 */
import { http, USE_MOCK } from "@/lib/api-v2";
import type {
  IngestManual, IngestStatus, KeywordRow, NewTopic, PeoplePage, PeopleQuery, Person, PersonPatch, TopicCandidate, TopicPatch,
} from "@/types/catalog";

type MockModule = typeof import("@/mocks/catalog");
let store: { mod: MockModule; people: Person[]; ingest: IngestStatus } | null = null;

/** 목업 저장소 — 처음 한 번 목업을 복사해 두고, 고치기는 이 복사본에 한다 */
async function mockDb() {
  if (!store) {
    const mod = await import("@/mocks/catalog");
    store = { mod, people: structuredClone(mod.PEOPLE), ingest: structuredClone(mod.ingestStatus) };
  }
  return store;
}
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const nowIso = () => new Date().toISOString();

function peopleQs(q: PeopleQuery): string {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.topics?.length) p.set("topics", q.topics.join(","));
  if (q.platform && q.platform !== "any") p.set("platform", q.platform);
  if (q.followers_min != null) p.set("followers_min", String(q.followers_min));
  if (q.followers_max != null) p.set("followers_max", String(q.followers_max));
  if (q.account_type && q.account_type !== "any") p.set("account_type", q.account_type);
  if (q.sponsor && q.sponsor !== "any") p.set("sponsor", q.sponsor);
  if (q.contact && q.contact !== "any") p.set("contact", q.contact);
  if (q.fresh_only) p.set("fresh_only", "1");
  if (q.hidden) p.set("hidden", "1");
  if (q.sort) p.set("sort", q.sort);
  if (q.limit) p.set("limit", String(q.limit));
  return p.toString();
}

// ── 인플루언서 목록 · 상세 ──────────────────────────────────────────────────────────
export async function getPeople(q: PeopleQuery): Promise<PeoplePage> {
  if (USE_MOCK) {
    const s = await mockDb();
    await wait(120);
    return structuredClone(s.mod.filterPeople(s.people, q));
  }
  return http(`/api/catalog/people?${peopleQs(q)}`);
}

export async function getPerson(id: string): Promise<Person> {
  if (USE_MOCK) {
    const s = await mockDb();
    await wait(120);
    const p = s.people.find((x) => x.id === id);
    if (!p) throw new Error("없는 인물입니다");
    return structuredClone(p);
  }
  return http(`/api/catalog/people/${encodeURIComponent(id)}`);
}

/** 정보 고치기 — 고친 칸은 잠겨 적재가 덮어쓰지 않고, 골든셋 후보로 올라간다(D27) */
export async function patchPerson(id: string, patch: PersonPatch): Promise<Person> {
  if (!USE_MOCK) return http(`/api/catalog/people/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) });
  const s = await mockDb();
  await wait(250);
  const p = s.people.find((x) => x.id === id);
  if (!p) throw new Error("없는 인물입니다");
  const lock = (k: Person["locked"][number]) => { if (!p.locked.includes(k)) p.locked.push(k); };
  const log = (what: string) => p.history.unshift({ at: nowIso(), by: "사람", what, detail: "관리자 · 골든셋 후보" });
  switch (patch.kind) {
    case "topics":
      p.topics = patch.topics;
      lock("topics");
      log(`분야 고침 — ${patch.topics.join(" · ")} (잠금)`);
      break;
    case "account_type":
      p.account_type = patch.account_type;
      lock("account_type");
      log(`계정 종류 고침 — ${patch.account_type} (잠금)`);
      break;
    case "unlink": {
      // 끊은 계정으로 가는 DM 연락처도 지운다(누가 넣었든). 주 계정 · 다른 출처 연락처는 둔다 — SQL catalog_patch 와 같게
      const gone = new Set(p.accounts.filter((a) => a.platform === patch.platform && a.link.how !== "discovered").map((a) => a.handle));
      p.accounts = p.accounts.filter((a) => a.platform !== patch.platform || a.link.how === "discovered");
      if (patch.platform === "instagram") p.contacts = p.contacts.filter((c) => c.kind !== "instagram" || !gone.has(c.value));
      if (!p.contacts.length) p.contact_state = "pending";
      lock("links");
      log(`연결 끊기 — ${patch.platform}${patch.note ? ` · ${patch.note}` : ""}`);
      break;
    }
    case "link": {
      const handle = patch.handle.replace(/^@/, "").trim();
      p.accounts = p.accounts.filter((a) => a.platform !== patch.platform || a.link.how === "discovered");
      p.accounts.push({
        platform: patch.platform, handle: `@${handle}`, url: `https://example.com/${patch.platform}/${handle}`,
        followers: null, posts: null, bio: "관리자가 이었다 — 다음 적재에서 수집한다", state: "ok",
        link: { how: "human", confidence: 1, note: patch.note || "관리자 확인" }, fetched_at: nowIso(),
      });
      if (patch.platform === "instagram") {
        p.contacts = p.contacts.filter((c) => c.kind !== "instagram");
        p.contacts.unshift({ kind: "instagram", value: `@${handle}`, label: "DM", origin: "human", source_url: "", source_label: patch.note || "관리자 입력", found_at: nowIso() });
        p.contact_state = "found";
      }
      lock("links");
      log(`계정 잇기 — ${patch.platform} @${handle} (확신도 1.0)`);
      break;
    }
    case "contact":
      p.contacts.push({ ...patch.contact, origin: "human", source_label: patch.contact.source_url ? "관리자가 확인한 곳" : "관리자 입력", found_at: nowIso() });
      p.contact_state = "found";
      lock("contacts");
      log(`연락처 넣기 — ${patch.contact.value}`);
      break;
    case "hide":
      p.status = patch.hidden ? "hidden" : "active";
      log(patch.hidden ? `숨김${patch.note ? ` — ${patch.note}` : ""} (갱신 멈춤)` : "숨김 해제");
      break;
  }
  return structuredClone(p);
}

// ── 적재 현황 · 분야 ──────────────────────────────────────────────────────────
export async function getIngest(): Promise<IngestStatus> {
  if (USE_MOCK) {
    const s = await mockDb();
    await wait(150);
    mockTick(s.ingest);
    return structuredClone(s.ingest);
  }
  return http("/api/catalog/ingest");
}

/** 지금 한 번 돌리기 — 서버가 적재 그래프를 한 번(최대 minutes분) 돈다. 스위치가 꺼져 있어도 시험으로 돈다. 도는 중이면 409 */
export async function runIngestNow(minutes: number): Promise<{ started: boolean; minutes: number; switch: boolean; manual: IngestManual }> {
  if (!USE_MOCK) return http("/api/catalog/ingest/run", { method: "POST", body: JSON.stringify({ minutes }) });
  const s = await mockDb();
  await wait(300);
  if (s.ingest.running) throw new Error("다른 적재 실행이 돌고 있습니다 — 끝나면 다시 누르세요");
  mockRun = { t0: Date.now(), minutes };
  s.ingest.running = true;
  s.ingest.manual = { alive: true, started_at: nowIso(), minutes, finished_at: "", error: "", result: null };
  return { started: true, minutes, switch: s.ingest.enabled, manual: structuredClone(s.ingest.manual) };
}

// 목업 실행 — 누른 뒤 약 12초 동안 단계 숫자가 늘고, 끝나면 실행 기록 한 줄이 생긴다(지어낸 숫자)
let mockRun: { t0: number; minutes: number; done?: number } | null = null;
function mockTick(g: IngestStatus) {
  if (!mockRun || !g.manual) return;
  const sec = (Date.now() - mockRun.t0) / 1000;
  const step = Math.min(12, Math.floor(sec / 2));
  const add = step - (mockRun.done ?? 0);
  if (add > 0) {
    for (const st of g.stages) if (st.key !== "store") { st.done_24h += add * (st.key === "collect" ? 3 : 1); st.waiting = Math.max(0, st.waiting - add); }
    mockRun.done = step;
  }
  if (sec < 12) return;
  const r = { status: "ok", run_id: 413, jobs_done: 36, jobs_failed: 1, people_added: 9, llm_usd: 0.004, stopped: "할 일 없음" };
  g.runs.unshift({ id: "ing_413", started_at: g.manual.started_at, minutes: 0.2, processed: 36, added: 9, failed: 1, usd: 0.004, stopped: "할 일 없음" });
  g.running = false;
  g.manual = { ...g.manual, alive: false, finished_at: nowIso(), result: r };
  mockRun = null;
}

export async function getTopicCandidates(): Promise<TopicCandidate[]> {
  if (!USE_MOCK) return http("/api/catalog/topics/candidates");
  const s = await mockDb();
  await wait(100);
  return structuredClone(s.mod.TOPIC_CANDIDATES.filter((c) => !s.ingest.topics.some((t) => t.name === c.name)));
}

const row = (word: string, source: KeywordRow["source"]): KeywordRow => ({ word, source, status: "active", queries: 0, added: 0, classified: 0, hits: 0 });
const activeWords = (rows: KeywordRow[]) => rows.filter((k) => k.status === "active").map((k) => k.word);

/** 분야 추가 — 낱말이 비면 후보 낱말, 후보도 아니면 비워 두고 첫 적재가 자동으로 만든다 (SQL catalog_topic_add 와 같게) */
export async function addTopic(t: NewTopic): Promise<IngestStatus> {
  if (!USE_MOCK) return http("/api/catalog/topics", { method: "POST", body: JSON.stringify(t) });
  const s = await mockDb();
  await wait(200);
  const name = t.name.trim();
  if (s.ingest.topics.some((x) => x.name === name)) throw new Error("이미 있는 분야입니다");
  const given = [...new Set((t.keywords || []).map((k) => k.trim()).filter(Boolean))];
  const cand = s.mod.TOPIC_CANDIDATES.find((c) => c.name === name);
  const rows = given.length ? given.map((w) => row(w, "manual")) : (cand?.keywords || []).map((w) => row(w, "seed"));
  s.ingest.topics.push({
    name, enabled: true, target: t.target, origin: !given.length && cand ? "candidate" : "manual",
    people: 0, creators: 0, fresh_ratio: 0, new_7d: 0,
    keywords: activeWords(rows), keyword_rows: rows, queries_used: 0, yield_per_query: 0, last_run_at: "",
  });
  return structuredClone(s.ingest);
}

/** 켜기/끄기 · 목표 · 낱말 더하기(꺼진 낱말은 다시 켬) · 낱말 빼기(다시 자동으로 넣지 않음) — SQL catalog_topic_patch 와 같게 */
export async function patchTopic(name: string, patch: TopicPatch): Promise<IngestStatus> {
  if (!USE_MOCK) return http(`/api/catalog/topics/${encodeURIComponent(name)}`, { method: "PATCH", body: JSON.stringify(patch) });
  const s = await mockDb();
  await wait(200);
  const t = s.ingest.topics.find((x) => x.name === name);
  if (!t) throw new Error("없는 분야입니다");
  if (patch.enabled !== undefined) t.enabled = patch.enabled;
  if (patch.target !== undefined) t.target = patch.target;
  for (const w of (patch.add_keywords || []).map((k) => k.trim()).filter(Boolean)) {
    const have = t.keyword_rows.find((k) => k.word === w);
    if (!have) t.keyword_rows.push(row(w, "manual"));
    else if (have.status === "off") { have.status = "active"; have.source = "manual"; delete have.off_reason; }
  }
  const gone = new Set((patch.remove_keywords || []).map((k) => k.trim()));
  t.keyword_rows = t.keyword_rows.filter((k) => !gone.has(k.word));
  t.keywords = activeWords(t.keyword_rows);
  return structuredClone(s.ingest);
}
