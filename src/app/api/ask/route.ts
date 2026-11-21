import { z } from "zod";
import { handle } from "@/lib/route";
import { apiUser } from "@/lib/auth";
import { ask } from "@/lib/agents";

export const maxDuration = 300;
export const POST = handle(async (req) => {
  const user = await apiUser();
  const b = z.object({ question: z.string().min(3).max(600), page: z.string().max(40) }).parse(await req.json());
  return { answer: await ask(user.id, b.question, b.page) };
});
