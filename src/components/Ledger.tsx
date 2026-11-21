"use client";
import { useState } from "react";
import { postJson, useAction, Spinner, ErrorNote } from "./ui";
import type { Claim } from "@/lib/engine";
import type { Question } from "@/lib/store";

const SOURCE: Record<string, string> = { resume: "From your resume", answer: "From your answer", user: "From your graded proof" };

export function ClaimRow({ c, skill }: { c: Claim; skill: string }) {
  const { run, pending, error } = useAction((verdict: "confirmed" | "rejected" | null) => postJson(`/api/claims/${c.id}`, { verdict }));
  const state = c.verdict === "rejected" ? "rejected" : c.status;
  const unverified = c.evidence.startsWith("Unverified quote:");
  return (
    <li className={`py-4 flex gap-3 ${c.verdict === "rejected" ? "opacity-50" : ""}`}>
      <span className={`mark mt-1.5 ${state === "demonstrated" ? "mark-demonstrated" : state === "inferred" ? "mark-inferred" : "mark-missing"}`} aria-label={state} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className={`font-medium ${c.verdict === "rejected" ? "line-through" : ""}`}>{c.label}</span>
          <span className="text-sm text-graphite">{skill}</span>
        </div>
        <blockquote className={`mt-1.5 text-[0.9rem] border-l-[3px] pl-3 ${unverified ? "border-alert text-alert" : "border-rule text-graphite"}`}>
          {unverified ? <>The AI quoted text we could not find in your resume, so this was downgraded to assumed: <em>{c.evidence.replace("Unverified quote: ", "")}</em></> : <>&ldquo;{c.evidence}&rdquo;</>}
          <span className="block hint mt-0.5">{SOURCE[c.source] ?? c.source}{c.status === "inferred" && !c.verdict ? ". Assumed: confirm if true." : c.verdict === "confirmed" ? ". You confirmed this." : ""}</span>
        </blockquote>
        <div className="flex flex-wrap gap-1 mt-2">
          {c.verdict ? (
            <button className="btn btn-quiet text-sm" onClick={() => run(null)} disabled={pending}>Undo</button>
          ) : (
            <>
              {c.status === "inferred" && <button className="btn btn-ghost text-sm py-1" onClick={() => run("confirmed")} disabled={pending}>Yes, I did this</button>}
              <button className="btn btn-quiet text-sm" onClick={() => run("rejected")} disabled={pending}>Not accurate</button>
            </>
          )}
          {pending && <Spinner />}
        </div>
        <ErrorNote error={error} />
      </div>
    </li>
  );
}

export function QuestionsForm({ questions }: { questions: Question[] }) {
  const open = questions.filter((q) => !q.answer);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const save = useAction(async () => {
    const r = await postJson<{ changed: number }>("/api/questions", { answers: open.map((q) => ({ id: q.id, answer: answers[q.id] ?? "" })) });
    setAnswers({});
    setResult(r.changed ? `${r.changed} ledger ${r.changed === 1 ? "entry" : "entries"} updated from your answers.` : "Answers saved. They did not change any evidence.");
  });
  const refresh = useAction(() => postJson("/api/questions/refresh"));
  const filled = open.filter((q) => (answers[q.id] ?? "").trim().length > 0).length;

  return (
    <section className="sheet p-5" aria-labelledby="fq">
      <h2 id="fq" className="text-xl font-semibold">Questions that would strengthen your evidence</h2>
      <p className="text-sm text-graphite mt-1">Each one targets an assumed or missing skill that matters for your closest roles.</p>
      {open.length === 0 ? (
        <div className="mt-4">
          <p className="text-sm">{result ?? "No open questions."}</p>
          <button className="btn btn-ghost mt-3" onClick={() => refresh.run()} disabled={refresh.pending}>{refresh.pending && <Spinner />}Ask me new questions</button>
          <ErrorNote error={refresh.error} />
        </div>
      ) : (
        <form className="mt-4 space-y-5" onSubmit={(e) => { e.preventDefault(); save.run(); }}>
          {open.map((q) => (
            <div key={q.id}>
              <label className="label" htmlFor={q.id}>{q.question}</label>
              <p className="hint mb-1.5">{q.why}</p>
              <textarea id={q.id} className="textarea min-h-[5rem]" value={answers[q.id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} maxLength={2000} />
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button className="btn btn-primary" disabled={save.pending || filled === 0}>{save.pending && <Spinner />}Update my ledger</button>
            <span className="hint">{filled} of {open.length} answered. Skip any that do not apply.</span>
          </div>
          {result && <p className="text-sm text-ok">{result}</p>}
          <ErrorNote error={save.error} />
        </form>
      )}
    </section>
  );
}
