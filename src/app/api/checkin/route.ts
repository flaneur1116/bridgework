import { z } from "zod";
import { handle } from "@/lib/route";
import { apiUser, HttpError } from "@/lib/auth";
import { diagnose } from "@/lib/agents";

export const maxDuration = 300;
const Body = z.object({ applications: z.number().int().min(0).max(1000), responses: z.number().int().min(0).max(1000), interviews: z.number().int().min(0).max(1000), channel: z.string().max(100), feedback: z.string().max(2000) });

export const POST = handle(async (req) => {
  const user = await apiUser();
  const b = Body.parse(await req.json());
  if (b.responses > b.applications) throw new HttpError(400, "Responses cannot be more than applications.");
  if (b.interviews > b.responses) throw new HttpError(400, "Interviews cannot be more than responses.");
  return diagnose(user.id, b);
});
