"use client";
import { useState } from "react";
import Link from "next/link";
import { postJson, useAction, Spinner, ErrorNote } from "./ui";
import type { Brief, Grade } from "@/lib/agents";

const LEVEL: Record<string, string> = { strong: "bg-ink text-paper border-ink", developing: "border-ink", absent: "border-dashed text-alert border-alert" };

export function ProofForge({ roleSlug, roleTitle, brief, grade }: { roleSlug: string; roleTitle: string; brief: Brief | null; grade: (Grade & { submittedChars?: number }) | null }) {
  const [text, setText] = useState("");
  const make = useAction(() => postJson("/api/proof/brief", { roleSlug }));
  const submit = useAction(async () => { await postJson("/api/proof/grade", { roleSlug, submission: text }); setText(""); });

  if (!brief)
    return (
      <div className="sheet p-6 max-w-2xl">
        <h2 className="text-2xl font-bold">{roleTitle}</h2>
        <p className="text-graphite mt-2">One project, built from your own work, graded like a hiring manager would.</p>
        <button className="btn btn-primary mt-5" onClick={() => make.run()} disabled={make.pending}>{make.pending ? <><Spinner />Designing your brief</> : "Create a brief"}</button>
        <ErrorNote error={make.error} />
      </div>
    );

  return (
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
      <article className="sheet p-6">
        <p className="text-sm text-graphite">Proof brief for {roleTitle}, about {brief.timeboxHours} hours</p>
        <h2 className="text-2xl font-semibold mt-1">{brief.title}</h2>
        <p className="mt-3"><span className="font-semibold">Built from your work: </span><span className="text-graphite">{brief.context}</span></p>
        <p className="mt-3"><span className="font-semibold">The task: </span>{brief.task}</p>
        <p className="font-semibold mt-4">Deliverables</p>
        <ul className="list-disc pl-5 mt-1 space-y-0.5">{brief.deliverables.map((d) => <li key={d}>{d}</li>)}</ul>
        <p className="font-semibold mt-5">Rubric</p>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm border-collapse min-w-[520px]">
            <thead><tr className="text-left text-graphite"><th className="py-2 pr-3 font-medium">Criterion</th><th className="py-2 pr-3 font-medium">Strong</th><th className="py-2 pr-3 font-medium">Developing</th><th className="py-2 font-medium">Absent</th></tr></thead>
            <tbody>{brief.rubric.map((r) => <tr key={r.criterion} className="border-t border-rule align-top"><td className="py-2 pr-3 font-medium">{r.criterion}</td><td className="py-2 pr-3">{r.strong}</td><td className="py-2 pr-3 text-graphite">{r.developing}</td><td className="py-2 text-graphite">{r.absent}</td></tr>)}</tbody>
          </table>
        </div>
        <button className="btn btn-quiet mt-4 text-sm" onClick={() => make.run()} disabled={make.pending}>{make.pending && <Spinner />}Write a different brief</button>
        <ErrorNote error={make.error} />
      </article>

      <div className="space-y-6">
        <form className="sheet p-6" onSubmit={(e) => { e.preventDefault(); submit.run(); }}>
          <h2 className="text-xl font-semibold">Submit your work for grading</h2>
          <p className="text-sm text-mist mt-1">Strong criteria become proven skills in your ledger.</p>
          <textarea className="textarea min-h-[12rem] mt-3" value={text} onChange={(e) => setText(e.target.value)} aria-label="Your work" maxLength={20000} placeholder="Paste your work here" />
          <div className="flex items-center gap-3 mt-3">
            <button className="btn btn-primary" disabled={submit.pending || text.trim().length < 150}>{submit.pending ? <><Spinner />Grading against the rubric</> : "Grade my work"}</button>
            <span className="hint">{text.trim().length < 150 ? `${150 - text.trim().length} more characters needed` : `${text.length.toLocaleString("en-IN")} characters`}</span>
          </div>
          <ErrorNote error={submit.error} />
        </form>

        {grade && (
          <section className="sheet p-6" aria-live="polite">
            <div className="flex items-center gap-3"><h2 className="text-xl font-semibold">Latest grade</h2><span className={`chip capitalize ${LEVEL[grade.overall]}`}>{grade.overall}</span></div>
            <p className="text-graphite mt-2">{grade.summary}</p>
            <ul className="mt-4 space-y-4">
              {grade.criteria.map((c) => (
                <li key={c.criterion} className="border-t border-rule pt-3">
                  <div className="flex items-center gap-2"><span className="font-medium flex-1">{c.criterion}</span><span className={`chip capitalize ${LEVEL[c.level]}`}>{c.level}</span></div>
                  {c.evidence && c.evidence !== "none" && <p className="text-sm text-graphite mt-1 border-l-[3px] border-rule pl-3">&ldquo;{c.evidence}&rdquo;</p>}
                  <p className="text-sm mt-1"><span className="font-semibold">Fix: </span>{c.fix}</p>
                </li>
              ))}
            </ul>
            {grade.ledgerUpdates.length > 0 && <p className="text-sm mt-4 text-ok">{grade.ledgerUpdates.length} {grade.ledgerUpdates.length === 1 ? "entry was" : "entries were"} added to your <Link className="underline" href="/app/evidence">evidence ledger</Link>. Route fits update automatically.</p>}
          </section>
        )}
      </div>
    </div>
  );
}
