"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { btn } from "@/components/v2/ui";
import type { AccountType, ContactKind, Person, PersonPatch } from "@/types/catalog";
import { CONTACT_KO, LINK_KO, PLATFORM_KO, TYPE_KO } from "./bits";

interface Props {
  p: Person;
  topics: string[];
  onSave: (patch: PersonPatch) => Promise<Person>;
  onDone: () => void;
}

const input = "h-[32px] px-2.5 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[13px] min-w-0";
const small = "inline-flex items-center justify-center h-[30px] px-3 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[12.5px] hover:bg-[var(--soft)] disabled:opacity-50";
const IG_RE = /^@?[A-Za-z0-9._]{1,30}$/;

function Block({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 p-0 border-0 border-t border-[var(--border)] pt-4 flex flex-col gap-2">
      <legend className="p-0 text-[13px] font-semibold">{title}</legend>
      {hint && <p className="m-0 text-[12px] text-[var(--dim)] leading-relaxed">{hint}</p>}
      {children}
    </fieldset>
  );
}

/** 정보 고치기 — 칸마다 따로 저장한다. 고친 칸은 잠겨 적재가 덮어쓰지 않고, 골든셋 후보가 된다(D27) */
export default function PersonEdit({ p, topics, onSave, onDone }: Props) {
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [tp, setTp] = useState<string[]>(p.topics);
  const [ty, setTy] = useState<AccountType>(p.account_type);
  const [ig, setIg] = useState("");
  const [igNote, setIgNote] = useState("");
  const [ck, setCk] = useState<ContactKind>("email");
  const [cv, setCv] = useState("");
  const [cl, setCl] = useState("");
  const [cs, setCs] = useState("");
  const [hideNote, setHideNote] = useState("");

  /** 저장 — 성공하면 true (입력칸을 비울지 정한다) */
  const run = async (key: string, patch: PersonPatch, ok: string): Promise<boolean> => {
    setBusy(key);
    setErr("");
    setMsg("");
    try {
      await onSave(patch);
      setMsg(ok);
      return true;
    } catch (e) {
      setErr(String((e as Error)?.message || e));
      return false;
    } finally {
      setBusy("");
    }
  };

  const allTopics = [...new Set([...topics, ...p.topics])];
  const toggle = (t: string) => setTp((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  const linked = p.accounts.filter((a) => a.link.how !== "discovered");
  const hasIg = p.accounts.some((a) => a.platform === "instagram");
  const igOk = IG_RE.test(ig.trim());
  const contactOk = cv.trim().length > 2 && (ck !== "email" || /.+@.+\..+/.test(cv.trim())) && (ck !== "instagram" || IG_RE.test(cv.trim()));
  const hidden = p.status === "hidden";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onDone} className={btn.ghost}><ArrowLeft size={15} aria-hidden />상세로</button>
        <h3 className="m-0 text-[14px] font-semibold">정보 고치기</h3>
      </div>
      <p className="m-0 text-[12.5px] text-[var(--ink-2)] leading-relaxed">
        칸마다 따로 저장합니다. 고친 칸은 <b>잠겨</b> 다음 적재가 덮어쓰지 않고, <b>골든셋 후보</b>로 올라가 골든셋 화면에서 확정합니다(D27).
      </p>
      <p aria-live="polite" className="m-0 min-h-[18px] text-[12.5px]" style={{ color: err ? "var(--fail)" : "var(--pass)" }}>{err || msg}</p>

      <Block title="분야" hint="이 사람이 주로 다루는 분야. 빠진 분야가 있으면 그 분야 검색에 안 나옵니다.">
        <div className="flex flex-wrap gap-1.5">
          {allTopics.map((t) => (
            <button key={t} type="button" aria-pressed={tp.includes(t)} onClick={() => toggle(t)}
              className={`h-[28px] px-2.5 rounded-full border text-[12.5px] ${tp.includes(t) ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)] font-medium" : "border-[var(--border-strong)] text-[var(--ink-2)] hover:bg-[var(--soft)]"}`}>
              {t}
            </button>
          ))}
        </div>
        <div><button type="button" className={small} disabled={!tp.length || busy === "topics" || tp.join() === p.topics.join()}
          onClick={() => run("topics", { kind: "topics", topics: tp }, "분야를 고쳤습니다 — 잠금 · 골든셋 후보")}>분야 저장</button></div>
      </Block>

      <Block title="계정 종류" hint="개인 크리에이터만 검색 후보가 됩니다. 매장 사장의 계정은 개인 일상 · 리뷰가 절반 넘으면 개인 크리에이터입니다.">
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="edit-type">계정 종류</label>
          <select id="edit-type" className={input} value={ty} onChange={(e) => setTy(e.target.value as AccountType)}>
            {(Object.keys(TYPE_KO) as AccountType[]).map((k) => <option key={k} value={k}>{TYPE_KO[k]}</option>)}
          </select>
          <button type="button" className={small} disabled={ty === p.account_type || busy === "type"}
            onClick={() => run("type", { kind: "account_type", account_type: ty }, "계정 종류를 고쳤습니다 — 잠금 · 골든셋 후보")}>저장</button>
        </div>
      </Block>

      <Block title="계정 연결" hint="다른 사람 계정이 이어졌으면 끊고, 확인한 인스타가 있으면 잇습니다(확신도 1.0 · 인스타는 DM 연락처로도 들어갑니다).">
        {linked.length > 0 && (
          <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
            {linked.map((a) => (
              <li key={`${a.platform}:${a.handle}`} className="flex items-center gap-2 text-[13px]">
                <span className="w-[52px] text-[12px] text-[var(--dim)]">{PLATFORM_KO[a.platform]}</span>
                <span className="font-medium">{a.handle}</span>
                <span className="text-[12px] text-[var(--dim)] truncate">{LINK_KO[a.link.how]}</span>
                <button type="button" className={`${small} ml-auto`} disabled={busy === `unlink-${a.platform}`}
                  onClick={() => run(`unlink-${a.platform}`, { kind: "unlink", platform: a.platform, note: "다른 사람" }, `${PLATFORM_KO[a.platform]} 연결을 끊었습니다 — 오연결 골든셋 후보`)}>연결 끊기</button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="edit-ig">인스타 아이디</label>
          <input id="edit-ig" className={`${input} w-[160px]`} placeholder={hasIg ? "인스타 바꾸기 @아이디" : "@인스타 아이디"} value={ig} onChange={(e) => setIg(e.target.value)} autoComplete="off" spellCheck={false} />
          <label className="sr-only" htmlFor="edit-ig-note">확인한 곳</label>
          <input id="edit-ig-note" className={`${input} flex-1 min-w-[140px]`} placeholder="확인한 곳 (예: 나무위키 · 유튜브 설명란)" value={igNote} onChange={(e) => setIgNote(e.target.value)} />
          <button type="button" className={small} disabled={!igOk || busy === "link"}
            onClick={() => run("link", { kind: "link", platform: "instagram", handle: ig.trim(), note: igNote.trim() }, "인스타를 이었습니다 — DM 연락처에도 넣었습니다").then((ok) => { if (ok) { setIg(""); setIgNote(""); } })}>인스타 잇기</button>
        </div>
      </Block>

      <Block title="연락처 넣기" hint="확인한 곳 주소를 함께 남기면 골든셋 정답 근거가 됩니다. 전화번호는 넣지 않습니다(D24).">
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="edit-ck">종류</label>
          <select id="edit-ck" className={input} value={ck} onChange={(e) => setCk(e.target.value as ContactKind)}>
            {(Object.keys(CONTACT_KO) as ContactKind[]).map((k) => <option key={k} value={k}>{CONTACT_KO[k]}</option>)}
          </select>
          <label className="sr-only" htmlFor="edit-cv">값</label>
          <input id="edit-cv" className={`${input} flex-1 min-w-[160px]`} placeholder={ck === "email" ? "collab@example.com" : ck === "instagram" ? "@아이디" : "https://…"} value={cv} onChange={(e) => setCv(e.target.value)} autoComplete="off" spellCheck={false} />
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="edit-cl">라벨</label>
          <input id="edit-cl" className={`${input} w-[120px]`} placeholder="라벨 (협업 · 소속사)" value={cl} onChange={(e) => setCl(e.target.value)} />
          <label className="sr-only" htmlFor="edit-cs">확인한 곳 주소</label>
          <input id="edit-cs" className={`${input} flex-1 min-w-[160px]`} placeholder="확인한 곳 주소 (https://…)" value={cs} onChange={(e) => setCs(e.target.value)} />
          <button type="button" className={small} disabled={!contactOk || busy === "contact"}
            onClick={() => run("contact", { kind: "contact", contact: { kind: ck, value: cv.trim(), label: cl.trim() || undefined, source_url: cs.trim() } }, "연락처를 넣었습니다 — 출처 ‘관리자’ · 골든셋 후보").then((ok) => { if (ok) { setCv(""); setCl(""); setCs(""); } })}>넣기</button>
        </div>
      </Block>

      <Block title={hidden ? "숨김 해제" : "숨기기"} hint={hidden ? "목록 · 검색에 다시 나오고 다음 적재부터 갱신합니다." : "지우지 않고 목록 · 검색에서 빼고 갱신을 멈춥니다. 삭제 요청도 이것으로 합니다(D26). 되돌릴 수 있습니다."}>
        <div className="flex flex-wrap gap-2">
          {!hidden && (
            <>
              <label className="sr-only" htmlFor="edit-hide">사유</label>
              <input id="edit-hide" className={`${input} flex-1 min-w-[160px]`} placeholder="사유 (예: 본인 삭제 요청)" value={hideNote} onChange={(e) => setHideNote(e.target.value)} />
            </>
          )}
          <button type="button" className={small} disabled={busy === "hide"}
            onClick={() => run("hide", { kind: "hide", hidden: !hidden, note: hideNote.trim() || undefined }, hidden ? "숨김을 풀었습니다" : "숨겼습니다 — 목록 · 검색에서 빠집니다")}>
            {hidden ? "숨김 해제" : "숨기기"}
          </button>
        </div>
      </Block>
    </div>
  );
}
