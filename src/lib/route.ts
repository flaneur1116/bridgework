import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./auth";

export function handle<T>(fn: (req: Request, ctx: T) => Promise<unknown>) {
  return async (req: Request, ctx: T) => {
    try {
      const data = await fn(req, ctx);
      return NextResponse.json(data ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) return NextResponse.json({ error: "Some fields are missing or invalid: " + e.issues.map((i) => i.path.join(".")).join(", ") }, { status: 400 });
      console.error(e);
      return NextResponse.json({ error: "Something went wrong on our side. Try again." }, { status: 500 });
    }
  };
}
