import { handle } from "@/lib/route";
import { apiUser, clearSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const POST = handle(async () => {
  const user = await apiUser();
  const db = await sql();
  await db`delete from users where id = ${user.id}`;
  await clearSession();
  return { ok: true };
});
