"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson, Spinner } from "./ui";

export function AccountActions() {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  async function go(kind: "logout" | "delete") {
    setBusy(kind); setErr(null);
    try { await postJson(kind === "logout" ? "/api/auth/logout" : "/api/account/delete"); router.push("/"); router.refresh(); }
    catch (e) { setErr((e as Error).message); setBusy(null); }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <a className="btn btn-ghost" href="/api/account/export">Download my data (JSON)</a>
        <button className="btn btn-ghost" onClick={() => go("logout")} disabled={!!busy}>{busy === "logout" && <Spinner />}Sign out</button>
      </div>
      {!confirm ? (
        <button className="btn btn-quiet text-alert" onClick={() => setConfirm(true)}>Delete my account and data</button>
      ) : (
        <div className="rounded-xl border border-alert p-4">
          <p className="font-medium">This permanently deletes your profile, ledger, plans and history. It cannot be undone.</p>
          <div className="flex gap-2 mt-3">
            <button className="btn btn-primary bg-alert" onClick={() => go("delete")} disabled={!!busy}>{busy === "delete" && <Spinner />}Delete everything</button>
            <button className="btn btn-ghost" onClick={() => setConfirm(false)}>Keep my account</button>
          </div>
        </div>
      )}
      {err && <p className="text-sm text-alert">{err}</p>}
    </div>
  );
}
