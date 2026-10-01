// 목업 아티팩트용 라우터 — next/navigation 대신. 주소는 메모리에 두고(아티팩트 틀은 해시 토큰만 받는다) 처음 화면만 #토큰으로 고른다
import { useSyncExternalStore } from "react";

type Route = { path: string; search: string; query: URLSearchParams };
const ALIAS: Record<string, string> = {
  "/ops/golden": "/ops/quality?tab=golden", "/ops/feedback": "/ops/quality?tab=human", "/ops/eval": "/ops/quality",
  "/ops/diagnose": "/ops/observe?tab=diagnose", "/ops/gates": "/ops/release",
};
const TOKENS: Record<string, string> = {
  search: "/", "demo-done": "/?demo=done", short: "/?demo=short", live: "/?demo=live", detail: "/?demo=detail", review: "/?demo=review",
  list: "/catalog", ingest: "/catalog/ingest", ops: "/ops", agents: "/ops/agents", trace: "/ops/trace", "trace-ingest": "/ops/trace?tab=ingest",
  quality: "/ops/quality", release: "/ops/release", observe: "/ops/observe", cost: "/ops/observe?tab=cost",
};
function parse(href: string): Route {
  const u = new URL(href, "http://mock.local");
  const al = ALIAS[u.pathname];
  if (al) return parse(al + (u.search ? "&" + u.search.slice(1) : ""));
  return { path: u.pathname, search: u.search, query: u.searchParams };
}
const g = globalThis as unknown as { __MQ: string };
let route: Route = parse(TOKENS[(typeof location !== "undefined" ? location.hash.slice(1) : "")] ?? "/catalog/ingest");
g.__MQ = route.search;
const subs = new Set<() => void>();
export function navigate(href: string) {
  if (/^(https?:|mailto:)/.test(href)) { window.open(href, "_blank", "noopener"); return; }
  if (href.startsWith("#")) return;
  const next = parse(href);
  const moved = next.path !== route.path;
  route = next;
  g.__MQ = route.search;
  subs.forEach((f) => f());
  if (moved) try { window.scrollTo(0, 0); } catch { /* 틀이 막으면 그대로 */ }
}
const subscribe = (f: () => void) => { subs.add(f); return () => subs.delete(f); };
export function useRoute(): Route { return useSyncExternalStore(subscribe, () => route, () => route); }
export function usePathname() { return useRoute().path; }
export function useSearchParams() { return useRoute().query; }
export function useRouter() {
  return { push: navigate, replace: navigate, back: () => {}, forward: () => {}, refresh: () => {}, prefetch: () => {} };
}
export function redirect(href: string) { navigate(href); }
export function notFound() {}
