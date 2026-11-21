"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PERSONAS, DEFAULT_CONSTRAINTS, type Constraints } from "@/lib/data/personas";
import { ConstraintFields } from "./ConstraintFields";
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
            <p className="hint sm:col-span-3">Sample people are fictional. The analysis of them is run live, the same way as for your own resume.</p>
          </div>
        )}
        {mode === "paste" && (
          <div>
            <label className="label" htmlFor="resume">Resume text</label>
            <textarea id="resume" className="textarea min-h-[14rem]" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste everything: roles, projects, numbers, tools, education." />
            <p className="hint mt-1">{text.length.toLocaleString("en-IN")} characters. Specifics (numbers, scope, outcomes) become stronger evidence.</p>
          </div>
        )}
        {mode === "upload" && (
          <div>
            <label className="label" htmlFor="file">Resume PDF (text-based, up to 5 MB)</label>
            <input id="file" type="file" accept="application/pdf,.pdf" className="input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <p className="hint mt-1">Scanned images cannot be read; paste the text instead.</p>
          </div>
        )}
      </fieldset>

      <fieldset className="sheet p-5 sm:p-6">
        <legend className="sr-only">Direction</legend>
        <label className="label" htmlFor="target">Where do you want to go?</label>
        <input id="target" className="input" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="For example: product or consulting, without quitting my job" maxLength={300} />
        <p className="hint mt-1">Be vague if you are unsure. Bridgework compares eight destination roles either way.</p>
      </fieldset>

      <fieldset className="sheet p-5 sm:p-6">
        <legend className="display text-xl font-semibold mb-1">Your limits</legend>
        <p className="text-graphite text-sm mb-5">These decide which routes are realistic. You can change them any time and the plan will repack.</p>
        <ConstraintFields value={c} onChange={setC} />
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button className="btn btn-primary" disabled={busy}>{busy ? <><Spinner />{STAGES[stage]}</> : "Build my evidence ledger"}</button>
        {hasExisting && !busy && <span className="hint">This replaces your current ledger and plan.</span>}
        {busy && <span className="hint">Usually 20 to 40 seconds.</span>}
      </div>
      {err && <p role="alert" className="text-sm text-alert">{err}</p>}
    </form>
  );
}
