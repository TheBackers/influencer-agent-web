/**
 * 공용 조각. 원칙(ui-ux-pro-max · Vercel Web Interface Guidelines):
 * - 상태는 색만으로 전달하지 않는다 → 점/아이콘 + 글자
 * - 배지는 상태에만. 값이나 분류에는 배지를 쓰지 않고 그냥 글자로 쓴다
 * - 숫자는 tabular-nums, 숫자 형식은 Intl
 */
import type { Dossier, Feasibility, Health, GateVerdict } from "@/types/v2";

const nf = new Intl.NumberFormat("ko-KR");
export const num = (v: number | undefined) => nf.format(v ?? 0);

export function compact(v: number): string {
  if (v >= 10000) return `${(Math.round(v / 1000) / 10).toLocaleString("ko-KR")}만`;
  return nf.format(v);
}

export const pct = (v: number, digits = 0) => `${((v ?? 0) * 100).toFixed(digits)}%`;

/** 필수 조건 중 확인 못 한 것 — 결과에 든 사람의 필수 조건은 통과 아니면 '확인 못 함'이다(미충족은 탈락).
 *  이름은 백엔드 weak('필수 조건 확인 못 함 — 협업하고, 단점도 말하는')에서 읽는다 */
export function unconfirmed(d: Dossier): { n: number; names: string } {
  const n = Math.max(0, d.score.must_total - d.score.must_pass);
  const names = (d.weak ?? "").split("—").slice(1).join("—").trim();
  return { n: n || (d.weak ? 1 : 0), names };
}

/** '필수 조건 확인 못 함' 표시 — 상태라서 배지(점 + 글자) */
export function UnconfirmedBadge({ d }: { d: Dossier }) {
  const u = unconfirmed(d);
  if (!u.n) return null;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium" style={{ color: "var(--unknown)" }}
      title={u.names ? `확인 못 한 필수 조건: ${u.names}` : undefined}>
      <span aria-hidden className="w-[7px] h-[7px] rounded-full" style={{ background: "var(--unknown)" }} />
      필수 {u.n}개 확인 못 함
    </span>
  );
}

const df = new Intl.DateTimeFormat("ko-KR");
/** 날짜 글자 → '2026. 9. 3.' — 비었거나 못 읽으면 빈 글자(★ Intl.format 은 Invalid Date 에서 예외를 던져 화면 전체가 깨진다).
 *  인스타 시각 '+0000' 꼴은 일부 브라우저(Safari)가 못 읽어 '+00:00' 으로 고친다. */
export function fmtDate(s?: string | null): string {
  if (!s) return "";
  const d = new Date(String(s).replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));
  return Number.isNaN(d.getTime()) ? "" : df.format(d);
}

const FEAS: Record<Feasibility, { label: string; color: string }> = {
  direct: { label: "직접 확인", color: "var(--pass)" },
  proxy: { label: "대체 지표", color: "var(--unknown)" },
  infeasible: { label: "확인 불가", color: "var(--fail)" },
};

/** 가능성 — 작은 점 + 글자 (배지 아님) */
export function FeasibilityBadge({ f }: { f: Feasibility }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px]">
      <span aria-hidden className="w-[7px] h-[7px] rounded-full" style={{ background: FEAS[f].color }} />
      {FEAS[f].label}
    </span>
  );
}

export function VerdictBadge({ v }: { v: "pass" | "fail" | "unknown" }) {
  const map = {
    pass: { label: "통과", color: "var(--pass)" },
    fail: { label: "실패", color: "var(--fail)" },
    unknown: { label: "확인 못 함", color: "var(--unknown)" },
  }[v];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium" style={{ color: map.color }}>
      <span aria-hidden className="w-[7px] h-[7px] rounded-full" style={{ background: map.color }} />
      {map.label}
    </span>
  );
}

const H: Record<Health, { label: string; color: string }> = {
  green: { label: "정상", color: "var(--pass)" },
  yellow: { label: "주의", color: "var(--unknown)" },
  red: { label: "위험", color: "var(--fail)" },
  none: { label: "측정 안 함", color: "var(--border-strong)" },
};

export function HealthDot({ h, withLabel = false }: { h: Health; withLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span aria-hidden className="inline-block w-[7px] h-[7px] rounded-full" style={{ background: H[h].color }} />
      {withLabel ? <span className="text-[12.5px]">{H[h].label}</span> : <span className="sr-only">{H[h].label}</span>}
    </span>
  );
}

const G: Record<GateVerdict, { label: string; color: string; bg: string; desc: string }> = {
  DEPLOY: { label: "배포 가능", color: "var(--pass)", bg: "var(--pass-bg)", desc: "모든 기준을 통과했습니다" },
  DEBUG: { label: "디버그 필요", color: "var(--unknown)", bg: "var(--unknown-bg)", desc: "운영 환경이나 연결에 문제가 있어 품질을 판정할 수 없습니다" },
  IMPROVE: { label: "개선 필요", color: "var(--fail)", bg: "var(--fail-bg)", desc: "품질이 배포 기준에 못 미칩니다" },
};

export const gateStyle = (v: GateVerdict) => G[v];

export function GateBadge({ v }: { v: GateVerdict }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-semibold" style={{ color: G[v].color }}>
      <span aria-hidden className="w-[7px] h-[7px] rounded-full" style={{ background: G[v].color }} />
      {G[v].label}
    </span>
  );
}

export function Avatar({ name, hue, src, size = 32 }: { name: string; hue: number; src?: string; size?: number }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} className="rounded-full object-cover shrink-0" />;
  }
  return (
    <span aria-hidden className="rounded-full shrink-0 inline-flex items-center justify-center font-semibold"
      style={{ width: size, height: size, background: `hsl(${hue} 30% 92%)`, color: `hsl(${hue} 35% 32%)`, fontSize: size * 0.42 }}>
      {name.slice(0, 1)}
    </span>
  );
}

export function Spinner() {
  return <span aria-hidden className="inline-block w-[12px] h-[12px] border-[1.5px] rounded-full animate-spin border-current border-t-transparent opacity-70" />;
}

/** 눌러서 켜고 끄는 스위치 (필수/참고) */
export function Switch({ id, checked, onChange, disabled, label }: { id: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button id={id} type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[18px] w-[32px] shrink-0 rounded-full transition-colors duration-150 disabled:opacity-40 ${checked ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]"}`}>
      <span aria-hidden className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-transform duration-150 ${checked ? "translate-x-[16px]" : "translate-x-[2px]"}`} />
    </button>
  );
}

export const btn = {
  primary: "inline-flex items-center justify-center gap-2 h-[34px] px-3.5 rounded-md bg-[var(--accent)] text-[var(--accent-ink)] text-[13px] font-semibold hover:opacity-90 disabled:opacity-50",
  secondary: "inline-flex items-center justify-center gap-2 h-[34px] px-3 rounded-md border border-[var(--border-strong)] bg-[var(--panel)] text-[13px] hover:bg-[var(--soft)] disabled:opacity-50",
  ghost: "inline-flex items-center justify-center gap-1.5 h-[30px] px-2 rounded-md text-[13px] text-[var(--ink-2)] hover:bg-[var(--soft)]",
};

/** 표 공통 클래스 */
export const tbl = {
  th: "px-3 h-[34px] text-left text-[12px] font-medium text-[var(--dim)] border-b border-[var(--border)] whitespace-nowrap",
  td: "px-3 py-2.5 border-b border-[var(--border)] align-middle",
};
