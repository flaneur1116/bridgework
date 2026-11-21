"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PERSONAS, DEFAULT_CONSTRAINTS, type Constraints } from "@/lib/data/personas";
import { ConstraintFields } from "./ConstraintFields";
import { fmtInr } from "@/lib/engine";
import { Spinner } from "./ui";

type Mode = "sample" | "paste" | "upload";
const STAGES = ["Reading your resume", "Mapping evidence to 38 capabilities", "Checking every quote against your resume", "Writing follow-up questions"];

export function IntakeForm({ hasExisting }: { hasExisting: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sample");
  const [persona, setPersona] = useState(PERSONAS[0].id);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState(PERSONAS[0].target);
  const [c, setC] = useState<Constraints>(PERSONAS[0].constraints);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 6000);
    return () => clearInterval(t);
  }, [busy]);

  function pickPersona(id: string) {
    const p = PERSONAS.find((x) => x.id === id)!;
    setPersona(id); setTarget(p.target); setC(p.constraints);
  }
  function switchMode(m: Mode) {
    setMode(m); setErr(null);
    if (m === "sample") pickPersona(persona); else { setTarget(""); setC(DEFAULT_CONSTRAINTS); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (mode === "paste" && text.trim().length < 200) return setErr("Paste your full resume; it needs at least a few lines of experience.");
    if (mode === "upload" && !file) return setErr("Choose a PDF to upload.");
    const fd = new FormData();
    if (mode === "sample") fd.set("personaId", persona);
    if (mode === "paste") fd.set("resumeText", text);
    if (mode === "upload" && file) fd.set("file", file);
    fd.set("target", target);
    fd.set("constraints", JSON.stringify(c));
    setBusy(true); setStage(0);
    try {
      const res = await fetch("/api/intake", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "The analysis failed. Try again.");
      router.push("/app/evidence");
      router.refresh();
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <fieldset className="sheet p-5 sm:p-6">
        <legend className="sr-only">Your experience</legend>
        <div className="flex flex-wrap gap-2 mb-5" role="tablist">
          {([["sample", "Use a sample profile"], ["paste", "Paste your resume"], ["upload", "Upload a PDF"]] as [Mode, string][]).map(([m, l]) => (
            <button type="button" role="tab" aria-selected={mode === m} key={m} onClick={() => switchMode(m)} className={`btn ${mode === m ? "btn-primary" : "btn-ghost"}`}>{l}</button>
          ))}
        </div>
        {mode === "sample" && (
          <div className="grid sm:grid-cols-3 gap-3">
            {PERSONAS.map((p) => (
              <button type="button" key={p.id} onClick={() => pickPersona(p.id)} aria-pressed={persona === p.id}
                className={`text-left rounded-xl border p-4 transition-colors ${persona === p.id ? "border-ink bg-wash" : "border-rule bg-sheet hover:border-graphite"}`}>
                <span className="font-semibold block">{p.name}</span>
                <span className="text-sm text-graphite block">{p.headline}, {p.city}</span>
                <span className="text-sm block mt-2">Wants: {p.target}</span>
              </button>
            ))}
            <p className="text-sm text-mist sm:col-span-3">Fictional people, analysed live.</p>
          </div>
        )}
        {mode === "paste" && (
          <div>
            <label className="sr-only" htmlFor="resume">Resume text</label>
            <textarea id="resume" className="textarea min-h-[14rem]" value={text} onChange={(e) => setText(e.target.value)} placeholder="Roles, projects, numbers, tools" />

          </div>
        )}
        {mode === "upload" && (
          <div>
            <label className="label" htmlFor="file">Resume PDF, up to 5 MB</label>
            <input id="file" type="file" accept="application/pdf,.pdf" className="input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

          </div>
        )}
      </fieldset>

      <fieldset className="sheet p-5 sm:p-6 space-y-6">
        <legend className="sr-only">Direction and limits</legend>
        <div>
          <label className="label" htmlFor="target">Where to?</label>
          <input id="target" className="input" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. product or consulting, without quitting" maxLength={300} />
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-baseline mb-2"><label htmlFor="hpw" className="label mb-0">Hours a week</label><span className="font-semibold tabular-nums">{c.hoursPerWeek}</span></div>
            <input id="hpw" type="range" min={2} max={40} value={c.hoursPerWeek} onChange={(e) => setC({ ...c, hoursPerWeek: Number(e.target.value) })} />
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-2"><label htmlFor="bud" className="label mb-0">Learning budget</label><span className="font-semibold tabular-nums">Rs {fmtInr(c.budgetInr)}</span></div>
            <input id="bud" type="range" min={0} max={500000} step={5000} value={c.budgetInr} onChange={(e) => setC({ ...c, budgetInr: Number(e.target.value) })} />
          </div>
        </div>
        <details className="group">
          <summary className="cursor-pointer text-sm text-graphite hover:text-ink">Income and other limits</summary>
          <div className="mt-5"><ConstraintFields value={c} onChange={setC} /></div>
        </details>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button className="btn btn-primary" disabled={busy}>{busy ? <><Spinner />{STAGES[stage]}</> : "Read my experience"}</button>
        {hasExisting && !busy && <span className="text-sm text-mist">Replaces your current ledger and plan.</span>}
        {busy && <span className="text-sm text-mist">About a minute on the free AI tier.</span>}
      </div>
      {err && <p role="alert" className="text-sm text-alert">{err}</p>}
    </form>
  );
}
