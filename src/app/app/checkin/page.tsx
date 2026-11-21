import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getActivePlan, getArtifact } from "@/lib/store";
import { getRole } from "@/lib/data/roles";
import { CheckIn } from "@/components/CheckIn";
import type { Diagnosis } from "@/lib/agents";

export default async function CheckinPage() {
  const user = await requireUser();
  const plan = await getActivePlan(user.id);
  if (!plan) redirect("/app/routes");
  const last = await getArtifact<Diagnosis>(user.id, "diagnosis", plan.plan.roleSlug);
  return (
    <div>
      <h1 className="text-4xl font-semibold">Check-in</h1>
      <p className="text-graphite mt-2 text-lg max-w-3xl">Applying for {getRole(plan.plan.roleSlug)!.title} roles and not hearing back? Find out why before you buy another course.</p>
      <div className="mt-8"><CheckIn last={last?.payload ?? null} /></div>
    </div>
  );
}
