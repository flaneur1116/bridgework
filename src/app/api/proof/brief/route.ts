import { z } from "zod";
import { handle } from "@/lib/route";
import { apiUser } from "@/lib/auth";
import { makeBrief } from "@/lib/agents";

export const maxDuration = 300;
export const POST = handle(async (req) => {
  const user = await apiUser();
  return makeBrief(user.id, z.object({ roleSlug: z.string() }).parse(await req.json()).roleSlug);
});
