import OpsNav from "@/components/ops/ops-nav";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full min-w-0 max-w-[1120px] px-4 md:px-8 py-6 pb-20">
      <OpsNav />
      <div className="flex flex-col gap-4">{children}</div>
    </main>
  );
}
