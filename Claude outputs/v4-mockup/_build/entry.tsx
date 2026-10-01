import { createRoot } from "react-dom/client";
import type { ComponentType, ReactNode } from "react";
import AppShell from "@/components/v2/app-shell";
import CatalogLayout from "@/app/catalog/layout";
import OpsLayout from "@/app/ops/layout";
import SearchPage from "@/app/page";
import CatalogPage from "@/app/catalog/page";
import IngestPage from "@/app/catalog/ingest/page";
import OpsOverview from "@/app/ops/page";
import AgentsPage from "@/app/ops/agents/page";
import TracePage from "@/app/ops/trace/page";
import QualityPage from "@/app/ops/quality/page";
import ReleasePage from "@/app/ops/release/page";
import ObservePage from "@/app/ops/observe/page";
import { navigate, useRoute } from "./nav";

const ROUTES: Record<string, { C: ComponentType; L?: ComponentType<{ children: ReactNode }> }> = {
  "/": { C: SearchPage },
  "/catalog": { C: CatalogPage, L: CatalogLayout },
  "/catalog/ingest": { C: IngestPage, L: CatalogLayout },
  "/ops": { C: OpsOverview, L: OpsLayout },
  "/ops/agents": { C: AgentsPage, L: OpsLayout },
  "/ops/trace": { C: TracePage, L: OpsLayout },
  "/ops/quality": { C: QualityPage, L: OpsLayout },
  "/ops/release": { C: ReleasePage, L: OpsLayout },
  "/ops/observe": { C: ObservePage, L: OpsLayout },
};

const GUIDE: [string, string][] = [
  ["/catalog/ingest", "적재"], ["/?demo=short", "검색 · 모자람"], ["/?demo=live", "검색 · 실시간 더함"], ["/?demo=done", "검색 · DB로 채움"],
  ["/catalog", "목록 · 출처 필터"], ["/ops", "개요"], ["/ops/agents", "에이전트"], ["/ops/trace", "추적"], ["/ops/quality", "정확도"], ["/ops/release", "배포"], ["/ops/observe?tab=cost", "관측"],
];

function App() {
  const { path, search } = useRoute();
  const r = ROUTES[path] ?? ROUTES["/"];
  const page = <r.C key={path + search} />;
  return (
    <AppShell>
      <nav aria-label="목업 바로가기" className="mock-guide">
        <b>v4 목업 · 승인 전</b>
        <span className="mock-guide-list">
          {GUIDE.map(([h, l]) => <button key={h} type="button" onClick={() => navigate(h)} aria-current={h === path + search || (h.split("?")[0] === path && !h.includes("?") ) ? "page" : undefined}>{l}</button>)}
        </span>
      </nav>
      {r.L ? <r.L>{page}</r.L> : page}
    </AppShell>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
