// Signature transit map: three priced routes out of one profile.
const LINES = [
  { c: "var(--color-direct)", d: "M60 190 H170 C215 190 215 90 260 90 H530", len: 620, stops: [[390, 90, "Process case study"]], end: [530, 90, "Business Operations"] },
  { c: "var(--color-bridge)", d: "M60 200 H530", len: 520, stops: [[330, 200, "Founder's office, 1 yr"]], end: [530, 200, "Strategy & Ops"] },
  { c: "var(--color-upskill)", d: "M60 210 H170 C215 210 215 310 260 310 H530", len: 620, stops: [[330, 310, "Fellowship"], [440, 310, "2 case studies"]], end: [530, 310, "Product Manager"] },
] as const;

export function RouteMapHero() {
  return (
    <svg viewBox="0 0 760 380" className="w-full h-auto" role="img" aria-labelledby="rm-title">
      <title id="rm-title">Three routes from a project architect to new roles</title>
      {LINES.map((l, i) => <path key={i} d={l.d} fill="none" stroke={l.c} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />)}
      {LINES.map((l, i) => (
        <g key={`s${i}`}>
          {l.stops.map(([x, y, t], j) => (
            <g key={j}>
              <circle cx={x} cy={y} r="8" fill="#f3f4ef" stroke={l.c} strokeWidth="4" />
              <text x={x} y={y + (i === 0 ? -20 : 30)} textAnchor="middle" fontSize="14" fill="#56666c">{t}</text>
            </g>
          ))}
          <circle cx={l.end[0]} cy={l.end[1]} r="12" fill={l.c} />
          <text x={l.end[0] + 22} y={l.end[1] + 6} fontSize="18" fontWeight="700" fill="#10222b">{l.end[2]}</text>
        </g>
      ))}
      <circle cx="60" cy="200" r="20" fill="#10222b" />
      <circle cx="60" cy="200" r="6" fill="#f3f4ef" />
      <text x="60" y="244" textAnchor="middle" fontSize="15" fontWeight="700" fill="#10222b">You today</text>
      <text x="60" y="262" textAnchor="middle" fontSize="13" fill="#56666c">Architect, 4 yrs</text>
    </svg>
  );
}
