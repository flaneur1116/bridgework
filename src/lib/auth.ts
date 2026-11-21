import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { sql } from "./db";

const COOKIE = "bw_session";
function key() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ characters). See README.");
  return new TextEncoder().encode(s);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function getUserId(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return typeof payload.uid === "string" ? payload.uid : null;
  } catch {
    return null;
  }
}

export type SessionUser = { id: string; email: string | null; name: string | null; isGuest: boolean };

export async function getUser(): Promise<SessionUser | null> {
  const id = await getUserId();
  if (!id) return null;
  const db = await sql();
  const rows = await db`select id, email, name, is_guest from users where id = ${id}`;
  if (!rows.length) return null;
  const r = rows[0];
  return { id: r.id, email: r.email, name: r.name, isGuest: r.is_guest };
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getUser();
  if (!u) redirect("/login");
  return u;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiUser(): Promise<SessionUser> {
  const u = await getUser();
  if (!u) throw new HttpError(401, "Your session has expired. Sign in again.");
  return u;
}
