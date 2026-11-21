// Deterministic decision engine. Every number the user sees comes from here, never from the LLM.
// Runs on server and client so constraint sliders recompute instantly.

import { ROLES, type Role } from "./data/roles";
import { LEARNING, type LearningOption } from "./data/learning";
import type { Constraints } from "./data/personas";
import { skillLabel } from "./data/skills";

export type ClaimStatus = "demonstrated" | "inferred";
export type Verdict = "confirmed" | "rejected" | null;

export type Claim = {
  id: string;
  skillId: string;
  label: string;
  status: ClaimStatus;
  evidence: string;
  source: "resume" | "answer" | "user";
  verdict: Verdict;
};

export function claimStrength(c: Claim): number {
  if (c.verdict === "rejected") return 0;
  if (c.status === "demonstrated") return 1;
  return c.verdict === "confirmed" ? 0.75 : 0.4;
}

export type SkillMatch = {
  skillId: string;
  label: string;
  weight: number;
  mustHave: boolean;
  strength: number;
  state: "demonstrated" | "inferred" | "missing";
  claimIds: string[];
  hoursToProof: number;
};

export type Band = "Strong" | "Workable" | "Constrained";

export type RoleFit = {
  slug: string;
  title: string;
  coverage: number; // 0..1, share of weighted role skills backed by evidence
  band: Band;
  matches: SkillMatch[];
  blockers: string[];
  gapHours: number;
};

export const BAND_RULES = "Strong: 55%+ weighted coverage and every must-have skill at least inferred. Workable: 35%+. Constrained: below 35%, or a must-have skill missing.";

export function fitRole(role: Role, claims: Claim[]): RoleFit {
  let total = 0;
  let got = 0;
  const matches: SkillMatch[] = role.skills.map((rs) => {
    const relevant = claims.filter((c) => c.skillId === rs.id && claimStrength(c) > 0);
    const strength = relevant.reduce((m, c) => Math.max(m, claimStrength(c)), 0);
    total += rs.weight;
    got += rs.weight * strength;
    return {
      skillId: rs.id,
      label: skillLabel(rs.id),
      weight: rs.weight,
      mustHave: !!rs.mustHave,
      strength,
      state: strength >= 0.99 ? "demonstrated" : strength > 0 ? "inferred" : "missing",
      claimIds: relevant.map((c) => c.id),
      hoursToProof: rs.hoursToProof,
    };
  });
  const coverage = total ? got / total : 0;
  const missingMust = matches.filter((m) => m.mustHave && m.strength === 0);
  const blockers = missingMust.map((m) => `No evidence yet for must-have skill: ${m.label}`);
  let band: Band = coverage >= 0.55 ? "Strong" : coverage >= 0.35 ? "Workable" : "Constrained";
  if (missingMust.length && band === "Strong") band = "Workable";
  if (missingMust.length >= 2) band = "Constrained";
  const gapHours = Math.round(matches.reduce((s, m) => s + m.hoursToProof * (1 - m.strength), 0));
  return { slug: role.slug, title: role.title, coverage, band, matches, blockers, gapHours };
}

export function rankRoles(claims: Claim[]): RoleFit[] {
  return ROLES.map((r) => fitRole(r, claims)).sort((a, b) => b.coverage - a.coverage);
}

// ---------- Routes ----------

export type RouteType = "direct" | "bridge" | "upskill" | "mba";

export const ROUTE_NAMES: Record<RouteType, string> = {
  direct: "Direct move",
  bridge: "Bridge role first",
  upskill: "Course plus portfolio",
  mba: "Full-time MBA",
};

export type Scenario = "conservative" | "base" | "optimistic";

export type RouteResult = {
  type: RouteType;
  name: string;
  summary: string;
  course?: LearningOption;
  studyHours: number;
  proofHours: number;
  months: Record<Scenario, number>; // months until a realistic offer in the target role
  cashInr: number;
  incomeLossInr: number; // forgone or reduced income over the transition
  totalInvestmentInr: number;
  flags: string[]; // constraint violations
  feasible: boolean;
  score: number; // lower is better, used for ranking only
  assumptions: string[];
};

