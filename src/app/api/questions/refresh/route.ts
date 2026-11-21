import { handle } from "@/lib/route";
import { apiUser } from "@/lib/auth";
import { generateQuestions } from "@/lib/agents";

export const maxDuration = 60;
export const POST = handle(async () => {
  const user = await apiUser();
  await generateQuestions(user.id);
  return { ok: true };
});
