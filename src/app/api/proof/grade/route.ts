import { z } from "zod";
import { handle } from "@/lib/route";
import { apiUser } from "@/lib/auth";
import { gradeProof } from "@/lib/agents";

export const maxDuration = 120;
export const POST = handle(async (req) => {
  const user = await apiUser();
  const b = z.object({ roleSlug: z.string(), submission: z.string().max(20000) }).parse(await req.json());
  return gradeProof(user.id, b.roleSlug, b.submission);
});
