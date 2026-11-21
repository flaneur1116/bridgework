"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson, Spinner } from "./ui";

export function StartButtons({ signedIn, dark = false }: { signedIn: boolean; dark?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function guest() {
    setBusy(true); setErr(null);
    try { await postJson("/api/auth/guest"); router.push("/app/start"); }
    catch (e) { setErr((e as Error).message); setBusy(false); }
  }
  const primary = dark ? "btn bg-white text-ink hover:bg-cable" : "btn btn-primary";
  const ghost = dark ? "btn border border-white/30 text-white hover:border-white" : "btn btn-ghost";
  if (signedIn) return <a className={primary} href="/app">Open your workspace</a>;
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button className={primary} onClick={guest} disabled={busy}>{busy ? <Spinner /> : null}Try it without an account</button>
        <a className={ghost} href="/signup">Create an account</a>
      </div>
      {err && <p className="text-sm text-alert mt-2">{err}</p>}
      <p className={`text-sm mt-3 ${dark ? "text-cable/70" : "text-graphite"}`}>Guest work is kept on this browser. You can save it to an account later.</p>
    </div>
  );
}
