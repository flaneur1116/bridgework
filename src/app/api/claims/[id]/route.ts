import { z } from "zod";
import { handle } from "@/lib/route";
import { apiUser } from "@/lib/auth";
import { sql } from "@/lib/db";

const Body = z.object({ verdict: z.enum(["confirmed", "rejected"]).nullable(), label: z.string().min(2).max(120).optional() });

export const POST = handle<{ params: Promise<{ id: string }> }>(async (req, ctx) => {
  const user = await apiUser();
  const { id } = await ctx.params;
  const b = Body.parse(await req.json());
  const db = await sql();
  if (b.label) await db`update claims set label = ${b.label} where id = ${id} and user_id = ${user.id}`;
  await db`update claims set verdict = ${b.verdict} where id = ${id} and user_id = ${user.id}`;
  return { ok: true };
});
