import type { RouteResult } from "@/lib/engine";

const COLOR: Record<string, string> = { direct: "var(--color-direct)", bridge: "var(--color-bridge)", upskill: "var(--color-upskill)", mba: "var(--color-mba)" };

// Each route is drawn as a line whose length is proportional to base-case months.
export function RouteMap({ routes, roleTitle, scenario }: { routes: RouteResult[]; roleTitle: string; scenario: "conservative" | "base" | "optimistic" }) {
  const max = Math.max(...routes.map((r) => r.months.conservative), 6);
  const W = 720, left = 24, right = 170, rowH = 50, top = 28;
  const x = (m: number) => left + ((W - left - right) * m) / max;
  const H = top + routes.length * rowH + 30;
  const ticks = [];
  const step = max > 24 ? 6 : 3;
  for (let m = 0; m <= max; m += step) ticks.push(m);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Months to ${roleTitle} by route, ${scenario} case`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={top - 12} y2={H - 26} stroke="#d6ddd8" strokeDasharray="2 4" />
          <text x={x(t)} y={H - 10} textAnchor="middle" fontSize="12" fill="#8c9a9e">{t === 0 ? "now" : `${t} mo`}</text>
        </g>
      ))}
      {routes.map((r, i) => {
        const y = top + i * rowH + 10;
        const end = x(r.months[scenario]);
        return (
          <g key={r.type} opacity={r.feasible ? 1 : 0.45}>
            <line x1={left} x2={end} y1={y} y2={y} stroke={COLOR[r.type]} strokeWidth="8" strokeLinecap="round" strokeDasharray={r.feasible ? undefined : "2 12"} />
            <circle cx={left} cy={y} r="7" fill="#13262f" />
            <circle cx={end} cy={y} r="9" fill="#fff" stroke={COLOR[r.type]} strokeWidth="4" />
            <text x={end + 16} y={y + 5} fontSize="15" fill="#13262f" fontWeight="600">{r.months[scenario]} mo</text>
            <text x={end + 16} y={y + 21} fontSize="13" fill="#56666c">{r.name}</text>
          </g>
        );
      })}
    </svg>
  );
}
