"use client";
import { useState } from "react";
import type { Milestone } from "@/lib/store";
import type { Constraints } from "@/lib/data/personas";
import { postJson, useAction, Spinner, ErrorNote } from "./ui";

const KIND: Record<string, { label: string; color: string }> = {
  learn: { label: "Learn", color: "var(--color-direct)" },
  build: { label: "Build proof", color: "var(--color-upskill)" },
  apply: { label: "Apply", color: "var(--color-mba)" },
  network: { label: "Network", color: "var(--color-bridge)" },
};

export function MilestoneRow({ m }: { m: Milestone }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(m.note ?? "");
  const act = useAction((status: "todo" | "done" | "stuck", n?: string) => postJson(`/api/milestones/${m.id}`, { status, note: n ?? null }));
  const k = KIND[m.kind] ?? KIND.learn;
  return (
    <li className={`py-4 flex gap-4 ${m.status === "done" ? "opacity-60" : ""}`}>
      <span className="w-1.5 rounded-full flex-none" style={{ background: k.color }} aria-hidden />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className={`font-semibold ${m.status === "done" ? "line-through" : ""}`}>{m.title}</h3>
          <span className="text-sm text-graphite">{k.label}, {m.hours} hrs</span>
          {m.status === "stuck" && <span className="chip border-alert text-alert">Stuck</span>}
        </div>
        <p className="text-[0.93rem] text-graphite mt-1">{m.detail}</p>
        <p className="text-sm mt-1"><span className="text-graphite">Produces: </span>{m.output}</p>
        {m.status === "stuck" && m.note && <p className="text-sm mt-1 text-alert">Note: {m.note}</p>}
        <div className="flex flex-wrap gap-1 mt-2 items-center">
          {m.status !== "done" && <button className="btn btn-ghost text-sm py-1" onClick={() => act.run("done")} disabled={act.pending}>Mark done</button>}
          {m.status === "todo" && <button className="btn btn-quiet text-sm" onClick={() => setNoteOpen((o) => !o)}>I am stuck</button>}
          {m.status !== "todo" && <button className="btn btn-quiet text-sm" onClick={() => act.run("todo")} disabled={act.pending}>Reopen</button>}
          {act.pending && <Spinner />}
        </div>
        {noteOpen && m.status === "todo" && (
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); act.run("stuck", note); setNoteOpen(false); }}>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What is blocking you?" maxLength={500} aria-label="What is blocking you" />
            <button className="btn btn-primary">Save</button>
          </form>
        )}
        <ErrorNote error={act.error} />
      </div>
    </li>
  );
}

export function HoursQuickChange({ constraints }: { constraints: Constraints }) {
  const [h, setH] = useState(constraints.hoursPerWeek);
  const act = useAction(() => postJson("/api/constraints", { constraints: { ...constraints, hoursPerWeek: h } }));
  return (
    <div className="sheet p-5">
      <p className="font-semibold">Life changed?</p>
      <p className="hint">Change your weekly hours and the remaining steps are rescheduled. Finished steps stay finished.</p>
      <div className="flex items-baseline justify-between mt-3"><label htmlFor="qh" className="text-sm">Hours per week</label><span className="display text-2xl font-semibold">{h}</span></div>
      <input id="qh" type="range" min={2} max={40} value={h} onChange={(e) => setH(Number(e.target.value))} />
      <button className="btn btn-primary mt-3 w-full" disabled={h === constraints.hoursPerWeek || act.pending} onClick={() => act.run()}>{act.pending && <Spinner />}Repack my plan</button>
      <ErrorNote error={act.error} />
    </div>
  );
}
