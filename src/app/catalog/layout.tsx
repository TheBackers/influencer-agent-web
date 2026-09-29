/** 인플루언서 목록 · 적재 현황 — 같은 폭의 본문 */
export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full min-w-0 max-w-[1200px] px-4 md:px-8 py-6 pb-20">
      <div className="flex flex-col gap-4">{children}</div>
    </main>
  );
}