const WEEKS_PER_MONTH = 4.33;
const BUFFER = 1.15;
const SCEN: Record<Scenario, { hours: number; search: number }> = {
  optimistic: { hours: 0.8, search: -1 },
  base: { hours: 1, search: 0 },
  conservative: { hours: 1.4, search: 3 },
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function computeRoutes(role: Role, fit: RoleFit, c: Constraints): RouteResult[] {
  const hpw = Math.max(1, c.hoursPerWeek);
  const monthlyCtc = (c.currentCtcLpa * 100000) / 12;
  const bandPenalty = fit.band === "Strong" ? 0 : fit.band === "Workable" ? 2 : 4;
  const out: RouteResult[] = [];

  const timeline = (hours: number, search: number, fixedMonths = 0) => {
    const m = {} as Record<Scenario, number>;
    (Object.keys(SCEN) as Scenario[]).forEach((s) => {
      const study = (hours * SCEN[s].hours * BUFFER) / (hpw * WEEKS_PER_MONTH);
      m[s] = round1(Math.max(1, fixedMonths + study + Math.max(0, search + SCEN[s].search)));
    });
    return m;
  };

  // Direct
  {
    const study = Math.round(fit.gapHours * 0.6);
    const proof = role.proofHours;
    const search = role.searchMonths.direct + bandPenalty;
    const flags: string[] = [];
    if (fit.band === "Constrained") flags.push("Long shot: screens for this role usually filter out profiles with this little evidence");
    const cash = 2000;
    out.push(mk("direct", `Self-study the gaps, build ${role.proofIdea.toLowerCase().startsWith("a") ? "one proof project" : "proof projects"}, apply with a reframed resume.`, undefined, study, proof, timeline(study + proof, search), cash, 0, flags, [
      `Self-study covers 60% of the ${fit.gapHours} gap hours; the rest is learned through the proof project`,
      `Job search ${search} months in the base case (role default ${role.searchMonths.direct}, plus ${bandPenalty} for a ${fit.band.toLowerCase()} fit)`,
    ]));
  }

  // Bridge
  {
    const study = Math.round(fit.gapHours * 0.4);
    const proof = Math.round(role.proofHours * 0.5);
    const search = role.searchMonths.bridge;
    const tenure = 12;
    const payChange = role.bridgePayChangePct;
    const incomeLoss = payChange < 0 ? Math.round(monthlyCtc * (-payChange / 100) * tenure) : 0;
    const flags: string[] = [];
    if (-payChange > c.maxPayCutPct) flags.push(`Bridge roles typically pay about ${-payChange}% less; your limit is ${c.maxPayCutPct}%`);
    if (monthlyCtc * (1 + payChange / 100) < c.incomeFloorMonthly) flags.push("Bridge salary may fall below your monthly income floor");
    out.push(mk("bridge", `Move first into ${role.bridgeRoles[0].toLowerCase()} (or similar), then into ${role.title} after about a year.`, undefined, study, proof, timeline(study + proof, search, tenure), 0, incomeLoss, flags, [
      `About ${tenure} months in the bridge role before moving on (planning assumption)`,
      payChange ? `Bridge pay change of ${payChange}% assumed` : "Bridge role assumed at similar pay",
    ]));
  }

  // Upskill: cheapest paid course that fits budget, else first listed
  {
    const paid = role.courses.map((id) => LEARNING[id]).filter((l) => l && l.kind !== "free" && l.kind !== "degree");
    const affordable = paid.filter((l) => l.costInr <= c.budgetInr).sort((a, b) => a.costInr - b.costInr);
    const course = affordable[0] ?? paid.sort((a, b) => a.costInr - b.costInr)[0];
    if (course) {
      const proof = role.proofHours;
      const study = Math.max(course.hours, Math.round(fit.gapHours * 0.5));
      const flags: string[] = [];
      if (course.costInr > c.budgetInr) flags.push(`Costs Rs ${fmtInr(course.costInr)}, above your Rs ${fmtInr(c.budgetInr)} budget`);
      if (hpw < course.minHoursPerWeek) flags.push(`Programme expects about ${course.minHoursPerWeek} hrs/week; at ${hpw} it will run long or you may fall behind a cohort`);
      out.push(mk("upskill", `${course.name} (${course.provider}) plus portfolio work aimed at the gaps.`, course, study, proof, timeline(study + proof, role.searchMonths.upskill + Math.max(0, bandPenalty - 1)), course.costInr, 0, flags, [
        `Course hours: ${course.hours}; ${course.costNote}`,
        `Job search ${role.searchMonths.upskill} months in the base case`,
      ]));
    }
  }

  // MBA
  {
    const mba = LEARNING.isb_pgp;
    const flags: string[] = [];
    if (!c.fullTimeStudyOk) flags.push("Needs a year of full-time study; you said you cannot stop working");
    if (mba.costInr > c.budgetInr) flags.push(`Fees of Rs ${fmtInr(mba.costInr)} are far above your budget (loan likely)`);
    const incomeLoss = Math.round(c.currentCtcLpa * 100000);
    const prep = 4; // test prep and applications
    const m = {} as Record<Scenario, number>;
    (["optimistic", "base", "conservative"] as Scenario[]).forEach((s) => {
      m[s] = round1(prep + 12 + Math.max(0, role.searchMonths.mba + SCEN[s].search) + (s === "conservative" ? 4 : 0));
    });
    const r = mk("mba", `One-year full-time MBA with campus placement. Helps ${role.mbaHelps} for ${role.title} hiring.`, mba, mba.hours, 0, m, mba.costInr, incomeLoss, flags, [
      "4 months test prep and applications, 12 months programme",
      "Lost salary = one year of current CTC",
      `Our curated view: an MBA helps ${role.mbaHelps} for this role`,
    ]);
    out.push(r);
  }

  return out.sort((a, b) => a.score - b.score);

  function mk(type: RouteType, summary: string, course: LearningOption | undefined, studyHours: number, proofHours: number, months: Record<Scenario, number>, cashInr: number, incomeLossInr: number, flags: string[], assumptions: string[]): RouteResult {
    const total = cashInr + incomeLossInr;
    const feasible = !flags.some((f) => f.startsWith("Needs a year") || f.includes("above your") || f.includes("below your monthly"));
    const mbaFit = type === "mba" ? (role.mbaHelps === "often" ? -3 : role.mbaHelps === "rarely" ? 4 : 0) : 0;
    const score = months.base + total / 100000 * 0.6 + flags.length * 6 + (feasible ? 0 : 20) + mbaFit + (cashInr === 0 ? -0.5 : 0);
    return { type, name: ROUTE_NAMES[type], summary, course, studyHours, proofHours, months, cashInr, incomeLossInr, totalInvestmentInr: total, flags, feasible, score, assumptions };
  }
}

export type Flip = { change: string; newTop: string } | null;

// "What would change this ranking": try plausible constraint changes and report the first one that flips the top route.
export function whatWouldFlip(role: Role, fit: RoleFit, c: Constraints): string[] {
  const base = computeRoutes(role, fit, c)[0];
  const tries: { label: string; c: Constraints }[] = [
    { label: `you could give ${Math.round(c.hoursPerWeek * 1.75)} hrs/week instead of ${c.hoursPerWeek}`, c: { ...c, hoursPerWeek: Math.round(c.hoursPerWeek * 1.75) } },
    { label: `your budget rose to Rs ${fmtInr(c.budgetInr + 100000)}`, c: { ...c, budgetInr: c.budgetInr + 100000 } },
    { label: c.fullTimeStudyOk ? "you could not study full time" : "you could stop working for a year", c: { ...c, fullTimeStudyOk: !c.fullTimeStudyOk } },
    { label: `you accepted a pay cut of up to 20%`, c: { ...c, maxPayCutPct: 20, incomeFloorMonthly: Math.min(c.incomeFloorMonthly, ((c.currentCtcLpa * 100000) / 12) * 0.8) } },
  ];
  const res: string[] = [];
  for (const t of tries) {
    const top = computeRoutes(role, fit, t.c)[0];
    if (top.type !== base.type) res.push(`If ${t.label}, "${top.name}" would overtake "${base.name}".`);
  }
  if (!res.length) res.push(`"${base.name}" stays on top under every change we tested (more hours, more budget, full-time study, a 20% pay cut).`);
  return res;
}

// ---------- Planner ----------

export type MilestoneInput = { title: string; detail: string; hours: number; kind: "learn" | "build" | "apply" | "network"; skillId?: string; output: string };
export type PackedMilestone = MilestoneInput & { startWeek: number; endWeek: number };

export const PLAN_CAPACITY = 0.85; // 15% of weekly hours kept as buffer

export function packMilestones(items: MilestoneInput[], hoursPerWeek: number): { milestones: PackedMilestone[]; weeks: number } {
  const cap = Math.max(1, hoursPerWeek * PLAN_CAPACITY);
  let used = 0; // hours consumed from week 1
  const milestones = items.map((m) => {
    const start = Math.floor(used / cap) + 1;
    used += Math.max(0.5, m.hours);
    const end = Math.max(start, Math.ceil(used / cap));
    return { ...m, startWeek: start, endWeek: end };
  });
  return { milestones, weeks: Math.ceil(used / cap) };
}

export function fmtInr(n: number) {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)} lakh`;
  return Math.round(n).toLocaleString("en-IN");
}
