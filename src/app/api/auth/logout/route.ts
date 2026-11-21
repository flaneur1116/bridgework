import { handle } from "@/lib/route";
import { clearSession } from "@/lib/auth";

export const POST = handle(async () => {
  await clearSession();
  return { ok: true };
});
