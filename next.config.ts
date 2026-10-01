import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // v4 메뉴 9개(PRD 2장) — 합쳐진 옛 Ops 주소는 새 화면으로 보낸다
  async redirects() {
    return [
      { source: "/ops/gates", destination: "/ops/release", permanent: false },
      { source: "/ops/eval", destination: "/ops/quality", permanent: false },
      { source: "/ops/golden", destination: "/ops/quality?tab=golden", permanent: false },
      { source: "/ops/feedback", destination: "/ops/quality?tab=human", permanent: false },
      { source: "/ops/diagnose", destination: "/ops/observe?tab=diagnose", permanent: false },
    ];
  },
};

export default nextConfig;
