import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getActivePlan, getArtifact, getClaims } from "@/lib/store";
import { rankRoles } from "@/lib/engine";
import { getRole, ROLES } from "@/lib/data/roles";
import { ProofForge } from "@/components/ProofForge";
import type { Brief, Grade } from "@/lib/agents";

export default async function ProofPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const user = await requireUser();
  const claims = await getClaims(user.id);
  if (!claims.length) redirect("/app/start");
  const plan = await getActivePlan(user.id);
  const sp = await searchParams;
  const slug = (sp.role && getRole(sp.role) ? sp.role : null) ?? plan?.plan.roleSlug ?? rankRoles(claims)[0].slug;
  const role = getRole(slug)!;
  const [brief, grade] = await Promise.all([getArtifact<Brief>(user.id, "proof_brief", slug), getArtifact<Grade>(user.id, "proof_grade", slug)]);
  return (
    <div>
      <h1 className="text-4xl font-semibold">Proof</h1>
      <p className="text-graphite mt-2 text-lg max-w-3xl">Recruiters screening a career changer look for work, not certificates. Build one piece of proof, get it graded, and watch your evidence change.</p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm" aria-label="Choose role">
        {ROLES.map((r) => <Link key={r.slug} href={`/app/proof?role=${r.slug}`} className={`chip ${r.slug === slug ? "bg-ink text-white border-ink" : "hover:border-ink"}`}>{r.title}</Link>)}
      </div>
      <div className="mt-8"><ProofForge key={slug} roleSlug={slug} roleTitle={role.title} brief={brief?.payload ?? null} grade={grade?.payload ?? null} /></div>
    </div>
  );
}
