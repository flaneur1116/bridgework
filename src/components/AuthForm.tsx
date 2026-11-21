"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { postJson, Spinner } from "./ui";
import { Logo } from "./Logo";

export function AuthForm({ mode, isGuest = false }: { mode: "login" | "signup"; isGuest?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (mode === "signup" && password.length < 8) return setErr("Use at least 8 characters for your password.");
    setBusy(true);
    try {
      await postJson(mode === "login" ? "/api/auth/login" : "/api/auth/signup", mode === "login" ? { email, password } : { email, password, name: name || undefined });
      router.push("/app");
      router.refresh();
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }
  async function guest() {
    setBusy(true);
    try { await postJson("/api/auth/guest"); router.push("/app/start"); } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  return (
    <div className="min-h-dvh grid place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <Link href="/"><Logo /></Link>
        <h1 className="text-3xl font-semibold mt-8">{mode === "login" ? "Sign in" : isGuest ? "Save your work to an account" : "Create your account"}</h1>
        {isGuest && <p className="text-graphite mt-2">Your ledger, routes and plan stay as they are.</p>}
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          {mode === "signup" && (
            <div><label className="label" htmlFor="name">Name <span className="hint">(optional)</span></label><input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>
          )}
          <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
          <div><label className="label" htmlFor="pw">Password</label><input id="pw" type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />{mode === "signup" && <p className="hint mt-1">At least 8 characters.</p>}</div>
          {err && <p role="alert" className="text-sm text-alert">{err}</p>}
          <button className="btn btn-primary w-full" disabled={busy || !email || !password}>{busy && <Spinner />}{mode === "login" ? "Sign in" : isGuest ? "Save to account" : "Create account"}</button>
        </form>
        <div className="mt-6 text-sm text-graphite space-y-2">
          {mode === "login" ? <p>New here? <Link className="underline" href="/signup">Create an account</Link></p> : !isGuest && <p>Already have one? <Link className="underline" href="/login">Sign in</Link></p>}
          {!isGuest && <p>Or <button className="underline" onClick={guest} disabled={busy}>try it without an account</button>.</p>}
        </div>
      </div>
    </div>
  );
}
