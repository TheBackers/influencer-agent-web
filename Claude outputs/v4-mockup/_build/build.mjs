import { build } from "/home/claude/web/node_modules/esbuild/lib/main.js";
import { readFileSync } from "node:fs";
const shell = { name: "shell", setup(b) { b.onLoad({ filter: /app-shell\.tsx$/ }, (a) => ({ contents: readFileSync(a.path, "utf8").replaceAll("lg:", "md:"), loader: "tsx" })); } };
await build({
  entryPoints: ["/home/claude/mock-build/entry.tsx"],
  bundle: true, minify: true, format: "iife", target: "es2020", jsx: "automatic",
  outfile: "/home/claude/mock-build/out/app.js",
  nodePaths: ["/home/claude/web/node_modules"],
  alias: { "@": "/home/claude/web/src", "next/link": "/home/claude/mock-build/link.tsx", "next/navigation": "/home/claude/mock-build/nav.ts" },
  define: {
    "process.env.NEXT_PUBLIC_USE_MOCK": '"1"', "process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_API_URL": '""',
    "window.location.search": "globalThis.__MQ",
  },
  tsconfig: "/home/claude/web/tsconfig.json",
  logLevel: "warning",
  plugins: [shell],
});
console.log("ok");
