import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getActivePlan, getPlanHistory, getProfile } from "@/lib/store";
import { getRole } from "@/lib/data/roles";
import { ROUTE_NAMES, type RouteType } from "@/lib/engine";
import { MilestoneRow, HoursQuickChange, KIND } from "@/components/PlanBoard";
import { NumberTicker } from "@/components/vendor/number-ticker";

export default async function PlanPage() {
  const user = await requireUser();
  const [active, history, profile] = await Promise.all([getActivePlan(user.id), getPlanHistory(user.id), getProfile(user.id)]);
  if (!active || !profile) redirect("/app/routes");
  const { plan, milestones } = active;
  const role = getRole(plan.roleSlug)!;
  const done = milestones.filter((m) => m.status === "done");
  const ahead = milestones.filter((m) => m.status !== "done");
  const totalH = milestones.reduce((s, m) => s + m.hours, 0);
  const pct = Math.round((done.reduce((s, m) => s + m.hours, 0) / Math.max(1, totalH)) * 100);
  const weeks = new Map<string, typeof ahead>();
  for (const m of ahead) {
    const key = m.startWeek === m.endWeek ? `Week ${m.startWeek}` : `Weeks ${m.startWeek} to ${m.endWeek}`;
    weeks.set(key, [...(weeks.get(key) ?? []), m]);
  }

  return (
    <div className="space-y-12">
      <section className="grid lg:grid-cols-[1.3fr_1fr] gap-10 items-end">
        <div>
          <p className="text-graphite">{ROUTE_NAMES[plan.routeType as RouteType]} into</p>
          <h1 className="text-[clamp(2.4rem,5.5vw,4.4rem)] font-extrabold tracking-[-0.045em] leading-[0.95] mt-2">{role.title}</h1>
        </div>
        <div className="flex gap-10">
          <div><p className="text-[3.4rem] font-bold leading-none tabular-nums"><NumberTicker value={plan.weeks} /></p><p className="text-graphite mt-2">weeks of prep</p></div>
          <div><p className="text-[3.4rem] font-bold leading-none tabular-nums"><NumberTicker value={pct} />%</p><p className="text-graphite mt-2">done</p></div>
        </div>
      </section>

      {plan.note && <p className="serif text-xl leading-snug max-w-3xl text-graphite">{plan.note}</p>}

      <div className="grid lg:grid-cols-[1fr_320px] gap-12 items-start">
        <div>
          {[...weeks.entries()].map(([w, ms]) => (
            <section key={w} className="mb-4">
              <h2 className="text-sm text-mist pl-10 mb-1">{w}</h2>
              <ol>{ms.map((m) => <MilestoneRow key={m.id} m={m} />)}</ol>
            </section>
          ))}
          {done.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm text-mist pl-10 mb-1">Done</h2>
              <ol>{done.map((m) => <MilestoneRow key={m.id} m={m} />)}</ol>
            </section>
          )}
          {!ahead.length && <p className="pl-10 py-6">All done. <Link className="underline" href="/app/checkin">Log your applications</Link>.</p>}
        </div>

        <aside className="space-y-10 lg:sticky lg:top-24">
          <HoursQuickChange constraints={profile.constraints} />
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-graphite">
            {Object.values(KIND).map((k) => <li key={k.label} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: k.color }} />{k.label}</li>)}
          </ul>
          <Link href="/app/checkin" className="btn btn-ghost w-full">No callbacks? Check in</Link>
          <section>
            <h2 className="text-sm text-mist mb-3">Versions</h2>
            <ol className="space-y-3">
              {history.slice(0, 6).map((h) => (
                <li key={h.id} className="text-sm flex gap-3">
                  <span className={`w-7 h-7 rounded-full grid place-items-center text-[11px] font-semibold flex-none ${h.id === plan.id ? "bg-ink text-paper" : "border border-rule text-graphite"}`}>v{h.version}</span>
                  <span className={h.id === plan.id ? "" : "text-graphite"}>{h.reason}<span className="block text-mist">{h.weeks} weeks at {h.hoursPerWeek} hrs</span></span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
