import { z } from "zod";
import { handle } from "@/lib/route";
import { apiUser } from "@/lib/auth";
import { buildPlan } from "@/lib/agents";

export const maxDuration = 120;
const Body = z.object({ roleSlug: z.string(), routeType: z.enum(["direct", "bridge", "upskill", "mba"]) });

export const POST = handle(async (req) => {
  const user = await apiUser();
  const b = Body.parse(await req.json());
  return buildPlan(user.id, b.roleSlug, b.routeType);
});
