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
      <p className="text-graphite">{getRole(plan.plan.roleSlug)!.title}</p>
      <h1 className="text-[clamp(2.4rem,5.5vw,4.4rem)] font-extrabold tracking-[-0.045em] leading-[0.95] mt-2">Not hearing back?</h1>
      <div className="mt-8"><CheckIn last={last?.payload ?? null} /></div>
    </div>
  );
}
