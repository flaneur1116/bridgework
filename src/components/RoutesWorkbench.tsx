"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ROLES } from "@/lib/data/roles";
import { computeRoutes, fitRole, whatWouldFlip, fmtInr, BAND_RULES, type Claim, type RouteType, type Scenario } from "@/lib/engine";
import type { Constraints } from "@/lib/data/personas";
import { RouteMap } from "./RouteMap";
import { postJson, Spinner, useAction, ErrorNote } from "./ui";
import { NumberTicker } from "./vendor/number-ticker";
import type { RoleExplain } from "@/lib/agents";

const COLOR: Record<string, string> = { direct: "var(--color-direct)", bridge: "var(--color-bridge)", upskill: "var(--color-upskill)", mba: "var(--color-mba)" };

export function RoutesWorkbench({ claims, initialConstraints, initialRole, explain, hasPlan, currentPlan }: {
  claims: Claim[]; initialConstraints: Constraints; initialRole: string; explain: RoleExplain | null; hasPlan: boolean; currentPlan: { role: string; route: string } | null;
}) {
  const router = useRouter();
  const [c, setC] = useState(initialConstraints);
  const [saved, setSaved] = useState(initialConstraints);
  const [slug, setSlug] = useState(initialRole);
  const [scenario, setScenario] = useState<Scenario>("base");
  const [pick, setPick] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [buildErr, setBuildErr] = useState<string | null>(null);

  const fits = useMemo(() => ROLES.map((r) => fitRole(r, claims)).sort((a, b) => b.coverage - a.coverage), [claims]);
  const role = ROLES.find((r) => r.slug === slug)!;
  const fit = fits.find((f) => f.slug === slug)!;
  const routes = useMemo(() => computeRoutes(role, fit, c), [role, fit, c]);
  const flip = useMemo(() => whatWouldFlip(role, fit, c)[0], [role, fit, c]);
  const selected = routes.find((r) => r.type === pick) ?? routes[0];
  const ex = explain?.roles.find((r) => r.slug === slug);
  const dirty = JSON.stringify(c) !== JSON.stringify(saved);
  const set = <K extends keyof Constraints>(k: K, v: Constraints[K]) => setC({ ...c, [k]: v });

  const explainAct = useAction(() => postJson("/api/roles/explain"));
  const saveAct = useAction(async () => { await postJson("/api/constraints", { constraints: c }); setSaved(c); });

  async function build(type: RouteType) {
    setBuilding(true); setBuildErr(null);
    try {
      if (dirty) { await postJson("/api/constraints", { constraints: c }); setSaved(c); }
      await postJson("/api/plan", { roleSlug: slug, routeType: type });
      router.push("/app/plan"); router.refresh();
    } catch (e) { setBuildErr((e as Error).message); setBuilding(false); }
  }

  return (
    <div className="space-y-10">
      {/* Destination picker */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Destination role">
        {fits.map((f) => (
          <button key={f.slug} role="tab" aria-selected={f.slug === slug} onClick={() => { setSlug(f.slug); setPick(null); }}
            className={`flex-none rounded-full px-4 py-2 text-sm border transition-colors ${f.slug === slug ? "bg-ink text-paper border-ink" : "border-rule text-graphite hover:text-ink hover:border-graphite"}`}>
            {f.title} <span className="tabular-nums opacity-70 ml-1">{Math.round(f.coverage * 100)}%</span>
          </button>
        ))}
      </div>

      {/* Role headline */}
      <section className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-end">
        <div>
          <h1 className="text-[clamp(2.4rem,5.5vw,4.4rem)] font-extrabold tracking-[-0.045em] leading-[0.95]">{role.title}</h1>
          <div className="flex items-baseline gap-4 mt-5">
            <span className="text-[3.2rem] font-bold leading-none tabular-nums"><NumberTicker value={Math.round(fit.coverage * 100)} />%</span>
            <span className="text-graphite" title={BAND_RULES}>evidence match, <span className="text-ink">{fit.band.toLowerCase()}</span></span>
          </div>
        </div>
        <div>
          {ex ? (
            <dl className="space-y-3 text-[0.95rem]">
              <div><dt className="text-mist text-sm">Why it fits</dt><dd>{ex.whyItFits}</dd></div>
              <div><dt className="text-mist text-sm">The recruiter will ask</dt><dd>{ex.recruiterDoubt}</dd></div>
            </dl>
          ) : (
            <button className="btn btn-ghost" onClick={() => explainAct.run()} disabled={explainAct.pending}>{explainAct.pending ? <><Spinner />Reading your evidence</> : "Explain this fit"}</button>
          )}
          <ErrorNote error={explainAct.error} />
        </div>
      </section>

      <ul className="flex flex-wrap gap-2" aria-label="Skills this role screens for">
        {fit.matches.map((m) => (
          <li key={m.skillId} className={`chip gap-2 py-1 ${m.state === "missing" ? "text-mist" : ""}`} title={m.state === "demonstrated" ? "Proven in your ledger" : m.state === "inferred" ? "Assumed, not proven yet" : "No evidence yet"}>
            <span className={`mark mark-${m.state}`} style={{ width: 9, height: 9 }} />{m.label}{m.mustHave && <span className="text-mist">*</span>}
          </li>
        ))}
      </ul>

      {/* Controls */}
      <section className="sheet p-5 grid sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-x-8 gap-y-5 items-end" aria-label="Your limits">
        <Slider label="Hours a week" value={c.hoursPerWeek} min={2} max={40} step={1} fmt={(v) => `${v}`} onChange={(v) => set("hoursPerWeek", v)} />
        <Slider label="Learning budget" value={c.budgetInr} min={0} max={500000} step={5000} fmt={(v) => `Rs ${fmtInr(v)}`} onChange={(v) => set("budgetInr", v)} />
        <Slider label="Pay cut you'd accept" value={c.maxPayCutPct} min={0} max={50} step={5} fmt={(v) => `${v}%`} onChange={(v) => set("maxPayCutPct", v)} />
        <label className="flex items-center gap-3 text-sm pb-1 cursor-pointer select-none">
          <input type="checkbox" className="peer sr-only" checked={c.fullTimeStudyOk} onChange={(e) => set("fullTimeStudyOk", e.target.checked)} />
          <span className="w-10 h-6 rounded-full bg-wash border border-rule relative transition-colors peer-checked:bg-ink peer-focus-visible:ring-2 peer-focus-visible:ring-direct after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-[18px] after:h-[18px] after:rounded-full after:bg-graphite after:transition-transform peer-checked:after:translate-x-4 peer-checked:after:bg-paper" aria-hidden />
          Can stop work for a year
        </label>
        {dirty && (
          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3 -mt-1">
            <button className="btn btn-primary py-1.5" onClick={() => saveAct.run()} disabled={saveAct.pending}>{saveAct.pending && <Spinner />}{hasPlan ? "Save and repack plan" : "Save limits"}</button>
            <button className="btn btn-quiet" onClick={() => setC(saved)}>Reset</button>
            <ErrorNote error={saveAct.error} />
          </div>
        )}
      </section>

      {/* Map */}
      <section aria-label="Routes">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <h2 className="text-2xl font-bold">{routes.length} ways across</h2>
          <div className="flex rounded-full border border-rule p-0.5 text-sm" role="group" aria-label="Scenario">
            {(["optimistic", "base", "conservative"] as Scenario[]).map((s) => (
              <button key={s} onClick={() => setScenario(s)} aria-pressed={scenario === s} className={`px-3 py-1 rounded-full capitalize ${scenario === s ? "bg-ink text-paper" : "text-graphite hover:text-ink"}`}>{s === "base" ? "Likely" : s}</button>
            ))}
          </div>
        </div>
        <RouteMap routes={routes} scenario={scenario} selected={selected.type} onSelect={setPick} />
        <p className="text-sm text-mist mt-2">Thick line: your study and proof hours. Thin: a bridge job or degree. Dotted: job search. Click a route.</p>
      </section>

      {/* Selected route */}
      <section className="sheet p-6 md:p-8" style={{ borderTop: `3px solid ${COLOR[selected.type]}` }} aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <h3 className="text-2xl font-bold">{selected.name}{routes[0].type === selected.type && selected.feasible && <span className="chip ml-3 align-middle">Ranks first</span>}</h3>
            <p className="text-graphite mt-1">{selected.summary}</p>
          </div>
          <button className="btn btn-primary" onClick={() => build(selected.type)} disabled={building}>
            {building ? <><Spinner />Drafting your plan</> : currentPlan?.role === slug && currentPlan.route === selected.type ? "Rebuild plan" : "Plan this route"}
          </button>
        </div>
        <dl className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Metric label="Months to offer" value={selected.months[scenario]} dp={1} sub={`${selected.months.optimistic} to ${selected.months.conservative}`} />
          <Metric label="Your hours" value={selected.studyHours + selected.proofHours} sub={`${selected.proofHours} on proof`} />
          <Metric label="Cash" prefix="Rs " text={fmtInr(selected.cashInr)} sub={selected.course ? selected.course.provider : "Free resources"} />
          <Metric label="Income lost" prefix="Rs " text={fmtInr(selected.incomeLossInr)} sub={selected.incomeLossInr ? "over the switch" : "none"} />
        </dl>
        {selected.flags.length > 0 && <ul className="mt-5 space-y-1">{selected.flags.map((f) => <li key={f} className="text-sm text-alert">{f}</li>)}</ul>}
        <p className="mt-5 text-sm text-graphite">{flip}</p>
        <details className="mt-3 text-sm text-mist">
          <summary className="cursor-pointer hover:text-graphite">How this is calculated</summary>
          <ul className="list-disc pl-5 mt-2 space-y-0.5">{selected.assumptions.map((a) => <li key={a}>{a}</li>)}<li>Hours are spread over your week with a 15% buffer</li>{selected.course && <li><a className="underline" href={selected.course.source.url} target="_blank" rel="noreferrer">Price source</a>, checked {selected.course.source.checked}</li>}<li>Entry salary for this role is roughly Rs {role.salaryLpa[0]} to {role.salaryLpa[1]} lakh (demo figure, unsourced)</li></ul>
        </details>
        <ErrorNote error={buildErr} />
      </section>
    </div>
  );
}

function Slider({ label, value, min, max, step, fmt, onChange }: { label: string; value: number; min: number; max: number; step: number; fmt: (v: number) => string; onChange: (v: number) => void }) {
  const id = label.replace(/\W/g, "");
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2"><label htmlFor={id} className="text-sm text-graphite">{label}</label><span className="font-semibold tabular-nums">{fmt(value)}</span></div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function Metric({ label, value, dp = 0, text, prefix = "", sub }: { label: string; value?: number; dp?: number; text?: string; prefix?: string; sub: string }) {
  return (
    <div>
      <dt className="text-sm text-mist">{label}</dt>
      <dd className="text-[2rem] font-bold leading-tight mt-1 tabular-nums">{prefix}{value !== undefined ? <NumberTicker value={value} startValue={value} decimalPlaces={dp} /> : text}</dd>
      <dd className="text-sm text-graphite">{sub}</dd>
    </div>
  );
}
