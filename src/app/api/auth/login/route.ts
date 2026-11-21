import bcrypt from "bcryptjs";
import { z } from "zod";
import { handle } from "@/lib/route";
import { sql } from "@/lib/db";
import { createSession, HttpError } from "@/lib/auth";

const Body = z.object({ email: z.string().email(), password: z.string().min(1) });

export const POST = handle(async (req) => {
  const b = Body.parse(await req.json());
  const db = await sql();
  const u = (await db`select id, password_hash from users where email = ${b.email.toLowerCase().trim()}`)[0];
  if (!u || !u.password_hash || !(await bcrypt.compare(b.password, u.password_hash))) throw new HttpError(401, "That email and password do not match.");
  await createSession(u.id);
  return { ok: true };
});
