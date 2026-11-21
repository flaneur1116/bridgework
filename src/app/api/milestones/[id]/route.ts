import { z } from "zod";
import { handle } from "@/lib/route";
import { apiUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { logEvent } from "@/lib/store";

const Body = z.object({ status: z.enum(["todo", "done", "stuck"]), note: z.string().max(500).nullable().optional() });

export const POST = handle<{ params: Promise<{ id: string }> }>(async (req, ctx) => {
  const user = await apiUser();
  const { id } = await ctx.params;
  const b = Body.parse(await req.json());
  const db = await sql();
  await db`update milestones set status = ${b.status}, note = ${b.note ?? null} where id = ${id} and user_id = ${user.id}`;
  await logEvent(user.id, "milestone", { id, status: b.status });
  return { ok: true };
});
