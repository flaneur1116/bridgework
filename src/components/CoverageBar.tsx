import { NumberTicker } from "./vendor/number-ticker";
export function CoverageBar({ value, band }: { value: number; band: string }) {
  const color = band === "Strong" ? "var(--color-ink)" : band === "Workable" ? "var(--color-graphite)" : "var(--color-mist)";
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-wash overflow-hidden" role="meter" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Evidence coverage">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(3, value * 100)}%`, background: color }} />
      </div>
      <span className="text-sm tabular-nums w-10 text-right"><NumberTicker value={Math.round(value * 100)} />%</span>
    </div>
  );
}

export function BandChip({ band }: { band: string }) {
  const style = band === "Strong" ? "bg-ink text-white border-ink" : band === "Workable" ? "border-ink" : "border-dashed text-graphite";
  return <span className={`chip ${style}`}>{band}</span>;
}
