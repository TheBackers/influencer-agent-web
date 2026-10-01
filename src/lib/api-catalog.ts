/**
 * 인플루언서 DB(catalog) API 어댑터 — 인플루언서 목록 · 상세 · 정보 고치기. 적재 화면은 src/lib/api-v4.ts.
 *
 * NEXT_PUBLIC_USE_MOCK=1 이면 src/mocks/catalog.ts 를 쓰고, 아니면 실제 백엔드를 부른다(설계서 14장).
 * 목업과 실제가 같은 타입(src/types/catalog.ts)을 쓰므로, 1단계 구현 때는 환경변수만 끄면 된다.
 * 목업 모드에서 고친 정보 · 더한 분야는 이 탭 안에서만 남는다(새로고침하면 처음 데이터).
 *
 * 실제 엔드포인트(1단계 · web/app.py):
 *   GET   /api/catalog/people?q&topics&platform&followers_min&followers_max&account_type&sponsor&contact&fresh_only&source&hidden&sort → PeoplePage
 *   GET   /api/catalog/people/{id}            → Person
 *   PATCH /api/catalog/people/{id}            → Person        (고친 칸은 잠김 · 골든셋 후보 D27 · 숨기기 D26)
 */
import { http, USE_MOCK } from "@/lib/api-v2";
import type {
  PeoplePage, PeopleQuery, Person, PersonPatch,
} from "@/types/catalog";

type MockModule = typeof import("@/mocks/catalog");
let store: { mod: MockModule; people: Person[] } | null = null;

/** 목업 저장소 — 처음 한 번 목업을 복사해 두고, 고치기는 이 복사본에 한다 */
async function mockDb() {
  if (!store) {
    const mod = await import("@/mocks/catalog");
    store = { mod, people: structuredClone(mod.PEOPLE) };
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
  if (q.source && q.source !== "any") p.set("source", q.source);
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
