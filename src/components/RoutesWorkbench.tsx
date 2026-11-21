"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ROLES } from "@/lib/data/roles";
import { computeRoutes, fitRole, whatWouldFlip, fmtInr, BAND_RULES, type Claim, type RouteType, type Scenario } from "@/lib/engine";
import type { Constraints } from "@/lib/data/personas";
import { ConstraintFields } from "./ConstraintFields";
import { CoverageBar, BandChip } from "./CoverageBar";
import { RouteMap } from "./RouteMap";
import { postJson, Spinner, useAction, ErrorNote } from "./ui";
import { NumberTicker } from "./vendor/number-ticker";
import type { RoleExplain } from "@/lib/agents";

const ROUTE_COLOR: Record<string, string> = { direct: "var(--color-direct)", bridge: "var(--color-bridge)", upskill: "var(--color-upskill)", mba: "var(--color-mba)" };

export function RoutesWorkbench({ claims, initialConstraints, initialRole, explain, hasPlan, currentPlan }: {
  claims: Claim[]; initialConstraints: Constraints; initialRole: string; explain: RoleExplain | null; hasPlan: boolean; currentPlan: { role: string; route: string } | null;
}) {
  const router = useRouter();
  const [c, setC] = useState(initialConstraints);
  const [saved, setSaved] = useState(initialConstraints);
  const [slug, setSlug] = useState(initialRole);
  const [scenario, setScenario] = useState<Scenario>("base");
  const [building, setBuilding] = useState<RouteType | null>(null);
  const [buildErr, setBuildErr] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const fits = useMemo(() => ROLES.map((r) => fitRole(r, claims)).sort((a, b) => b.coverage - a.coverage), [claims]);
  const role = ROLES.find((r) => r.slug === slug)!;
  const fit = fits.find((f) => f.slug === slug)!;
  const routes = useMemo(() => computeRoutes(role, fit, c), [role, fit, c]);
  const flips = useMemo(() => whatWouldFlip(role, fit, c), [role, fit, c]);
  const ex = explain?.roles.find((r) => r.slug === slug);
  const dirty = JSON.stringify(c) !== JSON.stringify(saved);

  const explainAct = useAction(() => postJson("/api/roles/explain"));
  const saveAct = useAction(async () => {
    const r = await postJson<{ replanned: { version: number } | null }>("/api/constraints", { constraints: c });
    setSaved(c);
    setSaveMsg(r.replanned ? `Saved. Your plan was repacked as version ${r.replanned.version}.` : "Saved.");
  });

  async function build(type: RouteType) {
    setBuilding(type); setBuildErr(null);
    try {
      if (dirty) { await postJson("/api/constraints", { constraints: c }); setSaved(c); }
      await postJson("/api/plan", { roleSlug: slug, routeType: type });
      router.push("/app/plan");
      router.refresh();
    } catch (e) { setBuildErr((e as Error).message); setBuilding(null); }
  }

  return (
    <div className="grid lg:grid-cols-[230px_1fr] gap-8 items-start">
      {/* Role list */}
      <div className="lg:hidden">
        <label className="label" htmlFor="role-pick">Destination role</label>
        <select id="role-pick" className="select" value={slug} onChange={(e) => setSlug(e.target.value)}>
          {fits.map((f) => <option key={f.slug} value={f.slug}>{f.title}: {Math.round(f.coverage * 100)}% ({f.band})</option>)}
        </select>
      </div>
      <nav aria-label="Destination roles" className="sheet p-2 lg:sticky lg:top-24 hidden lg:block">
        <p className="text-sm font-semibold text-graphite px-3 pt-2 pb-1">Destination roles</p>
        <ul>
          {fits.map((f) => (
            <li key={f.slug}>
              <button onClick={() => setSlug(f.slug)} aria-current={f.slug === slug} className={`w-full text-left rounded-lg px-3 py-2.5 ${f.slug === slug ? "bg-wash" : "hover:bg-paper"}`}>
                <span className={`block text-[0.93rem] ${f.slug === slug ? "font-semibold" : ""}`}>{f.title}</span>
                <span className="flex items-center gap-2 mt-1"><span className="flex-1"><CoverageBar value={f.coverage} band={f.band} /></span></span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main */}
      <div className="min-w-0 space-y-6">
        <section className="sheet p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-semibold">{role.title}</h2>
            <BandChip band={fit.band} />
          </div>
          <p className="text-graphite mt-2">{role.summary}</p>
          <div className="mt-4 max-w-md"><CoverageBar value={fit.coverage} band={fit.band} /></div>
          <p className="hint mt-1">{BAND_RULES}</p>

          {ex ? (
            <div className="mt-5 grid md:grid-cols-3 gap-4 text-[0.93rem]">
              <div><p className="font-semibold">Why it fits</p><p className="text-graphite mt-1">{ex.whyItFits}</p></div>
              <div><p className="font-semibold">What a recruiter will doubt</p><p className="text-graphite mt-1">{ex.recruiterDoubt}</p></div>
              <div><p className="font-semibold">First proof to build</p><p className="text-graphite mt-1">{ex.firstProof}</p></div>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button className="btn btn-ghost" onClick={() => explainAct.run()} disabled={explainAct.pending}>{explainAct.pending && <Spinner />}{explain ? "Explain this role too" : "Explain my top role fits"}</button>
              <span className="hint">The AI explains the fit using your ledger. The numbers above are calculated, not generated.</span>
              <ErrorNote error={explainAct.error} />
            </div>
          )}

          <div className="mt-6">
            <p className="font-semibold mb-2">Skills this role screens for</p>
            <ul className="grid sm:grid-cols-2 gap-x-6">
              {fit.matches.map((m) => (
                <li key={m.skillId} className="flex items-center gap-2.5 py-1.5 border-b border-rule">
                  <span className={`mark mark-${m.state}`} aria-label={m.state} />
                  <span className="flex-1 text-[0.93rem]">{m.label}</span>
                  {m.mustHave && <span className="chip text-[0.7rem]">must-have</span>}
                </li>
              ))}
            </ul>
            {role.hardRequirements.length > 0 && <p className="text-sm mt-3"><strong className="font-semibold">Cannot be replaced by skills alone: </strong><span className="text-graphite">{role.hardRequirements.join(". ")}.</span></p>}
          </div>
        </section>

      
      <section className="sheet p-5 sm:p-6" aria-label="Your limits">
        <h2 className="text-xl font-semibold">Your limits</h2>
        <p className="hint mb-4">The routes below recalculate as you change these.</p>
        <ConstraintFields value={c} onChange={(v) => { setC(v); setSaveMsg(null); }} />
        <div className="mt-5 flex flex-wrap gap-2 items-center">
          <button className="btn btn-primary" disabled={!dirty || saveAct.pending} onClick={() => saveAct.run()}>{saveAct.pending && <Spinner />}{hasPlan ? "Save and repack plan" : "Save limits"}</button>
          {dirty && <button className="btn btn-quiet" onClick={() => setC(saved)}>Reset</button>}
        </div>
        {saveMsg && <p className="text-sm text-ok mt-2">{saveMsg}</p>}
        <ErrorNote error={saveAct.error} />
      </section>

        <section className="sheet p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">{routes.length} ways in, under your limits</h2>
              <p className="text-graphite text-sm mt-1">Ranked by time, money and constraint breaks. Move the sliders and the ranking updates.</p>
            </div>
            <div className="flex rounded-full border border-rule p-0.5 bg-paper text-sm" role="group" aria-label="Scenario">
              {(["optimistic", "base", "conservative"] as Scenario[]).map((s) => (
                <button key={s} onClick={() => setScenario(s)} aria-pressed={scenario === s} className={`px-3 py-1 rounded-full capitalize ${scenario === s ? "bg-ink text-white" : "text-graphite"}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="mt-4"><RouteMap routes={routes} roleTitle={role.title} scenario={scenario} /></div>

          <ol className="mt-4 space-y-3">
            {routes.map((r, i) => {
              const isCurrent = currentPlan?.role === slug && currentPlan.route === r.type;
              return (
                <li key={r.type} className="rounded-xl border border-rule p-4" style={{ borderLeft: `6px solid ${ROUTE_COLOR[r.type]}` }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{r.name}</h3>
                        {i === 0 && r.feasible && <span className="chip bg-ink text-white border-ink">Ranks first for you</span>}
                        {!r.feasible && <span className="chip border-dashed text-alert">Breaks a limit</span>}
                        {isCurrent && <span className="chip">Your current plan</span>}
                      </div>
                      <p className="text-graphite text-[0.93rem] mt-1">{r.summary}</p>
                    </div>
                    <button className="btn btn-ghost" onClick={() => build(r.type)} disabled={!!building}>
                      {building === r.type ? <><Spinner />Drafting plan</> : isCurrent ? "Rebuild plan" : "Plan this route"}
                    </button>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div><dt className="text-graphite">Time to offer</dt><dd className="font-semibold text-base"><NumberTicker value={r.months[scenario]} decimalPlaces={1} /> months</dd><dd className="hint">{r.months.optimistic} to {r.months.conservative}</dd></div>
                    <div><dt className="text-graphite">Your hours</dt><dd className="font-semibold text-base"><NumberTicker value={r.studyHours + r.proofHours} /></dd><dd className="hint">{r.proofHours} on proof</dd></div>
                    <div><dt className="text-graphite">Cash out</dt><dd className="font-semibold text-base">Rs {fmtInr(r.cashInr)}</dd>{r.course && <dd className="hint"><a className="underline" href={r.course.source.url} target="_blank" rel="noreferrer">{r.course.source.quality === "official" ? "Official price" : r.course.source.quality === "third-party" ? "Third-party price" : "Estimate"}, {r.course.source.checked}</a></dd>}</div>
                    <div><dt className="text-graphite">Income lost</dt><dd className="font-semibold text-base">Rs {fmtInr(r.incomeLossInr)}</dd><dd className="hint">Total Rs {fmtInr(r.totalInvestmentInr)}</dd></div>
                  </dl>
                  {r.flags.length > 0 && <ul className="mt-3 space-y-1">{r.flags.map((f) => <li key={f} className="text-sm text-alert flex gap-2"><span aria-hidden>!</span>{f}</li>)}</ul>}
                  <details className="mt-2 text-sm"><summary className="cursor-pointer text-graphite">Assumptions behind these numbers</summary><ul className="list-disc pl-5 mt-2 text-graphite space-y-0.5">{r.assumptions.map((a) => <li key={a}>{a}</li>)}<li>Study hours are spread over your weekly hours with a 15% buffer</li></ul></details>
                </li>
              );
            })}
          </ol>
          <ErrorNote error={buildErr} />

          <div className="mt-5 rounded-xl bg-wash p-4">
            <p className="font-semibold">What would change this ranking</p>
            <ul className="mt-1 text-[0.93rem] space-y-1">{flips.map((f) => <li key={f}>{f}</li>)}</ul>
          </div>
          <p className="hint mt-3">Indicative entry salary for career changers into {role.title}: Rs {role.salaryLpa[0]} to {role.salaryLpa[1]} lakh a year. Demo figure, not sourced; check Naukri or AmbitionBox for your city.</p>
        </section>

        {explain?.outsideList && (
          <section className="rounded-xl border border-dashed border-graphite p-5">
            <p className="font-semibold">Worth a look, outside our curated roles: {explain.outsideList.title}</p>
            <p className="text-graphite text-sm mt-1">{explain.outsideList.why}</p>
            <p className="hint mt-2">Suggested by the AI. We have no role card for it, so there is no scoring or route comparison.</p>
          </section>
        )}
      </div>

    </div>
  );
}
