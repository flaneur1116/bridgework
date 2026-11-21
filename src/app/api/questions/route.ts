import { z } from "zod";
import { handle } from "@/lib/route";
import { apiUser } from "@/lib/auth";
import { applyAnswers } from "@/lib/agents";

export const maxDuration = 90;
const Body = z.object({ answers: z.array(z.object({ id: z.string(), answer: z.string().max(2000) })) });

export const POST = handle(async (req) => {
  const user = await apiUser();
  return applyAnswers(user.id, Body.parse(await req.json()).answers);
});
