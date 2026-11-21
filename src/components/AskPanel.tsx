"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { postJson, Spinner } from "./ui";

type Msg = { q: string; a: string };

export function AskPanel() {
  const path = usePathname();
  const page = path.split("/").pop() || "app";
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (page === "start") return null;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 3) return;
    setBusy(true); setErr(null);
    try {
      const r = await postJson<{ answer: string }>("/api/ask", { question: q, page });
      setMsgs((m) => [...m, { q, a: r.answer }]);
      setQ("");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <>
      <button onClick={() => setOpen((o) => !o)} className="fixed bottom-5 right-5 z-40 btn btn-primary shadow-lg" aria-expanded={open}>
        {open ? "Close" : "Ask about your plan"}
      </button>
      {open && (
        <aside className="fixed z-40 bottom-20 right-5 left-5 sm:left-auto sm:w-[380px] sheet shadow-xl flex flex-col max-h-[70dvh]" aria-label="Ask about your plan">
          <div className="p-4 border-b border-rule">
            <p className="font-semibold">Ask about your plan</p>
            <p className="hint">Answers use only your ledger, routes and plan. Nothing here changes your data.</p>
          </div>
          <div className="p-4 overflow-y-auto space-y-4 flex-1 text-[0.93rem]">
            {!msgs.length && (
              <div className="space-y-2">
                {["Why is the MBA ranked low for me?", "What is my weakest must-have skill?", "Which route keeps my income safest?"].map((s) => (
                  <button key={s} className="chip hover:border-ink text-left" onClick={() => setQ(s)}>{s}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i}>
                <p className="font-medium">{m.q}</p>
                <p className="text-graphite mt-1 whitespace-pre-wrap">{m.a}</p>
              </div>
            ))}
            {err && <p className="text-sm text-alert">{err}</p>}
          </div>
          <form onSubmit={send} className="p-3 border-t border-rule flex gap-2">
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a question" aria-label="Your question" maxLength={600} />
            <button className="btn btn-primary" disabled={busy || q.trim().length < 3}>{busy ? <Spinner /> : "Ask"}</button>
          </form>
        </aside>
      )}
    </>
  );
}
