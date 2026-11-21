"use client";
import { useState } from "react";
import { postJson, useAction, Spinner, ErrorNote } from "./ui";
import type { Claim } from "@/lib/engine";
import type { Question } from "@/lib/store";

const SOURCE: Record<string, string> = { resume: "resume", answer: "your answer", user: "graded proof" };

export function ClaimCard({ c, skill }: { c: Claim; skill: string }) {
  const { run, pending, error } = useAction((verdict: "confirmed" | "rejected" | null) => postJson(`/api/claims/${c.id}`, { verdict }));
  const unverified = c.evidence.startsWith("Unverified quote:");
  const state = c.verdict === "rejected" ? "missing" : c.status;
  return (
    <li className={`group rounded-2xl border border-rule bg-sheet p-5 flex flex-col gap-3 transition-opacity ${c.verdict === "rejected" ? "opacity-40" : ""}`}>
      <div className="flex items-start gap-3">
        <span className={`mark mt-1.5 mark-${state}`} aria-label={state} />
        <div className="min-w-0">
          <p className={`font-semibold leading-snug ${c.verdict === "rejected" ? "line-through" : ""}`}>{c.label}</p>
          <p className="text-sm text-mist">{skill}</p>
        </div>
      </div>
      <blockquote className={`serif text-[0.98rem] leading-snug ${unverified ? "text-alert" : "text-graphite"}`}>
        {unverified ? "Quote not found in your resume" : <>&ldquo;{c.evidence}&rdquo;</>}
      </blockquote>
      <div className="flex items-center gap-2 mt-auto text-sm">
        <span className="text-mist flex-1">From your {SOURCE[c.source] ?? c.source}{c.verdict === "confirmed" ? ", confirmed" : ""}</span>
        {pending && <Spinner size={14} />}
        {c.verdict ? (
          <button className="text-graphite hover:text-ink" onClick={() => run(null)} disabled={pending}>Undo</button>
        ) : (
          <>
            {c.status === "inferred" && <button className="rounded-full border border-rule px-3 py-1 hover:border-ink" onClick={() => run("confirmed")} disabled={pending}>True</button>}
            <button className="rounded-full px-3 py-1 text-graphite hover:text-ink" onClick={() => run("rejected")} disabled={pending} aria-label={`Mark "${c.label}" as not accurate`}>Not me</button>
          </>
        )}
      </div>
      <ErrorNote error={error} />
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
    setResult(r.changed ? `${r.changed} ${r.changed === 1 ? "skill" : "skills"} updated.` : "Saved. No skills changed.");
  });
  const refresh = useAction(() => postJson("/api/questions/refresh"));
  const filled = open.filter((q) => (answers[q.id] ?? "").trim().length > 0).length;

  return (
    <section aria-labelledby="fq">
      <h2 id="fq" className="text-xl font-bold">Prove more</h2>
      {open.length === 0 ? (
        <div className="mt-3">
          {result && <p className="text-sm text-ok mb-3">{result}</p>}
          <button className="btn btn-ghost" onClick={() => refresh.run()} disabled={refresh.pending}>{refresh.pending && <Spinner />}Ask me more</button>
          <ErrorNote error={refresh.error} />
        </div>
      ) : (
        <form className="mt-4 space-y-5" onSubmit={(e) => { e.preventDefault(); save.run(); }}>
          {open.map((q) => (
            <div key={q.id}>
              <label className="block text-[0.95rem] mb-2" htmlFor={q.id}>{q.question}</label>
              <textarea id={q.id} className="textarea min-h-[4.5rem]" value={answers[q.id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} maxLength={2000} />
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button className="btn btn-primary" disabled={save.pending || filled === 0}>{save.pending ? <><Spinner />Updating</> : "Update ledger"}</button>
            <span className="text-sm text-mist">{filled}/{open.length}</span>
          </div>
          {result && <p className="text-sm text-ok">{result}</p>}
          <ErrorNote error={save.error} />
        </form>
      )}
    </section>
  );
}
