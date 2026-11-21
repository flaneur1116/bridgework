import { z } from "zod";
import { handle } from "@/lib/route";
import { apiUser, HttpError } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getProfile, logEvent } from "@/lib/store";
import { replanForConstraints } from "@/lib/agents";

const C = z.object({
  hoursPerWeek: z.number().min(1).max(60),
  budgetInr: z.number().min(0).max(10000000),
  currentCtcLpa: z.number().min(0).max(500),
  incomeFloorMonthly: z.number().min(0).max(10000000),
  fullTimeStudyOk: z.boolean(),
  canRelocate: z.boolean(),
  maxPayCutPct: z.number().min(0).max(100),
});

export const POST = handle(async (req) => {
  const user = await apiUser();
  const after = C.parse((await req.json()).constraints);
  const profile = await getProfile(user.id);
  if (!profile) throw new HttpError(400, "Add your profile first.");
  const db = await sql();
  await db`update profiles set constraints = ${db.json(after as never)}, updated_at = now() where user_id = ${user.id}`;
  await logEvent(user.id, "constraint_change", { before: profile.constraints, after });
  const replanned = await replanForConstraints(user.id, profile.constraints, after);
  return { ok: true, replanned };
});
