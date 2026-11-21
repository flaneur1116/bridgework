import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getClaims, getProfile, getQuestions } from "@/lib/store";
import { rankRoles } from "@/lib/engine";
import { skillLabel } from "@/lib/data/skills";
import { ClaimCard, QuestionsForm } from "@/components/Ledger";
import { NumberTicker } from "@/components/vendor/number-ticker";

export default async function EvidencePage() {
  const user = await requireUser();
  const [claims, profile, questions] = await Promise.all([getClaims(user.id), getProfile(user.id), getQuestions(user.id)]);
  if (!claims.length || !profile) redirect("/app/start");
  const live = claims.filter((c) => c.verdict !== "rejected");
  const proven = live.filter((c) => c.status === "demonstrated").length;
  const assumed = live.filter((c) => c.status === "inferred" && !c.verdict).length;
  const fits = rankRoles(claims).slice(0, 3);
  // Assumed claims first: they are the ones that need a decision.
  const order = [...claims].sort((a, b) => rank(a) - rank(b));

  return (
    <div className="space-y-12">
      <section className="grid lg:grid-cols-[1.3fr_1fr] gap-10 items-end">
        <div>
          <p className="text-graphite">{profile.currentRole}{profile.city ? `, ${profile.city}` : ""}</p>
          <h1 className="text-[clamp(2.4rem,5.5vw,4.4rem)] font-extrabold tracking-[-0.045em] leading-[0.95] mt-2">Your evidence</h1>
        </div>
        <div className="flex gap-10">
          <Stat n={proven} label="proven" mark="demonstrated" />
          <Stat n={assumed} label="to confirm" mark="inferred" />
        </div>
      </section>

      <div className="grid xl:grid-cols-[1fr_380px] gap-10 items-start">
        <ul className="grid sm:grid-cols-2 gap-4">{order.map((c) => <ClaimCard key={c.id} c={c} skill={skillLabel(c.skillId)} />)}</ul>
        <aside className="space-y-10 xl:sticky xl:top-24">
          <section>
            <h2 className="text-xl font-bold">Closest roles</h2>
            <ul className="mt-4 space-y-4">
              {fits.map((f) => (
                <li key={f.slug}>
                  <Link href={`/app/routes?role=${f.slug}`} className="group block">
                    <div className="flex justify-between text-[0.95rem]"><span className="group-hover:underline">{f.title}</span><span className="tabular-nums font-semibold">{Math.round(f.coverage * 100)}%</span></div>
                    <div className="h-1.5 rounded-full bg-wash mt-2 overflow-hidden"><div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(3, f.coverage * 100)}%` }} /></div>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/app/routes" className="btn btn-primary w-full mt-6">See your routes</Link>
          </section>
          <QuestionsForm questions={questions} />
        </aside>
      </div>
    </div>
  );
}

function rank(c: { status: string; verdict: string | null }) {
  if (c.verdict === "rejected") return 3;
  if (c.status === "inferred" && !c.verdict) return 0;
  return c.status === "inferred" ? 2 : 1;
}

function Stat({ n, label, mark }: { n: number; label: string; mark: string }) {
  return (
    <div>
      <p className="text-[3.4rem] font-bold leading-none tabular-nums"><NumberTicker value={n} /></p>
      <p className="flex items-center gap-2 text-graphite mt-2"><span className={`mark mark-${mark}`} />{label}</p>
    </div>
  );
}
