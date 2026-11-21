import { handle } from "@/lib/route";
import { apiUser } from "@/lib/auth";
import { explainRoles } from "@/lib/agents";

export const maxDuration = 90;
export const POST = handle(async () => {
  const user = await apiUser();
  return explainRoles(user.id);
});
