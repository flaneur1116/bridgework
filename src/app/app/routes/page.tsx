import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getClaims, getProfile, getArtifact, getActivePlan } from "@/lib/store";
import { rankRoles } from "@/lib/engine";
import { RoutesWorkbench } from "@/components/RoutesWorkbench";
import type { RoleExplain } from "@/lib/agents";

export default async function RoutesPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const user = await requireUser();
  const [claims, profile, explain, plan] = await Promise.all([getClaims(user.id), getProfile(user.id), getArtifact<RoleExplain>(user.id, "role_explain"), getActivePlan(user.id)]);
  if (!claims.length || !profile) redirect("/app/start");
  const sp = await searchParams;
  const initialRole = sp.role || plan?.plan.roleSlug || profile.selectedRole || rankRoles(claims)[0].slug;
  return (
    <div>
      <h1 className="text-4xl font-semibold">Routes</h1>
      <p className="text-graphite mt-2 text-lg max-w-3xl">Pick a destination, then compare how to get there. Every number here is calculated from your evidence and limits; open the assumptions to see how.</p>
      <div className="mt-8">
        <RoutesWorkbench claims={claims} initialConstraints={profile.constraints} initialRole={initialRole} explain={explain?.payload ?? null} hasPlan={!!plan} currentPlan={plan ? { role: plan.plan.roleSlug, route: plan.plan.routeType } : null} />
      </div>
    </div>
  );
}
