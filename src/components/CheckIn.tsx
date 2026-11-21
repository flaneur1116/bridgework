"use client";
import { useState } from "react";
import Link from "next/link";
import { postJson, useAction, Spinner, ErrorNote } from "./ui";
import type { Diagnosis } from "@/lib/agents";

const CAUSE: Record<string, string> = { role_fit: "Role fit", evidence_quality: "Evidence quality", positioning: "Positioning", channel: "Application channel", volume: "Volume", skill_gap: "Skill gap", constraint: "Constraint" };

export function CheckIn({ last }: { last: (Diagnosis & { input?: Record<string, unknown> }) | null }) {
  const [f, setF] = useState({ applications: 12, responses: 0, interviews: 0, channel: "Job portals (Naukri, LinkedIn Easy Apply)", feedback: "" });
  const [planV, setPlanV] = useState<number | null>(null);
  const act = useAction(async () => {
    const r = await postJson<{ plan: { version: number } }>("/api/checkin", f);
    setPlanV(r.plan.version);
  });
  const n = (k: "applications" | "responses" | "interviews") => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Math.max(0, Number(e.target.value) || 0) });
  const invalid = f.responses > f.applications || f.interviews > f.responses;

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-8 items-start">
      <form className="sheet p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); act.run(); }}>
        <h2 className="text-xl font-semibold">Since your last check-in</h2>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label" htmlFor="ap">Applied</label><input id="ap" className="input" type="number" min={0} value={f.applications} onChange={n("applications")} /></div>
          <div><label className="label" htmlFor="rs">Replies</label><input id="rs" className="input" type="number" min={0} value={f.responses} onChange={n("responses")} /></div>
          <div><label className="label" htmlFor="iv">Interviews</label><input id="iv" className="input" type="number" min={0} value={f.interviews} onChange={n("interviews")} /></div>
        </div>
        {invalid && <p className="text-sm text-alert">Replies cannot exceed applications, and interviews cannot exceed replies.</p>}
        <div>
          <label className="label" htmlFor="ch">How did you mostly apply?</label>
          <select id="ch" className="select" value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })}>
            {["Job portals (Naukri, LinkedIn Easy Apply)", "Referrals from people I know", "Cold messages to hiring managers", "Company career pages", "Campus or alumni network", "Mix of these"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="fb">Feedback or what happened <span className="hint">(optional)</span></label>
          <textarea id="fb" className="textarea" value={f.feedback} onChange={(e) => setF({ ...f, feedback: e.target.value })} maxLength={2000} placeholder="For example: one recruiter said they want someone with a PM title" />
        </div>
        <button className="btn btn-primary w-full" disabled={act.pending || invalid}>{act.pending ? <><Spinner />Diagnosing</> : "Diagnose and update my plan"}</button>
        <ErrorNote error={act.error} />
      </form>

      {last ? (
        <section className="sheet p-6" aria-live="polite">
          <h2 className="text-2xl font-semibold">Diagnosis</h2>
          <p className="mt-2 text-lg">{last.verdict}</p>
          <p className="font-semibold mt-6">Likely causes, most likely first</p>
          <ul className="mt-2 divide-y divide-rule">
            {last.hypotheses.map((h, i) => (
              <li key={i} className="py-3 flex gap-3">
                <span className={`chip h-fit ${h.confidence === "high" ? "bg-ink text-white border-ink" : h.confidence === "medium" ? "border-ink" : "border-dashed"}`}>{h.confidence}</span>
                <div><p className="font-medium">{CAUSE[h.cause] ?? h.cause}</p><p className="text-graphite text-[0.93rem]">{h.reasoning}</p></div>
              </li>
            ))}
          </ul>
          <p className="font-semibold mt-6">{last.keepRoute ? "Keep your route. Do these first:" : "Change course. Do these first:"}</p>
          <ol className="mt-2 space-y-3">
            {last.actions.map((a, i) => (
              <li key={i} className="rounded-xl border border-rule p-4">
                <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{a.title}</span><span className="chip">{a.hours} hrs</span>{a.paid ? <span className="chip border-alert text-alert">Costs money</span> : <span className="chip">Free</span>}</div>
                <p className="text-[0.93rem] text-graphite mt-1">{a.detail}</p>
              </li>
            ))}
          </ol>
          {!last.keepRoute && last.suggestedRoute && <p className="mt-4 text-sm">Suggested route: <Link className="underline" href="/app/routes">compare it on the Routes page</Link>.</p>}
          <p className="text-sm text-ok mt-4">{planV ? `These steps were added to the front of your plan (version ${planV}).` : "These steps were added to the front of your plan."} <Link className="underline" href="/app/plan">Open plan</Link></p>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-graphite p-6">
          <h2 className="text-xl font-semibold">How the check-in works</h2>
          <p className="text-graphite mt-2">Report what happened. The AI looks at your funnel, your ledger and your plan, ranks the likely causes, and checks positioning and channel before suggesting new skills or a paid course. Its fixes go straight into your plan as a new version, so you can see what changed.</p>
        </section>
      )}
    </div>
  );
}
