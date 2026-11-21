import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getClaims, getActivePlan } from "@/lib/store";

export default async function AppIndex() {
  const user = await requireUser();
  const claims = await getClaims(user.id);
  if (!claims.length) redirect("/app/start");
  const plan = await getActivePlan(user.id);
  redirect(plan ? "/app/plan" : "/app/evidence");
}
