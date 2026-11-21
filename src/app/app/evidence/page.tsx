import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getClaims, getProfile, getQuestions } from "@/lib/store";
import { rankRoles } from "@/lib/engine";
import { SKILLS, skillLabel } from "@/lib/data/skills";
import { ClaimRow, QuestionsForm } from "@/components/Ledger";
import { CoverageBar, BandChip } from "@/components/CoverageBar";

export default async function EvidencePage() {
  const user = await requireUser();
  const [claims, profile, questions] = await Promise.all([getClaims(user.id), getProfile(user.id), getQuestions(user.id)]);
  if (!claims.length || !profile) redirect("/app/start");
  const live = claims.filter((c) => c.verdict !== "rejected");
  const demo = live.filter((c) => c.status === "demonstrated").length;
  const inf = live.filter((c) => c.status === "inferred").length;
  const fits = rankRoles(claims).slice(0, 3);
  const groups = new Map<string, typeof claims>();
  for (const c of claims) {
    const g = (SKILLS as Record<string, { group: string }>)[c.skillId]?.group ?? "Other";
    groups.set(g, [...(groups.get(g) ?? []), c]);
  }

  return (
    <div>
      <div className="max-w-3xl">
        <p className="text-graphite">{profile.currentRole}{profile.city ? `, ${profile.city}` : ""}</p>
        <h1 className="text-4xl font-semibold mt-1">Your evidence ledger</h1>
        <p className="mt-3 text-lg text-graphite">{profile.summary}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-2"><span className="mark mark-demonstrated" /> <strong>{demo}</strong> proven by a specific</span>
        <span className="inline-flex items-center gap-2"><span className="mark mark-inferred" /> <strong>{inf}</strong> assumed, needs your confirmation or proof</span>
        <span className="inline-flex items-center gap-2"><span className="mark mark-missing" /> missing skills appear on the Routes page</span>
      </div>

      <div className="mt-8 grid lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
        <div className="sheet px-5 py-2">
          {[...groups.entries()].map(([g, cs]) => (
            <section key={g} className="border-b border-rule last:border-0 py-3">
              <h2 className="text-sm font-semibold text-graphite pt-2">{g}</h2>
              <ul className="divide-y divide-rule">{cs.map((c) => <ClaimRow key={c.id} c={c} skill={skillLabel(c.skillId)} />)}</ul>
            </section>
          ))}
        </div>
        <div className="space-y-6 lg:sticky lg:top-24">
          <QuestionsForm questions={questions} />
          <section className="sheet p-5">
            <h2 className="text-xl font-semibold">Closest roles right now</h2>
            <p className="text-sm text-graphite mt-1">Share of each role&apos;s weighted skills backed by your evidence. Updates as you confirm, reject or answer.</p>
            <ul className="mt-4 space-y-4">
              {fits.map((f) => (
                <li key={f.slug}>
                  <div className="flex justify-between items-center mb-1.5"><span className="font-medium">{f.title}</span><BandChip band={f.band} /></div>
                  <CoverageBar value={f.coverage} band={f.band} />
                </li>
              ))}
            </ul>
            <Link href="/app/routes" className="btn btn-primary mt-5 w-full">Compare routes</Link>
          </section>
        </div>
      </div>
    </div>
  );
}
