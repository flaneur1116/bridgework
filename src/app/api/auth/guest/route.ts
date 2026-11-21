import { handle } from "@/lib/route";
import { sql } from "@/lib/db";
import { createSession, getUser } from "@/lib/auth";

export const POST = handle(async () => {
  const existing = await getUser();
  if (existing) return { ok: true };
  const db = await sql();
  const u = (await db`insert into users (is_guest) values (true) returning id`)[0];
  await createSession(u.id);
  return { ok: true };
});
