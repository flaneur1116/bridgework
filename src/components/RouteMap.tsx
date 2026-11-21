"use client";
import { useEffect, useRef, useState } from "react";
import type { RouteResult, Scenario } from "@/lib/engine";

const COLOR: Record<string, string> = { direct: "var(--color-direct)", bridge: "var(--color-bridge)", upskill: "var(--color-upskill)", mba: "var(--color-mba)" };

// The signature view: each route is a line whose length is its time to an offer.
// Solid = your study and proof hours, thin = a bridge role or degree, dotted = job search.
export function RouteMap({ routes, scenario, selected, onSelect }: { routes: RouteResult[]; scenario: Scenario; selected: string; onSelect: (t: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(900);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const narrow = w < 560;
  const max = Math.max(...routes.map((r) => r.months.conservative), 6);
  const left = narrow ? 8 : 40, right = narrow ? 70 : 120, rowH = narrow ? 64 : 78, top = 24;
  const x = (m: number) => left + ((w - left - right) * m) / max;
  const H = top + routes.length * rowH + 28;
  const step = max > 24 ? 6 : 3;
  const ticks: number[] = [];
  for (let m = 0; m <= max; m += step) ticks.push(m);

  return (
    <div ref={box} className="w-full">
      <svg width={w} height={H} role="img" aria-label="Months to an offer, by route" className="block">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={top - 10} y2={H - 24} stroke="var(--color-rule)" />
            <text x={x(t)} y={H - 6} textAnchor={t === 0 ? "start" : "middle"} fontSize="12" fill="var(--color-mist)">{t === 0 ? "Today" : `${t} mo`}</text>
          </g>
        ))}
        {routes.map((r, i) => {
          const y = top + i * rowH + 22;
          const p = r.parts[scenario];
          const a = x(0), b = x(p.prep), c = x(p.prep + p.fixed), d = x(r.months[scenario]);
          const col = COLOR[r.type];
          const on = selected === r.type;
          return (
            <g key={r.type} onClick={() => onSelect(r.type)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(r.type)} tabIndex={0} role="button" aria-pressed={on} aria-label={`${r.name}: ${r.months[scenario]} months`} className="cursor-pointer outline-none" opacity={on ? 1 : r.feasible ? 0.55 : 0.3}>
              <rect x={0} y={y - rowH / 2 + 6} width={w} height={rowH - 12} fill="transparent" />
              <text x={a} y={y - 18} fontSize={narrow ? 13 : 14} fontWeight="600" fill="var(--color-ink)">{r.name}{r.feasible ? "" : "  (breaks a limit)"}</text>
              <line x1={a} x2={Math.max(a + 2, b)} y1={y} y2={y} stroke={col} strokeWidth={on ? 12 : 9} strokeLinecap="round" style={{ transition: "all .5s cubic-bezier(.22,1,.36,1)" }} />
              {p.fixed > 0 && <line x1={b} x2={c} y1={y} y2={y} stroke={col} strokeWidth={3} style={{ transition: "all .5s cubic-bezier(.22,1,.36,1)" }} />}
              {p.search > 0 && <line x1={c} x2={d} y1={y} y2={y} stroke={col} strokeWidth={3} strokeDasharray="1 7" strokeLinecap="round" style={{ transition: "all .5s cubic-bezier(.22,1,.36,1)" }} />}
              <circle cx={a} cy={y} r={on ? 7 : 6} fill="var(--color-paper)" stroke={col} strokeWidth={3} />
              <circle cx={d} cy={y} r={on ? 11 : 9} fill={col} style={{ transition: "cx .5s cubic-bezier(.22,1,.36,1)" }} />
              <text x={d + 18} y={y + 7} fontSize={narrow ? 18 : 22} fontWeight="700" fill="var(--color-ink)" style={{ transition: "x .5s cubic-bezier(.22,1,.36,1)" }}>{r.months[scenario]}<tspan fontSize="12" fontWeight="500" fill="var(--color-graphite)"> mo</tspan></text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
