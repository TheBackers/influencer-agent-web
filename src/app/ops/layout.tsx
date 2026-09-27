import OpsNav from "@/components/ops/ops-nav";
import { OPS_SAMPLE, USE_MOCK } from "@/lib/api-v2";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full min-w-0 max-w-[1120px] px-4 md:px-8 py-6 pb-20">
      <OpsNav />
      {OPS_SAMPLE && !USE_MOCK && (
        <p role="note" className="m-0 mb-4 px-3 py-2 rounded-md text-[13px] bg-[var(--warn-bg,#fbf0d6)] text-[var(--warn,#8a5a00)]">
          예시 데이터입니다 — Ops 화면은 다음 작업(평가 · 배포 판정 API)에서 실제 기록으로 연결됩니다.
        </p>
      )}
      <div className="flex flex-col gap-4">{children}</div>
    </main>
  );
}
