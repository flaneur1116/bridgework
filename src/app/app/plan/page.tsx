import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getActivePlan, getPlanHistory, getProfile } from "@/lib/store";
import { getRole } from "@/lib/data/roles";
import { ROUTE_NAMES, PLAN_CAPACITY, type RouteType } from "@/lib/engine";
import { MilestoneRow, HoursQuickChange } from "@/components/PlanBoard";

export default async function PlanPage() {
  const user = await requireUser();
  const [active, history, profile] = await Promise.all([getActivePlan(user.id), getPlanHistory(user.id), getProfile(user.id)]);
  if (!active || !profile) redirect("/app/routes");
  const { plan, milestones } = active;
  const role = getRole(plan.roleSlug)!;
  const done = milestones.filter((m) => m.status === "done");
  const totalH = milestones.reduce((s, m) => s + m.hours, 0);
  const doneH = done.reduce((s, m) => s + m.hours, 0);
  const ahead = milestones.filter((m) => m.status !== "done");
  const weeks = new Map<string, typeof ahead>();
  for (const m of ahead) {
    const key = m.startWeek === m.endWeek ? `Week ${m.startWeek}` : `Weeks ${m.startWeek} to ${m.endWeek}`;
    weeks.set(key, [...(weeks.get(key) ?? []), m]);
  }
  const months = Math.round((plan.weeks / 4.33) * 10) / 10;

  return (
    <div>
      <p className="text-graphite">{ROUTE_NAMES[plan.routeType as RouteType]} into</p>
      <h1 className="text-4xl font-semibold mt-1">{role.title}</h1>
      <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
        <div><p className="text-sm text-graphite">Preparation</p><p className="display text-2xl font-semibold">{plan.weeks} weeks</p><p className="hint">about {months} months, then job search</p></div>
        <div><p className="text-sm text-graphite">Pace</p><p className="display text-2xl font-semibold">{plan.hoursPerWeek} hrs/week</p><p className="hint">{Math.round(PLAN_CAPACITY * 100)}% scheduled, rest is buffer</p></div>
        <div className="min-w-[12rem]"><p className="text-sm text-graphite">Progress</p><p className="display text-2xl font-semibold">{Math.round((doneH / Math.max(1, totalH)) * 100)}%</p><div className="h-2 rounded-full bg-wash mt-1 overflow-hidden"><div className="h-full bg-ink rounded-full" style={{ width: `${(doneH / Math.max(1, totalH)) * 100}%` }} /></div></div>
      </div>
      {plan.note && <p className="mt-5 max-w-3xl rounded-xl bg-wash p-4 text-[0.95rem]"><span className="font-semibold">Version {plan.version}: </span>{plan.note}</p>}

      <div className="mt-8 grid lg:grid-cols-[1fr_300px] gap-8 items-start">
        <div className="sheet px-5 py-2">
          {[...weeks.entries()].map(([w, ms]) => (
            <section key={w} className="border-b border-rule last:border-0">
              <h2 className="text-sm font-semibold text-graphite pt-4">{w}</h2>
              <ul className="divide-y divide-rule">{ms.map((m) => <MilestoneRow key={m.id} m={m} />)}</ul>
            </section>
          ))}
          {done.length > 0 && (
            <section className="border-t border-rule">
              <h2 className="text-sm font-semibold text-graphite pt-4">Done</h2>
              <ul className="divide-y divide-rule">{done.map((m) => <MilestoneRow key={m.id} m={m} />)}</ul>
            </section>
          )}
          {!ahead.length && <p className="py-6">Every step is done. Log your applications on the <Link className="underline" href="/app/checkin">check-in page</Link>.</p>}
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <HoursQuickChange constraints={profile.constraints} />
          <div className="sheet p-5">
            <p className="font-semibold">Applied and heard nothing?</p>
            <p className="hint mt-1">The check-in diagnoses why before it suggests anything you would pay for, then adds the fixes to this plan.</p>
            <Link href="/app/checkin" className="btn btn-ghost mt-3 w-full">Run a check-in</Link>
          </div>
          <div className="sheet p-5">
            <p className="font-semibold">How this plan has changed</p>
            <ol className="mt-3 space-y-3">
              {history.slice(0, 8).map((h) => (
                <li key={h.id} className="text-sm flex gap-3">
                  <span className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-semibold flex-none ${h.id === plan.id ? "bg-ink text-white" : "border border-rule"}`}>v{h.version}</span>
                  <span><span className="block">{h.reason}</span><span className="hint">{new Date(h.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}, {h.weeks} weeks at {h.hoursPerWeek} hrs</span></span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
