import bcrypt from "bcryptjs";
import { z } from "zod";
import { handle } from "@/lib/route";
import { sql } from "@/lib/db";
import { createSession, getUser, HttpError } from "@/lib/auth";

const Body = z.object({ email: z.string().email().max(200), password: z.string().min(8).max(200), name: z.string().max(80).optional() });

export const POST = handle(async (req) => {
  const b = Body.parse(await req.json());
  const email = b.email.toLowerCase().trim();
  const db = await sql();
  const exists = await db`select 1 from users where email = ${email}`;
  if (exists.length) throw new HttpError(409, "An account with this email already exists. Sign in instead.");
  const hash = await bcrypt.hash(b.password, 10);
  const current = await getUser();
  if (current?.isGuest) {
    // Keep the guest's work: upgrade the guest account in place.
    await db`update users set email = ${email}, password_hash = ${hash}, name = coalesce(${b.name ?? null}, name), is_guest = false where id = ${current.id}`;
    return { ok: true, upgraded: true };
  }
  const u = (await db`insert into users (email, password_hash, name) values (${email}, ${hash}, ${b.name ?? null}) returning id`)[0];
  await createSession(u.id);
  return { ok: true };
});
