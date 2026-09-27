/** 페이지 제목 줄 — 제목 · 한 줄 설명 · 오른쪽 동작 */
export default function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end gap-x-4 gap-y-2 pb-4">
      <div className="min-w-0">
        <h1 className="m-0 text-[20px] font-semibold tracking-tight">{title}</h1>
        {description && <p className="m-0 mt-1 text-[13px] text-[var(--dim)]">{description}</p>}
      </div>
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </header>
  );
}
